import * as React from 'react';

export const BREAKPOINTS = {
  MOBILE_MAX: 767,
  TABLET_MIN: 768,
  TABLET_MAX: 1279,
  DESKTOP_MIN: 1280,
} as const;

export type BreakpointTier = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveBreakpoints {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: BreakpointTier;
}

export function getClientBreakpoint(width: number): BreakpointTier {
  if (width < BREAKPOINTS.TABLET_MIN) {
    return 'mobile';
  }
  if (width < BREAKPOINTS.DESKTOP_MIN) {
    return 'tablet';
  }
  return 'desktop';
}

export function useResponsiveBreakpoints(defaultTier: BreakpointTier = 'desktop'): ResponsiveBreakpoints {
  const subscribe = React.useCallback((callback: () => void) => {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const mobileMql = window.matchMedia(`(max-width: ${BREAKPOINTS.MOBILE_MAX}px)`);
    const tabletMql = window.matchMedia(
      `(min-width: ${BREAKPOINTS.TABLET_MIN}px) and (max-width: ${BREAKPOINTS.TABLET_MAX}px)`
    );
    const desktopMql = window.matchMedia(`(min-width: ${BREAKPOINTS.DESKTOP_MIN}px)`);

    mobileMql.addEventListener('change', callback);
    tabletMql.addEventListener('change', callback);
    desktopMql.addEventListener('change', callback);

    return () => {
      mobileMql.removeEventListener('change', callback);
      tabletMql.removeEventListener('change', callback);
      desktopMql.removeEventListener('change', callback);
    };
  }, []);

  const getSnapshot = React.useCallback((): BreakpointTier => {
    if (typeof window === 'undefined') {
      return defaultTier;
    }
    return getClientBreakpoint(window.innerWidth);
  }, [defaultTier]);

  const getServerSnapshot = React.useCallback((): BreakpointTier => {
    return defaultTier;
  }, [defaultTier]);

  const tier = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return React.useMemo(
    () => ({
      isMobile: tier === 'mobile',
      isTablet: tier === 'tablet',
      isDesktop: tier === 'desktop',
      breakpoint: tier,
    }),
    [tier]
  );
}
