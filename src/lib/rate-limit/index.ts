import { headers } from 'next/headers';
import type { RateLimitConfig, RateLimiter } from './types';
import { MemoryRateLimiter } from './memory';
import { SupabaseRateLimiter } from './supabase';

export * from './types';
export * from './memory';
export * from './supabase';

/**
 * Konfigurasi standar Rate Limit Login:
 * Maksimal 5 percobaan dalam kurun waktu 15 menit (900 detik).
 */
export const AUTH_RATE_LIMIT_CONFIG: RateLimitConfig = {
  limit: 5,
  windowSeconds: 15 * 60,
};

/**
 * Factory untuk membuat instance RateLimiter sesuai kebutuhan runtime.
 */
export function createRateLimiter(
  config: RateLimitConfig,
  driver: 'supabase' | 'memory' = 'supabase'
): RateLimiter {
  if (driver === 'memory') {
    return new MemoryRateLimiter(config);
  }
  return new SupabaseRateLimiter(config);
}

/**
 * Instance Rate Limiter khusus alur autentikasi
 */
export const authRateLimiter = createRateLimiter(AUTH_RATE_LIMIT_CONFIG);

/**
 * Mengekstrak alamat IP klien dari request headers Next.js
 * dengan mempertimbangkan reverse proxy Vercel / Cloudflare.
 */
export async function getClientIp(): Promise<string> {
  const headerStore = await headers();

  const forwardedFor = headerStore.get('x-forwarded-for');
  if (forwardedFor) {
    // Ambil IP pertama jika terdapat rantai proxy "client, proxy1, proxy2"
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = headerStore.get('x-real-ip');
  if (realIp) return realIp.trim();

  const cfIp = headerStore.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  return '127.0.0.1';
}
