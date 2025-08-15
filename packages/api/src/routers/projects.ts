import { TRPCError } from "@trpc/server";
import { and, desc, eq, count, isNull, inArray } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "node:crypto";

import { db, project, environmentVariable, member, organization } from "@better-env/db";
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
        organizationId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        info("[projects.create]", { userId: ctx.session.user.id, input });
        const newProjectId = randomUUID();
        const activeOrgId = (ctx.session as { activeOrganizationId?: string } | null)?.activeOrganizationId || input.organizationId;
        const [created] = await db
          .insert(project)
          .values({
            id: newProjectId,
            name: input.name,
            logoUrl: input.logoUrl,
            ownerId: ctx.session.user.id,
            organizationId: activeOrgId ?? null,
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

  list: protectedProcedure
    .input(z.object({ organizationId: z.string().nullable().optional() }).optional())
    .query(async ({ ctx, input }) => {
    const requestedOrgId = (input?.organizationId ?? null) as string | null;
    const activeOrgId = requestedOrgId || ((ctx.session as { activeOrganizationId?: string } | null)?.activeOrganizationId ?? null);
    const selectBase = () =>
      db
        .select({
          id: project.id,
          name: project.name,
          logoUrl: project.logoUrl,
          ownerId: project.ownerId,
          organizationId: project.organizationId,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          envCount: count(environmentVariable.id).as("envCount"),
        })
        .from(project)
        .leftJoin(environmentVariable, eq(environmentVariable.projectId, project.id))
        .groupBy(project.id);

    const personal = await selectBase()
      .where(and(eq(project.ownerId, ctx.session.user.id), isNull(project.organizationId)))
      .orderBy(desc(project.createdAt));

    const org = activeOrgId
      ? await selectBase()
          .where(eq(project.organizationId, activeOrgId))
          .orderBy(desc(project.createdAt))
      : [];

    const memberships = await db
      .select({ orgId: member.organizationId, name: organization.name })
      .from(member)
      .leftJoin(organization, eq(organization.id, member.organizationId))
      .where(eq(member.userId, ctx.session.user.id));

    const orgIds = memberships.map((m) => m.orgId).filter(Boolean) as string[];
    let orgs: { organizationId: string; organizationName: string | null; projects: typeof org }[] = [];
    if (orgIds.length > 0) {
      const all = await selectBase()
        .where(inArray(project.organizationId, orgIds))
        .orderBy(desc(project.createdAt));
      const byId = new Map<string, { organizationId: string; organizationName: string | null; projects: typeof all }>();
      for (const m of memberships) {
        if (!m.orgId) continue;
        byId.set(m.orgId, { organizationId: m.orgId, organizationName: m.name ?? null, projects: [] });
      }
      for (const p of all) {
        if (!p.organizationId) continue;
        const bucket = byId.get(p.organizationId);
        if (bucket) bucket.projects.push(p);
      }
      orgs = Array.from(byId.values());
    }

    return { success: true, data: { personal, org, orgs } };
  }),

  debugAll: protectedProcedure.query(async ({ ctx }) => {
    if (process.env.NODE_ENV === "production") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not available in production" });
    }
    const rows = await db
      .select({
        id: project.id,
        name: project.name,
        logoUrl: project.logoUrl,
        ownerId: project.ownerId,
        organizationId: project.organizationId,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        envCount: count(environmentVariable.id).as("envCount"),
      })
      .from(project)
      .leftJoin(environmentVariable, eq(environmentVariable.projectId, project.id))
      .groupBy(project.id)
      .orderBy(desc(project.createdAt));
    return { success: true, data: rows };
  }),

  get: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const [row] = await db
      .select()
      .from(project)
      .where(eq(project.id, input.id))
      .limit(1);
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });

    if (row.organizationId == null) {
      if (row.ownerId !== ctx.session.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }
    } else {
      const [membership] = await db
        .select({ id: member.id })
        .from(member)
        .where(and(eq(member.userId, ctx.session.user.id), eq(member.organizationId, row.organizationId)))
        .limit(1);
      if (!membership) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }
    }

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
      const activeOrgId = (ctx.session as { activeOrganizationId?: string } | null)?.activeOrganizationId;
      const [existing] = await db
        .select({ id: project.id })
        .from(project)
        .where(
          and(
            eq(project.id, input.id),
            activeOrgId ? eq(project.organizationId, activeOrgId) : eq(project.ownerId, ctx.session.user.id)
          )
        )
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
    const activeOrgId = (ctx.session as { activeOrganizationId?: string } | null)?.activeOrganizationId;
    const [existing] = await db
      .select({ id: project.id })
      .from(project)
      .where(
        and(
          eq(project.id, input.id),
          activeOrgId ? eq(project.organizationId, activeOrgId) : eq(project.ownerId, ctx.session.user.id)
        )
      )
      .limit(1);
    if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });

    await db.delete(project).where(eq(project.id, input.id));
    return { success: true };
  }),

  envs: router({
    add: protectedProcedure
      .input(z.object({ projectId: z.string(), env: envVarInput }))
      .mutation(async ({ ctx, input }) => {
        const activeOrgId = (ctx.session as { activeOrganizationId?: string } | null)?.activeOrganizationId;
        const [own] = await db
          .select({ id: project.id })
          .from(project)
          .where(
            and(
              eq(project.id, input.projectId),
              activeOrgId ? eq(project.organizationId, activeOrgId) : eq(project.ownerId, ctx.session.user.id)
            )
          )
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
        const activeOrgId = (ctx.session as { activeOrganizationId?: string } | null)?.activeOrganizationId;
        const [own] = await db
          .select({ id: project.id })
          .from(project)
          .where(
            and(
              eq(project.id, input.projectId),
              activeOrgId ? eq(project.organizationId, activeOrgId) : eq(project.ownerId, ctx.session.user.id)
            )
          )
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
        const activeOrgId = (ctx.session as { activeOrganizationId?: string } | null)?.activeOrganizationId;
        const [own] = await db
          .select({ id: project.id })
          .from(project)
          .where(
            and(
              eq(project.id, input.projectId),
              activeOrgId ? eq(project.organizationId, activeOrgId) : eq(project.ownerId, ctx.session.user.id)
            )
          )
          .limit(1);
        if (!own) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });

        await db.delete(environmentVariable).where(eq(environmentVariable.id, input.id));
        return { success: true };
      }),
  }),
});

