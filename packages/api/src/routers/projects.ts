import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db, project, environmentVariable } from "@better-env/db";
import { protectedProcedure, router } from "../trpc";

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
        const [created] = await db
          .insert(project)
          .values({
            name: input.name,
            logoUrl: input.logoUrl,
            ownerId: ctx.session.user.id,
          })
          .returning();

        if (!created) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create project" });
        }

        if (input.envs && input.envs.length > 0) {
          await db.insert(environmentVariable).values(
            input.envs.map((e) => ({
              projectId: created.id,
              key: e.key,
              value: e.value,
              description: e.description,
              environmentName: e.environmentName || "default",
            }))
          );
        }

        return { success: true, data: created };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error creating project" });
      }
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db
      .select()
      .from(project)
      .where(eq(project.ownerId, ctx.session.user.id))
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

    const envs = await db
      .select()
      .from(environmentVariable)
      .where(eq(environmentVariable.projectId, row.id));

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

        const [created] = await db
          .insert(environmentVariable)
          .values({
            projectId: input.projectId,
            key: input.env.key,
            value: input.env.value,
            description: input.env.description,
            environmentName: input.env.environmentName || "default",
          })
          .returning();

        return { success: true, data: created };
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

        const [updated] = await db
          .update(environmentVariable)
          .set({
            key: input.key,
            value: input.value,
            description: input.description,
            environmentName: input.environmentName,
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

