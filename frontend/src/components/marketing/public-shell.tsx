import { Shield } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

type PublicShellProps = {
  children: ReactNode;
};

const navItems = [
  { href: '/platform', label: 'Platform' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function PublicShell({ children }: PublicShellProps) {
  return (
    <main className="min-h-dvh bg-background text-on-surface">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-background/90 px-5 py-4 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link className="flex items-center gap-2.5 text-primary" href="/">
            <Shield className="h-7 w-7" />
            <span className="font-mono text-lg font-bold uppercase tracking-widest">PhishAware</span>
          </Link>
          <div className="hidden items-center gap-6 text-sm font-semibold text-on-surface-variant md:flex">
            {navItems.map((item) => (
              <Link key={item.href} className="hover:text-primary" href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link className="hidden rounded-xl px-4 py-2 text-sm font-bold text-primary hover:bg-surface sm:inline-flex" href="/signin">
              Sign In
            </Link>
            <Link className="pressable rounded-xl bg-primary-container px-4 py-2 text-sm font-bold text-on-primary-container" href="/signup">
              Get Started
            </Link>
          </div>
        </nav>
      </header>
      {children}
      <footer className="border-t border-white/10 px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm text-on-surface-variant md:flex-row md:items-center md:justify-between">
          <Link className="flex items-center gap-2.5 text-primary" href="/">
            <Shield className="h-6 w-6" />
            <span className="font-mono text-base font-bold uppercase tracking-widest">PhishAware</span>
          </Link>
          <p>Cybersecurity awareness through safe, AI-powered email labs.</p>
          <p>© 2026 PhishAware</p>
        </div>
      </footer>
    </main>
  );
}
