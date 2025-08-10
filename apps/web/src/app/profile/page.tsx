"use client";

import { authClient } from "@better-env/auth/client";
import { useRouter } from "next/navigation";
import { UserCard } from "@/components/profile/user-card";
import { OrganizationCard } from "@/components/profile/organization-card";

export default function ProfilePage() {
  const router = useRouter();
  const session = authClient.useSession();

  if (session.isPending) return <div className="p-8">Loading...</div>;
  if (!session.data?.user) {
    router.replace("/login");
    return null;
  }

  return (
    <main className="px-8 py-8 max-w-4xl mx-auto space-y-6 w-full">
      <h1 className="text-text-primary text-xl font-medium tracking-tight">Profile</h1>
      <div className="flex flex-col gap-6 w-full">
        <UserCard />
        <OrganizationCard />
      </div>
    </main>
  );
}


