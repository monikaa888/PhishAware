'use client';

import { ArrowRight, CheckCircle2, Circle, Lock, Mail, Megaphone, MessageCircle, ShieldCheck, Smartphone, Target } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';

type ChallengeApp = 'email' | 'sms' | 'social';

type Challenge = {
  id: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  app: ChallengeApp;
  messageId: string;
  icon: typeof Mail;
  state: 'done' | 'open' | 'locked';
  sender: string;
  objective: string;
  userTask: string;
  redFlags: string[];
  vulnerability: string;
  identification: string[];
};

const filters = [
  { label: 'All', icon: Target },
  { label: 'Email', icon: Mail },
  { label: 'SMS', icon: Smartphone },
  { label: 'Social', icon: MessageCircle },
];

const challenges: Challenge[] = [
  {
    id: 'student-aid-confirmation',
    title: 'Scholarship Confirmation',
    description: 'A fake financial-aid email pressures the learner to verify school login details before a deadline.',
    level: 'Easy',
    duration: '8 mins',
    app: 'email',
    messageId: 'student-aid',
    icon: Mail,
    state: 'open',
    sender: 'Student Aid Office',
    objective: 'Inspect sender identity, deadline pressure, and the verification link before taking action.',
    userTask: 'Open the email in the phone, inspect the link, then choose the safest response.',
    redFlags: ['Lookalike sender domain: grant-verify.example', 'Urgent deadline designed to reduce careful review', 'Login verification requested from a message link'],
    vulnerability: 'The message can steal school credentials because the link leads to a cloned verification page controlled by the attacker.',
    identification: ['Compare the sender domain with the real school domain.', 'Do not trust urgency as proof of legitimacy.', 'Avoid entering passwords after following links from email.'],
  },
  {
    id: 'delivery-fee-sms',
    title: 'Delivery Fee SMS',
    description: 'A smishing message claims a package is held and asks for a small redelivery payment.',
    level: 'Medium',
    duration: '10 mins',
    app: 'sms',
    messageId: 'delivery',
    icon: Smartphone,
    state: 'open',
    sender: 'Delivery Notice',
    objective: 'Detect unexpected payment pressure and inspect the destination before responding.',
    userTask: 'Open the SMS, click the suspicious parcel link, then report or block the sender.',
    redFlags: ['Unexpected fee request', 'Generic sender instead of a known courier', 'Short urgent payment path on parcel-update.example'],
    vulnerability: 'The attacker can collect payment details or redirect the learner into a credential or card-harvesting page.',
    identification: ['Verify deliveries in the official courier app or website.', 'Treat tiny fees and urgent payment links as high risk.', 'Check whether the domain actually belongs to the company.'],
  },
  {
    id: 'social-recruiter',
    title: 'Recruiter Direct Message',
    description: 'A social message impersonates a campus recruiter and asks for sensitive verification details.',
    level: 'Medium',
    duration: '12 mins',
    app: 'social',
    messageId: 'careers',
    icon: MessageCircle,
    state: 'done',
    sender: 'Campus Careers',
    objective: 'Identify credential requests inside a direct-message conversation.',
    userTask: 'Open the social conversation, inspect the profile request, and avoid sharing secrets.',
    redFlags: ['Password request inside chat', 'Unverified help-style username', 'Recruiting offer used as bait'],
    vulnerability: 'The attacker is attempting account takeover by convincing the learner to share a password or use a fake verification page.',
    identification: ['Legitimate staff should never ask for passwords.', 'Confirm recruiter identity through official campus channels.', 'Be cautious when opportunity pressure is paired with credential requests.'],
  },
  {
    id: 'ceo-fraud',
    title: 'CEO Fraud',
    description: 'Business email compromise scenario involving executive impersonation and payment pressure.',
    level: 'Hard',
    duration: '15 mins',
    app: 'email',
    messageId: 'student-aid',
    icon: Megaphone,
    state: 'locked',
    sender: 'Executive Office',
    objective: 'Review authority pressure, payment language, and identity mismatch.',
    userTask: 'Locked until the SMS and social scenarios are completed.',
    redFlags: ['Authority pressure', 'Payment urgency', 'External reply path'],
    vulnerability: 'Executive impersonation can bypass normal approval behavior and cause payment fraud.',
    identification: ['Verify payment requests out of band.', 'Check reply-to addresses carefully.', 'Follow approval workflow even when the message claims urgency.'],
  },
];

type FeedbackDetail = {
  challengeId: string;
  reason: string;
};

