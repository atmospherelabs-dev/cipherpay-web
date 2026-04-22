import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CipherPay — Private Payments for the Internet',
  description:
    'Accept Zcash in minutes. Non-custodial. Zero buyer data. No middleman.',
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'CipherPay — Private Payments for the Internet',
    description: 'Accept Zcash in minutes. Non-custodial. Zero buyer data. No middleman.',
    siteName: 'CipherPay',
    type: 'website',
    images: [{ url: '/logo-dark-bg.png', width: 694, height: 694 }],
  },
};

const themeScript = `
  (function() {
    try {
      var t = localStorage.getItem('theme');
      if (!t) t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(t);
    } catch (e) {}
  })();
`;

const dirScript = `
  (function() {
    try {
      var m = window.location.pathname.match(/^\\/([a-z]{2})(?:\\/|$)/);
      if (m) {
        document.documentElement.lang = m[1];
        document.documentElement.dir = m[1] === 'ar' ? 'rtl' : 'ltr';
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: dirScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
