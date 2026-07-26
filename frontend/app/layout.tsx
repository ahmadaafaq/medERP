import './globals.css';
import React from 'react';

export const metadata = {
  title: 'MedERP — Multi-Tenant Medical University ERP',
  description: 'Enterprise Medical University Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#0F172A] text-[#F8FAFC] min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
