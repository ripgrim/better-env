"use client";

import { z } from "zod";

export const envVarSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
  description: z.string().optional(),
  environmentName: z.string().min(1).default("default"),
});

export const createProjectSchema = z.object({
  name: z.string().min(1),
  logoUrl: z.string().url().optional(),
  envs: z.array(envVarSchema).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type EnvVarInput = z.infer<typeof envVarSchema>;

