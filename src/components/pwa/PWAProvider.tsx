'use client';

/**
 * Provider PWA que registra o Service Worker e gerencia instalação.
 * Deve ser incluído no layout como Client Component.
 */

import dynamic from 'next/dynamic';

const ServiceWorkerRegistration = dynamic(
  () => import('./ServiceWorkerRegistration'),
  { ssr: false }
);

export default function PWAProvider() {
  return <ServiceWorkerRegistration />;
}
