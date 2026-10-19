import 'server-only';
import { createAdminClient } from '../supabase/admin.server';
import type { RateLimitConfig, RateLimiter, RateLimitResult } from './types';
import { MemoryRateLimiter } from './memory';

/**
 * SupabaseRateLimiter
 *
 * Implementasi rate limiting persisten berbasis basis data Supabase (PostgreSQL).
 *
 * Mengapa ini penting untuk Vercel Serverless:
 * - Instance serverless Vercel bersifat ephemeral (bisa hidup dan mati sewaktu-waktu).
 * - Berbagai request bisa dieksekusi di instance lambda atau region yang berbeda.
 * - In-memory store akan di-reset setiap cold start dan tidak saling berbagi state.
 * - SupabaseRateLimiter menjamin state laju request tersimpan secara atomic dan terpusat di DB.
 * - Memiliki fallback otomatis ke MemoryRateLimiter jika koneksi DB terganggu (fail-open/resilient).
 */
export class SupabaseRateLimiter implements RateLimiter {
  private readonly config: RateLimitConfig;
  private readonly fallbackLimiter: MemoryRateLimiter;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.fallbackLimiter = new MemoryRateLimiter(config);
  }

  async limit(identifier: string): Promise<RateLimitResult> {
    try {
      const admin = createAdminClient();

      // Panggil fungsi RPC atomic check_rate_limit
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await admin.rpc('check_rate_limit' as any, {
        p_key: identifier,
        p_max_attempts: this.config.limit,
        p_window_seconds: this.config.windowSeconds,
      });

      if (error || !data) {
        console.warn('[RateLimiter] DB RPC warning, fallback to memory limiter:', error?.message);
        return await this.fallbackLimiter.limit(identifier);
      }

      return data as unknown as RateLimitResult;
    } catch (err) {
      console.warn('[RateLimiter] Error during DB rate limiting, fallback to memory limiter:', err);
      return await this.fallbackLimiter.limit(identifier);
    }
  }
}
