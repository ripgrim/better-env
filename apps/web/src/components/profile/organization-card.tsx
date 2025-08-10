"use client";

import { authClient } from "@better-env/auth/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Invitation } from "@/types";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import { trpc, queryClient } from "@/utils/trpc";

export type OrganizationCardHandle = { save: () => Promise<void>; isDirty: () => boolean };
type OrganizationCardProps = { editing?: boolean; onDirtyChange?: (dirty: boolean) => void };
export const OrganizationCard = forwardRef<OrganizationCardHandle, OrganizationCardProps>(function OrganizationCard({ editing: externalEditing = false, onDirtyChange }, ref) {
  const router = useRouter();
  const session = authClient.useSession();
  const orgs = authClient.useListOrganizations();
  const activeOrg = authClient.useActiveOrganization();
  const orgNameRef = useRef<HTMLInputElement>(null);
  const originalOrgName = activeOrg.data?.name || "";

  useImperativeHandle(ref, () => ({
    save: async () => {
      const next = orgNameRef.current?.value?.trim() || "";
      if (!next || next === originalOrgName || !activeOrg.data?.id) return;
      await authClient.organization.update({ data: { name: next }, organizationId: activeOrg.data?.id ?? "" });
      await activeOrg.refetch?.();
      await orgs.refetch?.();
    },
    isDirty: () => ((orgNameRef.current?.value?.trim() || "") !== originalOrgName),
  }), [originalOrgName, activeOrg.data?.id]);
  const [editing] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "admin" | "owner">("member");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // removed unused organizations
  const invites = useQuery<Invitation[] | { data?: Invitation[] } | null>({
    queryKey: ["org-invitations", activeOrg.data?.id],
    queryFn: async () => {
      const res = await authClient.organization.listInvitations();
      return res as unknown as Invitation[];
    },
    enabled: !!activeOrg.data?.id,
  });

  const incoming = useQuery<Invitation[] | { data?: Invitation[] } | null>({
    queryKey: ["user-invitations"],
    queryFn: async () => {
      const res = await authClient.organization.listUserInvitations();
      return res as unknown as Invitation[];
    },
    enabled: !!session.data?.user,
  });

  const orgList = Array.isArray(orgs.data) ? orgs.data : [];

  const isBusy = isSwitching || activeOrg.isPending;

  return (
    <Card className="p-5 space-y-4 relative">
      <div>
        <h2 className="text-sm text-text-secondary mb-1">Organization</h2>
        <Separator />
      </div>
      {orgList.length > 0 && (
        <div className="space-y-2">
          <Label>Switch organization</Label>
          <Select
            value={activeOrg.data?.id ?? "__personal"}
            onValueChange={async (val) => {
              try {
                setIsSwitching(true);
                if (val === "__personal") {
                  await authClient.organization.setActive({ organizationId: null as unknown as string });
                } else {
                  await authClient.organization.setActive({ organizationId: val });
                }
                await activeOrg.refetch?.();
                await orgs.refetch?.();
                queryClient.invalidateQueries({ queryKey: trpc.projects.list.queryKey() });
              } finally {
                setIsSwitching(false);
              }
            }}
          >
            <SelectTrigger disabled={isBusy}>
              <SelectValue placeholder="Select organization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__personal">Personal workspace</SelectItem>
              {orgList.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {activeOrg.data || isBusy ? (
        <div className="space-y-3">
          <div>
            <Label htmlFor="org-name">Name</Label>
            <Input id="org-name" defaultValue={activeOrg.data?.name || ""} ref={orgNameRef} onChange={() => onDirtyChange?.(((orgNameRef.current?.value?.trim() || "") !== originalOrgName))} disabled={!editing && !externalEditing || isBusy} />
          </div>
          

          <div className="space-y-2 pt-4">
            <Label htmlFor="invite-email">Add user</Label>
            <div className="flex gap-2 items-center">
              <Input id="invite-email" placeholder="user@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} disabled={sendingInvite || isBusy} />
              <div className="w-36">
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "member" | "admin" | "owner") }>
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
                disabled={sendingInvite || isBusy}
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
          {isBusy && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center rounded-md">
              <Spinner size={18} />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-text-primary">Personal workspace</h3>
            <p className="text-sm text-text-secondary">Create an organization to invite teammates and share projects.</p>
          </div>
          {orgList.length === 0 && (
            <div className="flex gap-2 items-center">
              <Input placeholder="Organization name" value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)} disabled={creatingOrg} />
              <Button
                disabled={creatingOrg || newOrgName.trim().length === 0}
                onClick={async () => {
                  const name = newOrgName.trim();
                  if (!name) return;
                  try {
                    setCreatingOrg(true);
                    const slug = name
                      .toLowerCase()
                      .trim()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-+|-+$/g, "")
                      .slice(0, 50) || "org";
                    await authClient.organization.create({ name, slug });
                    toast.success("Organization created");
                    setNewOrgName("");
                    await orgs.refetch?.();
                    await activeOrg.refetch?.();
                  } catch (e: unknown) {
                    const er = e as { error?: { message?: string }; message?: string };
                    toast.error(er?.error?.message || er?.message || "Failed to create");
                  } finally {
                    setCreatingOrg(false);
                  }
                }}
              >
                {creatingOrg ? "Creating..." : "Create organization"}
              </Button>
            </div>
          )}
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-text-primary">Your invitations</h4>
              <Button variant="outline" size="sm" onClick={() => incoming.refetch()} disabled={incoming.isPending}>Refresh</Button>
            </div>
            <IncomingInvitationsList list={(() => {
              const raw = incoming.data;
              const normalized = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data! : [];
              return normalized.filter((inv) => (inv?.status || '').toLowerCase() !== 'canceled');
            })()} onAccept={async (id) => {
              try {
                await authClient.organization.acceptInvitation({ invitationId: id });
                toast.success("Invitation accepted");
                await incoming.refetch();
                await orgs.refetch?.();
                await activeOrg.refetch?.();
              } catch (e: unknown) {
                const er = e as { error?: { message?: string }; message?: string };
                toast.error(er?.error?.message || er?.message || "Failed to accept");
              }
            }} onOpen={(id) => router.push(`/invite/${id}`)} />
          </Card>
        </div>
      )}
    </Card>
  );
});

