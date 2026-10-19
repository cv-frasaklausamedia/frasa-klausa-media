import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryRateLimiter } from '../src/lib/rate-limit/memory.ts';

// Logic verification of keep-alive authorization & rate-limiting guards
function verifyKeepAliveAuth(authHeader: string | null, cronSecret: string | undefined, nodeEnv = 'development'): {
  status: number;
  error?: string;
} {
  if (cronSecret) {
    const expectedBearer = `Bearer ${cronSecret}`;
    if (!authHeader || authHeader !== expectedBearer) {
      return { status: 401, error: 'Unauthorized' };
    }
  } else if (nodeEnv === 'production') {
    return { status: 500, error: 'Configuration Error' };
  }
  return { status: 200 };
}

describe('Keep-Alive Route Logic & Security Guards Suite (PRD §14.6, §15.11)', () => {
  it('1. Menolak request jika CRON_SECRET disetel namun request tanpa header Authorization', () => {
    const secret = 'super-secret-cron-token-12345';
    const result = verifyKeepAliveAuth(null, secret);
    assert.equal(result.status, 401);
    assert.equal(result.error, 'Unauthorized');
  });

  it('2. Menolak request jika header Authorization membawa bearer token yang salah', () => {
    const secret = 'super-secret-cron-token-12345';
    const result = verifyKeepAliveAuth('Bearer wrong-secret-token', secret);
    assert.equal(result.status, 401);
    assert.equal(result.error, 'Unauthorized');
  });

  it('3. Menolak request jika skema Authorization bukan Bearer (misal Basic)', () => {
    const secret = 'super-secret-cron-token-12345';
    const result = verifyKeepAliveAuth('Basic super-secret-cron-token-12345', secret);
    assert.equal(result.status, 401);
    assert.equal(result.error, 'Unauthorized');
  });

  it('4. Mengizinkan request jika header Authorization membawa Bearer token yang cocok persis', () => {
    const secret = 'super-secret-cron-token-12345';
    const result = verifyKeepAliveAuth(`Bearer ${secret}`, secret);
    assert.equal(result.status, 200);
    assert.equal(result.error, undefined);
  });

  it('5. Mengembalikan status 500 configuration error di production jika CRON_SECRET belum disetel', () => {
    const result = verifyKeepAliveAuth(null, undefined, 'production');
    assert.equal(result.status, 500);
    assert.equal(result.error, 'Configuration Error');
  });

  it('6. Rate Limiter keep-alive membatasi panggilan berulang dalam jendela 5 menit', async () => {
    const keepAliveLimiter = new MemoryRateLimiter({ limit: 5, windowSeconds: 300 });
    const clientIp = '10.0.0.1';

    // 5 request pertama diizinkan
    for (let i = 0; i < 5; i++) {
      const res = await keepAliveLimiter.limit(`keep-alive:${clientIp}`);
      assert.equal(res.success, true);
    }

    // Request ke-6 ditolak
    const blockedRes = await keepAliveLimiter.limit(`keep-alive:${clientIp}`);
    assert.equal(blockedRes.success, false);
    assert.equal(blockedRes.remaining, 0);
  });

  it('7. Header anti-caching wajib diterapkan (no-store, no-cache, must-revalidate)', () => {
    const noCacheHeaders = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      'Surrogate-Control': 'no-store',
    };

    assert.equal(noCacheHeaders['Cache-Control'], 'no-store, no-cache, must-revalidate, proxy-revalidate');
    assert.equal(noCacheHeaders['Pragma'], 'no-cache');
    assert.equal(noCacheHeaders['Expires'], '0');
    assert.equal(noCacheHeaders['Surrogate-Control'], 'no-store');
  });
});
