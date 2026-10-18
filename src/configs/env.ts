import { clientEnvSchema } from '@/validations/env';

const parsedClientEnv = clientEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

if (!parsedClientEnv.success) {
  console.error('Invalid client environment variables:', parsedClientEnv.error.format());
  throw new Error('Invalid client environment variables. Check .env.local');
}

export const env = parsedClientEnv.data;
