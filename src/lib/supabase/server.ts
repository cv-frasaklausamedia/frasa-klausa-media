import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { env } from '@/configs/env';
import type { Database } from '@/types/database';

export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  ) as unknown as SupabaseClient<Database>;
}

/**
 * Supabase Public Client (Anonymous, Cookie-Free)
 *
 * Digunakan khusus untuk operasi pembacaan data publik di server
 * (misal: getActiveBanner, getSiteContent, public catalog cache).
 * Karena tidak membaca cookies(), fungsi ini aman dipanggil di dalam
 * unstable_cache() dan selama proses static build prerendering.
 */
export function createPublicClient(): SupabaseClient<Database> {
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    }
  ) as unknown as SupabaseClient<Database>;
}
