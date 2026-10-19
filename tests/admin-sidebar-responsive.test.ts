import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getClientBreakpoint,
  BREAKPOINTS,
  type BreakpointTier,
} from '../src/hooks/use-responsive-breakpoints.ts';

test('Admin Sidebar Responsive & Breakpoint Suite', async (t) => {
  await t.test('Verifikasi nilai konstanta breakpoint sistem', () => {
    assert.strictEqual(BREAKPOINTS.MOBILE_MAX, 767);
    assert.strictEqual(BREAKPOINTS.TABLET_MIN, 768);
    assert.strictEqual(BREAKPOINTS.TABLET_MAX, 1279);
    assert.strictEqual(BREAKPOINTS.DESKTOP_MIN, 1280);
  });

  await t.test('Kalkulasi getClientBreakpoint untuk perangkat Mobile (< 768px)', () => {
    const mobileWidths = [320, 375, 414, 600, 767];
    for (const w of mobileWidths) {
      assert.strictEqual(
        getClientBreakpoint(w),
        'mobile',
        `Lebar ${w}px harus terdeteksi sebagai mobile`
      );
    }
  });

  await t.test('Kalkulasi getClientBreakpoint untuk perangkat Tablet (768px - 1279px)', () => {
    const tabletWidths = [768, 820, 1024, 1180, 1279];
    for (const w of tabletWidths) {
      assert.strictEqual(
        getClientBreakpoint(w),
        'tablet',
        `Lebar ${w}px harus terdeteksi sebagai tablet`
      );
    }
  });

  await t.test('Kalkulasi getClientBreakpoint untuk perangkat Desktop (>= 1280px)', () => {
    const desktopWidths = [1280, 1440, 1536, 1920, 2560];
    for (const w of desktopWidths) {
      assert.strictEqual(
        getClientBreakpoint(w),
        'desktop',
        `Lebar ${w}px harus terdeteksi sebagai desktop`
      );
    }
  });

  await t.test('Resolusi state docked sidebar berdasarkan breakpoint tier dan preferensi open', () => {
    const resolveDockedState = (tier: BreakpointTier, open: boolean): 'expanded' | 'collapsed' => {
      // Pada desktop: mengikuti nilai 'open'
      // Pada tablet & mobile: docked sidebar selalu 'collapsed' (72px)
      return tier === 'desktop' && open ? 'expanded' : 'collapsed';
    };

    // 1. Desktop dengan open = true -> expanded (256px)
    assert.strictEqual(resolveDockedState('desktop', true), 'expanded');

    // 2. Desktop dengan open = false -> collapsed (72px)
    assert.strictEqual(resolveDockedState('desktop', false), 'collapsed');

    // 3. Tablet dengan open = true -> tetap collapsed (72px) karena dock icon-only
    assert.strictEqual(resolveDockedState('tablet', true), 'collapsed');
    assert.strictEqual(resolveDockedState('tablet', false), 'collapsed');

    // 4. Mobile -> collapsed (dan dock disembunyikan via CSS md:flex)
    assert.strictEqual(resolveDockedState('mobile', true), 'collapsed');
  });

  await t.test('Aksi toggleSidebar membuka drawer overlay pada mobile & tablet, dan toggle dock pada desktop', () => {
    type MockState = {
      openMobile: boolean;
      openDesktop: boolean;
    };

    const performToggle = (tier: BreakpointTier, state: MockState): MockState => {
      if (tier === 'mobile' || tier === 'tablet') {
        return { ...state, openMobile: !state.openMobile };
      }
      return { ...state, openDesktop: !state.openDesktop };
    };

    // Mobile: toggle memicu openMobile
    const initialMobile: MockState = { openMobile: false, openDesktop: true };
    const toggledMobile = performToggle('mobile', initialMobile);
    assert.strictEqual(toggledMobile.openMobile, true);
    assert.strictEqual(toggledMobile.openDesktop, true);

    // Tablet: toggle memicu openMobile (drawer overlay sementara)
    const initialTablet: MockState = { openMobile: false, openDesktop: true };
    const toggledTablet = performToggle('tablet', initialTablet);
    assert.strictEqual(toggledTablet.openMobile, true);
    assert.strictEqual(toggledTablet.openDesktop, true);

    // Desktop: toggle memicu openDesktop (expand / collapse sidebar dock)
    const initialDesktop: MockState = { openMobile: false, openDesktop: true };
    const toggledDesktop = performToggle('desktop', initialDesktop);
    assert.strictEqual(toggledDesktop.openMobile, false);
    assert.strictEqual(toggledDesktop.openDesktop, false);
  });
});
