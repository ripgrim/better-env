import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@better-env/api";
import superjson from "superjson";
import { loadToken } from "../utils/auth";

const API_BASE_URL = process.env.BETTER_ENV_API_URL || "http://localhost:3000";

// Create a typed tRPC client that always gets fresh token
export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${API_BASE_URL}/api/trpc`,
      transformer: superjson,
      // Add CLI token to all requests - this loads fresh token on each request
      headers() {
        const token = loadToken();
        console.log(`🔑 Loading token for request: ${token ? 'Found' : 'Not found'}`);
        return token
          ? { Authorization: `Bearer ${token}` }
          : {};
      },
    }),
  ],
});

// Create a separate client for unauthenticated requests (device auth flow)
export const unauthenticatedTrpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${API_BASE_URL}/api/trpc`,
      transformer: superjson,
    }),
  ],
});

// Wrapper class for easier migration and additional CLI-specific features
export class TRPCApiClient {
  constructor() {
    // No need to cache token - tRPC client loads it fresh each time
  }

  // Get current token status
  getCurrentToken() {
    return loadToken();
  }

  // Check if we have a valid token
  hasToken() {
    const token = loadToken();
    return token && token.startsWith('cli_');
  }

  // CLI-specific authentication method
  async authenticate(token: string) {
    try {
      const result = await trpc.cli.auth.mutate({ token });
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("CLI Auth Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Authentication failed"
      };
    }
  }

  // Device authorization flow - Step 1: Request device code
  async requestDeviceCode() {
    try {
      const result = await unauthenticatedTrpc.cli.deviceAuth.mutate();
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to request device code"
      };
    }
  }

  // Device authorization flow - Step 2: Poll for token
  async pollForToken(deviceCode: string) {
    try {
      const result = await unauthenticatedTrpc.cli.deviceToken.mutate({ deviceCode });
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get token"
      };
    }
  }

  // Health check
  async healthCheck() {
    try {
      const result = await trpc.healthCheck.query();
      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Health check failed" 
      };
    }
  }

  // CLI-specific ping (requires authentication)
  async ping() {
    try {
      const result = await trpc.cli.ping.query();
      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Ping failed" 
      };
    }
  }

  // Get current user through CLI endpoint
  async getCurrentUser() {
    try {
      const result = await trpc.cli.user.query();
      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to get user" 
      };
    }
  }

  // List projects through CLI endpoint
  async listProjects() {
    try {
      const result = await trpc.cli.projects.query();
      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to list projects" 
      };
    }
  }

  // Get specific project through CLI endpoint
  async getProject(id: string) {
    try {
      const result = await trpc.cli.project.query({ id });
      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to get project" 
      };
    }
  }

  // Create project through main projects router (requires session auth)
  async createProject(data: {
    name: string;
    logoUrl?: string;
    envs?: Array<{
      key: string;
      value: string;
      description?: string;
      environmentName?: string;
    }>;
    organizationId?: string;
  }) {
    try {
      const result = await trpc.projects.create.mutate(data);
      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to create project" 
      };
    }
  }

  // Update project
  async updateProject(data: {
    id: string;
    name?: string;
    logoUrl?: string;
  }) {
    try {
      const result = await trpc.projects.update.mutate(data);
      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to update project" 
      };
    }
  }

  // Delete project
  async deleteProject(id: string) {
    try {
      const result = await trpc.projects.delete.mutate({ id });
      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to delete project" 
      };
    }
  }

  // Add environment variable
  async addEnvVar(data: {
    projectId: string;
    env: {
      key: string;
      value: string;
      description?: string;
      environmentName?: string;
    };
  }) {
    try {
      const result = await trpc.projects.envs.add.mutate(data);
      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to add environment variable" 
      };
    }
  }

  // Update environment variable
  async updateEnvVar(data: {
    id: string;
    projectId: string;
    key?: string;
    value?: string;
    description?: string;
    environmentName?: string;
  }) {
    try {
      const result = await trpc.projects.envs.update.mutate(data);
      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to update environment variable" 
      };
    }
  }

  // Delete environment variable
  async deleteEnvVar(data: {
    id: string;
    projectId: string;
  }) {
    try {
      const result = await trpc.projects.envs.delete.mutate(data);
      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to delete environment variable" 
      };
    }
  }
}

// Export singleton instance for backward compatibility
export const apiClient = new TRPCApiClient();

// Export the raw tRPC client for direct use
export { trpc as trpcClient };

// Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}