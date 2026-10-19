import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { serverEnv } from '@/configs/server-env';
import type { Database } from '@/types/database';

/**
 * Supabase Admin Client (Service Role)
 *
 * PERINGATAN KEAMANAN:
 * - Menggunakan SUPABASE_SERVICE_ROLE_KEY yang melewati Row Level Security (RLS).
 * - Dilindungi oleh penanda 'server-only' agar build error jika ter-import oleh Client Component.
 * - HANYA boleh digunakan untuk operasi backend internal berwenang tinggi
 *   (misal: pembuatan akun admin oleh Super Admin, rate limiting internal, cron/batch).
 */
export function createAdminClient() {
  return createClient<Database>(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
