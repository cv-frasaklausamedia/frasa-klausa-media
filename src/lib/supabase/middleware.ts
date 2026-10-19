import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';

export interface UpdateSessionResult {
  supabaseResponse: NextResponse;
  user: User | null;
}

/**
 * Memperbarui sesi Supabase pada request Edge Middleware.
 * Mengembalikan respons Next.js beserta objek user terverifikasi (jika login).
 */
export async function updateSession(request: NextRequest): Promise<UpdateSessionResult> {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { supabaseResponse, user: null };
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Wajib menggunakan getUser() bukan getSession() agar JWT diverifikasi di server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabaseResponse, user };
}
