import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod/v4';

export const env = createEnv({
  server: {
    // Database
    DATABASE_URL: z.string().startsWith('postgresql://').or(z.string().startsWith('postgres://')),
    // Auth
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().url(),
    // Node environment
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    // Polar
  },
  experimental__runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION || process.env.NODE_ENV === 'test',
});


