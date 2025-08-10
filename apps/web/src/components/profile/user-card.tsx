"use client";

import { authClient } from "@better-env/auth/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useMemo, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import type { SaveController } from "@/types";

type UserCardProps = { editing?: boolean; onDirtyChange?: (dirty: boolean) => void; provideController?: (c: SaveController | null) => void };
export function UserCard({ editing: externalEditing = false, onDirtyChange, provideController }: UserCardProps) {
  const session = authClient.useSession();
  const nameRef = useRef<HTMLInputElement>(null);
  const originalName = useMemo(() => session.data?.user?.name || "", [session.data?.user?.name]);

  const updateName = useMutation({
    ...trpc.user.updateCurrentUserName.mutationOptions(),
  });

  const isDirty = useCallback(() => {
    const nextName = nameRef.current?.value ?? "";
    return nextName.trim() !== originalName.trim();
  }, [originalName]);

  const save = useCallback(async () => {
    const nextName = nameRef.current?.value?.trim() || "";
    if (nextName && nextName !== originalName) {
      await updateName.mutateAsync({ name: nextName });
      await session.refetch?.();
    }
  }, [originalName, session, updateName]);

  useEffect(() => {
    provideController?.({ save, isDirty });
    return () => provideController?.(null);
  }, [provideController, save, isDirty]);

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
}


