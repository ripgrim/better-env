"use client"

import { authClient } from "@bounty/auth/client";
import { useEffect } from "react";

export default function RedirectToSignIn() {
    const { data: session, isPending } = authClient.useSession();
    
    useEffect(() => {
        if (!isPending && !session?.user) {
          // Capture the current URL as the callback URL
          const currentUrl = window.location.pathname + window.location.search;
          const callbackUrl = encodeURIComponent(currentUrl);
          window.location.href = `/login?callback=${callbackUrl}`;
        }
    }, [session, isPending]);

    if (isPending) {
        return <div>Loading...</div>;
    }

    return null;
}

