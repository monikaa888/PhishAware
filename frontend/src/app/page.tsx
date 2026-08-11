import { ArrowRight, BarChart3, Brain, Building2, CheckCircle2, Clock, Mail, Phone, Shield, Sparkles, Users } from 'lucide-react';
import Link from 'next/link';
import { PublicShell } from '@/components/marketing/public-shell';
import { SimulationPreview } from '@/components/simulation-preview';

const platformFeatures = [
  {
    icon: Brain,
    title: 'AI-generated scenarios',
    text: 'Create fresh email phishing labs for different audiences, concepts, industries, and risk levels.',
  },
  {
    icon: Shield,
    title: 'Safe interactive practice',
    text: 'Learners inspect email samples, links, attachments, and reply paths without real-world risk.',
  },
  {
    icon: BarChart3,
    title: 'Organization insight',
    text: 'Track completion, weak areas, security scores, and training impact across students, teams, and cohorts.',
  },
];

const audiences = ['Students', 'Schools', 'Universities', 'Young professionals', 'Security awareness teams', 'Organizations'];

export default function LandingPage() {
  return (
    <PublicShell>
      <section className="relative overflow-hidden px-2.5 pb-12 pt-10 md:pb-20 md:pt-16">
        <div className="absolute inset-0 -z-10 bg-background" />
        <div className="mx-auto grid max-w-[80rem] items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-2 text-primary">
              <Sparkles className="h-4 w-4" />
              <span className="font-mono text-[10px] uppercase tracking-widest">AI-powered cyber awareness lab</span>
            </div>
            <h1 className="max-w-3xl text-3xl font-black tracking-tight text-on-surface md:text-5xl">
              Learn phishing defense by practicing inside realistic email labs.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-on-surface-variant">
              PhishAware helps students, schools, and organizations build real-world judgment through safe email phishing labs.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link className="pressable inline-flex items-center justify-center gap-2 rounded-xl bg-primary-container px-6 py-4 font-bold text-on-primary-container" href="/signup">
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link className="inline-flex items-center justify-center rounded-xl border border-outline-variant bg-surface px-6 py-4 font-bold text-on-surface hover:border-primary/50" href="/platform">
                Explore Platform
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="glass-card rounded-xl p-4">
                <p className="text-xl font-black text-primary">3x</p>
                <p className="mt-1 text-xs text-on-surface-variant">Email concepts</p>
              </div>
              <div className="glass-card rounded-xl p-4">
                <p className="text-xl font-black text-tertiary">AI</p>
                <p className="mt-1 text-xs text-on-surface-variant">Adaptive scenarios</p>
              </div>
              <div className="glass-card rounded-xl p-4">
                <p className="text-xl font-black text-secondary">Safe</p>
                <p className="mt-1 text-xs text-on-surface-variant">No real attacks</p>
              </div>
            </div>
          </div>

          <SimulationPreview />
        </div>
      </section>

      <section className="border-y border-white/10 bg-surface-low px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-3">
          {audiences.map((audience) => (
            <span key={audience} className="rounded-full border border-outline-variant bg-surface px-4 py-2 text-sm font-semibold text-on-surface-variant">
              {audience}
            </span>
          ))}
        </div>
      </section>

      <section className="px-5 py-14 md:py-20" id="platform">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-widest text-primary">Platform</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight md:text-3xl">Everything needed for modern awareness training.</h2>
            <p className="mt-4 text-sm leading-7 text-on-surface-variant">
              Replace static quizzes with guided email labs, personalized feedback, and admin-ready reporting.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {platformFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="glass-card rounded-xl p-6">
                  <div className="mb-5 inline-flex rounded-xl bg-primary-container/20 p-3 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-on-surface-variant">{feature.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-surface px-5 py-14 md:py-20" id="company">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-primary">Company</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight md:text-3xl">Built for safer digital behavior.</h2>
          </div>
          <div className="space-y-5 text-sm leading-7 text-on-surface-variant">
            <p>
              PhishAware is designed for education and workforce readiness. Our mission is to help people recognize social engineering before it becomes a breach.
            </p>
            <p>
              The platform focuses on safe practice, clear feedback, and measurable improvement for learners and administrators.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-outline-variant bg-background p-4">
                <Users className="mb-3 h-5 w-5 text-primary" />
                <p className="font-bold text-on-surface">Learner-first</p>
              </div>
              <div className="rounded-xl border border-outline-variant bg-background p-4">
                <Building2 className="mb-3 h-5 w-5 text-primary" />
                <p className="font-bold text-on-surface">Organization-ready</p>
              </div>
              <div className="rounded-xl border border-outline-variant bg-background p-4">
                <CheckCircle2 className="mb-3 h-5 w-5 text-primary" />
                <p className="font-bold text-on-surface">Safety-focused</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 md:py-20" id="contact">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[1fr_0.9fr]">
          <div className="glass-card rounded-xl p-6 md:p-8">
            <p className="font-mono text-xs uppercase tracking-widest text-primary">Contact</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight">Talk to PhishAware</h2>
            <p className="mt-4 text-sm leading-7 text-on-surface-variant">
              For schools, universities, and organizations planning cybersecurity awareness programs.
            </p>
            <div className="mt-6 space-y-4">
              <a className="flex items-center gap-3 text-on-surface-variant hover:text-primary" href="mailto:hello@phishaware.example">
                <Mail className="h-5 w-5" />
                hello@phishaware.example
              </a>
              <a className="flex items-center gap-3 text-on-surface-variant hover:text-primary" href="tel:+15550140200">
                <Phone className="h-5 w-5" />
                +1 (555) 014-0200
              </a>
              <div className="flex items-center gap-3 text-on-surface-variant">
                <Clock className="h-5 w-5" />
                24 hour response for program inquiries
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-primary-container p-6 text-on-primary-container md:p-8">
            <h2 className="text-2xl font-black tracking-tight">Start with a demo path.</h2>
            <p className="mt-4 text-sm leading-7 text-on-primary-container/85">
              Try the learner dashboard and launch a sample phishing challenge from the current frontend prototype.
            </p>
            <Link className="pressable mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-4 font-bold text-black sm:w-auto" href="/signup">
              Get Started
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
