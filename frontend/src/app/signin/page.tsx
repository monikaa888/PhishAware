'use client';

import { ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { PublicShell } from '@/components/marketing/public-shell';
import { loginUser } from '@/lib/api';
import { saveAuthSession } from '@/lib/auth';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const session = await loginUser({ email, password });
      saveAuthSession(session);
      router.push(session.user.role === 'BUSINESS_ADMIN' ? '/business' : '/dashboard');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicShell>
      <section className="px-5 py-12 md:py-20">
        <div className="mx-auto grid max-w-5xl items-center gap-8 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-primary">Welcome back</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Sign in to continue your security path.</h1>
            <p className="mt-4 leading-8 text-on-surface-variant">
              Open your learner dashboard, continue assigned email labs, and review feedback from previous challenges.
            </p>
            <div className="mt-6 rounded-xl bg-primary/10 p-4">
              <div className="flex gap-3">
                <ShieldCheck className="mt-1 h-5 w-5 text-primary" />
                <p className="text-sm leading-6 text-on-surface-variant">Authentication is connected to the backend. Use the account you created on sign up.</p>
              </div>
            </div>
          </div>
          <form className="glass-card rounded-xl p-6 md:p-8" onSubmit={handleSubmit}>
            <h2 className="text-2xl font-bold">Sign In</h2>
            <label className="mt-6 block">
              <span className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">Email</span>
              <div className="mt-2 flex items-center gap-3 rounded-xl bg-background px-4 py-3">
                <Mail className="h-5 w-5 text-primary" />
                <input className="w-full bg-transparent outline-none" placeholder="you@example.com" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
            </label>
            <label className="mt-4 block">
              <span className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">Password</span>
              <div className="mt-2 flex items-center gap-3 rounded-xl bg-background px-4 py-3">
                <Lock className="h-5 w-5 text-primary" />
                <input className="w-full bg-transparent outline-none" placeholder="Your password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
              </div>
            </label>
            <div className="mt-4 flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-on-surface-variant">
                <input className="rounded bg-background" type="checkbox" />
                Remember me
              </label>
              <a className="font-semibold text-primary" href="#">Forgot password?</a>
            </div>
            {error ? <p className="mt-4 rounded-xl bg-white/10 px-4 py-3 text-sm text-on-surface">{error}</p> : null}
            <button className="pressable mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-container py-4 font-bold text-on-primary-container disabled:cursor-not-allowed disabled:opacity-70" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="h-5 w-5" />
            </button>
            <p className="mt-5 text-center text-sm text-on-surface-variant">
              New to PhishAware? <Link className="font-semibold text-primary" href="/signup">Create an account</Link>
            </p>
          </form>
        </div>
      </section>
    </PublicShell>
  );
}
