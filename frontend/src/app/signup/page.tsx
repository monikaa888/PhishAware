import { ArrowRight, Building2, Mail, UserRound } from 'lucide-react';
import Link from 'next/link';
import { PublicShell } from '@/components/marketing/public-shell';

export default function SignUpPage() {
  return (
    <PublicShell>
      <section className="px-5 py-12 md:py-20">
        <div className="mx-auto grid max-w-5xl items-center gap-8 md:grid-cols-[1fr_1fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-primary">Create account</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Start practicing safe cyber decisions.</h1>
            <p className="mt-4 leading-8 text-on-surface-variant">
              Create a learner account for personal practice or join an organization using your school or work email.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="glass-card rounded-xl p-4">
                <p className="font-bold text-primary">Personal</p>
                <p className="mt-2 text-sm text-on-surface-variant">Learn with self-paced simulations and gamified progress.</p>
              </div>
              <div className="glass-card rounded-xl p-4">
                <p className="font-bold text-tertiary">Organization</p>
                <p className="mt-2 text-sm text-on-surface-variant">Join a school, university, or company awareness program.</p>
              </div>
            </div>
          </div>
          <form className="glass-card rounded-xl p-6 md:p-8">
            <h2 className="text-2xl font-bold">Sign Up</h2>
            <label className="mt-6 block">
              <span className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">Full name</span>
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-outline-variant bg-background px-4 py-3">
                <UserRound className="h-5 w-5 text-primary" />
                <input className="w-full bg-transparent outline-none" placeholder="Alex Morgan" type="text" />
              </div>
            </label>
            <label className="mt-4 block">
              <span className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">Email</span>
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-outline-variant bg-background px-4 py-3">
                <Mail className="h-5 w-5 text-primary" />
                <input className="w-full bg-transparent outline-none" placeholder="you@school.edu" type="email" />
              </div>
            </label>
            <label className="mt-4 block">
              <span className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">Organization optional</span>
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-outline-variant bg-background px-4 py-3">
                <Building2 className="h-5 w-5 text-primary" />
                <input className="w-full bg-transparent outline-none" placeholder="School or company name" type="text" />
              </div>
            </label>
            <label className="mt-4 block">
              <span className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">Password</span>
              <input className="mt-2 w-full rounded-xl border border-outline-variant bg-background px-4 py-3 outline-none" placeholder="Create a password" type="password" />
            </label>
            <Link className="pressable mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-container py-4 font-bold text-on-primary-container" href="/dashboard">
              Create Account
              <ArrowRight className="h-5 w-5" />
            </Link>
            <p className="mt-5 text-center text-sm text-on-surface-variant">
              Already have an account? <Link className="font-semibold text-primary" href="/signin">Sign in</Link>
            </p>
          </form>
        </div>
      </section>
    </PublicShell>
  );
}
