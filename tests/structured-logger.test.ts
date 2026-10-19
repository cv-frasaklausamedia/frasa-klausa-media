import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isSensitiveKey,
  redactSensitiveData,
  formatAndPrintLog,
} from '../src/lib/logger/index.ts';

test('Structured Logger & Redaction Suite (PRD §16.7)', async (t) => {
  await t.test('1. Mendeteksi kunci/properti sensitif dengan akurat', () => {
    assert.equal(isSensitiveKey('password'), true);
    assert.equal(isSensitiveKey('currentPassword'), true);
    assert.equal(isSensitiveKey('new_password'), true);
    assert.equal(isSensitiveKey('token'), true);
    assert.equal(isSensitiveKey('access_token'), true);
    assert.equal(isSensitiveKey('refresh_token'), true);
    assert.equal(isSensitiveKey('secret'), true);
    assert.equal(isSensitiveKey('CRON_SECRET'), true);
    assert.equal(isSensitiveKey('SUPABASE_SERVICE_ROLE_KEY'), true);
    assert.equal(isSensitiveKey('authorization'), true);
    assert.equal(isSensitiveKey('cookie'), true);
    assert.equal(isSensitiveKey('session'), true);
    assert.equal(isSensitiveKey('bearer'), true);

    // Kunci non-sensitif tidak boleh salah dideteksi
    assert.equal(isSensitiveKey('title'), false);
    assert.equal(isSensitiveKey('slug'), false);
    assert.equal(isSensitiveKey('status'), false);
    assert.equal(isSensitiveKey('durationMs'), false);
    assert.equal(isSensitiveKey('actorId'), false);
  });

  await t.test('2. Menghapus data sensitif secara rekursif pada objek', () => {
    const rawPayload = {
      user: {
        id: 'usr-123',
        email: 'admin@frasaklausamedia.com',
        password: 'SuperSecretPassword123!',
        profile: {
          sessionToken: 'xyz-987-token',
          role: 'admin',
        },
      },
      headers: {
        authorization: 'Bearer sensitive-token-here',
        cookie: 'sb-access-token=abcdef12345',
        'content-type': 'application/json',
      },
      publicInfo: 'Normal data',
    };

    const redacted = redactSensitiveData(rawPayload) as typeof rawPayload;

    assert.equal(redacted.user.id, 'usr-123');
    assert.equal(redacted.user.email, 'admin@frasaklausamedia.com');
    assert.equal(redacted.user.password, '[REDACTED]');
    assert.equal(redacted.user.profile.sessionToken, '[REDACTED]');
    assert.equal(redacted.user.profile.role, 'admin');
    assert.equal(redacted.headers.authorization, '[REDACTED]');
    assert.equal(redacted.headers.cookie, '[REDACTED]');
    assert.equal(redacted.headers['content-type'], 'application/json');
    assert.equal(redacted.publicInfo, 'Normal data');

    // Menjamin objek asli tidak ter-mutasi
    assert.equal(rawPayload.user.password, 'SuperSecretPassword123!');
  });

  await t.test('3. Menangani array dan relasi bersarang', () => {
    const list = [
      { id: 1, secretKey: 'secret-1', name: 'item-1' },
      { id: 2, apiKey: 'api-key-2', name: 'item-2' },
    ];

    const result = redactSensitiveData(list) as Array<Record<string, unknown>>;
    assert.equal(result[0].id, 1);
    assert.equal(result[0].secretKey, '[REDACTED]');
    assert.equal(result[0].name, 'item-1');
    assert.equal(result[1].apiKey, '[REDACTED]');
  });

  await t.test('4. Redaksi bearer token di tengah string biasa', () => {
    const headerStr = 'Incoming header: Bearer eyJhbGciOiJIUzI1NiIsInR...';
    const clean = redactSensitiveData(headerStr);
    assert.equal(clean, 'Incoming header: Bearer [REDACTED]');
  });

  await t.test('5. Memotong string yang terlalu panjang (> 1000 karakter)', () => {
    const veryLongString = 'A'.repeat(1500);
    const result = redactSensitiveData(veryLongString) as string;
    assert.equal(result.length, 1000 + '...[TRUNCATED]'.length);
    assert.ok(result.endsWith('...[TRUNCATED]'));
  });

  await t.test('6. Menangani objek circular reference tanpa infinite loop', () => {
    const circularObj: Record<string, unknown> = { name: 'Root' };
    circularObj.self = circularObj;

    const safe = redactSensitiveData(circularObj) as Record<string, unknown>;
    assert.equal(safe.name, 'Root');
    assert.equal(safe.self, '[CIRCULAR]');
  });

  await t.test('7. Menghasilkan format log JSON terstruktur yang valid', () => {
    const entry = formatAndPrintLog('info', 'Test log event', {
      requestId: 'req-456',
      route: '/api/test',
      status: 200,
      durationMs: 42,
      actorId: 'act-789',
      metadata: {
        attempt: 1,
        token: 'secret-token-to-hide',
      },
    });

    assert.equal(entry.level, 'info');
    assert.equal(entry.message, 'Test log event');
    assert.equal(entry.service, 'frasa-klausa-media');
    assert.equal(entry.requestId, 'req-456');
    assert.equal(entry.route, '/api/test');
    assert.equal(entry.status, 200);
    assert.equal(entry.durationMs, 42);
    assert.equal(entry.actorId, 'act-789');
    assert.equal(entry.metadata?.attempt, 1);
    assert.equal(entry.metadata?.token, '[REDACTED]');
    assert.ok(entry.timestamp);
  });
});
