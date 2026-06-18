import { AlertTriangle, ArrowRight, BarChart3, CheckCircle2, ClipboardList, FileText, ShieldCheck, Sparkles, Users } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';

const reviewQueue = [
  { title: 'Payroll Update Notice', type: 'Email phishing', status: 'Needs review', risk: 'Medium' },
  { title: 'Campus Wi-Fi QR Poster', type: 'QR phishing', status: 'Draft', risk: 'High' },
  { title: 'Recruiter Verification Chat', type: 'Social engineering', status: 'Ready', risk: 'Low' },
];

const cohorts = [
  { name: 'New employees', completion: 68, risk: 'Moderate' },
  { name: 'Student pilot', completion: 82, risk: 'Low' },
  { name: 'Finance team', completion: 54, risk: 'Elevated' },
];

export default function AdminPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/65">Admin Console</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Program command center</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">
              Review scenario content, monitor cohort risk, and prepare assignments for learners.
            </p>
          </div>

          <div className="rounded-xl bg-white/5 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/10">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/65">Generation queue</p>
                  <h2 className="mt-1 text-2xl font-bold">9 open reviews</h2>
                  <p className="text-sm text-white/65">4 reports ready for export</p>
                </div>
              </div>
              <button className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-black active:scale-[0.98]" type="button">
                <Sparkles className="h-4 w-4" />
                Generate scenario
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: 'Awareness score', value: '78%', icon: ShieldCheck },
              { label: 'Active learners', value: '1,248', icon: Users },
              { label: 'Open reviews', value: '9', icon: ClipboardList },
              { label: 'Reports ready', value: '4', icon: FileText },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-xl bg-white/5 p-4">
                  <div className="mb-2 flex items-center gap-2 text-primary">
                    <Icon className="h-4 w-4" />
                    <span className="text-xs font-medium text-white/65">{item.label}</span>
                  </div>
                  <p className="text-2xl font-bold">{item.value}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Scenario review queue</h2>
                <p className="mt-1 text-sm text-white/65">Approve, edit, or return generated simulations before publishing.</p>
              </div>
              <Link className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold" href="/challenges">View catalog</Link>
            </div>
            <div className="space-y-3">
              {reviewQueue.map((item) => (
                <article key={item.title} className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/10">
                      <ClipboardList className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold">{item.title}</h3>
                      <p className="text-xs font-semibold uppercase tracking-wider text-white/65">{item.type}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="hidden rounded-full bg-white/10 px-3 py-1 text-xs text-white/65 sm:inline-flex">{item.risk}</span>
                    <span className="hidden rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary sm:inline-flex">{item.status}</span>
                    <button className="rounded-lg bg-white/10 p-2 text-white/65" type="button" aria-label={`Open ${item.title}`}>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Cohort risk</h2>
                <p className="mt-1 text-sm text-white/65">Completion and risk by group.</p>
              </div>
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-5 space-y-4">
              {cohorts.map((cohort) => (
                <div key={cohort.name}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold">{cohort.name}</span>
                    <span className="text-white/65">{cohort.completion}% complete</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${cohort.completion}%` }} />
                  </div>
                  <p className="mt-2 inline-flex items-center gap-2 text-xs text-white/65">
                    {cohort.risk === 'Elevated' ? <AlertTriangle className="h-3.5 w-3.5 text-tertiary" /> : <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                    {cohort.risk} risk
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
