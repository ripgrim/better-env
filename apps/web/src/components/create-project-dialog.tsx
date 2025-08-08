"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProjectSchema, type CreateProjectInput } from "./forms";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export function CreateProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: "", logoUrl: "", envs: [] },
  });

  const { fields, remove, replace } = useFieldArray({ control: form.control, name: "envs" });
  const [keysText, setKeysText] = useState("");
  const [valuesText, setValuesText] = useState("");

  function parseEnv(content: string) {
    const lines = content.split(/\r?\n/);
    const vars: { key: string; value: string }[] = [];
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      if (line.startsWith("#")) continue;
      const eqIndex = line.indexOf("=");
      if (eqIndex === -1) {
        vars.push({ key: line, value: "" });
      } else {
        const key = line.slice(0, eqIndex).replace(/^export\s+/, "").trim();
        const value = line.slice(eqIndex + 1);
        vars.push({ key, value });
      }
    }
    return vars;
  }

  function handlePaste(text: string) {
    const parsed = parseEnv(text);
    if (parsed.length) {
      replace(parsed.map((v) => ({ key: v.key, value: v.value })) as any);
      setKeysText(parsed.map((v) => v.key).join("\n"));
      setValuesText(parsed.map((v) => v.value).join("\n"));
      toast.success("Imported variables");
    }
  }

  function composeFromTwoBoxes() {
    const kLines = keysText.split(/\r?\n/);
    const vLines = valuesText.split(/\r?\n/);
    const max = Math.max(kLines.length, vLines.length);
    const entries: { key: string; value: string }[] = [];
    for (let i = 0; i < max; i++) {
      const k = (kLines[i] || "").trim();
      const v = (vLines[i] || "").trim();
      if (!k) continue;
      entries.push({ key: k, value: v });
    }
    replace(entries as any);
    return entries;
  }

  const createMutation = useMutation({
    ...trpc.projects.create.mutationOptions(),
    onSuccess: () => {
      toast.success("Project created");
      queryClient.invalidateQueries({ queryKey: trpc.projects.list.queryKey() });
      onOpenChange(false);
    },
    onError: (err: any) => {
      const msg = err?.message || "Failed to create project";
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
            const composed = composeFromTwoBoxes();
            await createMutation.mutateAsync({ name: values.name, logoUrl: values.logoUrl || undefined, envs: composed });
            setSubmitting(false);
          })}
          className="space-y-4"
        >
          <div className="space-y-2 mt-4" >
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
            <select id="envName" className="w-full border rounded-md px-3 py-2 bg-transparent" defaultValue="development" onChange={(e) => {
              const env = e.target.value;
              const current = form.getValues("envs") || [];
              form.setValue("envs", current.map((v) => ({ ...v, environmentName: env })) as any);
            }}>
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
                  placeholder={`DATABASE_URL`}
                  value={keysText}
                  onChange={(e) => setKeysText(e.target.value)}
                  onBlur={() => composeFromTwoBoxes()}
                  onPaste={(e) => {
                    const text = e.clipboardData.getData("text");
                    if (text.includes("\n") || text.includes("=")) {
                      e.preventDefault();
                      handlePaste(text);
                    }
                  }}
                />
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Value</div>
                <Input
                  placeholder={`postgresql://...`}
                  value={valuesText}
                  onChange={(e) => setValuesText(e.target.value)}
                  onBlur={() => composeFromTwoBoxes()}
                  onPaste={(e) => {
                    const text = e.clipboardData.getData("text");
                    if (text.includes("\n") || text.includes("=")) {
                      e.preventDefault();
                      handlePaste(text);
                    }
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">Key</div>
              <div className="text-sm text-muted-foreground">Value</div>
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

