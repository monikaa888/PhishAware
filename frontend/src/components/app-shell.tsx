'use client';

import { BriefcaseBusiness, Grid2X2, LayoutDashboard, LogOut, Settings, Shield, User, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { EmailLabLauncher } from '@/components/phone-challenge-launcher';
import type { AuthUser } from '@/lib/api';
import { clearAuthSession, getAuthToken, getStoredUser } from '@/lib/auth';
import { applyPreferences, loadPreferences, type Preferences } from '@/lib/preferences';

type AppShellProps = {
  children: ReactNode;
};

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Grid2X2 },
  { href: '/challenges', label: 'Challenges', icon: Shield },
  { href: '/business', label: 'Business', icon: BriefcaseBusiness },
  { href: '/admin', label: 'Admin', icon: LayoutDashboard },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dashboardOrChallengeRoute = pathname === '/dashboard' || pathname.startsWith('/challenges') || pathname.startsWith('/business');
  const showEmailLabLauncher = pathname !== '/profile' && pathname !== '/settings' && !dashboardOrChallengeRoute;
  const [emailLabOpen, setEmailLabOpen] = useState(false);
  const sidebarCollapsed = showEmailLabLauncher && emailLabOpen;
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const isAdmin = user?.role === 'ADMIN';
  const isBusinessAdmin = user?.role === 'BUSINESS_ADMIN';
  const visibleNavItems = navItems.filter((item) => {
    if (item.href === '/admin') return isAdmin;
    if (item.href === '/business') return isBusinessAdmin;
    if (isBusinessAdmin && (item.href === '/dashboard' || item.href === '/challenges')) return false;
    return true;
  });

  useEffect(() => {
    if (!getAuthToken()) {
      router.replace('/signin');
      return;
    }

    const storedUser = getStoredUser();
    setUser(storedUser);
    if (pathname.startsWith('/admin') && storedUser?.role !== 'ADMIN') {
      router.replace('/dashboard');
      return;
    }
    if (pathname.startsWith('/business') && storedUser?.role !== 'BUSINESS_ADMIN') {
      router.replace('/dashboard');
      return;
    }
    if ((pathname === '/dashboard' || pathname.startsWith('/challenges')) && storedUser?.role === 'BUSINESS_ADMIN') {
      router.replace('/business');
      return;
    }

    setAuthChecked(true);
  }, [pathname, router]);

  useEffect(() => {
    const loadedPreferences = loadPreferences();
    setPreferences(loadedPreferences);
    applyPreferences(loadedPreferences);

    function handlePreferencesChanged(event: Event) {
      const nextPreferences = (event as CustomEvent<Preferences>).detail;
      setPreferences(nextPreferences);
      applyPreferences(nextPreferences);
    }

    window.addEventListener('phishaware:preferences-changed', handlePreferencesChanged);
    return () => window.removeEventListener('phishaware:preferences-changed', handlePreferencesChanged);
  }, []);

  useEffect(() => {
    function handleStartChallenge() {
      if (showEmailLabLauncher) setEmailLabOpen(true);
    }

    window.addEventListener('phishaware:start-challenge', handleStartChallenge);
    return () => window.removeEventListener('phishaware:start-challenge', handleStartChallenge);
  }, [showEmailLabLauncher]);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function signOut() {
    clearAuthSession();
    router.replace('/signin');
  }

  if (!authChecked) {
    return <div className="min-h-dvh bg-background" />;
  }

  return (
    <div className="min-h-dvh bg-background text-on-surface">
      <header className={`fixed inset-x-0 top-0 z-50 h-14 bg-background px-4 transition-all md:px-6 ${sidebarCollapsed ? 'md:left-20 xl:right-[720px]' : 'md:left-60'}`}>
        <div className="flex h-full items-center justify-between">
          <Link href={isBusinessAdmin ? '/business' : '/dashboard'} className="flex items-center gap-2.5">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-mono text-xl font-extrabold uppercase tracking-tight">PHISHAWARE</span>
          </Link>
          <div className="flex items-center gap-3">
            {preferences ? <span className="hidden rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/65 sm:block">{preferences.language}</span> : null}
          <Link className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary/20 text-primary" href="/profile" aria-label="Open profile">
            <UserCircle className="h-5 w-5" />
          </Link>
          </div>
        </div>
      </header>

      <aside className={`fixed inset-y-0 left-0 z-40 hidden bg-black p-3 pt-16 transition-all md:flex md:flex-col ${sidebarCollapsed ? 'w-20' : 'w-60'}`}>
        <div className={`mb-6 flex items-center gap-3 px-2 ${sidebarCollapsed ? 'justify-center px-0' : ''}`}>
          <Shield className="h-6 w-6 text-primary" />
          <span className={`font-mono text-xl font-extrabold uppercase tracking-tight ${sidebarCollapsed ? 'hidden' : 'block'}`}>PHISHAWARE</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center rounded-xl p-3 text-sm font-medium transition ${sidebarCollapsed ? 'justify-center gap-0' : 'gap-3'} ${
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

        <button className={`mt-6 flex items-center rounded-xl p-3 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white ${sidebarCollapsed ? 'justify-center gap-0' : 'gap-3'}`} type="button" title="Sign out" onClick={signOut}>
          <LogOut className="h-5 w-5" />
          <span className={sidebarCollapsed ? 'hidden' : 'block'}>Sign out</span>
        </button>
      </aside>

      <main className={`px-4 pb-24 pt-20 transition-all md:px-6 md:pb-8 ${sidebarCollapsed ? 'md:ml-20 xl:mr-[720px]' : 'md:ml-60'}`}>{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-20 items-center justify-around bg-black px-4 md:hidden">
        {visibleNavItems.filter((item) => item.href !== '/admin').map((item) => {
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

      {showEmailLabLauncher ? <EmailLabLauncher open={emailLabOpen} onClose={() => setEmailLabOpen(false)} onToggle={() => setEmailLabOpen((value) => !value)} /> : null}
    </div>
  );
}
