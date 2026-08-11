'use client';

import { ArrowRight, CheckCircle2, Clock, Filter, Mail, ShieldCheck, Target } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { getMyAssignments, type AuthUser, type BusinessAssignment } from '@/lib/api';
import { challengeCatalog, getRecentChallenges } from '@/lib/challenge-activity';
import { getAuthToken, getStoredUser } from '@/lib/auth';
import { getSolvedChallengeIds } from '@/lib/challenge-progress';

export default function ChallengesPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [solvedIds, setSolvedIds] = useState<string[]>([]);
  const [assignedLabs, setAssignedLabs] = useState<BusinessAssignment[]>([]);

  useEffect(() => {
    const storedUser = getStoredUser();
    const token = getAuthToken();
    setUser(storedUser);
    setSolvedIds(getSolvedChallengeIds(storedUser));
    if (!token) return;
    const assignmentToken = token;

    function loadAssignments() {
      getMyAssignments(assignmentToken).then(setAssignedLabs).catch(() => setAssignedLabs([]));
    }

    loadAssignments();
    const interval = window.setInterval(loadAssignments, 5000);
    return () => window.clearInterval(interval);
  }, []);

  const recent = getRecentChallenges(user).slice(0, 3);
  const assignedChallengeIds = new Set(assignedLabs.map((assignment) => assignment.challengeId));
  const assignedChallenges = challengeCatalog.filter((challenge) => assignedChallengeIds.has(challenge.id));
  const visibleChallenges = assignedChallenges.length ? assignedChallenges : challengeCatalog;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="overflow-hidden rounded-2xl bg-white/5">
          <div className="grid gap-5 p-5 lg:grid-cols-[1fr_340px] lg:p-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">Email security labs</p>
              <h1 className="mt-2 text-2xl font-black tracking-tight md:text-4xl">Choose a challenge</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">
                Pick a lab, open its dedicated page, study the brief, then start the email challenge from that page.
                This list is only for selection and progress tracking.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {['Phishing anatomy', 'Sender analysis', 'URL inspection', 'Reporting workflow'].map((item) => (
                  <span key={item} className="rounded-full bg-black px-3 py-1.5 text-xs font-semibold text-white/70">{item}</span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-black p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-white/45">Lab status</span>
                <Filter className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { label: assignedChallenges.length ? 'Assigned' : 'Labs', value: assignedChallenges.length || challengeCatalog.length },
                  { label: 'Solved', value: solvedIds.length },
                  { label: 'Open', value: Math.max(0, (assignedChallenges.length || challengeCatalog.length) - solvedIds.length) },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-white/5 p-3 text-center">
                    <p className="text-xl font-black text-primary">{item.value}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase text-white/45">{item.label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-5 text-white/55">Inspired by lab platforms: compact list, visible difficulty, clear completion state, and one dedicated page per challenge.</p>
            </div>
          </div>
        </section>

        {assignedLabs.length ? (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-white/55">Assigned to you</h2>
              <span className="text-xs text-white/45">{assignedLabs.length} notification{assignedLabs.length === 1 ? '' : 's'}</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {assignedLabs.map((assignment) => {
                const challenge = challengeCatalog.find((item) => item.id === assignment.challengeId);
                if (!challenge) return null;
                const Icon = challenge.icon;
                const solved = solvedIds.includes(challenge.id);
                return (
                  <Link key={assignment.id} className="rounded-2xl bg-primary/10 p-4 transition hover:bg-primary/15" href={`/challenges/${challenge.id}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${solved ? 'bg-primary/20 text-primary' : 'bg-black text-white/65'}`}>
                        {solved ? 'Solved' : 'Assigned'}
                      </span>
                    </div>
                    <h3 className="mt-4 text-sm font-bold">{challenge.title}</h3>
                    <p className="mt-1 text-xs text-white/55">{challenge.difficulty} · {challenge.category}</p>
                    <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-primary">
                      Assigned {new Date(assignment.assignedAt).toLocaleDateString()}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/55">Recently accessed</h2>
            <span className="text-xs text-white/45">Last 3</span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {recent.map((challenge) => {
              const Icon = challenge.icon;
              const solved = solvedIds.includes(challenge.id);
              return (
                <Link key={challenge.id} className="group rounded-2xl bg-white/5 p-4 transition hover:bg-white/10" href={`/challenges/${challenge.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xs text-white/55">{challenge.time}</span>
                  </div>
                  <h3 className="mt-4 text-sm font-bold">{challenge.title}</h3>
                  <p className="mt-1 text-xs text-white/55">{challenge.difficulty} · {challenge.category}</p>
                  <span className={`mt-3 inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase ${solved ? 'bg-primary/15 text-primary' : 'bg-secondary/15 text-secondary'}`}>
                    {solved ? 'Solved' : 'Open lab'}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/55">{assignedChallenges.length ? 'Assigned challenges' : 'All challenges'}</h2>
            <span className="text-xs text-white/45">Open details to start</span>
          </div>
          <div className="overflow-hidden rounded-2xl bg-white/5">
            <div className="hidden grid-cols-[1.2fr_0.7fr_0.5fr_0.5fr_48px] gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-white/40 lg:grid">
              <span>Challenge</span>
              <span>Focus</span>
              <span>Level</span>
              <span>Time</span>
              <span />
            </div>
            {visibleChallenges.map((challenge) => {
              const Icon = challenge.icon;
              const solved = solvedIds.includes(challenge.id);
              const assigned = assignedChallengeIds.has(challenge.id);
              return (
                <Link key={challenge.id} className="grid gap-3 border-t border-white/5 p-4 transition hover:bg-white/10 lg:grid-cols-[1.2fr_0.7fr_0.5fr_0.5fr_48px] lg:items-center" href={`/challenges/${challenge.id}`}>
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-bold">{challenge.title}</h3>
                        {solved ? <span className="rounded-full bg-primary/15 px-2 py-1 text-[10px] font-black uppercase text-primary">Solved</span> : null}
                        {assigned && !solved ? <span className="rounded-full bg-secondary/15 px-2 py-1 text-[10px] font-black uppercase text-secondary">Assigned</span> : null}
                      </div>
                      <p className="mt-1 truncate text-xs text-white/55">Dedicated page with briefing, anatomy, reporting, and solve checks</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-2 text-xs font-semibold text-white/60">
                    <ShieldCheck className="h-4 w-4 text-secondary" />
                    {challenge.category}
                  </span>
                  <span className="inline-flex w-fit items-center rounded-full bg-black px-2.5 py-1 text-xs font-bold text-white/65">{challenge.difficulty}</span>
                  <span className="flex items-center gap-2 text-xs text-white/55">
                    <Clock className="h-4 w-4" />
                    {challenge.duration}
                  </span>
                  <span className="flex justify-end">
                    {solved ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <ArrowRight className="h-5 w-5 text-secondary" />}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
