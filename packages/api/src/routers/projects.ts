import { TRPCError } from "@trpc/server";
import { and, desc, eq, count } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "node:crypto";

import { db, project, environmentVariable } from "@better-env/db";
import { grim } from "../lib/use-dev-log";
const { info } = grim();
import { protectedProcedure, router } from "../trpc";
import { encryptSecretForProject, decryptSecretForProject } from "../lib/crypto";

const envVarInput = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
  description: z.string().optional(),
  environmentName: z.string().min(1).default("default"),
});

export const projectsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        logoUrl: z.string().url().optional(),
        envs: z.array(envVarInput).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        info("[projects.create]", { userId: ctx.session.user.id, input });
        const newProjectId = randomUUID();
        const [created] = await db
          .insert(project)
          .values({
            id: newProjectId,
            name: input.name,
            logoUrl: input.logoUrl,
            ownerId: ctx.session.user.id,
          })
          .returning();

        if (!created) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create project" });
        }

        let insertedEnvCount = 0;
        if (input.envs && input.envs.length > 0) {
          const values = input.envs
            .filter((e) => e.key && e.value)
            .map((e) => ({
              id: randomUUID(),
              projectId: created.id,
              key: e.key,
              value: encryptSecretForProject(created.id, e.value),
              description: e.description,
              environmentName: e.environmentName || "default",
            }));
          info("[projects.create] inserting envs", values.length);
          if (values.length > 0) {
            await db.insert(environmentVariable).values(values);
            insertedEnvCount = values.length;
          }
        }

        return { success: true, data: created, envsInserted: insertedEnvCount };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[projects.create]", error);
        const anyErr = error as any;
        if (anyErr?.code === "23505" || (anyErr?.message && /duplicate|unique/i.test(anyErr.message))) {
          throw new TRPCError({ code: "CONFLICT", message: "Project name already exists" });
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error creating project" });
      }
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db
      .select({
        id: project.id,
        name: project.name,
        logoUrl: project.logoUrl,
        ownerId: project.ownerId,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        envCount: count(environmentVariable.id).as("envCount"),
      })
      .from(project)
      .leftJoin(environmentVariable, eq(environmentVariable.projectId, project.id))
      .where(eq(project.ownerId, ctx.session.user.id))
      .groupBy(project.id)
      .orderBy(desc(project.createdAt));
    return { success: true, data: rows };
  }),

  get: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const [row] = await db
      .select()
      .from(project)
      .where(and(eq(project.id, input.id), eq(project.ownerId, ctx.session.user.id)))
      .limit(1);
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });

    const envsRaw = await db
      .select({ id: environmentVariable.id, key: environmentVariable.key, value: environmentVariable.value, description: environmentVariable.description, environmentName: environmentVariable.environmentName, createdAt: environmentVariable.createdAt, updatedAt: environmentVariable.updatedAt })
      .from(environmentVariable)
      .where(eq(environmentVariable.projectId, row.id));

    const envs = envsRaw.map((e) => ({
      ...e,
      value: decryptSecretForProject(row.id, e.value),
    }));

    return { success: true, data: { ...row, envs } };
  }),

  update: protectedProcedure
    .input(
      z.object({ id: z.string(), name: z.string().min(1).optional(), logoUrl: z.string().url().optional() })
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await db
        .select({ id: project.id })
        .from(project)
        .where(and(eq(project.id, input.id), eq(project.ownerId, ctx.session.user.id)))
        .limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });

      const [updated] = await db
        .update(project)
        .set({ name: input.name, logoUrl: input.logoUrl, updatedAt: new Date() })
        .where(eq(project.id, input.id))
        .returning();
      return { success: true, data: updated };
    }),

  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const [existing] = await db
      .select({ id: project.id })
      .from(project)
      .where(and(eq(project.id, input.id), eq(project.ownerId, ctx.session.user.id)))
      .limit(1);
    if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });

    await db.delete(project).where(eq(project.id, input.id));
    return { success: true };
  }),

  envs: router({
    add: protectedProcedure
      .input(z.object({ projectId: z.string(), env: envVarInput }))
      .mutation(async ({ ctx, input }) => {
        const [own] = await db
          .select({ id: project.id })
          .from(project)
          .where(and(eq(project.id, input.projectId), eq(project.ownerId, ctx.session.user.id)))
          .limit(1);
        if (!own) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });

        try {
          const [created] = await db
            .insert(environmentVariable)
            .values({
              id: randomUUID(),
              projectId: input.projectId,
              key: input.env.key,
              value: encryptSecretForProject(input.projectId, input.env.value),
              description: input.env.description,
              environmentName: input.env.environmentName || "default",
            })
            .returning();

          return { success: true, data: created };
        } catch (err) {
          const anyErr = err as any;
          if (anyErr?.code === "23505" || (anyErr?.message && /duplicate|unique/i.test(anyErr.message))) {
            throw new TRPCError({ code: "CONFLICT", message: "Variable already exists for this environment" });
          }
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to add variable" });
        }
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.string(),
          projectId: z.string(),
          key: z.string().min(1).optional(),
          value: z.string().min(1).optional(),
          description: z.string().optional(),
          environmentName: z.string().min(1).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const [own] = await db
          .select({ id: project.id })
          .from(project)
          .where(and(eq(project.id, input.projectId), eq(project.ownerId, ctx.session.user.id)))
          .limit(1);
        if (!own) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });

        const [existingVar] = await db
          .select({ id: environmentVariable.id, key: environmentVariable.key, environmentName: environmentVariable.environmentName })
          .from(environmentVariable)
          .where(eq(environmentVariable.id, input.id))
          .limit(1);

        if (!existingVar) throw new TRPCError({ code: "NOT_FOUND", message: "Env var not found" });

        const nextEnv = input.environmentName ?? existingVar.environmentName;
        const nextKey = input.key ?? existingVar.key;

        const [updated] = await db
          .update(environmentVariable)
          .set({
            key: nextKey,
            value: input.value,
            description: input.description,
            environmentName: nextEnv,
            updatedAt: new Date(),
          })
          .where(eq(environmentVariable.id, input.id))
          .returning();

        if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Env var not found" });
        return { success: true, data: updated };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string(), projectId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const [own] = await db
          .select({ id: project.id })
          .from(project)
          .where(and(eq(project.id, input.projectId), eq(project.ownerId, ctx.session.user.id)))
          .limit(1);
        if (!own) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });

        await db.delete(environmentVariable).where(eq(environmentVariable.id, input.id));
        return { success: true };
      }),
  }),
});

