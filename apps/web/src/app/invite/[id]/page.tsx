"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@better-env/auth/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Invitation, AppError } from "@/types";

export default function AcceptInvitePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const session = authClient.useSession();

  const [invite, setInvite] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const data = await authClient.organization.getInvitation({ query: { id } });
        setInvite(data?.data || null);
      } catch {
        setError("Invitation not found or expired.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleAccept = async () => {
    if (!id) return;
    if (!session.data?.user) return router.replace(`/login?callbackURL=/invite/${id}`);
    setAccepting(true);
    try {
      await authClient.organization.acceptInvitation({ invitationId: id });
      router.replace("/");
    } catch (e: unknown) {
      const err = e as AppError;
      const code = err.code || err.error?.code;
      if (code === "YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION") {
        setError(`This invite is for ${invite?.email}. You're signed in as ${session.data?.user?.email}.`);
      } else {
        setError("Failed to accept invitation.");
      }
      setAccepting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 flex items-center justify-center">
      <Card className="w-full max-w-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold text-text-primary">Workspace invitation</h1>
          {loading ? (
            <p className="text-sm text-text-secondary">Loading invitation…</p>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : (
            <p className="text-sm text-text-secondary">
              You were invited to join <span className="text-text-primary font-medium">{invite?.organization?.name || "an organization"}</span>
            </p>
          )}
        </div>

        {!loading && invite && (
          <div className="space-y-4">
            <div className="rounded-md border p-4">
              <div className="text-sm text-text-secondary">Invitee</div>
              <div className="text-text-primary text-sm">{invite.email}</div>
            </div>
            {session.data?.user && session.data.user.email.toLowerCase() !== invite.email.toLowerCase() && (
              <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 p-4 text-yellow-700 text-sm">
                You’re signed in as {session.data.user.email}, but this invite is for {invite.email}.
              </div>
            )}
            <Separator />
            <div className="flex items-center justify-between gap-3">
              <Button
                className="bg-accent-blue"
                disabled={accepting}
                onClick={handleAccept}
              >
                {accepting ? "Accepting…" : "Accept invitation"}
              </Button>
              {!session.data?.user ? (
                <Button
                  variant="secondary"
                  onClick={() => router.replace(`/login?callbackURL=/invite/${id}`)}
                >
                  Sign in to accept
                </Button>
              ) : (
                session.data.user.email.toLowerCase() !== invite.email.toLowerCase() && (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      authClient.signOut({
                        fetchOptions: {
                          onSuccess: () => router.replace(`/login?callbackURL=/invite/${id}`),
                        },
                      })
                    }
                  >
                    Switch account
                  </Button>
                )
              )}
            </div>
          </div>
        )}
      </Card>
    </main>
  );
}


