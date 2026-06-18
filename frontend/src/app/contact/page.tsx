import { Building2, Mail, MapPin, MessageSquare, Phone } from 'lucide-react';
import Link from 'next/link';
import { PublicShell } from '@/components/marketing/public-shell';

export default function ContactPage() {
  return (
    <PublicShell>
      <section className="px-5 py-12 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-primary">Contact</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Plan your awareness program with PhishAware.</h1>
            <p className="mt-5 text-lg leading-8 text-on-surface-variant">
              Contact us for school pilots, university programs, team training, organization dashboards, or product partnerships.
            </p>
            <div className="mt-8 space-y-4">
              <a className="flex items-center gap-3 text-on-surface-variant hover:text-primary" href="mailto:hello@phishaware.example">
                <Mail className="h-5 w-5" />
                hello@phishaware.example
              </a>
              <a className="flex items-center gap-3 text-on-surface-variant hover:text-primary" href="tel:+15550140200">
                <Phone className="h-5 w-5" />
                +1 (555) 014-0200
              </a>
              <p className="flex items-center gap-3 text-on-surface-variant">
                <MapPin className="h-5 w-5" />
                Remote-first, serving education and organizations
              </p>
            </div>
          </div>
          <form className="glass-card rounded-xl p-6 md:p-8">
            <h2 className="text-2xl font-bold">Send a message</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label>
                <span className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">Name</span>
                <input className="mt-2 w-full rounded-xl border border-outline-variant bg-background px-4 py-3 outline-none" placeholder="Your name" type="text" />
              </label>
              <label>
                <span className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">Work email</span>
                <input className="mt-2 w-full rounded-xl border border-outline-variant bg-background px-4 py-3 outline-none" placeholder="you@org.com" type="email" />
              </label>
            </div>
            <label className="mt-4 block">
              <span className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">Organization</span>
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-outline-variant bg-background px-4 py-3">
                <Building2 className="h-5 w-5 text-primary" />
                <input className="w-full bg-transparent outline-none" placeholder="School, university, or company" type="text" />
              </div>
            </label>
            <label className="mt-4 block">
              <span className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">Message</span>
              <textarea className="mt-2 min-h-36 w-full rounded-xl border border-outline-variant bg-background px-4 py-3 outline-none" placeholder="Tell us what you want to build." />
            </label>
            <button className="pressable mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-container py-4 font-bold text-on-primary-container" type="button">
              <MessageSquare className="h-5 w-5" />
              Send Message
            </button>
            <p className="mt-5 text-center text-sm text-on-surface-variant">
              Want to try the product first? <Link className="font-semibold text-primary" href="/signup">Create an account</Link>
            </p>
          </form>
        </div>
      </section>
    </PublicShell>
  );
}
