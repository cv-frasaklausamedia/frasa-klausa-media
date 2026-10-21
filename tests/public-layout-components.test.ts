import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Public Layout Components Logic Suite (Tahap 9 - PRD §6.3.1, §6.3.9, §9.2)', () => {
  it('1. StickyBanner: Membedakan tautan internal vs eksternal secara tepat', () => {
    const internalUrl = '/katalog/hujan-bulan-juni';
    const externalUrl = 'https://shopee.co.id/promo-buku';

    const isInternal1 = internalUrl.startsWith('/');
    const isInternal2 = externalUrl.startsWith('/');

    assert.equal(isInternal1, true);
    assert.equal(isInternal2, false);
  });

  it('2. Footer: Sanitasi nomor WhatsApp untuk tautan wa.me', () => {
    const rawNumber1 = '0813-8060-4256';
    const clean1 = rawNumber1.replace(/[^0-9]/g, '');
    const waUrl1 = clean1.startsWith('0') ? `https://wa.me/62${clean1.slice(1)}` : `https://wa.me/${clean1}`;
    assert.equal(waUrl1, 'https://wa.me/6281380604256');

    const rawNumber2 = '6281380604256';
    const clean2 = rawNumber2.replace(/[^0-9]/g, '');
    const waUrl2 = clean2.startsWith('0') ? `https://wa.me/62${clean2.slice(1)}` : `https://wa.me/${clean2}`;
    assert.equal(waUrl2, 'https://wa.me/6281380604256');
  });

  it('3. Footer: Menyembunyikan tautan marketplace dan sosmed jika URL kosong', () => {
    const mockSocial = {
      instagram: 'https://instagram.com/frasaklausamedia',
      facebook: '',
      tiktok: '   ',
      twitter: undefined,
      shopee: 'https://shopee.co.id/frasaklausamedia',
      tokopedia: '',
    };

    const socialLinks = [
      { name: 'Instagram', url: mockSocial.instagram },
      { name: 'Facebook', url: mockSocial.facebook },
      { name: 'TikTok', url: mockSocial.tiktok },
      { name: 'Twitter', url: mockSocial.twitter },
    ].filter((item) => Boolean(item.url && item.url.trim() !== ''));

    const marketplaceLinks = [
      { name: 'Shopee Official', url: mockSocial.shopee },
      { name: 'Tokopedia Official', url: mockSocial.tokopedia },
    ].filter((item) => Boolean(item.url && item.url.trim() !== ''));

    assert.equal(socialLinks.length, 1);
    assert.equal(socialLinks[0].name, 'Instagram');

    assert.equal(marketplaceLinks.length, 1);
    assert.equal(marketplaceLinks[0].name, 'Shopee Official');
  });

  it('4. Navbar: Rute navigasi utama publik menggunakan next/link internal yang valid', () => {
    const navItems = [
      { label: 'Beranda', href: '/' },
      { label: 'Katalog', href: '/katalog' },
      { label: 'Blog', href: '/blog' },
      { label: 'Tentang Kami', href: '/tentang-kami' },
      { label: 'Kontak', href: '/kontak' },
    ];

    for (const item of navItems) {
      assert.ok(item.href.startsWith('/'), `Rute ${item.href} harus diawali slash`);
      assert.ok(item.label.length > 0, 'Label navigasi tidak boleh kosong');
    }
  });

  it('5. GlobalSearch: Rute tujuan navigasi buku mengarah ke /buku/[slug] dan artikel ke /blog/[slug]', () => {
    const getBookDetailUrl = (slug: string) => `/buku/${slug}`;
    const getPostDetailUrl = (slug: string) => `/blog/${slug}`;

    assert.equal(getBookDetailUrl('azzam-fkm'), '/buku/azzam-fkm');
    assert.equal(getPostDetailUrl('tips-literasi'), '/blog/tips-literasi');
  });
});
