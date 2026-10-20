import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import manifest from '../src/app/manifest.ts';
import nextConfig from '../next.config.ts';

describe('Progressive Web App (PWA) Implementation Suite', () => {
  it('manifest() menghasilkan konfigurasi manifest valid sesuai standar PWA', () => {
    const data = manifest();

    assert.equal(data.name, 'Frasa Klausa Media');
    assert.equal(data.short_name, 'Frasa Klausa');
    assert.equal(data.display, 'standalone');
    assert.equal(data.start_url, '/');
    assert.equal(data.background_color, '#ffffff');
    assert.equal(data.theme_color, '#9a3412');
    assert.ok(Array.isArray(data.icons));
    assert.ok(data.icons.length >= 4, 'Manifest harus menyediakan minimal 4 entri ikon');

    // Pastikan terdapat icon 192x192 dan 512x512
    const icon192 = data.icons.find((i) => i.sizes === '192x192' && i.purpose === 'any');
    const icon512 = data.icons.find((i) => i.sizes === '512x512' && i.purpose === 'any');
    const maskable192 = data.icons.find((i) => i.sizes === '192x192' && i.purpose === 'maskable');
    const maskable512 = data.icons.find((i) => i.sizes === '512x512' && i.purpose === 'maskable');
    const masterLogo = data.icons.find((i) => i.src === '/logo/logo.jpg');

    assert.ok(icon192, 'Harus ada icon-192x192');
    assert.ok(icon512, 'Harus ada icon-512x512');
    assert.ok(maskable192, 'Harus ada icon-maskable-192x192');
    assert.ok(maskable512, 'Harus ada icon-maskable-512x512');
    assert.ok(masterLogo, 'Harus mencantumkan /logo/logo.jpg asli pada entri icons');
  });

  it('seluruh file aset ikon PWA tersedia di disk dengan ukuran valid', () => {
    const iconFiles = [
      'public/icons/icon-192x192.png',
      'public/icons/icon-512x512.png',
      'public/icons/icon-maskable-192x192.png',
      'public/icons/icon-maskable-512x512.png',
      'public/icons/apple-touch-icon.png',
      'public/logo/logo.jpg',
    ];

    for (const relPath of iconFiles) {
      const fullPath = path.resolve(process.cwd(), relPath);
      assert.ok(fs.existsSync(fullPath), `Aset ${relPath} wajib ada`);
      const stat = fs.statSync(fullPath);
      assert.ok(stat.size > 0, `Aset ${relPath} tidak boleh kosong`);
    }
  });

  it('Service Worker (public/sw.js) mengonfigurasi strategi offline dan bypass keamanan', () => {
    const swPath = path.resolve(process.cwd(), 'public/sw.js');
    assert.ok(fs.existsSync(swPath), 'public/sw.js wajib ada');

    const swContent = fs.readFileSync(swPath, 'utf8');

    // Caching version dan fallback offline
    assert.ok(swContent.includes('CACHE_VERSION'), 'SW harus mendefinisikan versi cache');
    assert.ok(swContent.includes('/offline'), 'SW harus menyertakan URL fallback /offline');

    // Lifecycle events
    assert.ok(swContent.includes('skipWaiting'), 'SW harus mendukung skipWaiting');
    assert.ok(swContent.includes('clients.claim'), 'SW harus mendukung clients.claim');

    // Bypass aturan keamanan
    assert.ok(swContent.includes('/admin'), 'SW harus mem-bypass rute /admin');
    assert.ok(swContent.includes('/api/'), 'SW harus mem-bypass rute /api');
    assert.ok(swContent.includes("request.method !== 'GET'"), 'SW hanya boleh menangani method GET');
  });

  it('next.config.ts mendefinisikan header khusus untuk /sw.js', async () => {
    assert.ok(typeof nextConfig.headers === 'function');
    const headersList = await nextConfig.headers();

    const swRoute = headersList.find((entry) => entry.source === '/sw.js');
    assert.ok(swRoute, 'Harus ada konfigurasi header khusus untuk /sw.js');

    const headersMap = new Map<string, string>();
    for (const h of swRoute.headers) {
      headersMap.set(h.key.toLowerCase(), h.value);
    }

    assert.equal(headersMap.get('service-worker-allowed'), '/');
    assert.ok(headersMap.get('cache-control')?.includes('no-cache'));
    assert.ok(headersMap.get('content-type')?.includes('application/javascript'));
  });

  it('src/middleware.ts mengecualikan manifest dan sw.js dari pemeriksaan sesi Edge', () => {
    const middlewarePath = path.resolve(process.cwd(), 'src/middleware.ts');
    const content = fs.readFileSync(middlewarePath, 'utf8');

    assert.ok(content.includes('manifest'), 'Middleware harus mengecualikan manifest');
    assert.ok(content.includes('sw'), 'Middleware harus mengecualikan sw.js');
  });
});
