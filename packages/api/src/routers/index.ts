import { protectedProcedure, publicProcedure, router } from "../trpc";
import { userRouter } from "./user";
import { projectsRouter } from "./projects";

export const appRouter = router({
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
});

export type AppRouter = typeof appRouter;