OrganizationCard.displayName = "OrganizationCard";

type InvitationsListProps = { list: Invitation[]; onRefetch: () => void };
function InvitationsList({ list, onRefetch }: InvitationsListProps) {
  const activeOrg = authClient.useActiveOrganization();
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = React.useState<Set<string>>(new Set());

  if (!activeOrg.data) return null;

  return (
    <div className="space-y-2">
      <Label>Invitations</Label>
      <div className="space-y-2">
        {list.filter((i) => !hiddenIds.has(i.id)).length === 0 ? (
          <div className="text-sm text-muted-foreground">No invites</div>
        ) : (
          <AnimatePresence initial={false}>
            {list.filter((i) => !hiddenIds.has(i.id)).map((inv) => (
              <motion.div
                key={inv.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between border rounded px-3 py-2 overflow-hidden"
              >
              <div className="text-sm">
                {inv.email}
                <span className="ml-2 text-muted-foreground">{(inv.status)?.toLowerCase?.() || "pending"}</span>
              </div>
              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      aria-label="Resend"
                      className="h-8 w-8 rounded-md border flex items-center justify-center disabled:opacity-50"
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
                      {loadingId === inv.id ? <span className="animate-spin">●</span> : "⟲"}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Resend</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      aria-label="Cancel"
                      className="h-8 w-8 rounded-md bg-red-600 text-white flex items-center justify-center disabled:opacity-50"
                      disabled={loadingId === inv.id}
                      onClick={async () => {
                        const toHide = inv.id;
                        setLoadingId(inv.id);
                        toast.success("Invite canceled");
                        setTimeout(() => {
                          setHiddenIds((prev) => {
                            const next = new Set(prev);
                            next.add(toHide);
                            return next;
                          });
                        }, 300);
                        try {
                          await authClient.organization.cancelInvitation({ invitationId: inv.id });
                          onRefetch();
                        } catch (e: unknown) {
                          setHiddenIds((prev) => {
                            const next = new Set(prev);
                            next.delete(toHide);
                            return next;
                          });
                          const er = e as { error?: { message?: string }; message?: string };
                          toast.error(er?.error?.message || er?.message || "Failed to cancel");
                        } finally {
                          setLoadingId(null);
                        }
                      }}
                    >
                      {loadingId === inv.id ? <span className="animate-spin">●</span> : "✕"}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Cancel</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      aria-label="Copy link"
                      className="h-8 w-8 rounded-md border flex items-center justify-center disabled:opacity-50"
                      disabled={loadingId === inv.id}
                      onClick={async () => {
                        const base = window.location.origin;
                        await navigator.clipboard.writeText(`${base}/invite/${inv.id}`);
                        toast.success("Link copied");
                      }}
                    >
                      ⧉
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Copy link</TooltipContent>
                </Tooltip>
              </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

type IncomingInvitationsListProps = { list: Invitation[]; onAccept: (id: string) => Promise<void>; onOpen: (id: string) => void };
function IncomingInvitationsList({ list, onAccept, onOpen }: IncomingInvitationsListProps) {
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  return (
    <div className="space-y-2">
      {list.length === 0 ? (
        <div className="text-sm text-muted-foreground">No invitations</div>
      ) : (
        list.map((inv) => (
          <div key={inv.id} className="flex items-center justify-between border rounded px-3 py-2">
            <div className="text-sm">
              {inv.organization?.name || "Organization"}
              <span className="ml-2 text-muted-foreground">{(inv.status)?.toLowerCase?.() || "pending"}</span>
            </div>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    aria-label="Accept"
                    className="h-8 w-8 rounded-md bg-green-600 text-white flex items-center justify-center disabled:opacity-50"
                    disabled={loadingId === inv.id}
                    onClick={async () => {
                      try {
                        setLoadingId(inv.id);
                        await onAccept(inv.id);
                      } finally {
                        setLoadingId(null);
                      }
                    }}
                  >
                    {loadingId === inv.id ? <span className="animate-spin">●</span> : "✓"}
                  </button>
                </TooltipTrigger>
                <TooltipContent>Accept</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    aria-label="Open"
                    className="h-8 w-8 rounded-md border flex items-center justify-center"
                    disabled={loadingId === inv.id}
                    onClick={() => onOpen(inv.id)}
                  >
                    ⤴
                  </button>
                </TooltipTrigger>
                <TooltipContent>Open invite</TooltipContent>
              </Tooltip>
            </div>
          </div>
        ))
      )}
    </div>
  );
}


