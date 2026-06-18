import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PhishAware',
  description: 'AI-powered cybersecurity awareness and phishing simulation platform.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className="dark" lang="en">
      <body>{children}</body>
    </html>
  );
}
