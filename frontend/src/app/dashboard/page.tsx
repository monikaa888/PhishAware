import { Award, CheckCircle2, ChevronRight, Mail, MessageCircle, MoreHorizontal, ShieldCheck, Smartphone, Target, Trophy, UserRound } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';

const recentChallenges = [
  { title: 'Amazon Login Alert', type: 'Email', time: 'Today', icon: Mail },
  { title: 'Delivery Fee SMS', type: 'SMS', time: 'Yesterday', icon: Smartphone },
  { title: 'Recruiter Direct Message', type: 'Social', time: '2 days ago', icon: MessageCircle },
];

const challenges = [
  { title: 'Credential Harvesting', meta: 'Intermediate · 15 mins', icon: ShieldCheck },
  { title: 'Bank Fraud Simulator', meta: 'Expert · 25 mins', icon: Target },
  { title: 'CEO Fraud', meta: 'Hard · 12 mins', icon: Mail },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="space-y-4">
          <div className="rounded-xl bg-white/5 p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/10">
                <UserRound className="h-9 w-9 text-white/70" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/65">Basic Information</p>
                <h1 className="mt-1 text-2xl font-bold">Alex Morgan</h1>
                <p className="text-sm text-white/65">Learner · Security Guard · Level 4</p>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-xs font-semibold uppercase tracking-widest text-white/65">
                <span>Learning progress</span>
                <span className="text-primary">72%</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-white/15">
                <div className="h-full w-[72%] rounded-full bg-primary" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Achievement', value: 'Email Analyst', icon: Trophy },
              { label: 'Completed', value: '12 challenges', icon: Award },
              { label: 'Next focus', value: 'Link inspection', icon: Target, wide: true },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className={`rounded-xl bg-white/5 p-4 ${item.wide ? 'col-span-2' : ''}`}>
                  <div className="mb-2 flex items-center gap-2 text-primary">
                    <Icon className="h-4 w-4" />
                    <span className="text-xs font-medium text-white/65">{item.label}</span>
                  </div>
                  <p className="font-semibold">{item.value}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Recently accessed</h2>
            <Link className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary" href="/challenges">
              More
              <MoreHorizontal className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {recentChallenges.map((challenge) => {
              const Icon = challenge.icon;
              return (
                <Link key={challenge.title} className="min-w-[200px] shrink-0 rounded-xl bg-white/5 p-4" href="/challenge">
                  <div className="flex items-start justify-between">
                    <Icon className="h-5 w-5 text-white/65" />
                    <span className="text-xs text-white/65">{challenge.time}</span>
                  </div>
                  <div className="mt-8">
                    <h3 className="font-bold">{challenge.title}</h3>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-white/65">{challenge.type}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Challenges</h2>
              <p className="text-sm text-white/65">Select a training environment.</p>
            </div>
            <Link className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold" href="/challenges">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {challenges.map((challenge) => {
              const Icon = challenge.icon;
              return (
                <Link key={challenge.title} className="flex items-center justify-between rounded-xl bg-white/5 p-4 active:scale-[0.98]" href="/challenge">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{challenge.title}</h3>
                      <p className="text-xs font-semibold uppercase tracking-wider text-white/65">{challenge.meta}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/65" />
                </Link>
              );
            })}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {['Guardian', 'Eagle Eye', 'Swift Resolver'].map((badge) => (
            <div key={badge} className="rounded-xl bg-white/5 p-4 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-3 font-semibold">{badge}</p>
              <p className="text-xs text-white/65">Earned badge</p>
            </div>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
