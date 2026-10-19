import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { getSafeRedirectUrl } from '@/lib/redirect-validator';

/**
 * Next.js Edge Middleware
 *
 * Lapisan Pertama Pertahanan (Defense-in-depth):
 * 1. Refresh sesi Supabase & sinkronisasi cookie HTTP.
 * 2. Redirect pengunjung belum terautentikasi yang mengakses /admin ke /login.
 * 3. Redirect pengguna yang sudah terautentikasi yang mengakses /login ke dashboard /admin.
 *
 * CATATAN PENTING:
 * Middleware ini HANYA lapisan pertama. Pemeriksaan otorisasi data sensitif,
 * status keaktifan akun (is_active), dan hak akses (role) tetap diverifikasi
 * secara ketat pada Server Components, Server Actions, dan Data Access Layer.
 */
export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  // Kasus 1: Akses rute admin tanpa sesi login -> Redirect ke /login dengan parameter redirectTo aman
  if (pathname.startsWith('/admin') && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectTo', pathname);

    const response = NextResponse.redirect(redirectUrl);
    // Salin cookie sesi yang baru diperbarui agar tidak hilang
    copyCookies(supabaseResponse, response);
    return response;
  }

  // Kasus 2: Pengguna sudah login mengakses halaman /login -> Redirect ke dashboard /admin
  if (pathname === '/login' && user) {
    const rawRedirect = request.nextUrl.searchParams.get('redirectTo');
    const safeTarget = getSafeRedirectUrl(rawRedirect, '/admin');

    const redirectUrl = new URL(safeTarget, request.url);
    const response = NextResponse.redirect(redirectUrl);
    copyCookies(supabaseResponse, response);
    return response;
  }

  return supabaseResponse;
}

/**
 * Menyalin cookie dari response Supabase ke response redirect.
 */
function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie.name, cookie.value);
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (.svg, .png, .jpg, .jpeg, .gif, .webp, .ico)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
