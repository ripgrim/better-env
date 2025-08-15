import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc, sql } from "drizzle-orm";

import { db, user, session } from "@better-env/db";
import { protectedProcedure, publicProcedure, createTRPCRouter } from "../trpc";

export const userRouter = createTRPCRouter({
  hasAccess: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const userRecord = await db.select({ hasAccess: user.hasAccess }).from(user).where(eq(user.id, userId)).limit(1);

    if (!userRecord[0]) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return {
      hasAccess: userRecord[0].hasAccess,
    };
  }),

  getCurrentUser: publicProcedure.query(async ({ ctx }) => {
    try {
      // Return null if user is not authenticated
      if (!ctx.session?.user?.id) {
        return null;
      }

      const userId = ctx.session.user.id;

      const [userRecord] = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          hasAccess: user.hasAccess,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (!userRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return userRecord;
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch current user",
        cause: error,
      });
    }
  }),

  getUserSessions: protectedProcedure.query(async ({ ctx }) => {
    try {
      const sessions = await db
        .select({
          id: session.id,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
        })
        .from(session)
        .where(eq(session.userId, ctx.session.user.id))
        .orderBy(desc(session.createdAt));

      return sessions;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch user sessions",
        cause: error,
      });
    }
  }),

  revokeSession: protectedProcedure.input(z.object({ sessionId: z.string() })).mutation(async ({ ctx, input }) => {
    try {
      const [sessionToRevoke] = await db.select().from(session).where(eq(session.id, input.sessionId));

      if (!sessionToRevoke) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found",
        });
      }

      if (sessionToRevoke.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only revoke your own sessions",
        });
      }

      await db.delete(session).where(eq(session.id, input.sessionId));

      return {
        message: "Session revoked successfully",
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to revoke session",
        cause: error,
      });
    }
  }),

  // stats removed for bare boilerplate

  // admin mutations removed for bare boilerplate

  // admin list/update removed for bare boilerplate
  updateCurrentUserName: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      try {
        const [existing] = await db
          .select({ id: user.id })
          .from(user)
          .where(eq(user.id, ctx.session.user.id))
          .limit(1);
        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }
        const [updated] = await db
          .update(user)
          .set({ name: input.name, updatedAt: new Date() })
          .where(eq(user.id, ctx.session.user.id))
          .returning();
        return updated;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update user name" });
      }
    }),
});
