import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createContext } from "@better-env/api";
import { NextRequest } from "next/server";

async function handler(req: NextRequest) {
  console.log("🔍 [TRPC Handler] Request:", req.method, req.url);
  console.log("🔍 [TRPC Handler] Content-Type:", req.headers.get("content-type"));
  
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
  });
}

export { handler as GET, handler as POST };
