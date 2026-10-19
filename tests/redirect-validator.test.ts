import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isSafeInternalPath, getSafeRedirectUrl } from '../src/lib/redirect-validator.ts';

describe('Redirect Validator (Anti-Open Redirect / CWE-601)', () => {
  it('mengizinkan path internal admin yang sah', () => {
    assert.equal(isSafeInternalPath('/admin'), true);
    assert.equal(isSafeInternalPath('/admin/books'), true);
    assert.equal(isSafeInternalPath('/admin/books/new'), true);
    assert.equal(isSafeInternalPath('/admin/settings'), true);
    assert.equal(isSafeInternalPath('/admin/categories?tab=books&page=2'), true);
  });

  it('menolak URL eksternal absolut', () => {
    assert.equal(isSafeInternalPath('https://malicious.com'), false);
    assert.equal(isSafeInternalPath('http://attacker.com/admin'), false);
    assert.equal(isSafeInternalPath('ftp://files.example.com'), false);
  });

  it('menolak protocol-relative URLs (//attacker.com)', () => {
    assert.equal(isSafeInternalPath('//malicious.com'), false);
    assert.equal(isSafeInternalPath('//google.com/admin'), false);
  });

  it('menolak teknik backslash bypass (/\\attacker.com)', () => {
    assert.equal(isSafeInternalPath('/\\malicious.com'), false);
    assert.equal(isSafeInternalPath('/\\'), false);
  });

  it('menolak skema berbahaya (javascript:, data:, vbscript:)', () => {
    assert.equal(isSafeInternalPath('javascript:alert(document.cookie)'), false);
    assert.equal(isSafeInternalPath('data:text/html,<script>alert(1)</script>'), false);
    assert.equal(isSafeInternalPath('vbscript:msgbox(1)'), false);
  });

  it('menolak karakter kontrol dan CRLF injection', () => {
    assert.equal(isSafeInternalPath('/admin\r\nSet-Cookie: evil=1'), false);
    assert.equal(isSafeInternalPath('/admin\nLocation: http://evil.com'), false);
    assert.equal(isSafeInternalPath('/admin\0'), false);
  });

  it('menolak path publik umum yang bukan bagian dari rute admin CMS', () => {
    assert.equal(isSafeInternalPath('/'), false);
    assert.equal(isSafeInternalPath('/tentang-kami'), false);
    assert.equal(isSafeInternalPath('/katalog-buku'), false);
  });

  it('getSafeRedirectUrl mengembalikan target jika valid, dan fallback jika tidak valid', () => {
    assert.equal(getSafeRedirectUrl('/admin/books'), '/admin/books');
    assert.equal(getSafeRedirectUrl('https://evil.com'), '/admin');
    assert.equal(getSafeRedirectUrl('//evil.com'), '/admin');
    assert.equal(getSafeRedirectUrl(null), '/admin');
    assert.equal(getSafeRedirectUrl(undefined), '/admin');
    assert.equal(getSafeRedirectUrl(''), '/admin');
    assert.equal(getSafeRedirectUrl('invalid', '/admin/custom-fallback'), '/admin/custom-fallback');
  });
});
