'use client';

import { Grid2X2, LayoutDashboard, LogOut, Settings, Shield, Target, User, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { PhoneChallengeLauncher } from '@/components/phone-challenge-launcher';

type AppShellProps = {
  children: ReactNode;
};

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Grid2X2 },
  { href: '/challenges', label: 'Challenges', icon: Shield },
  { href: '/admin', label: 'Admin', icon: LayoutDashboard },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const showMobileLauncher = pathname !== '/profile' && pathname !== '/settings';
  const [phoneOpen, setPhoneOpen] = useState(false);
  const sidebarCollapsed = showMobileLauncher && phoneOpen;

  useEffect(() => {
    function handleStartChallenge() {
      if (showMobileLauncher) setPhoneOpen(true);
    }

    window.addEventListener('phishaware:start-challenge', handleStartChallenge);
    return () => window.removeEventListener('phishaware:start-challenge', handleStartChallenge);
  }, [showMobileLauncher]);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="min-h-dvh bg-background text-on-surface">
      <header className={`fixed inset-x-0 top-0 z-50 h-16 bg-background px-5 transition-all md:px-8 ${sidebarCollapsed ? 'md:left-20 md:right-[420px]' : 'md:left-64'}`}>
        <div className="flex h-full items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-mono text-xl font-extrabold uppercase tracking-tight">PHISHAWARE</span>
          </Link>
          <Link className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary/20 text-primary" href="/profile" aria-label="Open profile">
            <UserCircle className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <aside className={`fixed inset-y-0 left-0 z-40 hidden bg-black p-4 pt-20 transition-all md:flex md:flex-col ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className={`mb-8 flex items-center gap-3 px-2 ${sidebarCollapsed ? 'justify-center px-0' : ''}`}>
          <Shield className="h-5 w-5 text-primary" />
          <span className={`font-mono text-xl font-extrabold uppercase tracking-tight ${sidebarCollapsed ? 'hidden' : 'block'}`}>PHISHAWARE</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center rounded-xl p-4 text-sm font-medium transition ${sidebarCollapsed ? 'justify-center gap-0' : 'gap-3'} ${
                  active ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
                title={item.label}
              >
                <Icon className="h-5 w-5" />
                <span className={sidebarCollapsed ? 'hidden' : 'block'}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <Link className={`mt-6 flex items-center rounded-xl p-4 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white ${sidebarCollapsed ? 'justify-center gap-0' : 'gap-3'}`} href="/" title="Sign out">
          <LogOut className="h-5 w-5" />
          <span className={sidebarCollapsed ? 'hidden' : 'block'}>Sign out</span>
        </Link>
      </aside>

      <main className={`px-5 pb-28 pt-24 transition-all md:px-8 md:pb-10 ${sidebarCollapsed ? 'md:ml-20 md:mr-[420px]' : 'md:ml-64'}`}>{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-20 items-center justify-around bg-black px-4 md:hidden">
        {navItems.filter((item) => item.href !== '/admin').map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold ${active ? 'text-primary' : 'text-white/65'}`}>
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {showMobileLauncher ? <PhoneChallengeLauncher open={phoneOpen} onClose={() => setPhoneOpen(false)} onToggle={() => setPhoneOpen((value) => !value)} /> : null}
    </div>
  );
}
