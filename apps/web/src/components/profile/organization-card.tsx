"use client";

import { authClient } from "@better-env/auth/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import React, { useRef, useState } from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Invitation } from "@/types";

export function OrganizationCard() {
  const orgs = authClient.useListOrganizations();
  const activeOrg = authClient.useActiveOrganization();
  const orgNameRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "admin" | "owner">("member");
  const [sendingInvite, setSendingInvite] = useState(false);

  // removed unused organizations
  const invites = useQuery<Invitation[] | { data?: Invitation[] } | null>({
    queryKey: ["org-invitations", activeOrg.data?.id],
    queryFn: async () => {
      const res = await authClient.organization.listInvitations();
      return res as unknown as Invitation[];
    },
    enabled: !!activeOrg.data?.id,
  });

  if (activeOrg.isPending) return null;

  const orgList = Array.isArray(orgs.data) ? orgs.data : [];

  return (
    <Card className="p-5 space-y-4">
      <div>
        <h2 className="text-sm text-text-secondary mb-1">Organization</h2>
        <Separator />
      </div>
      {activeOrg.data ? (
        <div className="space-y-3">
          <div>
            <Label htmlFor="org-name">Name</Label>
            <Input id="org-name" defaultValue={activeOrg.data.name || ""} ref={orgNameRef} disabled={!editing} />
          </div>
          <div className="flex gap-2">
            {!editing ? (
              <Button onClick={() => setEditing(true)}>Edit</Button>
            ) : (
              <>
                <Button
                  onClick={async () => {
                    const next = orgNameRef.current?.value?.trim() || "";
                    if (!next) return;
                    await authClient.organization.update({ data: { name: next }, organizationId: activeOrg.data?.id ?? "" });
                    await activeOrg.refetch?.();
                    await orgs.refetch?.();
                    setEditing(false);
                  }}
                >
                  Save
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (orgNameRef.current) orgNameRef.current.value = activeOrg.data?.name || "";
                    setEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
          {orgList.length > 1 && (
            <div className="space-y-2">
              <Label>Switch organization</Label>
              <div className="flex flex-wrap gap-2">
                {orgList.map((o) => (
                  <Button
                    key={o.id}
                    variant={o.id === activeOrg.data?.id ? "default" : "outline"}
                    onClick={async () => {
                      await authClient.organization.setActive({ organizationId: o.id });
                      await activeOrg.refetch?.();
                    }}
                  >
                    {o.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 pt-4">
            <Label htmlFor="invite-email">Add user</Label>
            <div className="flex gap-2 items-center">
              <Input id="invite-email" placeholder="user@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} disabled={sendingInvite} />
              <div className="w-36">
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "member" | "admin" | "owner")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                disabled={sendingInvite}
                onClick={async () => {
                  const email = inviteEmail.trim();
                  if (!email) return;
                  try {
                    setSendingInvite(true); 
                    await authClient.organization.inviteMember({ email, role: inviteRole, organizationId: activeOrg.data?.id });
                    toast.success("Invite sent");
                    setInviteEmail("");
                    await invites.refetch();
                  } catch (err: unknown) {
                    const e = err as { error?: { code?: string; message?: string }; code?: string; message?: string };
                    const code = e?.error?.code || e?.code;
                    const message = e?.error?.message || e?.message || "Failed to invite";
                    if (code === "USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION") {
                      try {
                        await authClient.organization.inviteMember({ email, role: inviteRole, organizationId: activeOrg.data?.id, resend: true });
                        toast.success("Resent invite");
                        await invites.refetch();
                      } catch (e: unknown) {
                        const er = e as { error?: { message?: string }; message?: string };
                        toast.error(er?.error?.message || er?.message || "Failed to resend");
                      }
                    } else {
                      toast.error(message);
                    }
                  } finally {
                    setSendingInvite(false);
                  }
                }}
              >
                {sendingInvite ? "Sending..." : "Send invite"}
              </Button>
            </div>
          </div>

          {(() => {
            const raw = invites.data;
            const normalized = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data! : [];
            const visible = normalized.filter((inv) => (inv?.status || '').toLowerCase() !== 'canceled');
            return <InvitationsList list={visible} onRefetch={() => invites.refetch()} />;
          })()}
        </div>
      ) : (
        <div className="text-sm text-text-secondary">No active organization.</div>
      )}
    </Card>
  );
}

type InvitationsListProps = { list: Invitation[]; onRefetch: () => void };
function InvitationsList({ list, onRefetch }: InvitationsListProps) {
  const activeOrg = authClient.useActiveOrganization();
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  if (!activeOrg.data) return null;

  return (
    <div className="space-y-2">
      <Label>Invitations</Label>
      <div className="space-y-2">
        {list.length === 0 ? (
          <div className="text-sm text-muted-foreground">No invites</div>
        ) : (
          list.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between border rounded px-3 py-2">
              <div className="text-sm">
                {inv.email}
                <span className="ml-2 text-muted-foreground">{(inv.status)?.toLowerCase?.() || "pending"}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={loadingId === inv.id}
                  onClick={async () => {
                    try {
                      setLoadingId(inv.id);
                      await authClient.organization.inviteMember({ email: inv.email, role: "member", resend: true, organizationId: activeOrg.data?.id });
                      toast.success("Invite resent");
                      await onRefetch();
                    } catch (e: unknown) {
                      const er = e as { error?: { message?: string }; message?: string };
                      toast.error(er?.error?.message || er?.message || "Failed to resend");
                    } finally {
                      setLoadingId(null);
                    }
                  }}
                >
                  {loadingId === inv.id ? "Resending..." : "Resend"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={loadingId === inv.id}
                  onClick={async () => {
                    try {
                      setLoadingId(inv.id);
                      await authClient.organization.cancelInvitation({ invitationId: inv.id });
                      toast.success("Invite canceled");
                      onRefetch();
                    } catch (e: unknown) {
                      const er = e as { error?: { message?: string }; message?: string };
                      toast.error(er?.error?.message || er?.message || "Failed to cancel");
                    } finally {
                      setLoadingId(null);
                    }
                  }}
                >
                  {loadingId === inv.id ? "Canceling..." : "Cancel"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loadingId === inv.id}
                  onClick={async () => {
                    const base = window.location.origin;
                    await navigator.clipboard.writeText(`${base}/invite/${inv.id}`);
                    toast.success("Link copied");
                  }}
                >
                  Copy link
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


