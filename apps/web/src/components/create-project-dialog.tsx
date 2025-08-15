"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProjectSchema, type CreateProjectInput, type EnvVarInput } from "./forms";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { authClient } from "@better-env/auth/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
 

export function CreateProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const activeOrg = authClient.useActiveOrganization();
  const orgs = authClient.useListOrganizations();
  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: "", logoUrl: "", envs: [] },
  });

  const { fields, remove, replace, append } = useFieldArray({ control: form.control, name: "envs" });
  const [keyEntry, setKeyEntry] = useState("");
  const [valueEntry, setValueEntry] = useState("");
  const [selectedEnv, setSelectedEnv] = useState("development");
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const displayOrgId = selectedOrgId ?? (activeOrg.data?.id ?? "__personal");

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
      const existing = form.getValues("envs") ?? [];
      const mapped: EnvVarInput[] = parsed
        .filter((v) => v.key)
        .map((v) => ({ key: v.key, value: v.value, environmentName: selectedEnv }));
      const next: EnvVarInput[] = [...existing, ...mapped];
      replace(next);
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
    append({ key: k, value: v, environmentName: selectedEnv });
    setKeyEntry("");
    setValueEntry("");
  }

  const createMutation = useMutation({
    ...trpc.projects.create.mutationOptions(),
    onSuccess: () => {
      toast.success("Project created");
      queryClient.invalidateQueries({ queryKey: trpc.projects.list.queryKey() });
      onOpenChange(false);
    },
    onError: (error) => {
      const msg = error?.message || "Failed to create project";
      form.setError("name", { type: "server", message: msg });
      toast.error(msg);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(async (values) => {
            setSubmitting(true);
            let envs: EnvVarInput[] = form.getValues("envs") ?? [];
            if (keyEntry.trim() && valueEntry) {
              envs = [...envs, { key: keyEntry.trim(), value: valueEntry, environmentName: selectedEnv }];
            }
            await createMutation.mutateAsync({ name: values.name, logoUrl: values.logoUrl || undefined, organizationId: displayOrgId === "__personal" ? undefined : displayOrgId, envs });
            setSubmitting(false);
          })}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label>Organization</Label>
            <Select value={displayOrgId} onValueChange={(v) => setSelectedOrgId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__personal">Personal workspace</SelectItem>
                {Array.isArray(orgs.data) && orgs.data.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    <span className="inline-flex items-center gap-2">
                      {o.name}
                      {activeOrg.data?.id === o.id && <Badge variant="secondary">Active</Badge>}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 mt-4">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="my-app" {...form.register("name")} aria-invalid={!!form.formState.errors.name} />
            {form.formState.errors.name && <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input id="logoUrl" placeholder="https://..." {...form.register("logoUrl")} aria-invalid={!!form.formState.errors.logoUrl} />
            {form.formState.errors.logoUrl && <p className="text-red-500 text-sm">{form.formState.errors.logoUrl.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="envName">Default Environment</Label>
            <select
              id="envName"
              className="w-full border rounded-md px-3 py-2 bg-transparent"
              value={selectedEnv}
              onChange={(e) => {
                const env = e.target.value;
                setSelectedEnv(env);
                const current = (form.getValues("envs") || []) as { key: string; value: string; environmentName?: string }[];
                form.setValue(
                  "envs",
                  current.map((v) => ({ ...v, environmentName: env }))
                );
              }}
            >
              <option value="production">Production</option>
              <option value="preview">Preview</option>
              <option value="development">Development</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Environment variables</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Key</div>
                <Input
                  placeholder="DATABASE_URL"
                  value={keyEntry}
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
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Value</div>
                <Input
                  placeholder="postgresql://..."
                  value={valueEntry}
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
              <Button type="button" onClick={addPair} disabled={!keyEntry.trim() || !valueEntry}>
                Add another
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {fields.map((field, index) => (
                <>
                  <div className="flex items-center gap-2" key={`${field.id}-key`}>
                    <Input placeholder="KEY" {...form.register(`envs.${index}.key` as const)} />
                  </div>
                  <div className="flex items-center gap-2" key={`${field.id}-value`}>
                    <Input placeholder="value" {...form.register(`envs.${index}.value` as const)} />
                    <Button type="button" variant="text" onClick={() => remove(index)} className="shrink-0">
                      Remove
                    </Button>
                  </div>
                </>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={submitting || createMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" className="bg-accent-blue" disabled={submitting || createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

