'use client';

import { ArrowRight, BarChart3, Building2, CheckCircle2, ClipboardList, LayoutDashboard, Lock, LogOut, RefreshCw, Rocket, Shield, Sparkles, Users } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import {
  createBusinessAdmin,
  createPlatformChallenge,
  createPlatformInternalUser,
  deleteBusinessAdmin,
  deletePlatformAssignmentActivity,
  deletePlatformChallenge,
  deletePlatformUser,
  developerAdminLogin,
  generatePlatformChallenge,
  getPlatformOverview,
  updatePlatformChallenge,
  updatePlatformChallengeStatus,
  type PlatformOverview,
} from '@/lib/api';

const TOKEN_KEY = 'phishaware_developer_admin_token';

export default function DeveloperAdminPage() {
  const pathname = usePathname();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDifficulty, setDraftDifficulty] = useState('BEGINNER');
  const [draftType, setDraftType] = useState('Email Phishing');
  const [generateTheme, setGenerateTheme] = useState('credential theft with lookalike domain');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [businessAdminName, setBusinessAdminName] = useState('');
  const [businessAdminEmail, setBusinessAdminEmail] = useState('');
  const [businessAdminPassword, setBusinessAdminPassword] = useState('');
  const [businessAdminBusinessId, setBusinessAdminBusinessId] = useState('');
  const [editingChallengeId, setEditingChallengeId] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState('');
  const [editDifficulty, setEditDifficulty] = useState('');
  const [editContext, setEditContext] = useState('');
  const [editLure, setEditLure] = useState('');
  const [editSchedule, setEditSchedule] = useState('');

  async function loadOverview(nextToken = token) {
    if (!nextToken) return;
    const nextOverview = await getPlatformOverview(nextToken);
    setOverview(nextOverview);
  }

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_KEY);
    if (!storedToken) return;
    setToken(storedToken);
    void loadOverview(storedToken).catch(() => {
      window.localStorage.removeItem(TOKEN_KEY);
      setToken('');
    });
  }, []);

  useEffect(() => {
    if (!businessAdminBusinessId && overview?.businesses[0]?.id) {
      setBusinessAdminBusinessId(overview.businesses[0].id);
    }
  }, [overview, businessAdminBusinessId]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const session = await developerAdminLogin({ password });
      window.localStorage.setItem(TOKEN_KEY, session.accessToken);
      setToken(session.accessToken);
      await loadOverview(session.accessToken);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not sign in.');
    } finally {
      setLoading(false);
    }
  }

  async function createDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await createPlatformChallenge(token, {
        title: draftTitle,
        type: draftType,
        difficulty: draftDifficulty,
        status: 'DRAFT',
      });
      setDraftTitle('');
      setMessage('Challenge draft created.');
      await loadOverview();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not create challenge.');
    }
  }

  async function generateDraft() {
    setError('');
    setMessage('');
    try {
      await generatePlatformChallenge(token, {
        channel: 'EMAIL',
        difficulty: 'INTERMEDIATE',
        targetAudience: 'SME early career employees',
        theme: generateTheme,
        organizationName: 'Generic SME',
        learningObjectives: ['Inspect sender domain', 'Identify manipulation', 'Choose reporting path'],
        status: 'DRAFT',
      });
      setMessage('Generated challenge draft saved.');
      await loadOverview();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not generate challenge.');
    }
  }

  async function createManagedUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await createPlatformInternalUser(token, {
        displayName: userName,
        email: userEmail,
        password: userPassword,
      });
      setUserName('');
      setUserEmail('');
      setUserPassword('');
      setMessage('User created.');
      await loadOverview();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not create user.');
    }
  }

  async function createManagedBusinessAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await createBusinessAdmin(token, businessAdminBusinessId, {
        displayName: businessAdminName,
        email: businessAdminEmail,
        password: businessAdminPassword,
      });
      setBusinessAdminName('');
      setBusinessAdminEmail('');
      setBusinessAdminPassword('');
      setMessage('Business admin created.');
      await loadOverview();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not create business admin.');
    }
  }

  async function removeBusinessAdmin(businessId: string, adminId: string) {
    setError('');
    setMessage('');
    try {
      await deleteBusinessAdmin(token, businessId, adminId);
      setMessage('Business admin removed.');
      await loadOverview();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not remove business admin.');
    }
  }

  async function removeUser(userId: string) {
    setError('');
    setMessage('');
    try {
      await deletePlatformUser(token, userId);
      setMessage('User removed.');
      await loadOverview();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not remove user.');
    }
  }

  async function removeAssignmentActivity(assignmentId: string) {
    setError('');
    setMessage('');
    try {
      await deletePlatformAssignmentActivity(token, assignmentId);
      setMessage('Assignment activity removed.');
      await loadOverview();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not remove activity.');
    }
  }

  async function setChallengeStatus(challengeId: string, status: 'DRAFT' | 'AVAILABLE' | 'LOCKED' | 'ARCHIVED') {
    setError('');
    setMessage('');
    try {
      await updatePlatformChallengeStatus(token, challengeId, status);
      setMessage(`Challenge marked ${status.toLowerCase()}.`);
      await loadOverview();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not update challenge.');
    }
  }

  function startEditingChallenge(challenge: NonNullable<PlatformOverview['challenges']>[number]) {
    setEditingChallengeId(challenge.id);
    setEditTitle(challenge.title);
    setEditType(challenge.type);
    setEditDifficulty(challenge.difficulty);
    setEditContext(String(challenge.simulationSpec?.context ?? ''));
    setEditLure(typeof challenge.simulationSpec?.lure === 'string' ? challenge.simulationSpec.lure : JSON.stringify(challenge.simulationSpec?.lure ?? '', null, 2));
    setEditSchedule(challenge.scheduledReleaseAt ? challenge.scheduledReleaseAt.slice(0, 16) : '');
  }

  async function saveChallengeEdit(challengeId: string) {
    setError('');
    setMessage('');
    try {
      await updatePlatformChallenge(token, challengeId, {
        title: editTitle,
        type: editType,
        difficulty: editDifficulty,
        context: editContext,
        lure: editLure,
        scheduledReleaseAt: editSchedule ? new Date(editSchedule).toISOString() : '',
      });
      setEditingChallengeId('');
      setMessage('Challenge updated.');
      await loadOverview();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not update challenge.');
    }
  }

  async function removeChallenge(challengeId: string) {
    setError('');
    setMessage('');
    try {
      await deletePlatformChallenge(token, challengeId);
      setMessage('Challenge deleted.');
      await loadOverview();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not delete challenge.');
    }
  }

  function signOut() {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken('');
    setOverview(null);
  }

  if (!token) {
    return (
      <main className="min-h-dvh bg-background px-5 py-10 text-on-surface">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
          <section>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
              <Shield className="h-4 w-4" />
              Platform developer console
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight md:text-6xl">PhishAware release and monitoring console.</h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-on-surface-variant">
              Company developers can release challenges, create drafts, generate new lab concepts, and monitor organization adoption from this isolated console.
            </p>
          </section>

          <form className="rounded-2xl bg-white/5 p-6" onSubmit={login}>
            <h2 className="text-2xl font-black">Developer login</h2>
            <label className="mt-6 block">
              <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">Developer password</span>
              <div className="mt-2 flex items-center gap-3 rounded-xl bg-black px-4 py-3">
                <Lock className="h-5 w-5 text-primary" />
                <input className="w-full bg-transparent text-sm outline-none" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </div>
            </label>
            {error ? <p className="mt-4 rounded-xl bg-white/10 p-3 text-sm">{error}</p> : null}
            <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-black disabled:opacity-60" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Open developer console'}
              <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-4 text-xs leading-5 text-white/50">Default local password is printed by `./script.sh` as `Dev admin password`.</p>
          </form>
        </div>
      </main>
    );
  }

  const metrics = overview?.metrics;
  const navItems = [
    { href: '/123admin/overview', label: 'Overview', icon: LayoutDashboard },
    { href: '/123admin/design', label: 'Design', icon: Sparkles },
    { href: '/123admin/organizations', label: 'Organizations', icon: Building2 },
    { href: '/123admin/users', label: 'Users', icon: Users },
    { href: '/123admin/release', label: 'Release Queue', icon: Rocket },
    { href: '/123admin/activity', label: 'Activity', icon: BarChart3 },
  ];

  return (
    <main className="min-h-dvh bg-background text-on-surface">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 bg-black px-4 py-5 lg:flex lg:flex-col">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-black">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <p className="font-mono text-lg font-black uppercase tracking-tight">PhishAware</p>
            <p className="text-xs font-bold uppercase tracking-widest text-white/40">Developer console</p>
          </div>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition hover:bg-white/10 hover:text-white ${
                  pathname === item.href || (pathname === '/123admin' && item.href === '/123admin/overview') ? 'bg-white/10 text-white' : 'text-white/65'
                }`}
                href={item.href}
              >
                <Icon className="h-5 w-5 text-primary" />
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="rounded-2xl bg-white/5 p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/35">Admin route</p>
          <p className="mt-2 font-mono text-sm text-primary">/123admin</p>
          <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white/70" type="button" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 bg-background/95 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex flex-col gap-3 rounded-2xl bg-white/5 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">/123admin</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">Developer command center</h1>
              <p className="mt-1 text-sm text-white/60">Release challenges, design labs, and monitor organization adoption.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-black text-black" type="button" onClick={() => void loadOverview()}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-bold text-white/70 lg:hidden" type="button" onClick={signOut}>
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {navItems.map((item) => (
              <a
                key={item.href}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold ${
                  pathname === item.href || (pathname === '/123admin' && item.href === '/123admin/overview') ? 'bg-primary text-black' : 'bg-white/10 text-white/70'
                }`}
                href={item.href}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </header>

        <div className="mx-auto max-w-7xl space-y-6 px-4 pb-8 md:px-8">

        {error ? <p className="rounded-xl bg-white/10 p-4 text-sm">{error}</p> : null}
        {message ? <p className="rounded-xl bg-primary/10 p-4 text-sm text-primary">{message}</p> : null}

        <section id="overview" className="scroll-mt-32 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {[
            { label: 'Businesses', value: metrics?.totalBusinesses ?? 0, icon: Building2 },
            { label: 'Users', value: metrics?.totalUsers ?? 0, icon: Users },
            { label: 'Pending users', value: metrics?.pendingUsers ?? 0, icon: ClipboardList },
            { label: 'Released labs', value: metrics?.releasedChallenges ?? 0, icon: Rocket },
            { label: 'Draft labs', value: metrics?.draftChallenges ?? 0, icon: Sparkles },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.label} className="rounded-2xl bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/45">{item.label}</span>
                </div>
                <p className="mt-5 text-3xl font-black">{item.value}</p>
              </article>
            );
          })}
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <form id="design" className="scroll-mt-32 rounded-2xl bg-white/5 p-5" onSubmit={createDraft}>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Design challenge</p>
              <h2 className="mt-1 text-xl font-black">Create manual draft</h2>
              <div className="mt-4 grid gap-3">
                <input className="rounded-xl bg-black px-4 py-3 text-sm outline-none" placeholder="Challenge title" value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} required />
                <select className="rounded-xl bg-black px-4 py-3 text-sm outline-none" value={draftType} onChange={(event) => setDraftType(event.target.value)}>
                  <option>Email Phishing</option>
                  <option>Domain Reasoning</option>
                  <option>Attachment Safety</option>
                  <option>Writing Manipulation</option>
                </select>
                <select className="rounded-xl bg-black px-4 py-3 text-sm outline-none" value={draftDifficulty} onChange={(event) => setDraftDifficulty(event.target.value)}>
                  <option value="BEGINNER">BEGINNER</option>
                  <option value="INTERMEDIATE">INTERMEDIATE</option>
                  <option value="ADVANCED">ADVANCED</option>
                </select>
              </div>
              <button className="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-sm font-black text-black" type="submit">Save draft</button>
            </form>

            <div className="rounded-2xl bg-white/5 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Generate challenge</p>
              <h2 className="mt-1 text-xl font-black">AI-assisted email lab draft</h2>
              <textarea className="mt-4 min-h-24 w-full resize-none rounded-xl bg-black px-4 py-3 text-sm outline-none" value={generateTheme} onChange={(event) => setGenerateTheme(event.target.value)} />
              <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-black" type="button" onClick={() => void generateDraft()}>
                <Sparkles className="h-4 w-4" />
                Generate draft
              </button>
            </div>

            <div id="organizations" className="scroll-mt-32 rounded-2xl bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black">Organizations</h2>
                  <p className="mt-1 text-xs text-white/55">Registered businesses that can be managed by platform admins.</p>
                </div>
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-4 space-y-3">
                {overview?.businesses.length ? overview.businesses.map((business) => (
                  <article key={business.id} className="rounded-xl bg-black p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-black">{business.name}</h3>
                        <p className="mt-1 text-xs text-white/55">@{business.domain}</p>
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-white/35">Registered {new Date(business.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">{business.userCount} users</span>
                        <a className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/65" href="#users">Manage users</a>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">Business admins</p>
                      {business.admins?.length ? business.admins.map((admin) => (
                        <div key={admin.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/5 px-3 py-2">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold">{admin.displayName}</p>
                            <p className="truncate text-[11px] text-white/45">{admin.email}</p>
                          </div>
                          <button className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-bold text-white/65" type="button" onClick={() => void removeBusinessAdmin(business.id, admin.id)}>
                            Remove
                          </button>
                        </div>
                      )) : <p className="text-xs text-white/45">No business admins listed.</p>}
                    </div>
                  </article>
                )) : <p className="rounded-xl bg-black p-4 text-sm text-white/60">No businesses registered yet.</p>}
              </div>

              <form className="mt-5 grid gap-3 rounded-xl bg-black p-4" onSubmit={createManagedBusinessAdmin}>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Add organization admin</p>
                <select className="rounded-xl bg-white/5 px-4 py-3 text-sm outline-none" value={businessAdminBusinessId} onChange={(event) => setBusinessAdminBusinessId(event.target.value)} required>
                  <option value="" disabled>Select organization</option>
                  {overview?.businesses.map((business) => (
                    <option key={business.id} value={business.id}>{business.name} - {business.domain}</option>
                  ))}
                </select>
                <input className="rounded-xl bg-white/5 px-4 py-3 text-sm outline-none" placeholder="Admin name" value={businessAdminName} onChange={(event) => setBusinessAdminName(event.target.value)} required />
                <input className="rounded-xl bg-white/5 px-4 py-3 text-sm outline-none" placeholder="admin@business-domain.com" type="email" value={businessAdminEmail} onChange={(event) => setBusinessAdminEmail(event.target.value)} required />
                <input className="rounded-xl bg-white/5 px-4 py-3 text-sm outline-none" placeholder="Temporary password" type="password" value={businessAdminPassword} onChange={(event) => setBusinessAdminPassword(event.target.value)} required minLength={8} />
                <button className="rounded-xl bg-primary px-4 py-3 text-sm font-black text-black disabled:opacity-50" type="submit" disabled={!overview?.businesses.length}>Create business admin</button>
              </form>
            </div>

            <section id="users" className="scroll-mt-32 rounded-2xl bg-white/5 p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">User management</p>
                <h2 className="mt-1 text-xl font-black">PhishAware internal users</h2>
                <p className="mt-1 text-xs text-white/55">This section is only for PhishAware platform users, not organization employees.</p>
              </div>

              <form className="mt-4 grid gap-3" onSubmit={createManagedUser}>
                <input className="rounded-xl bg-black px-4 py-3 text-sm outline-none" placeholder="Full name" value={userName} onChange={(event) => setUserName(event.target.value)} required />
                <input className="rounded-xl bg-black px-4 py-3 text-sm outline-none" placeholder="developer@phishaware.local" type="email" value={userEmail} onChange={(event) => setUserEmail(event.target.value)} required />
                <input className="rounded-xl bg-black px-4 py-3 text-sm outline-none" placeholder="Temporary password" type="password" value={userPassword} onChange={(event) => setUserPassword(event.target.value)} required minLength={8} />
                <button className="rounded-xl bg-primary px-4 py-3 text-sm font-black text-black" type="submit">Create internal user</button>
              </form>

              <div className="mt-5 space-y-3">
                {overview?.users.length ? overview.users.map((user) => (
                  <article key={user.id} className="rounded-xl bg-black p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-black">{user.displayName}</h3>
                        <p className="mt-1 truncate text-xs text-white/55">{user.email}</p>
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-white/35">{user.role} · {user.accountStatus} · @{user.businessDomain ?? 'no-domain'}</p>
                      </div>
                      <button
                        className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white/70 disabled:opacity-40"
                        type="button"
                        disabled={user.role === 'BUSINESS_ADMIN'}
                        onClick={() => void removeUser(user.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                )) : <p className="rounded-xl bg-black p-4 text-sm text-white/60">No users found.</p>}
              </div>
            </section>
          </div>

          <section id="release" className="scroll-mt-32 rounded-2xl bg-white/5 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Challenge release queue</p>
                <h2 className="mt-1 text-xl font-black">Draft, release, lock, or archive labs</h2>
              </div>
              <span className="rounded-full bg-black px-3 py-1 text-xs font-bold text-white/55">{overview?.challenges.length ?? 0} total</span>
            </div>

            <div className="mt-5 space-y-3">
              {overview?.challenges.map((challenge) => (
                <article key={challenge.id} className="rounded-xl bg-black p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-black">{challenge.title}</h3>
                        <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-black uppercase text-white/60">{challenge.status}</span>
                      </div>
                      <p className="mt-1 text-xs text-white/55">{challenge.type} · {challenge.difficulty} · {challenge.durationMinutes} mins</p>
                      {challenge.scheduledReleaseAt ? <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-primary">Scheduled {new Date(challenge.scheduledReleaseAt).toLocaleString()}</p> : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button className="rounded-lg bg-primary px-3 py-2 text-xs font-black text-black" type="button" onClick={() => void setChallengeStatus(challenge.id, 'AVAILABLE')}>
                        Release
                      </button>
                      <button className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white/70" type="button" onClick={() => void setChallengeStatus(challenge.id, 'DRAFT')}>
                        Unrelease
                      </button>
                      <button className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white/70" type="button" onClick={() => void setChallengeStatus(challenge.id, 'LOCKED')}>
                        Lock
                      </button>
                      <button className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white/70" type="button" onClick={() => void setChallengeStatus(challenge.id, 'ARCHIVED')}>
                        Archive
                      </button>
                      <button className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white/70" type="button" onClick={() => startEditingChallenge(challenge)}>
                        Edit
                      </button>
                      <button className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white/70" type="button" onClick={() => void removeChallenge(challenge.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                  {editingChallengeId === challenge.id ? (
                    <div className="mt-4 grid gap-3 rounded-xl bg-white/5 p-4">
                      <input className="rounded-xl bg-black px-4 py-3 text-sm outline-none" value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
                      <div className="grid gap-3 md:grid-cols-2">
                        <input className="rounded-xl bg-black px-4 py-3 text-sm outline-none" value={editType} onChange={(event) => setEditType(event.target.value)} />
                        <input className="rounded-xl bg-black px-4 py-3 text-sm outline-none" value={editDifficulty} onChange={(event) => setEditDifficulty(event.target.value)} />
                      </div>
                      <textarea className="min-h-20 resize-none rounded-xl bg-black px-4 py-3 text-sm outline-none" placeholder="Adapted context, audience, organization style" value={editContext} onChange={(event) => setEditContext(event.target.value)} />
                      <textarea className="min-h-20 resize-none rounded-xl bg-black px-4 py-3 text-sm outline-none" placeholder="Lure copy, email body, attachment story, or social engineering angle" value={editLure} onChange={(event) => setEditLure(event.target.value)} />
                      <label className="block">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/45">Schedule release</span>
                        <input className="mt-2 w-full rounded-xl bg-black px-4 py-3 text-sm outline-none" type="datetime-local" value={editSchedule} onChange={(event) => setEditSchedule(event.target.value)} />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button className="rounded-lg bg-primary px-4 py-2 text-xs font-black text-black" type="button" onClick={() => void saveChallengeEdit(challenge.id)}>
                          Save edit
                        </button>
                        <button className="rounded-lg bg-white/10 px-4 py-2 text-xs font-bold text-white/70" type="button" onClick={() => setEditingChallengeId('')}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        </section>

        <section id="activity" className="scroll-mt-32 rounded-2xl bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Activity</p>
              <h2 className="mt-1 text-xl font-black">User and assignment activity</h2>
            </div>
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              { label: 'Active users', value: metrics?.activeUsers ?? 0 },
              { label: 'Rejected users', value: metrics?.rejectedUsers ?? 0 },
              { label: 'Assignments created', value: metrics?.totalAssignments ?? 0 },
            ].map((item) => (
              <article key={item.label} className="rounded-xl bg-black p-4">
                <p className="text-2xl font-black">{item.value}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-white/45">{item.label}</p>
              </article>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            {overview?.recentAssignments.length ? overview.recentAssignments.map((assignment) => (
              <article key={assignment.id} className="rounded-xl bg-black p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-black">{assignment.challengeTitle ?? assignment.challengeId}</h3>
                    <p className="mt-1 text-xs text-white/55">Assigned to {assignment.assigneeName ?? 'organization user'}</p>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-white/35">{new Date(assignment.assignedAt).toLocaleString()}</p>
                  </div>
                  <button className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white/70" type="button" onClick={() => void removeAssignmentActivity(assignment.id)}>
                    Remove activity
                  </button>
                </div>
              </article>
            )) : <p className="rounded-xl bg-black p-4 text-sm text-white/60">No assignment activity yet.</p>}
          </div>
        </section>
        </div>
      </div>
    </main>
  );
}
