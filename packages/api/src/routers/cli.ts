import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, count, isNull, gt } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db, project, environmentVariable, user, cliToken } from "@better-env/db";
import { cliProcedure, publicProcedure, createTRPCRouter } from "../trpc";
import { decryptSecretForProject } from "../lib/crypto";

// In-memory store for device codes (in production, use Redis or DB)
export const deviceCodes = new Map<string, {
  userCode: string;
  deviceCode: string;
  expiresAt: Date;
  userId?: string;
  used?: boolean;
}>();

// Share deviceCodes globally for API route access
// This allows the Next.js API route at /api/cli/authorize-device to access
// the same device codes map without requiring external storage
if (typeof global !== 'undefined') {
  // @ts-ignore - Global augmentation for device codes sharing
  global._deviceCodes = deviceCodes;
}

export const cliRouter = createTRPCRouter({
  // Device authorization flow - Step 1: CLI requests device code
  deviceAuth: publicProcedure.mutation(async () => {
    const deviceCode = nanoid(32);
    const userCode = nanoid(8).toUpperCase(); // 8-char user-friendly code
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    deviceCodes.set(deviceCode, {
      userCode,
      deviceCode,
      expiresAt,
    });

    return {
      deviceCode,
      userCode,
      verificationUri: `${process.env.BETTER_ENV_API_URL || "http://localhost:3000"}/cli/authorize`,
      expiresIn: 600, // 10 minutes
      interval: 2, // Poll every 2 seconds
    };
  }),

  // Device authorization flow - Step 2: CLI polls for token
  deviceToken: publicProcedure
    .input(z.object({ deviceCode: z.string() }))
    .mutation(async ({ input }) => {
      const deviceAuth = deviceCodes.get(input.deviceCode);
      
      if (!deviceAuth) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid device code",
        });
      }

      if (new Date() > deviceAuth.expiresAt) {
        deviceCodes.delete(input.deviceCode);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Device code expired",
        });
      }

      if (!deviceAuth.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Authorization pending",
        });
      }

      if (deviceAuth.used) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Device code already used",
        });
      }

      // Create CLI token for the user
      const token = `cli_${nanoid(32)}`;
      const tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const [newToken] = await db
        .insert(cliToken)
        .values({
          id: nanoid(),
          userId: deviceAuth.userId,
          name: "CLI Device Auth",
          token,
          expiresAt: tokenExpiresAt,
          createdAt: new Date(),
          lastUsedAt: null,
        })
        .returning();

      // Mark device code as used and clean up
      deviceAuth.used = true;
      deviceCodes.delete(input.deviceCode);

      return {
        token: newToken.token,
        expiresAt: newToken.expiresAt,
      };
    }),

  // Note: The device authorization endpoint (user code validation) was moved to
  // /api/cli/authorize-device as a direct Next.js API route to avoid TRPC request
  // body consumption conflicts with betterAuth session handling

  // CLI Authentication check - returns user info if token is valid
  auth: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // This will be handled by context, but we need to manually validate here
      // since we're getting the token from input, not headers
      if (!input.token || !input.token.startsWith("cli_")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid token format",
        });
      }

      // Re-validate the token (context validation uses headers, this uses input)
      const [tokenRecord] = await db
        .select({
          id: cliToken.id,
          userId: cliToken.userId,
          name: cliToken.name,
          expiresAt: cliToken.expiresAt,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          },
        })
        .from(cliToken)
        .innerJoin(user, eq(cliToken.userId, user.id))
        .where(
          and(
            eq(cliToken.token, input.token),
            gt(cliToken.expiresAt, new Date())
          )
        )
        .limit(1);

      if (!tokenRecord) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid or expired token",
        });
      }

      // Update last used timestamp
      await db
        .update(cliToken)
        .set({ lastUsedAt: new Date() })
        .where(eq(cliToken.id, tokenRecord.id));

      return {
        user: tokenRecord.user,
        token: {
          id: tokenRecord.id,
          name: tokenRecord.name,
          expiresAt: tokenRecord.expiresAt,
        },
      };
    }),

  // Get current user info
  user: cliProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),

  // List all projects accessible to the CLI user
  projects: cliProcedure.query(async ({ ctx }) => {
    try {
      const userId = ctx.user.id;

      // Get personal projects (no organization)
      const personal = await db
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
        .where(and(eq(project.ownerId, userId), isNull(project.organizationId)))
        .groupBy(project.id)
        .orderBy(desc(project.createdAt));

      return {
        personal,
        org: [], // TODO: Add organization projects when membership system is ready
        orgs: [], // TODO: Add organization list when membership system is ready
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch projects",
      });
    }
  }),

  // Get specific project details with environment variables
  project: cliProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const userId = ctx.user.id;

        // Get project details
        const [projectRecord] = await db
          .select()
          .from(project)
          .where(eq(project.id, input.id))
          .limit(1);

        if (!projectRecord) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Project not found",
          });
        }

        // Check if user owns the project (for now, only personal projects)
        if (projectRecord.ownerId !== userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied to this project",
          });
        }

        // Get environment variables
        const envsRaw = await db
          .select({
            id: environmentVariable.id,
            key: environmentVariable.key,
            value: environmentVariable.value,
            description: environmentVariable.description,
            environmentName: environmentVariable.environmentName,
            createdAt: environmentVariable.createdAt,
            updatedAt: environmentVariable.updatedAt,
          })
          .from(environmentVariable)
          .where(eq(environmentVariable.projectId, projectRecord.id));

        // Decrypt environment variable values
        const envs = envsRaw.map((env) => ({
          ...env,
          value: decryptSecretForProject(projectRecord.id, env.value),
        }));

        return {
          ...projectRecord,
          envs,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch project details",
        });
      }
    }),

  // Health check for CLI
  ping: cliProcedure.query(() => {
    return {
      message: "CLI authenticated and ready",
      timestamp: new Date().toISOString(),
    };
  }),
});