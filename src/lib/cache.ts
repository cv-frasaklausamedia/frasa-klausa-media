import { createRequire } from 'module';

type UnstableCacheType = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  keyParts?: string[],
  options?: {
    revalidate?: number | false;
    tags?: string[];
  }
) => T;

let unstableCacheImpl: UnstableCacheType = (fn) => fn;

try {
  const req = createRequire(import.meta.url);
  const nextCache = req('next/cache');
  if (nextCache && typeof nextCache.unstable_cache === 'function') {
    unstableCacheImpl = nextCache.unstable_cache;
  }
} catch {
  // Fallback no-op for non-bundled Node.js test execution
}

export const unstable_cache = unstableCacheImpl;
