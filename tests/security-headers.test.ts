import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import nextConfig from '../next.config.ts';

describe('Security Headers Configuration (PRD §15.9)', () => {
  it('next.config.ts mendefinisikan seluruh security headers wajib', async () => {
    assert.ok(typeof nextConfig.headers === 'function', 'nextConfig.headers harus berupa fungsi');

    const headersConfig = await nextConfig.headers();
    assert.ok(Array.isArray(headersConfig));

    const globalRoute = headersConfig.find((entry) => entry.source === '/:path*');
    assert.ok(globalRoute, 'Harus ada rule header untuk /:path*');

    const headersMap = new Map<string, string>();
    for (const h of globalRoute.headers) {
      headersMap.set(h.key.toLowerCase(), h.value);
    }

    // 1. X-Content-Type-Options
    assert.equal(headersMap.get('x-content-type-options'), 'nosniff');

    // 2. X-Frame-Options
    assert.equal(headersMap.get('x-frame-options'), 'DENY');

    // 3. Referrer-Policy
    assert.equal(headersMap.get('referrer-policy'), 'strict-origin-when-cross-origin');

    // 4. Permissions-Policy
    const permissionsPolicy = headersMap.get('permissions-policy');
    assert.ok(permissionsPolicy?.includes('camera=()'));
    assert.ok(permissionsPolicy?.includes('microphone=()'));
    assert.ok(permissionsPolicy?.includes('geolocation=()'));

    // 5. Content-Security-Policy
    const csp = headersMap.get('content-security-policy');
    assert.ok(csp, 'CSP wajib ada');
    assert.ok(csp.includes("default-src 'self'"));
    assert.ok(csp.includes("frame-ancestors 'none'"), 'CSP harus memuat frame-ancestors none untuk anti-clickjacking');
    assert.ok(csp.includes('supabase.co'), 'CSP harus mengizinkan koneksi/gambar Supabase');
    assert.ok(csp.includes('fonts.googleapis.com'), 'CSP harus mengizinkan stylesheet Google Fonts');
    assert.ok(csp.includes('fonts.gstatic.com'), 'CSP harus mengizinkan font Google Fonts');
    assert.ok(csp.includes('object-src \'none\''), 'CSP harus memblokir plugin object-src none');
    assert.ok(csp.includes('base-uri \'self\''));
    assert.ok(csp.includes('form-action \'self\''));
  });
});
