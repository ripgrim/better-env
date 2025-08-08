import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  client: {
    // Server URLs
    NEXT_PUBLIC_BASE_URL: z.string().url(),
    // Rate limiting (client-side)
    NEXT_PUBLIC_UNKEY_ROOT_KEY: z.string().min(1).optional(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_UNKEY_ROOT_KEY: process.env.NEXT_PUBLIC_UNKEY_ROOT_KEY,
  },
  skipValidation: process.env.NODE_ENV !== "production",
});
