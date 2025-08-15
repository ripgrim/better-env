"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/utils/trpc";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "./ui/sonner";
import { ConfettiProvider } from "@/lib/context/confetti-context";
import { Databuddy } from "@databuddy/sdk";
import { TOAST_ICONS, TOAST_OPTIONS } from "@/constants/toast";
import { PostHogProvider } from "posthog-js/react";
import { AuthUIProvider } from "@daveyplate/better-auth-ui"
import { authClient } from "@better-env/auth/client";
import { useRouter } from "next/navigation"
import Link from "next/link";
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { KeybindsProvider } from "@/components/keybinds-provider";


export function Providers({
  children
}: {
  children: React.ReactNode
}) {
  const posthogApiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const router = useRouter()

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        {posthogApiKey ? (
          <PostHogProvider apiKey={posthogApiKey}>
            <ConfettiProvider>
              <AuthUIProvider
                authClient={authClient}
                navigate={router.push}
                replace={router.replace}
                onSessionChange={() => {
                  // Clear router cache (protected routes)
                  router.refresh()
                }}
                Link={Link}
              >
                <EnsureOrganization />
                <KeybindsProvider>
                  {children}
                </KeybindsProvider>
              </AuthUIProvider>
              <Databuddy
                clientId="bounty"
                trackHashChanges={true}
                trackAttributes={true}
                trackOutgoingLinks={true}
                trackInteractions={true}
                trackEngagement={true}
                trackScrollDepth={true}
                trackExitIntent={true}
                trackBounceRate={true}
                trackWebVitals={true}
                trackErrors={true}
                enableBatching={true}
              />
            </ConfettiProvider>
            <ReactQueryDevtools />
          </PostHogProvider>
        ) : (
          <ConfettiProvider>
            <EnsureOrganization />
            <KeybindsProvider>
              {children}
            </KeybindsProvider>
            <Databuddy
              clientId="bounty"
              trackHashChanges={true}
              trackAttributes={true}
              trackOutgoingLinks={true}
              trackInteractions={true}
              trackEngagement={true}
              trackScrollDepth={true}
              trackExitIntent={true}
              trackBounceRate={true}
              trackWebVitals={true}
              trackErrors={true}
              enableBatching={true}
            />
          </ConfettiProvider>
        )}
      </QueryClientProvider>
      <Toaster
        richColors
        position="bottom-right"
        toastOptions={TOAST_OPTIONS}
        icons={TOAST_ICONS}
        visibleToasts={4}
      />
    </ThemeProvider>
  );
}

function EnsureOrganization() {
  const [open, setOpen] = React.useState(false);
  const [orgName, setOrgName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);
  const session = authClient.useSession();
  const orgs = authClient.useListOrganizations();
  const invitations = useQuery({
    queryKey: ["org-invites"],
    queryFn: async () => {
      const res = await authClient.organization.listUserInvitations();
      return res;
    },
  });

  React.useEffect(() => {
    if (!session.data?.user) return;
    if (orgs.isPending) return;
    const isDismissed = typeof window !== "undefined" && sessionStorage.getItem("orgPromptDismissed") === "1";
    if (dismissed || isDismissed) {
      setOpen(false);
      return;
    }
    const invites = Array.isArray(invitations.data) ? invitations.data : [];
    const hasOrg = Array.isArray(orgs.data) && orgs.data.length > 0;
    const hasInvite = invites.length > 0;
    setOpen(!hasOrg || hasInvite);
  }, [session.data?.user, orgs.isPending, orgs.data, invitations.data, dismissed]);

  const acceptInvite = async (invitationId: string, organizationId?: string) => {
    setLoading(true);
    try {
      await authClient.organization.acceptInvitation({ invitationId });
      if (organizationId) {
        await authClient.organization.setActive({ organizationId });
      }
      await orgs.refetch?.();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const createOrg = async () => {
    if (!orgName.trim()) return;
    setLoading(true);
    try {
      const slug = orgName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      await authClient.organization.create({ name: orgName.trim(), slug });
      await orgs.refetch?.();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{(Array.isArray(invitations.data) && invitations.data.length > 0) ? "You're invited" : "Create your workspace"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {Array.isArray(invitations.data) && invitations.data.length > 0 ? (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">Choose an invite to join.</div>
              <div className="space-y-2">
                {(Array.isArray(invitations.data) ? invitations.data : []).map((inv: { id: string; organizationId?: string; organization?: { name?: string } }) => (
                  <div key={inv.id} className="flex items-center justify-between gap-3 border rounded-md px-3 py-2">
                    <div className="text-sm text-foreground">{inv.organization?.name || inv.organizationId || "Organization"}</div>
                    <Button size="sm" onClick={() => acceptInvite(inv.id, inv.organizationId)} disabled={loading}>
                      {loading ? "Joining..." : "Accept"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization name</Label>
              <Input id="org-name" placeholder="acme" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
              <Button onClick={createOrg} disabled={!orgName.trim() || loading}>{loading ? "Creating..." : "Create"}</Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setDismissed(true);
              if (typeof window !== "undefined") sessionStorage.setItem("orgPromptDismissed", "1");
              setOpen(false);
            }}
          >
            Not now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
