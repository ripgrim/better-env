"use client";

import { authClient } from "@better-env/auth/client";
import { useRouter } from "next/navigation";
import { UserCard } from "@/components/profile/user-card";
import { OrganizationCard } from "@/components/profile/organization-card";
import { Spinner } from "@/components/ui/spinner";
import { DashboardHeader } from "@/components/dashboard-header";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import { Pencil } from "lucide-react";
import type { UserCardHandle } from "@/components/profile/user-card";
import type { OrganizationCardHandle } from "@/components/profile/organization-card";

export default function ProfilePage() {
  const router = useRouter();
  const session = authClient.useSession();
  const [editing, setEditing] = useState(false);
  const [userDirty, setUserDirty] = useState(false);
  const [orgDirty, setOrgDirty] = useState(false);
  const userRef = useRef<UserCardHandle>(null);
  const orgRef = useRef<OrganizationCardHandle>(null);
  const hasChanges = userDirty || orgDirty;

  if (session.isPending) {
    return <div className="flex h-screen items-center justify-center"><Spinner size={24} /></div>;
  }

  if (!session.data?.user) {
    router.replace("/login");
    return null;
  }

  return (
    <main className="px-8 py-8 max-w-5xl mx-auto space-y-8 w-full">
      <DashboardHeader session={session.data?.user || null} />
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-text-primary text-2xl font-semibold tracking-tight">Profile</h1>
          <p className="text-sm text-text-secondary">Manage your account, workspace, and invites</p>
        </div>
        <Button
          variant={editing ? (hasChanges ? "default" : "secondary") : "default"}
          onClick={async () => {
            if (!editing) {
              setEditing(true);
              return;
            }
            if (hasChanges) {
              await userRef.current?.save();
              await orgRef.current?.save();
            }
            setEditing(false);
          }}
        >
          {editing ? (hasChanges ? "Save changes" : "Cancel") : (
            <span className="inline-flex items-center gap-2"><Pencil className="size-4" /> Edit profile</span>
          )}
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-text-secondary">Account</h2>
          <UserCard ref={userRef} editing={editing} onDirtyChange={setUserDirty} />
        </div>
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-text-secondary">Organization</h2>
          <OrganizationCard ref={orgRef} editing={editing} onDirtyChange={setOrgDirty} />
        </div>
      </div>
    </main>
  );
}


