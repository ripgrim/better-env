import { protectedProcedure, publicProcedure, router } from "../trpc";
import { userRouter } from "./user";

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
});

export type AppRouter = typeof appRouter;
