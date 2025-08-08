import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  client: {
    // Server URLs
    NEXT_PUBLIC_BASE_URL: z.string().url(),
    // Rate limiting (client-side)
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },
  skipValidation: process.env.NODE_ENV !== "production",
});
