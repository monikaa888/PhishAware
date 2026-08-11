'use client';

import { Award, Bell, CheckCircle2, ChevronRight, MoreHorizontal, Target, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { getDashboard, getMyAssignments, type AuthUser, type BusinessAssignment, type DashboardSummary } from '@/lib/api';
import { challengeCatalog, getActivityStats, getRecentChallenges } from '@/lib/challenge-activity';
import { getAuthToken, getStoredUser } from '@/lib/auth';

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [assignedLabs, setAssignedLabs] = useState<BusinessAssignment[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const storedUser = getStoredUser();
    const token = getAuthToken();
    setUser(storedUser);
    getDashboard(token).then(setSummary).catch(() => setSummary(null));
    if (!token) return;
    const assignmentToken = token;

    function loadAssignments() {
      getMyAssignments(assignmentToken).then(setAssignedLabs).catch(() => setAssignedLabs([]));
    }

    loadAssignments();
    const interval = window.setInterval(loadAssignments, 5000);
    return () => window.clearInterval(interval);
  }, []);

  const activity = getActivityStats(user, summary?.streak ?? 0);
  const recentChallenges = getRecentChallenges(user);
  const displayName = user?.displayName ?? 'Learner';
  const rankName = activity.completed ? activity.rankName : summary?.rankName ?? activity.rankName;
  const level = activity.completed ? activity.level : summary?.level ?? activity.level;
  const completedChallenges = activity.completed || summary?.completedChallenges || 0;
  const securityScore = activity.completed ? activity.securityScore : summary?.securityScore ?? activity.securityScore;
  const progress = activity.progress || (summary ? Math.min(100, Math.round((summary.xp / summary.nextLevelXp) * 100)) : 0);
  const nextChallenge = activity.nextChallenge;
  const NextChallengeIcon = nextChallenge.icon;
  const assignedChallengeIds = new Set(assignedLabs.map((assignment) => assignment.challengeId));
  const generalChallenges = challengeCatalog.filter((challenge) => !assignedChallengeIds.has(challenge.id));

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="relative flex justify-end">
          <button
            className="relative inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/15"
            type="button"
            onClick={() => setNotificationsOpen((value) => !value)}
          >
            <Bell className="h-4 w-4 text-primary" />
            Notifications
            {assignedLabs.length ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-black text-white">
                {assignedLabs.length}
              </span>
            ) : null}
          </button>

          {notificationsOpen ? (
            <div className="absolute right-0 top-12 z-20 w-full max-w-sm rounded-2xl bg-black p-3 shadow-2xl ring-1 ring-white/10">
              <div className="flex items-center justify-between px-1 pb-3">
                <p className="text-xs font-bold uppercase tracking-widest text-white/45">Assigned lab notifications</p>
                <span className="text-xs font-bold text-primary">{assignedLabs.length}</span>
              </div>
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {assignedLabs.length ? assignedLabs.map((assignment) => (
                  <Link
                    key={assignment.id}
                    className="block rounded-xl bg-white/5 p-3 transition hover:bg-white/10"
                    href={`/challenges/${assignment.challengeId}`}
                    onClick={() => setNotificationsOpen(false)}
                  >
                    <p className="truncate text-sm font-bold">{assignment.challengeTitle}</p>
                    <p className="mt-1 text-xs text-white/55">Assigned to {assignment.assigneeName}</p>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-primary">{new Date(assignment.assignedAt).toLocaleString()}</p>
                  </Link>
                )) : (
                  <p className="rounded-xl bg-white/5 p-4 text-sm text-white/60">No assigned lab notifications yet.</p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-xl bg-white/5 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <UserRound className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/55">Learner overview</p>
                <h1 className="mt-1 truncate text-xl font-bold sm:text-2xl">{displayName}</h1>
                <p className="mt-1 break-words text-xs text-white/60">{user?.email ?? 'Security awareness learner'}</p>
                {user?.organization ? <p className="mt-1 text-xs text-white/50">{user.organization}</p> : null}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Rank', value: rankName, accent: 'text-primary' },
                { label: 'Level', value: String(level), accent: 'text-secondary' },
                { label: 'Score', value: `${securityScore}%`, accent: 'text-primary' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-black p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-white/45">{item.label}</p>
                  <p className={`mt-1 text-sm font-bold ${item.accent}`}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <div className="mb-2 flex justify-between text-[11px] font-semibold uppercase tracking-widest text-white/55">
                <span>Challenge progress</span>
                <span className="text-primary">{completedChallenges}/{activity.total} solved</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, progress - 8)}%` }} />
                <div className="-mt-2 h-full rounded-full bg-secondary" style={{ width: `${progress}%`, opacity: 0.28 }} />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white/5 p-4 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/55">Next recommended</p>
            <div className="mt-4 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <NextChallengeIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold">{nextChallenge.title}</h2>
                <p className="mt-1 text-xs leading-5 text-white/60">{nextChallenge.type} · {nextChallenge.category} · {nextChallenge.duration}</p>
              </div>
            </div>
            <Link className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold text-white shadow-[0_3px_0_#F59E0B]" href={`/challenges/${nextChallenge.id}`}>
              Continue training
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {assignedLabs.length ? (
          <section className="rounded-xl bg-primary/10 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-primary">
                  <Bell className="h-4 w-4" />
                  Assigned lab notifications
                </p>
                <h2 className="mt-2 text-base font-bold sm:text-lg">Your organization assigned new email security labs</h2>
                <p className="mt-1 text-xs leading-5 text-white/60">Open each lab from your challenge list and complete the review checks after the interaction.</p>
              </div>
              <Link className="rounded-full bg-black px-4 py-2 text-xs font-bold text-white" href="/challenges">View assigned labs</Link>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {assignedLabs.slice(0, 3).map((assignment) => (
                <Link key={assignment.id} className="rounded-xl bg-black p-3 transition hover:bg-white/10" href={`/challenges/${assignment.challengeId}`}>
                  <p className="truncate text-sm font-bold">{assignment.challengeTitle}</p>
                  <p className="mt-1 text-xs text-white/55">{assignment.assigneeName}</p>
                  <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-primary">
                    {new Date(assignment.assignedAt).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Completed', value: `${completedChallenges}`, detail: 'Solved challenges', icon: CheckCircle2, accent: 'text-primary' },
            { label: assignedLabs.length ? 'Assigned' : 'Available', value: `${assignedLabs.length || challengeCatalog.length - activity.solvedIds.length}`, detail: assignedLabs.length ? 'Organization labs' : 'Open email labs', icon: Target, accent: 'text-secondary' },
            { label: 'Badges', value: `${activity.earnedBadges.length}`, detail: 'Unlocked achievements', icon: Award, accent: 'text-secondary' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-xl bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <Icon className={`h-5 w-5 ${item.accent}`} />
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-white/45">{item.label}</span>
                </div>
                <p className={`mt-4 text-2xl font-black ${item.accent}`}>{item.value}</p>
                <p className="mt-1 text-xs text-white/55">{item.detail}</p>
              </div>
            );
          })}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold sm:text-lg">Recently accessed challenges</h2>
            <Link className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary" href="/challenges">
              More
              <MoreHorizontal className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {recentChallenges.map((challenge) => {
              const Icon = challenge.icon;
              const solved = activity.solvedIds.includes(challenge.id);
              return (
                <Link key={challenge.id} className="rounded-xl bg-white/5 p-4 transition hover:bg-white/10" href={`/challenges/${challenge.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xs text-white/55">{challenge.time}</span>
                  </div>
                  <h3 className="mt-4 text-sm font-bold">{challenge.title}</h3>
                  <p className="mt-1 text-xs text-white/55">{challenge.type} · {challenge.category}</p>
                  <span className={`mt-3 inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase ${solved ? 'bg-primary/15 text-primary' : 'bg-secondary/15 text-secondary'}`}>
                    {solved ? 'Solved' : 'In progress'}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold sm:text-lg">Awareness path</h2>
            <Link className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold" href="/challenges">View all</Link>
          </div>

          {assignedLabs.length ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Organizational challenges</h3>
                  <p className="mt-1 text-xs text-white/55">Assigned by your business or organization.</p>
                </div>
                <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">{assignedLabs.length} assigned</span>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {assignedLabs.map((assignment) => {
                  const challenge = challengeCatalog.find((item) => item.id === assignment.challengeId);
                  if (!challenge) return null;
                  const Icon = challenge.icon;
                  const solved = activity.solvedIds.includes(challenge.id);
                  return (
                    <Link key={assignment.id} className="flex items-center justify-between rounded-xl bg-primary/10 p-3 transition hover:bg-primary/15 sm:p-4" href={`/challenges/${challenge.id}`}>
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold">{challenge.title}</h3>
                          <p className="truncate text-xs text-white/55">{challenge.difficulty} · {challenge.category} · {assignment.assigneeName}</p>
                        </div>
                      </div>
                      {solved ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <ChevronRight className="h-5 w-5 text-secondary" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between pt-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/55">General challenges</h3>
            <span className="text-xs text-white/45">{generalChallenges.length} available</span>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {generalChallenges.map((challenge) => {
              const Icon = challenge.icon;
              const solved = activity.solvedIds.includes(challenge.id);
              return (
                <Link key={challenge.id} className="flex items-center justify-between rounded-xl bg-white/5 p-3 transition hover:bg-white/10 sm:p-4" href={`/challenges/${challenge.id}`}>
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold">{challenge.title}</h3>
                      <p className="truncate text-xs text-white/55">{challenge.difficulty} · {challenge.category}</p>
                    </div>
                  </div>
                  {solved ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <ChevronRight className="h-5 w-5 text-secondary" />}
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
