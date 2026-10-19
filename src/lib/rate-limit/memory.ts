import type { RateLimitConfig, RateLimiter, RateLimitResult } from './types';

interface MemoryEntry {
  count: number;
  resetAt: number; // Unix timestamp in seconds
}

/**
 * MemoryRateLimiter
 *
 * Implementasi in-memory rate limiting.
 * Sangat cocok untuk:
 * - Pengujian lokal (Local Development)
 * - Unit Test & CI
 * - Lingkungan single-container berumur panjang
 *
 * Catatan untuk Vercel Serverless:
 * Status in-memory bersifat lokal per-instance lambda dan akan di-reset saat cold start.
 */
export class MemoryRateLimiter implements RateLimiter {
  private readonly config: RateLimitConfig;
  private readonly store = new Map<string, MemoryEntry>();

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async limit(identifier: string): Promise<RateLimitResult> {
    const now = Math.floor(Date.now() / 1000);
    this.cleanupExpired(now);

    const existing = this.store.get(identifier);

    if (!existing || existing.resetAt <= now) {
      // Entri baru atau entri lama sudah kadaluarsa
      const resetAt = now + this.config.windowSeconds;
      this.store.set(identifier, {
        count: 1,
        resetAt,
      });

      return {
        success: true,
        limit: this.config.limit,
        remaining: Math.max(0, this.config.limit - 1),
        reset: resetAt,
      };
    }

    // Entri masih dalam jendela aktif
    if (existing.count >= this.config.limit) {
      return {
        success: false,
        limit: this.config.limit,
        remaining: 0,
        reset: existing.resetAt,
      };
    }

    existing.count += 1;
    return {
      success: true,
      limit: this.config.limit,
      remaining: Math.max(0, this.config.limit - existing.count),
      reset: existing.resetAt,
    };
  }

  /**
   * Reset store untuk isolasi unit test
   */
  clear(): void {
    this.store.clear();
  }

  private cleanupExpired(now: number): void {
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt <= now) {
        this.store.delete(key);
      }
    }
  }
}
