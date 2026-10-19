'use client';

import * as React from 'react';

interface DynamicCopyrightProps {
  companyName: string;
  suffix?: string;
  className?: string;
}

/**
 * Komponen DynamicCopyright
 *
 * Mencegah tahun copyright "membeku" pada hasil static build (SSG/ISR).
 * Sesuai panduan Next.js 16 (Cache Components / PPR):
 * Pembacaan new Date().getFullYear() dilakukan di dalam useEffect (defer)
 * agar saat proses prerender tidak memicu blocking-prerender-current-time-client,
 * sekaligus memastikan saat di browser klien nilai tahun selalu 100% mengikuti
 * tahun kalender perangkat pengguna saat ini.
 *
 * Format baku: "[Company Name] © {tahun}" (PRD §6.3.9).
 */
export function DynamicCopyright({
  companyName,
  suffix,
  className,
}: DynamicCopyrightProps) {
  // Nilai awal stabil untuk prerender server, diperbarui secara presisi di client
  const [year, setYear] = React.useState<number>(2026);

  React.useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <span className={className}>
      {companyName} &copy; {year}
      {suffix ? ` ${suffix}` : ''}
    </span>
  );
}
