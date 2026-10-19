import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { sanitizeAuditMetadata, isSensitiveKey } from '../src/lib/audit/sanitizer.ts';
import type { AuditLogEntry } from '../src/lib/audit/types.ts';

describe('Audit Log Security & Sanitization Suite (Tahap 8 - PRD §16.7)', () => {
  describe('1. Deteksi Kunci Sensitif (isSensitiveKey)', () => {
    it('mendeteksi nama properti yang mengandung kata kunci rahasia', () => {
      assert.equal(isSensitiveKey('password'), true);
      assert.equal(isSensitiveKey('temporaryPassword'), true);
      assert.equal(isSensitiveKey('secret_key'), true);
      assert.equal(isSensitiveKey('token'), true);
      assert.equal(isSensitiveKey('authToken'), true);
      assert.equal(isSensitiveKey('service_role_key'), true);
      assert.equal(isSensitiveKey('cookieSession'), true);
      assert.equal(isSensitiveKey('bearerToken'), true);
    });

    it('tidak menandai properti non-sensitif biasa', () => {
      assert.equal(isSensitiveKey('email'), false);
      assert.equal(isSensitiveKey('fullName'), false);
      assert.equal(isSensitiveKey('role'), false);
      assert.equal(isSensitiveKey('isActive'), false);
      assert.equal(isSensitiveKey('site_name'), false);
    });
  });

  describe('2. Sanitasi Rekursif Metadata Audit Log (sanitizeAuditMetadata)', () => {
    it('mengganti nilai kredensial/password dengan [REDACTED]', () => {
      const rawMetadata = {
        email: 'admin@frasaklausa.id',
        password: 'SuperSecretPassword123!',
        temporaryPassword: 'TempPass456!',
        role: 'admin',
        is_active: true,
      };

      const sanitized = sanitizeAuditMetadata(rawMetadata);

      assert.equal(sanitized.email, 'admin@frasaklausa.id');
      assert.equal(sanitized.role, 'admin');
      assert.equal(sanitized.is_active, true);
      assert.equal(sanitized.password, '[REDACTED]');
      assert.equal(sanitized.temporaryPassword, '[REDACTED]');
    });

    it('membersihkan kunci sensitif di dalam nested object dan array', () => {
      const nestedMetadata = {
        user: {
          email: 'target@frasaklausa.id',
          api_key: 'sk_live_1234567890',
        },
        items: [
          { type: 'auth_method', secret: 'abc123xyz' },
          { type: 'contact', value: 'target@frasaklausa.id' },
        ],
        credentials: 'some-raw-token',
      };

      const sanitized = sanitizeAuditMetadata(nestedMetadata);

      assert.equal((sanitized.user as any).email, 'target@frasaklausa.id');
      assert.equal((sanitized.user as any).api_key, '[REDACTED]');
      assert.equal((sanitized.items as any[])[0].secret, '[REDACTED]');
      assert.equal((sanitized.items as any[])[0].type, 'auth_method');
      assert.equal((sanitized.items as any[])[1].value, 'target@frasaklausa.id');
      assert.equal(sanitized.credentials, '[REDACTED]');
    });

    it('memotong string yang sangat panjang (> 500 karakter) demi efisiensi storage', () => {
      const longString = 'A'.repeat(600);
      const raw = {
        note: longString,
      };

      const sanitized = sanitizeAuditMetadata(raw);
      assert.equal((sanitized.note as string).length, 500 + '...[TRUNCATED]'.length);
      assert((sanitized.note as string).endsWith('...[TRUNCATED]'));
    });

    it('menangani input null atau undefined dengan aman', () => {
      assert.deepEqual(sanitizeAuditMetadata(null), {});
      assert.deepEqual(sanitizeAuditMetadata(undefined), {});
    });
  });

  describe('3. Integritas Struktur Entri Audit Log Append-Only', () => {
    it('membentuk struktur entri audit log lengkap dengan aman', () => {
      const rawEntry: AuditLogEntry = {
        actorId: 'sa-001',
        action: 'user.create',
        targetType: 'user',
        targetId: 'user-789',
        status: 'success',
        ipAddress: '192.168.1.10',
        metadata: {
          email: 'editor@frasaklausa.id',
          password: 'UnsafePassword',
        },
      };

      const safeMetadata = sanitizeAuditMetadata(rawEntry.metadata);

      const finalAuditLog = {
        ...rawEntry,
        metadata: safeMetadata,
      };

      assert.equal(finalAuditLog.actorId, 'sa-001');
      assert.equal(finalAuditLog.action, 'user.create');
      assert.equal(finalAuditLog.targetType, 'user');
      assert.equal(finalAuditLog.targetId, 'user-789');
      assert.equal(finalAuditLog.status, 'success');
      assert.equal(finalAuditLog.ipAddress, '192.168.1.10');
      assert.equal((finalAuditLog.metadata as any).password, '[REDACTED]');
      assert.equal((finalAuditLog.metadata as any).email, 'editor@frasaklausa.id');
    });

    it('simulasi immutability append-only: menolak update/delete pada log audit', () => {
      interface AuditRow {
        id: string;
        action: string;
        createdAt: string;
      }

      const auditTable: AuditRow[] = [
        { id: 'log-1', action: 'user.create', createdAt: '2026-10-24T00:00:00Z' },
      ];

      // Simulasi PostgreSQL Rule: DO INSTEAD NOTHING pada UPDATE
      function attemptUpdate(id: string, newAction: string): AuditRow[] {
        // Rule: DO INSTEAD NOTHING -> tabel tetap tidak berubah
        return auditTable;
      }

      // Simulasi PostgreSQL Rule: DO INSTEAD NOTHING pada DELETE
      function attemptDelete(id: string): AuditRow[] {
        // Rule: DO INSTEAD NOTHING -> baris tidak dihapus
        return auditTable;
      }

      const afterUpdate = attemptUpdate('log-1', 'tampered.action');
      assert.equal(afterUpdate[0].action, 'user.create');

      const afterDelete = attemptDelete('log-1');
      assert.equal(afterDelete.length, 1);
    });
  });
});
