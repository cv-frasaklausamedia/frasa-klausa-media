/**
 * Validator Redirect URL Internal
 *
 * Mencegah kerentanan Open Redirect (CWE-601).
 * Mengizinkan hanya path internal relatif yang valid (allowlist path admin).
 */

const DEFAULT_FALLBACK = '/admin';

/**
 * Memeriksa apakah suatu string merupakan path internal yang aman.
 */
export function isSafeInternalPath(url: unknown): url is string {
  if (typeof url !== 'string' || !url.trim()) {
    return false;
  }

  const trimmed = url.trim();

  // Mencegah CRLF injection atau karakter kontrol
  if (/[\r\n\t\0]/.test(trimmed)) {
    return false;
  }

  // Wajib diawali dengan satu karakter '/'
  if (!trimmed.startsWith('/')) {
    return false;
  }

  // Dilarang diawali '//' (protocol-relative URL ke domain eksternal)
  if (trimmed.startsWith('//')) {
    return false;
  }

  // Dilarang diawali '/\' (bypass normalisasi browser ke domain eksternal)
  if (trimmed.startsWith('/\\')) {
    return false;
  }

  // Dilarang mengandung skema protokol eksplisit (misal: javascript:, http:, data:)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return false;
  }

  // Batasi hanya rute admin internal yang diizinkan untuk redirect pasca-login
  // Format yang diizinkan: /admin atau /admin/...
  const isAdminPath = /^\/admin(\/[a-zA-Z0-9\-_./?=&#%]*)?$/.test(trimmed);

  return isAdminPath;
}

/**
 * Menghasilkan URL redirect yang aman. Jika target tidak valid,
 * akan menggunakan fallback default ('/admin').
 */
export function getSafeRedirectUrl(
  target: string | null | undefined,
  fallback = DEFAULT_FALLBACK
): string {
  if (target && isSafeInternalPath(target)) {
    return target;
  }
  return fallback;
}
