export interface RateLimitConfig {
  /** Jumlah maksimal request yang diizinkan dalam periode jendela */
  limit: number;
  /** Durasi jendela waktu dalam hitungan detik */
  windowSeconds: number;
}

export interface RateLimitResult {
  /** Apakah request saat ini diizinkan */
  success: boolean;
  /** Batas maksimal request */
  limit: number;
  /** Sisa kuota request */
  remaining: number;
  /** Waktu reset kuota dalam format Unix timestamp (detik) */
  reset: number;
}

export interface RateLimiter {
  /**
   * Memeriksa dan mencatat percobaan request berdasarkan identifier (misal: IP atau IP+email).
   */
  limit(identifier: string): Promise<RateLimitResult>;
}
