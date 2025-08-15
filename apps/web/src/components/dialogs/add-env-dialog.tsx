"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";

export function AddEnvDialog({ projectId, open, onOpenChange }: { projectId: string; open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient();
  const [keyEntry, setKeyEntry] = useState("");
  const [valueEntry, setValueEntry] = useState("");
  const [envName, setEnvName] = useState("development");
  const [envs, setEnvs] = useState<{ key: string; value: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const addEnv = useMutation({
    ...trpc.projects.envs.add.mutationOptions(),
  });

  function parseEnv(content: string) {
    const lines = content.split(/\r?\n/);
    const vars: { key: string; value: string }[] = [];
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      if (line.startsWith("#")) continue;
      const eqIndex = line.indexOf("=");
      if (eqIndex === -1) {
        const k = line.replace(/^export\s+/, "").trim();
        if (!k) continue;
        vars.push({ key: k, value: "" });
      } else {
        const key = line.slice(0, eqIndex).replace(/^export\s+/, "").trim();
        let value = line.slice(eqIndex + 1);
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        vars.push({ key, value });
      }
    }
    return vars;
  }

  function handlePasteText(text: string) {
    const parsed = parseEnv(text);
    if (!parsed.length) return;
    if (parsed.length > 1) {
      setEnvs((prev) => [...prev, ...parsed.filter((v) => v.key)]);
      setKeyEntry("");
      setValueEntry("");
      toast.success("Imported variables");
    } else {
      setKeyEntry(parsed[0].key);
      setValueEntry(parsed[0].value);
    }
  }

  function addPair() {
    const k = keyEntry.trim();
    const v = valueEntry;
    if (!k || !v) return;
    setEnvs((prev) => [...prev, { key: k, value: v }]);
    setKeyEntry("");
    setValueEntry("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="mb-2">
          <DialogTitle>Add variables</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="env-key">Key</Label>
              <Input
                id="env-key"
                placeholder="DATABASE_URL"
                value={keyEntry}
                className="mt-2"
                onChange={(e) => setKeyEntry(e.target.value)}
                onPaste={(e) => {
                  const text = e.clipboardData.getData("text");
                  if (text.includes("\n") || text.includes("=")) {
                    e.preventDefault();
                    handlePasteText(text);
                  }
                }}
              />
            </div>
            <div>
              <Label htmlFor="env-value">Value</Label>
              <Input
                id="env-value"
                placeholder="postgresql://..."
                value={valueEntry}
                className="mt-2"
                onChange={(e) => setValueEntry(e.target.value)}
                onPaste={(e) => {
                  const text = e.clipboardData.getData("text");
                  if (text.includes("\n") || text.includes("=")) {
                    e.preventDefault();
                    handlePasteText(text);
                  }
                }}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="button" onClick={addPair} disabled={!keyEntry.trim() || !valueEntry}>Add another</Button>
          </div>
          {envs.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">Key</div>
              <div className="text-sm text-muted-foreground">Value</div>
              {envs.map((item, idx) => (
                <>
                  <div className="flex items-center gap-2" key={`k-${idx}`}>
                    <Input
                      placeholder="KEY"
                      value={item.key}
                      onChange={(e) => {
                        const v = e.target.value;
                        setEnvs((prev) => prev.map((it, i) => (i === idx ? { ...it, key: v } : it)));
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2" key={`v-${idx}`}>
                    <Input
                      placeholder="value"
                      value={item.value}
                      onChange={(e) => {
                        const v = e.target.value;
                        setEnvs((prev) => prev.map((it, i) => (i === idx ? { ...it, value: v } : it)));
                      }}
                    />
                    <Button type="button" variant="text" onClick={() => setEnvs((prev) => prev.filter((_, i) => i !== idx))} className="shrink-0">
                      Remove
                    </Button>
                  </div>
                </>
              ))}
            </div>
          )}
          <div>
            <Label htmlFor="env-name">Environment</Label>
            <select id="env-name" className="w-full border rounded-md px-3 py-2 bg-transparent mb-4 mt-2" value={envName} onChange={(e) => setEnvName(e.target.value)}>
              <option value="production">Production</option>
              <option value="preview">Preview</option>
              <option value="development">Development</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={async () => {
              if (saving) return;
              const toAdd = [
                ...envs,
                ...(keyEntry.trim() && valueEntry ? [{ key: keyEntry.trim(), value: valueEntry }] : []),
              ].filter((e) => e.key && e.value);
              if (toAdd.length === 0) return;
              try {
                setSaving(true);
                await Promise.all(
                  toAdd.map((e) =>
                    addEnv.mutateAsync({ projectId, env: { key: e.key, value: e.value, environmentName: envName || "default" } })
                  )
                );
                await qc.invalidateQueries({ queryKey: trpc.projects.get.queryKey({ id: projectId }) });
                toast.success("Added variables");
                setKeyEntry("");
                setValueEntry("");
                setEnvs([]);
                onOpenChange(false);
              } catch (err: unknown) {
                const e = err as { message?: string };
                const msg = e?.message || "Failed to add";
                toast.error(msg);
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
          >
            {saving ? "Adding..." : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

