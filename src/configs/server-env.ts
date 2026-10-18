import 'server-only';
import { serverEnvSchema } from '@/validations/env';

const parsedServerEnv = serverEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
});

if (!parsedServerEnv.success) {
  console.error('Invalid server environment variables:', parsedServerEnv.error.format());
  throw new Error('Invalid server environment variables. Check .env.local');
}

export const serverEnv = parsedServerEnv.data;
