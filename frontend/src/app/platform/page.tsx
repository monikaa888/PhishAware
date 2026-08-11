import { BarChart3, Brain, CheckCircle2, FileText, Link2, Mail, Shield } from 'lucide-react';
import Link from 'next/link';
import { PublicShell } from '@/components/marketing/public-shell';
import { SimulationPreview } from '@/components/simulation-preview';

const modules = [
  { icon: Mail, title: 'Email inbox labs', text: 'Realistic webmail exercises for sender checks, reply paths, headers, and report flows.' },
  { icon: Link2, title: 'Domain and URL labs', text: 'Homograph domains, subdomain tricks, lookalike text, and destination analysis.' },
  { icon: FileText, title: 'Attachment labs', text: 'Invoice, document-share, payroll, and vendor-change attachment scenarios.' },
  { icon: Brain, title: 'GPT-assisted generation', text: 'Admins can draft email samples by audience, difficulty, concept, industry, and objective.' },
  { icon: BarChart3, title: 'Analytics', text: 'Awareness scores, completion rates, weak areas, and cohort risk trends.' },
  { icon: Shield, title: 'Guided reviews', text: 'Each lab explains anatomy, manipulation, indicators, and mitigation after interaction.' },
];

export default function PlatformPage() {
  return (
    <PublicShell>
      <section className="px-5 py-12 md:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-primary">Platform</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">A realistic cyber awareness lab for everyday users.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-on-surface-variant">
              PhishAware turns awareness into practice with email labs, adaptive recommendations, and admin-ready reporting.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link className="pressable rounded-xl bg-primary-container px-6 py-4 text-center font-bold text-on-primary-container" href="/signup">
                Get Started
              </Link>
              <Link className="rounded-xl border border-outline-variant bg-surface px-6 py-4 text-center font-bold hover:border-primary/50" href="/contact">
                Contact Sales
              </Link>
            </div>
          </div>
          <SimulationPreview />
        </div>
      </section>
      <section className="bg-surface px-5 py-14">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <article key={module.title} className="rounded-xl border border-outline-variant bg-background p-5">
                <Icon className="h-7 w-7 text-primary" />
                <h2 className="mt-4 text-xl font-bold">{module.title}</h2>
                <p className="mt-3 leading-7 text-on-surface-variant">{module.text}</p>
              </article>
            );
          })}
        </div>
      </section>
      <section className="px-5 py-14">
        <div className="mx-auto max-w-6xl rounded-xl bg-primary-container p-6 text-on-primary-container md:p-8">
          <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
            <div>
              <Shield className="h-8 w-8" />
              <h2 className="mt-4 text-3xl font-black">Designed for safe simulation only.</h2>
            </div>
            <div className="space-y-3 text-on-primary-container/85">
              {['Synthetic credentials only', 'Reserved training domains', 'Human review before publishing', 'Clear learner feedback'].map((item) => (
                <p key={item} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
