import { BookOpen, GraduationCap, ShieldCheck, Target, Users } from 'lucide-react';
import Link from 'next/link';
import { PublicShell } from '@/components/marketing/public-shell';

const values = [
  { icon: Target, title: 'Practice over theory', text: 'People learn best by making decisions inside realistic but safe situations.' },
  { icon: ShieldCheck, title: 'Safety by design', text: 'The product teaches recognition and response without enabling real phishing abuse.' },
  { icon: GraduationCap, title: 'Accessible education', text: 'The experience is designed for non-technical users, students, and early-career professionals.' },
];

export default function AboutPage() {
  return (
    <PublicShell>
      <section className="px-5 py-12 md:py-20">
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-xs uppercase tracking-widest text-primary">About PhishAware</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">We help people recognize social engineering before it becomes a breach.</h1>
          <p className="mt-6 text-lg leading-8 text-on-surface-variant">
            PhishAware exists because static awareness content is not enough. Attackers use urgency, trust, and personalization. Learners need realistic practice, guided feedback, and repeated exposure to evolving tactics.
          </p>
        </div>
      </section>
      <section className="bg-surface px-5 py-14">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
          {values.map((value) => {
            const Icon = value.icon;
            return (
              <article key={value.title} className="glass-card rounded-xl p-6">
                <Icon className="h-7 w-7 text-primary" />
                <h2 className="mt-4 text-xl font-bold">{value.title}</h2>
                <p className="mt-3 leading-7 text-on-surface-variant">{value.text}</p>
              </article>
            );
          })}
        </div>
      </section>
      <section className="px-5 py-14">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-outline-variant bg-background p-6">
            <Users className="h-7 w-7 text-primary" />
            <h2 className="mt-4 text-2xl font-bold">Who we serve</h2>
            <p className="mt-3 leading-7 text-on-surface-variant">
              Students, schools, universities, young professionals, security awareness programs, and organizations that want measurable behavior change.
            </p>
          </div>
          <div className="rounded-xl border border-outline-variant bg-background p-6">
            <BookOpen className="h-7 w-7 text-primary" />
            <h2 className="mt-4 text-2xl font-bold">How we teach</h2>
            <p className="mt-3 leading-7 text-on-surface-variant">
              Users interact with simulated attacks, choose actions, see consequences, and receive personalized recommendations for the next challenge.
            </p>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-6xl rounded-xl bg-primary-container p-6 text-on-primary-container">
          <h2 className="text-3xl font-black">Ready to build safer habits?</h2>
          <Link className="pressable mt-5 inline-flex rounded-xl bg-white px-6 py-4 font-bold text-black" href="/signup">
            Get Started
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
