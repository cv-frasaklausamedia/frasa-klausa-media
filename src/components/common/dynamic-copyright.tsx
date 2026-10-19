'use client';

import * as React from 'react';

const emptySubscribe = () => () => {};

export function DynamicCopyright({ companyName }: { companyName: string }) {
  const year = React.useSyncExternalStore(
    emptySubscribe,
    () => new Date().getFullYear(),
    () => 2026
  );

  return (
    <span>
      {companyName} &copy; {year} — Semua Hak Dilindungi.
    </span>
  );
}
