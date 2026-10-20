'use client';

import * as React from 'react';

/**
 * ServiceWorkerRegister
 * Komponen Client yang mendaftarkan Service Worker PWA secara otomatis di peramban
 * yang mendukung Service Worker pada lingkungan browser.
 */
export function ServiceWorkerRegister() {
  React.useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        // Deteksi pembaruan service worker
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener('statechange', () => {
            if (
              installingWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // Service worker baru terpasang
              console.info('[PWA] Versi baru aplikasi siap digunakan.');
            }
          });
        });
      } catch (error) {
        console.warn('[PWA] Pendaftaran Service Worker gagal:', error);
      }
    };

    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
      return () => window.removeEventListener('load', registerSW);
    }
  }, []);

  return null;
}