export default function ChallengesPage() {
  const [selectedId, setSelectedId] = useState(challenges[0].id);
  const [startedId, setStartedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const selected = useMemo(() => challenges.find((challenge) => challenge.id === selectedId) ?? challenges[0], [selectedId]);
  const SelectedIcon = selected.icon;
  const selectedFeedback = feedback[selected.id];

  useEffect(() => {
    function handleFeedback(event: Event) {
      const detail = (event as CustomEvent<FeedbackDetail>).detail;
      setFeedback((current) => ({ ...current, [detail.challengeId]: detail.reason }));
    }

    window.addEventListener('phishaware:challenge-feedback', handleFeedback);
    return () => window.removeEventListener('phishaware:challenge-feedback', handleFeedback);
  }, []);

  function startChallenge(challenge: Challenge) {
    if (challenge.state === 'locked') return;
    setSelectedId(challenge.id);
    setStartedId(challenge.id);
    setFeedback((current) => {
      const next = { ...current };
      delete next[challenge.id];
      return next;
    });
    window.dispatchEvent(
      new CustomEvent('phishaware:start-challenge', {
        detail: {
          app: challenge.app,
          messageId: challenge.messageId,
          challengeId: challenge.id,
        },
      }),
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8">
        <section>
          <h1 className="text-3xl font-bold">Simulations</h1>
          <p className="mt-1 text-sm text-white/65">Select a challenge, review the setup, then start it inside the simulated phone.</p>
          <div className="mt-6 flex gap-3 overflow-x-auto pb-1">
            {filters.map((filter, index) => {
              const Icon = filter.icon;
              return (
                <button key={filter.label} className={`flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold active:scale-95 ${index === 0 ? 'bg-primary text-black' : 'bg-white/5 text-white/70 hover:bg-white/10'}`} type="button">
                  <Icon className="h-4 w-4" />
                  {filter.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_380px]">
          <div className="space-y-3">
            <button className="relative block w-full overflow-hidden rounded-xl bg-white/5 p-5 text-left" type="button" onClick={() => setSelectedId('student-aid-confirmation')}>
              <div className="absolute left-0 top-0 h-full w-1 bg-primary" />
              <div className="mb-5 flex items-start justify-between">
                <div className="rounded-lg bg-primary/15 p-3">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <span className="rounded bg-primary/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">High priority</span>
              </div>
              <h2 className="text-lg font-bold">Scholarship Confirmation</h2>
              <p className="mt-2 text-sm text-white/65">Credential-harvesting email involving a fake grant verification portal.</p>
              <div className="mt-5 flex items-center justify-between">
                <div className="flex gap-2">
                  <span className="rounded bg-white/5 px-2 py-1 text-xs text-white/65">Email</span>
                  <span className="rounded bg-white/5 px-2 py-1 text-xs text-white/65">1/3 active</span>
                </div>
                <span className="flex items-center gap-1 text-sm font-bold text-primary">
                  View setup
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </button>

            <div className="grid grid-cols-2 gap-3">
              {challenges.map((challenge) => {
                const Icon = challenge.icon;
                const active = challenge.id === selected.id;
                const completed = Boolean(feedback[challenge.id]);
                return (
                  <button
                    key={challenge.id}
                    className={`flex min-h-44 flex-col rounded-xl p-4 text-left transition ${active ? 'bg-primary text-black' : 'bg-white/5 text-white hover:bg-white/10'}`}
                    type="button"
                    onClick={() => setSelectedId(challenge.id)}
                  >
                    <Icon className={`mb-5 h-5 w-5 ${active ? 'text-black/70' : 'text-white/65'}`} />
                    <h3 className="font-bold">{challenge.title}</h3>
                    <p className={`mt-1 text-xs ${active ? 'text-black/65' : 'text-white/65'}`}>{challenge.description}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <span className={`text-xs ${active ? 'text-black/65' : 'text-white/65'}`}>{challenge.level}</span>
                      {completed ? <CheckCircle2 className="h-5 w-5" /> : challenge.state === 'locked' ? <Lock className="h-5 w-5 opacity-45" /> : <Circle className="h-5 w-5 opacity-45" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="rounded-xl bg-white/5 p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="rounded-lg bg-white/10 p-3">
                <SelectedIcon className="h-5 w-5 text-primary" />
              </div>
              <span className="rounded bg-white/10 px-2 py-1 text-xs text-white/65">{selected.app.toUpperCase()}</span>
            </div>
            <h2 className="text-2xl font-bold">{selected.title}</h2>
            <p className="mt-2 text-sm leading-6 text-white/65">{selected.description}</p>

            <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-black p-3">
                <p className="text-xs text-white/50">Difficulty</p>
                <p className="mt-1 font-semibold">{selected.level}</p>
              </div>
              <div className="rounded-xl bg-black p-3">
                <p className="text-xs text-white/50">Time</p>
                <p className="mt-1 font-semibold">{selected.duration}</p>
              </div>
              <div className="col-span-2 rounded-xl bg-black p-3">
                <p className="text-xs text-white/50">Sender</p>
                <p className="mt-1 font-semibold">{selected.sender}</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Objective</p>
                <p className="mt-2 text-sm leading-6 text-white/70">{selected.objective}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Your task</p>
                <p className="mt-2 text-sm leading-6 text-white/70">{selected.userTask}</p>
              </div>
            </div>

            <button
              className={`mt-6 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-bold ${selected.state === 'locked' ? 'bg-white/10 text-white/40' : 'bg-primary text-black active:scale-[0.98]'}`}
              type="button"
              disabled={selected.state === 'locked'}
              onClick={() => startChallenge(selected)}
            >
              {selected.state === 'locked' ? 'Locked' : startedId === selected.id ? 'Restart challenge' : 'Start challenge'}
              {selected.state !== 'locked' ? <ArrowRight className="h-4 w-4" /> : null}
            </button>

            {selectedFeedback ? (
              <div className="mt-6 rounded-xl bg-black p-4">
                <div className="mb-3 flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="font-bold">Interaction reviewed: {selectedFeedback}</p>
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/50">What is wrong</p>
                <ul className="mt-2 space-y-2 text-sm text-white/75">
                  {selected.redFlags.map((flag) => (
                    <li key={flag}>- {flag}</li>
                  ))}
                </ul>
                <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-white/50">Why it is vulnerable</p>
                <p className="mt-2 text-sm leading-6 text-white/75">{selected.vulnerability}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-white/50">How to identify it</p>
                <ul className="mt-2 space-y-2 text-sm text-white/75">
                  {selected.identification.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mt-6 rounded-xl bg-black p-4 text-sm leading-6 text-white/65">
                Start the challenge and interact with the simulated message. The explanation appears here after you open a suspicious link or record an action in the phone.
              </div>
            )}
          </aside>
        </section>
      </div>
    </AppShell>
  );
}
