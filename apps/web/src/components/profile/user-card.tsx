"use client";

import { authClient } from "@better-env/auth/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";

export type UserCardHandle = { save: () => Promise<void>; isDirty: () => boolean };
type UserCardProps = { editing?: boolean; onDirtyChange?: (dirty: boolean) => void };
export const UserCard = forwardRef<UserCardHandle, UserCardProps>(function UserCard({ editing: externalEditing = false, onDirtyChange }, ref) {
  const session = authClient.useSession();
  const nameRef = useRef<HTMLInputElement>(null);
  const originalName = useMemo(() => session.data?.user?.name || "", [session.data?.user?.name]);

  useImperativeHandle(ref, () => ({
    save: async () => {
      const nextName = nameRef.current?.value?.trim() || "";
      if (nextName && nextName !== originalName) {
        if ((authClient as unknown as { user?: { update?: (data: { name: string }) => Promise<void> } }).user?.update) {
          await (authClient as unknown as { user: { update: (data: { name: string }) => Promise<void> } }).user.update({ name: nextName });
        }
        await session.refetch?.();
      }
    },
    isDirty: () => {
      const nextName = nameRef.current?.value ?? "";
      return nextName.trim() !== originalName.trim();
    },
  }), [originalName, session]);

  const handleChange = () => {
    onDirtyChange?.((nameRef.current?.value?.trim() || "") !== originalName);
  };

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
          <Input id="name" defaultValue={session.data.user.name || ""} ref={nameRef} onChange={handleChange} disabled={!externalEditing} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={session.data.user.email || ""} disabled />
        </div>
      </div>
    </Card>
  );
});

UserCard.displayName = "UserCard";


