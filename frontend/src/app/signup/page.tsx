'use client';

import { ArrowRight, Building2, Mail, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { PublicShell } from '@/components/marketing/public-shell';
import { registerBusiness, registerUserWithApproval } from '@/lib/api';
import { saveAuthSession } from '@/lib/auth';

export default function SignUpPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<'employee' | 'business'>('employee');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessDomain, setBusinessDomain] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (accountType === 'business') {
        const session = await registerBusiness({
          businessName,
          domain: businessDomain,
          adminEmail: email,
          adminName: displayName,
          password,
        });
        saveAuthSession(session);
        router.push('/business');
        return;
      }

      const result = await registerUserWithApproval({
        displayName,
        email,
        organization: organization || undefined,
        password,
      });
      if (!('accessToken' in result)) {
        setMessage(result.message);
        return;
      }
      const session = result;
      saveAuthSession(session);
      router.push('/dashboard');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not create account. Check your details or use a different email.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicShell>
      <section className="px-5 py-12 md:py-20">
        <div className="mx-auto grid max-w-5xl items-center gap-8 md:grid-cols-[1fr_1fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-primary">Create account</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Start practicing safe cyber decisions.</h1>
            <p className="mt-4 leading-8 text-on-surface-variant">
              Register a business domain for SME awareness training, or join your company using your work email.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="glass-card rounded-xl p-4">
                <p className="font-bold text-primary">Employee</p>
                <p className="mt-2 text-sm text-on-surface-variant">Join with a work email only after your business has registered its domain.</p>
              </div>
              <div className="glass-card rounded-xl p-4">
                <p className="font-bold text-tertiary">Business</p>
                <p className="mt-2 text-sm text-on-surface-variant">Register a company domain and approve employees from the business dashboard.</p>
              </div>
            </div>
          </div>
          <form className="glass-card rounded-xl p-6 md:p-8" onSubmit={handleSubmit}>
            <h2 className="text-2xl font-bold">Sign Up</h2>
            <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-background p-1">
              {[
                { id: 'employee', label: 'Employee' },
                { id: 'business', label: 'Business' },
              ].map((item) => (
                <button
                  key={item.id}
                  className={`rounded-lg px-3 py-2 text-sm font-bold ${accountType === item.id ? 'bg-primary text-black' : 'text-on-surface-variant'}`}
                  type="button"
                  onClick={() => setAccountType(item.id as 'employee' | 'business')}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <label className="mt-6 block">
              <span className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">{accountType === 'business' ? 'Business admin name' : 'Full name'}</span>
              <div className="mt-2 flex items-center gap-3 rounded-xl bg-background px-4 py-3">
                <UserRound className="h-5 w-5 text-primary" />
                <input className="w-full bg-transparent outline-none" placeholder="Full name" type="text" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
              </div>
            </label>
            <label className="mt-4 block">
              <span className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">{accountType === 'business' ? 'Private admin email' : 'Work email'}</span>
              <div className="mt-2 flex items-center gap-3 rounded-xl bg-background px-4 py-3">
                <Mail className="h-5 w-5 text-primary" />
                <input className="w-full bg-transparent outline-none" placeholder={accountType === 'business' ? 'owner@gmail.com' : 'you@company.com'} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
            </label>
            {accountType === 'business' ? (
              <>
                <label className="mt-4 block">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">Business name</span>
                  <div className="mt-2 flex items-center gap-3 rounded-xl bg-background px-4 py-3">
                    <Building2 className="h-5 w-5 text-primary" />
                    <input className="w-full bg-transparent outline-none" placeholder="Acme Services" type="text" value={businessName} onChange={(event) => setBusinessName(event.target.value)} required />
                  </div>
                </label>
                <label className="mt-4 block">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">Company domain</span>
                  <input className="mt-2 w-full rounded-xl bg-background px-4 py-3 outline-none" placeholder="company.com" type="text" value={businessDomain} onChange={(event) => setBusinessDomain(event.target.value)} required />
                </label>
              </>
            ) : (
              <label className="mt-4 block">
                <span className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">Organization optional</span>
                <div className="mt-2 flex items-center gap-3 rounded-xl bg-background px-4 py-3">
                  <Building2 className="h-5 w-5 text-primary" />
                  <input className="w-full bg-transparent outline-none" placeholder="Company name" type="text" value={organization} onChange={(event) => setOrganization(event.target.value)} />
                </div>
                <span className="mt-2 block text-xs leading-5 text-on-surface-variant">Your email domain must already be registered by a business admin. New employee accounts wait for approval.</span>
              </label>
            )}
            <label className="mt-4 block">
              <span className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">Password</span>
              <input className="mt-2 w-full rounded-xl bg-background px-4 py-3 outline-none" placeholder="Create a password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
            </label>
            {error ? <p className="mt-4 rounded-xl bg-white/10 px-4 py-3 text-sm text-on-surface">{error}</p> : null}
            {message ? <p className="mt-4 rounded-xl bg-primary/10 px-4 py-3 text-sm text-on-surface">{message}</p> : null}
            <button className="pressable mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-container py-4 font-bold text-on-primary-container disabled:cursor-not-allowed disabled:opacity-70" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : accountType === 'business' ? 'Register Business' : 'Create Account'}
              <ArrowRight className="h-5 w-5" />
            </button>
            <p className="mt-5 text-center text-sm text-on-surface-variant">
              Already have an account? <Link className="font-semibold text-primary" href="/signin">Sign in</Link>
            </p>
          </form>
        </div>
      </section>
    </PublicShell>
  );
}
