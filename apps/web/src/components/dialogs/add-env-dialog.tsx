"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

export function AddEnvDialog({ projectId, open, onOpenChange }: { projectId: string; open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient();
  const [keyInput, setKeyInput] = useState("");
  const [valueInput, setValueInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [envName, setEnvName] = useState("development");

  const addEnv = useMutation({
    ...trpc.projects.envs.add.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trpc.projects.get.queryKey({ id: projectId }) });
      onOpenChange(false);
      setKeyInput("");
      setValueInput("");
      setDescInput("");
      setEnvName("default");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add variable</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="env-key">Key</Label>
              <Input id="env-key" placeholder="DATABASE_URL" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="env-value">Value</Label>
              <Textarea id="env-value" placeholder="postgresql://..." value={valueInput} onChange={(e) => setValueInput(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="env-name">Environment</Label>
            <select id="env-name" className="w-full border rounded-md px-3 py-2 bg-transparent" value={envName} onChange={(e) => setEnvName(e.target.value)}>
              <option value="production">Production</option>
              <option value="preview">Preview</option>
              <option value="development">Development</option>
            </select>
          </div>
          <div>
            <Label htmlFor="env-desc">Description</Label>
            <Input id="env-desc" placeholder="Optional" value={descInput} onChange={(e) => setDescInput(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => addEnv.mutate({ projectId, env: { key: keyInput, value: valueInput, description: descInput || undefined, environmentName: envName || "default" } })} disabled={!keyInput || !valueInput || addEnv.isPending}>
            {addEnv.isPending ? "Adding..." : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

