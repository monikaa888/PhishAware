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
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-primary">Admin Console</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Program command center</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
              Review scenario content, monitor cohort risk, and prepare assignments for learners.
            </p>
          </div>
          <button className="pressable inline-flex items-center justify-center gap-2 rounded-lg bg-primary-container px-4 py-3 text-sm font-bold text-on-primary-container" type="button">
            <Sparkles className="h-4 w-4" />
            Generate scenario
          </button>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Awareness score', value: '78%', icon: ShieldCheck },
            { label: 'Active learners', value: '1,248', icon: Users },
            { label: 'Open reviews', value: '9', icon: ClipboardList },
            { label: 'Reports ready', value: '4', icon: FileText },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-lg border border-outline-variant bg-surface p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-on-surface-variant">{item.label}</p>
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-3 text-3xl font-bold">{item.value}</p>
              </div>
            );
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-outline-variant bg-surface p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Scenario review queue</h2>
                <p className="mt-1 text-sm text-on-surface-variant">Approve, edit, or return generated simulations before publishing.</p>
              </div>
              <Link className="text-sm font-bold text-primary" href="/challenges">View catalog</Link>
            </div>
            <div className="mt-5 space-y-3">
              {reviewQueue.map((item) => (
                <article key={item.title} className="rounded-lg border border-outline-variant bg-background p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-bold">{item.title}</h3>
                      <p className="mt-1 text-sm text-on-surface-variant">{item.type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-outline-variant px-3 py-1 text-xs text-on-surface-variant">{item.risk}</span>
                      <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{item.status}</span>
                      <button className="rounded-lg bg-surface-highest p-2 text-on-surface-variant" type="button" aria-label={`Open ${item.title}`}>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-outline-variant bg-surface p-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Cohort risk</h2>
            </div>
            <div className="mt-5 space-y-4">
              {cohorts.map((cohort) => (
                <div key={cohort.name}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold">{cohort.name}</span>
                    <span className="text-on-surface-variant">{cohort.completion}% complete</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-highest">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${cohort.completion}%` }} />
                  </div>
                  <p className="mt-2 inline-flex items-center gap-2 text-xs text-on-surface-variant">
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
