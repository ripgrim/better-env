"use client";

import { authClient } from "@better-env/auth/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useRef, useState } from "react";

export function UserCard() {
  const session = authClient.useSession();
  const nameRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);

  if (session.isPending) return null;
  if (!session.data?.user) return null;

  return (
    <Card className="p-5 space-y-4">
      <div>
        <h2 className="text-sm text-text-secondary mb-1">User</h2>
        <Separator />
      </div>
      <div className="space-y-3">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" defaultValue={session.data.user.name || ""} ref={nameRef} disabled={!editing} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={session.data.user.email || ""} disabled />
        </div>
        <div className="flex gap-2">
          {!editing ? (
            <Button onClick={() => setEditing(true)}>Edit</Button>
          ) : (
            <>
              <Button
                onClick={async () => {
                  const nextName = nameRef.current?.value?.trim() || "";
                  if (!nextName) return;
                  if ((authClient as unknown as { user?: { update?: (data: { name: string }) => Promise<void> } }).user?.update) {
                    await (authClient as unknown as { user: { update: (data: { name: string }) => Promise<void> } }).user.update({ name: nextName });
                  }
                  await session.refetch?.();
                  setEditing(false);
                }}
              >
                Save
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  if (nameRef.current) nameRef.current.value = session.data?.user?.name || "";
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}


