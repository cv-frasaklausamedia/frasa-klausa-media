import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryRateLimiter } from '../src/lib/rate-limit/memory.ts';

describe('Modular Rate Limiter (MemoryRateLimiter)', () => {
  it('mengizinkan request di bawah batas kuota dan mengurangi sisa remaining', async () => {
    const limiter = new MemoryRateLimiter({ limit: 3, windowSeconds: 60 });
    const id = 'user-1';

    const res1 = await limiter.limit(id);
    assert.equal(res1.success, true);
    assert.equal(res1.limit, 3);
    assert.equal(res1.remaining, 2);

    const res2 = await limiter.limit(id);
    assert.equal(res2.success, true);
    assert.equal(res2.remaining, 1);

    const res3 = await limiter.limit(id);
    assert.equal(res3.success, true);
    assert.equal(res3.remaining, 0);
  });

  it('menolak request yang melebihi batas kuota (rate limit exceeded)', async () => {
    const limiter = new MemoryRateLimiter({ limit: 2, windowSeconds: 60 });
    const id = 'user-spam';

    await limiter.limit(id); // 1
    await limiter.limit(id); // 2

    const blocked = await limiter.limit(id); // 3 (melebihi limit)
    assert.equal(blocked.success, false);
    assert.equal(blocked.remaining, 0);
    assert.ok(blocked.reset > Math.floor(Date.now() / 1000));
  });

  it('memisahkan kuota antar-identifier yang berbeda', async () => {
    const limiter = new MemoryRateLimiter({ limit: 1, windowSeconds: 60 });

    const userA = await limiter.limit('ip-1');
    assert.equal(userA.success, true);

    const userB = await limiter.limit('ip-2');
    assert.equal(userB.success, true);

    // ip-1 sekarang harus diblokir, sedangkan ip-3 tetap baru dan diizinkan
    const userABlocked = await limiter.limit('ip-1');
    assert.equal(userABlocked.success, false);

    const userC = await limiter.limit('ip-3');
    assert.equal(userC.success, true);
  });
});
