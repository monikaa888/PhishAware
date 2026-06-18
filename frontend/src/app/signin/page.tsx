import { ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { PublicShell } from '@/components/marketing/public-shell';

export default function SignInPage() {
  return (
    <PublicShell>
      <section className="px-5 py-12 md:py-20">
        <div className="mx-auto grid max-w-5xl items-center gap-8 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-primary">Welcome back</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Sign in to continue your security path.</h1>
            <p className="mt-4 leading-8 text-on-surface-variant">
              Open your learner dashboard, continue assigned simulations, and review AI feedback from previous challenges.
            </p>
            <div className="mt-6 rounded-xl border border-primary/20 bg-primary/10 p-4">
              <div className="flex gap-3">
                <ShieldCheck className="mt-1 h-5 w-5 text-primary" />
                <p className="text-sm leading-6 text-on-surface-variant">Demo authentication UI only. Backend login integration comes next.</p>
              </div>
            </div>
          </div>
          <form className="glass-card rounded-xl p-6 md:p-8">
            <h2 className="text-2xl font-bold">Sign In</h2>
            <label className="mt-6 block">
              <span className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">Email</span>
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-outline-variant bg-background px-4 py-3">
                <Mail className="h-5 w-5 text-primary" />
                <input className="w-full bg-transparent outline-none" placeholder="you@example.com" type="email" />
              </div>
            </label>
            <label className="mt-4 block">
              <span className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">Password</span>
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-outline-variant bg-background px-4 py-3">
                <Lock className="h-5 w-5 text-primary" />
                <input className="w-full bg-transparent outline-none" placeholder="Your password" type="password" />
              </div>
            </label>
            <div className="mt-4 flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-on-surface-variant">
                <input className="rounded border-outline-variant bg-background" type="checkbox" />
                Remember me
              </label>
              <a className="font-semibold text-primary" href="#">Forgot password?</a>
            </div>
            <Link className="pressable mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-container py-4 font-bold text-on-primary-container" href="/dashboard">
              Sign In
              <ArrowRight className="h-5 w-5" />
            </Link>
            <p className="mt-5 text-center text-sm text-on-surface-variant">
              New to PhishAware? <Link className="font-semibold text-primary" href="/signup">Create an account</Link>
            </p>
          </form>
        </div>
      </section>
    </PublicShell>
  );
}
