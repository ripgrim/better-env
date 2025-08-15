import 'server-only';

import { createTRPCRouter, publicProcedure } from './trpc';
import { userRouter } from './routers/user';
import { projectsRouter } from './routers/projects';
import { cliRouter } from './routers/cli';
import { earlyAccessRouter } from './routers/early-access';

export const appRouter = createTRPCRouter({
  healthCheck: publicProcedure.query(() => {
    return {
      message: "IM ALIVE!!!!",
      timestamp: new Date().toISOString(),
      status: "healthy",
    };
  }),
  ping: publicProcedure.query(() => {
    return {
      message: "pong",
      timestamp: new Date().toISOString(),
      status: "healthy",
    };
  }),
  user: userRouter,
  projects: projectsRouter,
  cli: cliRouter,
  earlyAccess: earlyAccessRouter,
});

export type AppRouter = typeof appRouter;

export { createTRPCContext as createContext } from './trpc';