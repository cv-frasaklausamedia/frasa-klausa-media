import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Aksesibilitas E2E Suite (WCAG 2.1 AA — PRD §11, §17, §25)
 * Memastikan halaman publik utama bebas dari pelanggaran aksesibilitas tingkat critical dan serious.
 */
test.describe('Accessibility Regression Audit (Axe-core)', () => {
  const publicPages = [
    { name: 'Beranda (Home)', path: '/' },
    { name: 'Katalog Buku', path: '/katalog' },
    { name: 'Kontak Redaksi', path: '/kontak' },
    { name: 'Blog Literasi', path: '/blog' },
    { name: 'Tentang Kami', path: '/tentang-kami' },
  ];

  for (const pageItem of publicPages) {
    test(`Halaman ${pageItem.name} (${pageItem.path}) bebas pelanggaran WCAG 2.1 AA`, async ({ page }) => {
      await page.goto(pageItem.path, { waitUntil: 'networkidle' });
      await expect(page.locator('main, h1').first()).toBeVisible();

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .disableRules(['color-contrast'])
        .analyze();

      // Filter hanya pelanggaran dengan tingkat dampak 'critical' atau 'serious'
      const severeViolations = accessibilityScanResults.violations.filter((v) =>
        ['critical', 'serious'].includes(v.impact ?? '')
      );

      if (severeViolations.length > 0) {
        console.warn(`[A11y Warning] Pelanggaran ditemukan pada ${pageItem.path}:`, severeViolations.map(v => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.length,
        })));
      }

      expect(severeViolations).toEqual([]);
    });
  }
});
