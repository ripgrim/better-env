import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import 'server-only';
import { createContext } from "./context";
import type { Context } from "./context";

export const createTRPCContext = createContext;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session },
      user: { ...ctx.session.user },
    },
  });
});

export const cliProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.cliAuth) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "CLI authentication required",
    });
  }

  return next({
    ctx: {
      ...ctx,
      cliAuth: { ...ctx.cliAuth },
      user: { ...ctx.cliAuth.user },
    },
  });
});

export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  // Add role check when user roles are implemented
  // if (ctx.session.user.role === 'user') {
  //   throw new TRPCError({
  //     code: 'FORBIDDEN',
  //     message: 'You do not have permission to access this resource',
  //   });
  // }

  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session },
      user: { ...ctx.session.user },
    },
  });
});
