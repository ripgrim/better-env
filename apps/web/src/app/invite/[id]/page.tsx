"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { authClient } from "@better-env/auth/client";

export default function AcceptInvitePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const session = authClient.useSession();

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      if (!session.data?.user) {
        window.location.href = `/login?callbackURL=/invite/${id}`;
        return;
      }
      try {
        await authClient.organization.acceptInvitation({ invitationId: id });
        router.replace("/");
      } catch {
        router.replace("/");
      }
    };
    run();
  }, [id, session.data?.user, router]);

  return <div className="p-8">Accepting invitation…</div>;
}


