import './globals.css';
import React from 'react';
import TenantThemeProvider from '../components/theme/TenantThemeProvider';
import TenantThemeInjector from '../components/TenantThemeInjector';

export const metadata = {
  title: {
    default: 'UNICAMPUS ERP+',
    template: '%s | UNICAMPUS ERP+',
  },
  description: 'Enterprise Campus Management System — UNICAMPUS ERP+',
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>UNICAMPUS ERP+</title>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&family=Roboto:wght@400;500;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem('mederp_theme');
                if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <TenantThemeProvider>
          <TenantThemeInjector />
          {children}
        </TenantThemeProvider>
      </body>
    </html>
  );
}
