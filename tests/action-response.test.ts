import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import {
  actionSuccess,
  actionError,
  handleActionError,
  AppError,
  AuthError,
} from '../src/lib/action-response.ts';

describe('Action Response & Safe Error Mapping', () => {
  it('actionSuccess menghasilkan format { ok: true, data } yang konsisten', () => {
    const res = actionSuccess({ id: '123', name: 'Buku A' });
    assert.equal(res.ok, true);
    assert.deepEqual(res.data, { id: '123', name: 'Buku A' });
    assert.equal('error' in res, false);
  });

  it('actionError menghasilkan format { ok: false, error } dengan kode dan status HTTP', () => {
    const res = actionError('Tidak ditemukan', 'NOT_FOUND', 404);
    assert.equal(res.ok, false);
    assert.equal(res.error.code, 'NOT_FOUND');
    assert.equal(res.error.message, 'Tidak ditemukan');
    assert.equal(res.error.status, 404);
  });

  it('handleActionError memetakan AppError dan AuthError secara tepat', () => {
    const appErr = new AppError('Data konflik', 'CONFLICT', 409);
    const res1 = handleActionError(appErr);
    assert.equal(res1.ok, false);
    assert.equal(res1.error.code, 'CONFLICT');
    assert.equal(res1.error.status, 409);
    assert.equal(res1.error.message, 'Data konflik');

    const authErr = new AuthError('Sesi berakhir', 401);
    const res2 = handleActionError(authErr);
    assert.equal(res2.ok, false);
    assert.equal(res2.error.code, 'UNAUTHORIZED');
    assert.equal(res2.error.status, 401);

    const forbiddenErr = new AuthError('Akses ditolak', 403);
    const res3 = handleActionError(forbiddenErr);
    assert.equal(res3.ok, false);
    assert.equal(res3.error.code, 'FORBIDDEN');
    assert.equal(res3.error.status, 403);
  });

  it('handleActionError memetakan ZodError ke VALIDATION_ERROR (422) dengan fieldErrors', () => {
    const testSchema = z.object({
      email: z.string().email('Email salah'),
      age: z.number().min(18, 'Minimal 18 tahun'),
    });

    const parsed = testSchema.safeParse({ email: 'bukan-email', age: 10 });
    assert.equal(parsed.success, false);

    if (!parsed.success) {
      const res = handleActionError(parsed.error);
      assert.equal(res.ok, false);
      assert.equal(res.error.code, 'VALIDATION_ERROR');
      assert.equal(res.error.status, 422);
      assert.ok(res.error.fieldErrors?.email);
      assert.ok(res.error.fieldErrors?.age);
    }
  });

  it('handleActionError menyamarkan error basis data PostgREST (tidak membocorkan SQL/tabel)', () => {
    // Simulasi PostgREST unique violation (code 23505)
    const dbUniqueError = {
      code: '23505',
      message: 'duplicate key value violates unique constraint "books_slug_key"',
      details: 'Key (slug)=(buku-lama) already exists.',
    };

    const res = handleActionError(dbUniqueError);
    assert.equal(res.ok, false);
    assert.equal(res.error.code, 'CONFLICT');
    assert.equal(res.error.status, 409);
    // Memastikan string teknis basis data tidak bocor ke user
    assert.equal(res.error.message.includes('books_slug_key'), false);
    assert.equal(res.error.message.includes('duplicate key'), false);
  });

  it('handleActionError menyamarkan unexpected exception menjadi 500 generik tanpa stack trace', () => {
    const dangerousError = new Error('FATAL: Database connection string postgresql://user:secret@db.host leaked');
    const res = handleActionError(dangerousError);

    assert.equal(res.ok, false);
    assert.equal(res.error.code, 'INTERNAL_SERVER_ERROR');
    assert.equal(res.error.status, 500);
    assert.equal(res.error.message, 'Terjadi kesalahan internal pada server. Silakan coba beberapa saat lagi.');
    // Pastikan credential / pesan internal tidak muncul di respons
    assert.equal(JSON.stringify(res).includes('secret'), false);
    assert.equal(JSON.stringify(res).includes('postgresql://'), false);
    assert.equal('stack' in res.error, false);
  });
});
