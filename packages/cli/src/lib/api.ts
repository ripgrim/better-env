// Re-export the new tRPC-based API client for backward compatibility
export { apiClient, trpc as trpcClient, type ApiResponse } from "./trpc-client";

// For backward compatibility, also export the main client as a named export
export { apiClient as default } from "./trpc-client";