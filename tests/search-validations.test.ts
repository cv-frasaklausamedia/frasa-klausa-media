import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { searchQuerySchema } from '../src/validations/search.ts';

describe('Search Validations Suite (Tahap 9 - PRD §6.3.8)', () => {
  it('1. Menerima query valid dengan panjang minimal 2 karakter', () => {
    const result = searchQuerySchema.safeParse({ q: 'sastra' });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.q, 'sastra');
      assert.equal(result.data.limit, 10); // default limit
    }
  });

  it('2. Melakukan trim pada query pencarian', () => {
    const result = searchQuerySchema.safeParse({ q: '   puisi lama   ', limit: '15' });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.q, 'puisi lama');
      assert.equal(result.data.limit, 15);
    }
  });

  it('3. Menolak query yang kurang dari 2 karakter', () => {
    const result = searchQuerySchema.safeParse({ q: 'a' });
    assert.equal(result.success, false);
    if (!result.success) {
      const err = result.error.flatten().fieldErrors.q;
      assert.ok(err && err.length > 0);
      assert.match(err[0], /minimal 2 karakter/i);
    }
  });

  it('4. Menolak query yang melebihi batas maksimal 100 karakter', () => {
    const longQuery = 'x'.repeat(101);
    const result = searchQuerySchema.safeParse({ q: longQuery });
    assert.equal(result.success, false);
    if (!result.success) {
      const err = result.error.flatten().fieldErrors.q;
      assert.ok(err && err.length > 0);
      assert.match(err[0], /maksimal 100 karakter/i);
    }
  });

  it('5. Menolak nilai limit yang tidak valid (< 1 atau > 50)', () => {
    const zeroLimit = searchQuerySchema.safeParse({ q: 'novel', limit: 0 });
    assert.equal(zeroLimit.success, false);

    const excessiveLimit = searchQuerySchema.safeParse({ q: 'novel', limit: 51 });
    assert.equal(excessiveLimit.success, false);
  });
});
