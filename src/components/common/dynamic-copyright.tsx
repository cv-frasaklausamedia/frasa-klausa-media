'use client';

import * as React from 'react';

export function DynamicCopyright({ companyName }: { companyName: string }) {
  const [year, setYear] = React.useState<number>(2026);

  React.useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <span>
      {companyName} &copy; {year} — Semua Hak Dilindungi.
    </span>
  );
}
