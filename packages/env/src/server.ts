import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod/v4';

export const env = createEnv({
  server: {
    // Database
    DATABASE_URL: z.string().startsWith('postgresql://').or(z.string().startsWith('postgres://')),
    // Auth
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().url(),
    // App URLs
    APP_URL: z.string().url(),
    // Encryption
    ENV_ENCRYPTION_KEY: z.string().min(1),
    APP_ENCRYPTION_KEY: z.string().min(1).optional(),
    // Node environment
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    // Email (optional)
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(1).optional(),
    // Polar
  },
  experimental__runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION || process.env.NODE_ENV === 'test',
});