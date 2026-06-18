import { Award, CheckCircle2, Eye, Mail, ShieldCheck, Smartphone, Target, Terminal, UserRound, Zap } from 'lucide-react';
import { AppShell } from '@/components/app-shell';

export default function ProfilePage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="relative overflow-hidden rounded-xl bg-white/5 p-6">
          <div className="absolute left-0 top-0 h-full w-1 bg-primary" />
          <div className="flex flex-col items-center gap-6 md:flex-row md:text-left">
            <div className="relative">
              <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-white/10 md:h-40 md:w-40">
                <UserRound className="h-16 w-16 text-white/65" />
              </div>
              <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-black">4</div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">Basic Information</span>
              <h1 className="mt-2 text-4xl font-bold">Alex Morgan</h1>
              <p className="mt-2 text-white/65">Learner · Security Guard · Level 4</p>
              <div className="mx-auto mt-6 max-w-md md:mx-0">
                <div className="mb-2 flex justify-between text-xs text-white/65">
                  <span>Learning progress</span>
                  <span className="text-white">72%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full w-[72%] bg-primary" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          {[
            { label: 'Completed', value: '12 challenges', detail: 'Active streak: 5 days', icon: CheckCircle2 },
            { label: 'Achievement', value: 'Email Analyst', detail: 'Ranked: Top 15%', icon: Award },
            { label: 'Next focus', value: 'Link inspection', detail: 'Estimated: 15 mins', icon: Target },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-xl bg-white/5 p-5">
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-white/65">{item.label}</span>
                </div>
                <p className="text-xl font-bold">{item.value}</p>
                <p className="mt-1 text-xs text-white/65">{item.detail}</p>
              </div>
            );
          })}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Earned Badges</h2>
            <button className="text-sm font-semibold text-primary" type="button">View all</button>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { title: 'Guardian', subtitle: 'Phishing Shield', icon: ShieldCheck },
              { title: 'Eagle Eye', subtitle: 'URL Expert', icon: Eye },
              { title: 'Swift Resolver', subtitle: 'Rapid Analysis', icon: Zap },
              { title: 'Code Breaker', subtitle: 'Script Scanner', icon: Terminal },
            ].map((badge) => {
              const Icon = badge.icon;
              return (
                <div key={badge.title} className="rounded-xl bg-white/5 p-5 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
                    <Icon className="h-9 w-9 text-primary" />
                  </div>
                  <p className="mt-4 font-semibold">{badge.title}</p>
                  <p className="text-xs text-white/65">{badge.subtitle}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl bg-white/5 p-5">
          <h2 className="text-xl font-bold">Recently accessed challenges</h2>
          <div className="mt-4 space-y-3">
            {[
              { title: 'Amazon Login Alert', meta: 'Email · High Severity', time: 'Today', icon: Mail },
              { title: 'Delivery Fee SMS', meta: 'SMS · Medium Severity', time: 'Yesterday', icon: Smartphone },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-center gap-4 rounded-lg bg-white/5 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-semibold">{item.title}</h3>
                      <span className="text-xs uppercase text-white/65">{item.time}</span>
                    </div>
                    <p className="text-sm text-white/65">{item.meta}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
