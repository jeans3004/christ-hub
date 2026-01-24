import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans } from 'next/font/google';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import ThemeProvider from '@/components/providers/ThemeProvider';
import ToastProvider from '@/components/ui/ToastProvider';
import PWAProvider from '@/components/pwa/PWAProvider';
import './globals.css';

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-ibm-plex',
});

export const metadata: Metadata = {
  title: 'Luminar',
  description: 'Luminar - Plataforma Educacional',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.png', sizes: 'any' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152' },
      { url: '/icons/icon-192x192.png', sizes: '192x192' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Luminar',
  },
  applicationName: 'Luminar',
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2A3F5F' },
    { media: '(prefers-color-scheme: dark)', color: '#0D1117' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={ibmPlexSans.variable} suppressHydrationWarning>
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider>
            {children}
            <ToastProvider />
            <PWAProvider />
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
