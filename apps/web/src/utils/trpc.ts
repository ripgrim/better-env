import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { AppRouter } from "@better-env/api";
import { toast } from "sonner";
import superjson from "superjson";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      toast.error(error.message, {
        action: {
          label: "retry",
          onClick: () => {
            queryClient.invalidateQueries();
          },
        },
      });
    },
  }),
});

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpLink({
      url: `${process.env.NEXT_PUBLIC_API_URL || ""}/api/trpc`,
      transformer: superjson,
      fetch(input: RequestInfo | URL, init?: RequestInit) {
        return fetch(input, {
          ...init,
          credentials: "include",
          headers: {
            ...init?.headers,
            "Content-Type": "application/json",
          },
        });
      },
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
