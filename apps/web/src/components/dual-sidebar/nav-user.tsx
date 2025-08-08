"use client";

import { authClient } from "@better-env/auth/client";
import { useState } from "react";
import { toast } from "sonner";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    image: string | null;
  };
}) {
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const { data: session } = authClient.useSession();

  const handleUpgrade = async () => {
    if (!session?.user) {
      toast.error("Please sign in to upgrade your account.");
      return;
    }

    setPricingDialogOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <span>
          {user.name}
        </span> 
        <span>
          {user.email}
        </span>
      </div>
    </>
  );
}
