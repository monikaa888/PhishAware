'use client';

import { BriefcaseBusiness, CheckCircle2, Globe2, Mail, ShieldCheck, Target, UserRound, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { getBusinessDashboard, getDashboard, type AuthUser, type BusinessDashboard, type DashboardSummary } from '@/lib/api';
import { badgeCatalog, challengeCatalog, getActivityStats } from '@/lib/challenge-activity';
import { getAuthToken, getStoredUser } from '@/lib/auth';

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [businessDashboard, setBusinessDashboard] = useState<BusinessDashboard | null>(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    const token = getAuthToken();
    setUser(storedUser);
    if (storedUser?.role === 'BUSINESS_ADMIN' && token) {
      getBusinessDashboard(token).then(setBusinessDashboard).catch(() => setBusinessDashboard(null));
      return;
    }
    getDashboard(token).then(setSummary).catch(() => setSummary(null));
  }, []);

  if (user?.role === 'BUSINESS_ADMIN') {
    const business = businessDashboard?.business;
    const pendingUsers = businessDashboard?.pendingUsers ?? [];
    const approvedUsers = businessDashboard?.approvedUsers ?? [];
    const rejectedUsers = businessDashboard?.rejectedUsers ?? [];

    return (
      <AppShell>
        <div className="mx-auto max-w-6xl space-y-5">
          <section className="rounded-2xl bg-white/5 p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <BriefcaseBusiness className="h-10 w-10" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-primary">Business profile</p>
                  <h1 className="mt-1 text-3xl font-black">{business?.name ?? user.organization ?? 'Business account'}</h1>
                  <p className="mt-2 text-sm text-white/60">Training administration profile for this company domain.</p>
                </div>
              </div>
              <Link className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/75" href="/settings">
                Business settings
              </Link>
            </div>
          </section>

          <section className="grid gap-3 md:grid-cols-3">
            {[
              { label: 'Domain name', value: business?.domain ?? user.businessDomain ?? '-', icon: Globe2 },
              { label: 'Admin email', value: business?.adminEmail ?? user.email, icon: Mail },
              { label: 'Business admin', value: user.displayName, icon: ShieldCheck },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-2xl bg-white/5 p-4">
                  <Icon className="h-5 w-5 text-primary" />
                  <p className="mt-4 text-xs font-bold uppercase tracking-widest text-white/45">{item.label}</p>
                  <p className="mt-2 break-words text-lg font-black">{item.value}</p>
                </div>
              );
            })}
          </section>

          <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black">Employee access</h2>
                  <p className="mt-1 text-sm text-white/60">Current access status for company users.</p>
                </div>
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-5 grid gap-3">
                {[
                  { label: 'Approved employees', value: approvedUsers.length },
                  { label: 'Pending requests', value: pendingUsers.length },
                  { label: 'Rejected requests', value: rejectedUsers.length },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl bg-black p-4">
                    <span className="text-sm text-white/65">{item.label}</span>
                    <span className="text-xl font-black text-primary">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white/5 p-5">
              <h2 className="text-xl font-black">Business identity</h2>
              <p className="mt-2 text-sm leading-6 text-white/60">
                Employees signing up with @{business?.domain ?? user.businessDomain ?? 'your-domain.com'} are routed into the approval queue before they can access awareness training.
              </p>
              <div className="mt-5 rounded-xl bg-black p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-white/45">Private login credential</p>
                <p className="mt-2 break-words text-sm font-semibold">{user.email}</p>
              </div>
            </div>
          </section>
        </div>
      </AppShell>
    );
  }

  const activity = getActivityStats(user, summary?.streak ?? 0);
  const displayName = user?.displayName ?? 'Learner';
  const level = activity.completed ? activity.level : summary?.level ?? activity.level;
  const rankName = activity.completed ? activity.rankName : summary?.rankName ?? activity.rankName;
  const completedChallenges = activity.completed || summary?.completedChallenges || 0;
  const securityScore = activity.completed ? activity.securityScore : summary?.securityScore ?? activity.securityScore;
  const progress = activity.progress || (summary ? Math.min(100, Math.round((summary.xp / summary.nextLevelXp) * 100)) : 0);
  const solvedChallenges = challengeCatalog.filter((challenge) => activity.solvedIds.includes(challenge.id));
  const openChallenges = challengeCatalog.filter((challenge) => !activity.solvedIds.includes(challenge.id));

  function badgeTone(tone: string, earned: boolean) {
    if (!earned) return 'bg-white/10 text-white/45';
    if (tone === 'amber') return 'bg-secondary/15 text-secondary';
    if (tone === 'white') return 'bg-white text-black';
    return 'bg-primary/15 text-primary';
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-xl bg-white/5 p-5">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <UserRound className="h-12 w-12" />
                </div>
                <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-black text-black">{level}</div>
              </div>
              <p className="mt-5 text-[11px] font-semibold uppercase tracking-widest text-primary">Learner profile</p>
              <h1 className="mt-1 max-w-full break-words text-2xl font-bold">{displayName}</h1>
              <p className="mt-2 max-w-full break-words text-sm text-white/60">{user?.email ?? 'Security awareness learner'}</p>
              {user?.organization ? <p className="mt-1 text-sm text-white/50">{user.organization}</p> : null}
              <Link className="mt-5 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/75" href="/settings">
                Edit profile
              </Link>
            </div>
          </div>

          <div className="rounded-xl bg-white/5 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/55">Current standing</p>
                <h2 className="mt-1 text-xl font-bold">{rankName}</h2>
                <p className="mt-2 text-sm leading-6 text-white/60">Progress is based on solved email labs and completed review checks for this logged-in account.</p>
              </div>
              <div className="rounded-xl bg-black p-4 text-center">
                <p className="text-2xl font-black">{securityScore}%</p>
                <p className="text-xs text-white/55">Awareness score</p>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex justify-between text-[11px] font-semibold uppercase tracking-widest text-white/55">
                <span>Profile completion</span>
                <span className="text-primary">{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Completed', value: completedChallenges },
                { label: 'Streak', value: `${activity.streak} day${activity.streak === 1 ? '' : 's'}` },
                { label: 'Badges', value: activity.earnedBadges.length },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-black p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-white/45">{item.label}</p>
                  <p className="mt-1 text-lg font-black">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold sm:text-lg">Badges</h2>
            <span className="text-xs text-white/55">{activity.earnedBadges.length}/{badgeCatalog.length} unlocked</span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {badgeCatalog.map((badge) => {
              const Icon = badge.icon;
              const earned = activity.earnedBadges.some((item) => item.title === badge.title);
              return (
                <div key={badge.title} className={`rounded-xl p-4 text-center ${earned ? 'bg-white/5' : 'bg-white/[0.03] opacity-60'}`}>
                  <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${badgeTone(badge.tone, earned)}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-sm font-semibold">{badge.title}</p>
                  <p className="mt-1 text-xs text-white/55">{badge.subtitle}</p>
                  <p className={`mt-2 text-[10px] font-black uppercase tracking-widest ${earned ? 'text-primary' : 'text-white/35'}`}>
                    {earned ? 'Unlocked' : badge.kind === 'streak' ? `${badge.threshold} day streak` : `${badge.threshold} solved`}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl bg-white/5 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold sm:text-lg">Solved challenges</h2>
              <p className="mt-1 text-sm text-white/55">Completed challenges for this specific user.</p>
            </div>
            <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">{solvedChallenges.length} solved</span>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {solvedChallenges.length ? (
              solvedChallenges.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.id} className="flex items-center gap-3 rounded-xl bg-black p-3 transition hover:bg-white/10" href={`/challenges/${item.id}`}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="truncate text-sm font-semibold">{item.title}</h3>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-2 py-1 text-[10px] font-bold uppercase text-primary">
                          <CheckCircle2 className="h-3 w-3" />
                          Solved
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-white/55">{item.type} · {item.category} · {item.difficulty}</p>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-xl bg-black p-4 text-sm leading-6 text-white/60 lg:col-span-2">
                No solved challenges yet. Complete your first challenge to unlock the First Signal badge.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-xl bg-white/5 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold sm:text-lg">Open challenge progress</h2>
              <p className="mt-1 text-sm text-white/55">Continue remaining challenges to unlock more badges.</p>
            </div>
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {(openChallenges.length ? openChallenges : challengeCatalog).map((item) => {
              const Icon = item.icon;
              const solved = activity.solvedIds.includes(item.id);
              return (
                <Link key={item.id} className="flex items-center gap-3 rounded-xl bg-black p-3 transition hover:bg-white/10" href={`/challenges/${item.id}`}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="truncate text-sm font-semibold">{item.title}</h3>
                      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase ${solved ? 'bg-primary/15 text-primary' : 'bg-white/10 text-white/55'}`}>
                        {solved ? <CheckCircle2 className="h-3 w-3" /> : null}
                        {solved ? 'Solved' : 'Open'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-white/55">{item.type} · {item.category} · {item.difficulty}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
