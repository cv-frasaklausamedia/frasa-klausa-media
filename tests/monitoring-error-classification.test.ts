import test from 'node:test';
import assert from 'node:assert/strict';
import { isExpectedError } from '../src/lib/monitoring.ts';
import { AppError, AuthError } from '../src/lib/action-response.ts';
import { ZodError } from 'zod';

test('Monitoring & Error Classification Suite (PRD §16.7)', async (t) => {
  await t.test('1. Mengklasifikasikan error validasi, 401, 403, 404, 429 sebagai expected', () => {
    // AppError standar
    assert.equal(isExpectedError(new AppError('Bad request', 'BAD_REQUEST', 400)), true);
    assert.equal(isExpectedError(new AppError('Not found', 'NOT_FOUND', 404)), true);
    assert.equal(isExpectedError(new AppError('Conflict', 'CONFLICT', 409)), true);
    assert.equal(isExpectedError(new AppError('Validation', 'VALIDATION_ERROR', 422)), true);
    assert.equal(isExpectedError(new AppError('Rate limit', 'TOO_MANY_REQUESTS', 429)), true);

    // AuthError
    assert.equal(isExpectedError(new AuthError('Unauthorized', 401)), true);
    assert.equal(isExpectedError(new AuthError('Forbidden', 403)), true);

    // ZodError
    const zodErr = new ZodError([]);
    assert.equal(isExpectedError(zodErr), true);

    // PostgREST expected codes (P0002 not found, 23505 unique constraint)
    assert.equal(isExpectedError({ code: 'P0002', message: 'Row not found' }), true);
    assert.equal(isExpectedError({ code: '23505', message: 'Duplicate key' }), true);
    assert.equal(isExpectedError({ code: '42501', message: 'Insufficient privilege' }), true);
  });

  await t.test('2. Mengklasifikasikan error 500, crash, dan pengecualian tak terduga sebagai unexpected', () => {
    // AppError internal 500
    assert.equal(isExpectedError(new AppError('Server error', 'INTERNAL_SERVER_ERROR', 500)), false);

    // TypeError / SyntaxError / Native Error
    assert.equal(isExpectedError(new TypeError('Cannot read properties of undefined')), false);
    assert.equal(isExpectedError(new Error('Connection reset by peer')), false);

    // PostgREST unexpected crash codes
    assert.equal(isExpectedError({ code: '08006', message: 'connection_failure' }), false);
    assert.equal(isExpectedError({ code: 'XX000', message: 'internal_error' }), false);

    // String / unknown throw
    assert.equal(isExpectedError('random fatal string'), false);
    assert.equal(isExpectedError(null), false);
  });
});
