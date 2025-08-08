"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

export function EditProjectDialog({ projectId, name, logoUrl, open, onOpenChange }: { projectId: string; name: string; logoUrl?: string; open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient();
  const [n, setN] = useState(name);
  const [l, setL] = useState(logoUrl || "");

  useEffect(() => {
    if (open) {
      setN(name);
      setL(logoUrl || "");
    }
  }, [open, name, logoUrl]);

  const update = useMutation({
    ...trpc.projects.update.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trpc.projects.list.queryKey() });
      qc.invalidateQueries({ queryKey: trpc.projects.get.queryKey({ id: projectId }) });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="pname">Name</Label>
            <Input id="pname" value={n} onChange={(e) => setN(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="plogo">Logo URL</Label>
            <Input id="plogo" value={l} onChange={(e) => setL(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => update.mutate({ id: projectId, name: n, logoUrl: l || undefined })} disabled={!n || update.isPending}>
            {update.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

