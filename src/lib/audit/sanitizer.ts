const SENSITIVE_KEY_PATTERNS = [
  /pass(word)?/i,
  /secret/i,
  /token/i,
  /key/i,
  /auth(orization)?/i,
  /credential/i,
  /cookie/i,
  /session/i,
  /bearer/i,
];

/**
 * Memeriksa apakah sebuah nama properti tergolong informasi rahasia
 */
export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

/**
 * Membersihkan metadata audit log secara rekursif dari data rahasia/PII sensitif (PRD §16.7).
 * Tidak mengubah objek asli (immutable).
 */
export function sanitizeAuditMetadata(
  data: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  if (!data || typeof data !== 'object') {
    return {};
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (isSensitiveKey(key)) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    if (value === null || value === undefined) {
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) => {
        if (item && typeof item === 'object') {
          return sanitizeAuditMetadata(item as Record<string, unknown>);
        }
        return item;
      });
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeAuditMetadata(value as Record<string, unknown>);
    } else if (typeof value === 'string' && value.length > 500) {
      // Potong string yang terlalu panjang untuk menghemat ruang dan mencegah abuse
      sanitized[key] = value.slice(0, 500) + '...[TRUNCATED]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
