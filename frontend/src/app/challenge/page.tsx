'use client';

import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Eye,
  Flag,
  Lightbulb,
  Link2,
  Mail,
  MapPin,
  MousePointerClick,
  Reply,
  ShieldAlert,
  Trash,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { recordChallengeAction, startChallengeSession, type ChallengeActionType, type ChallengeSession } from '@/lib/api';

const challengeId = 'email-amazon-login-alert';

const threatIndicators = [
  {
    id: 'sender-domain',
    label: 'Lookalike sender domain',
    detail: 'The sender uses amozon-support.com instead of an official Amazon domain.',
  },
  {
    id: 'urgency',
    label: 'Urgent pressure',
    detail: 'The message pushes immediate action before the learner can verify it.',
  },
  {
    id: 'geo-scare',
    label: 'Fear trigger',
    detail: 'The foreign login location is used to create panic and drive clicks.',
  },
  {
    id: 'button-link',
    label: 'Unverified account button',
    detail: 'The call to action asks the learner to secure the account through the message.',
  },
];

const actionLabels: Record<ChallengeActionType, string> = {
  OPEN_EMAIL: 'Opened message',
  VIEW_SENDER: 'Viewed sender',
  INSPECT_LINK: 'Inspected link',
  CLICK_LINK: 'Clicked secure account',
  REPORT_PHISHING: 'Reported phishing',
  DELETE_MESSAGE: 'Deleted message',
  REPLY_MESSAGE: 'Started reply',
  REQUEST_HINT: 'Requested hint',
};

type LogEntry = {
  id: string;
  label: string;
  target?: string;
  localOnly?: boolean;
};

export default function ChallengePage() {
  const [session, setSession] = useState<ChallengeSession | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);
  const [activityLog, setActivityLog] = useState<LogEntry[]>([]);
  const [hintVisible, setHintVisible] = useState(false);
  const [decision, setDecision] = useState<'reported' | 'safe' | null>(null);
  const [apiWarning, setApiWarning] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function startSession() {
      try {
        const started = await startChallengeSession(challengeId);
        if (active) {
          setSession(started);
          setApiWarning(null);
        }
      } catch {
        if (active) {
          setSession({
            id: `local-${Date.now()}`,
            challengeId,
            status: 'STARTED',
            startedAt: new Date().toISOString(),
          });
          setApiWarning('Backend unavailable. Actions are being tracked locally for this preview.');
        }
      } finally {
        if (active) {
          setIsStarting(false);
        }
      }
    }

    void startSession();

    return () => {
      active = false;
    };
  }, []);

  const score = useMemo(() => {
    const indicatorScore = selectedIndicators.length * 20;
    const decisionScore = decision === 'reported' ? 20 : decision === 'safe' ? -20 : 0;
    return Math.max(0, Math.min(100, indicatorScore + decisionScore));
  }, [decision, selectedIndicators.length]);

  const missedIndicators = threatIndicators.filter((indicator) => !selectedIndicators.includes(indicator.id));

  async function logAction(actionType: ChallengeActionType, target?: string) {
    const fallbackEntry = {
      id: `${actionType}-${Date.now()}`,
      label: actionLabels[actionType],
      target,
      localOnly: true,
    };

    if (!session) {
      setActivityLog((items) => [fallbackEntry, ...items].slice(0, 6));
      return;
    }

    try {
      const action = await recordChallengeAction(session.id, { actionType, target });
      setActivityLog((items) =>
        [
          {
            id: action.id,
            label: actionLabels[action.actionType],
            target: action.target,
          },
          ...items,
        ].slice(0, 6),
      );
    } catch {
      setApiWarning('Backend unavailable. Actions are being tracked locally for this preview.');
      setActivityLog((items) => [fallbackEntry, ...items].slice(0, 6));
    }
  }

  function toggleIndicator(id: string) {
    setSelectedIndicators((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function requestHint() {
    setHintVisible(true);
    void logAction('REQUEST_HINT', 'sender-domain');
  }

  function chooseSafe() {
    setDecision('safe');
    void logAction('CLICK_LINK', 'secure-account-button');
  }

  function reportPhish() {
    setDecision('reported');
    void logAction('REPORT_PHISHING', 'message');
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-primary">Active Mission</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Identify the Threat</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
              Inspect the message, mark the red flags, then choose the safest response.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface-variant">
              {isStarting ? 'Starting session...' : `Score ${score}%`}
            </div>
            <button className="pressable rounded-lg bg-primary-container p-3 text-on-primary-container" type="button" aria-label="Hint" onClick={requestHint}>
              <Lightbulb className="h-5 w-5" />
            </button>
          </div>
        </section>

        {apiWarning ? (
          <div className="rounded-lg border border-tertiary/30 bg-tertiary/10 px-4 py-3 text-sm text-tertiary">
            {apiWarning}
          </div>
        ) : null}

        <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="overflow-hidden rounded-xl bg-white text-black shadow-2xl shadow-primary/30">
            <header className="flex items-center gap-4 border-b border-black p-4">
              <div className="rounded-full bg-white p-3 text-black">
                <Mail className="h-5 w-5" />
              </div>
              <button className="min-w-0 flex-1 text-left" type="button" onClick={() => void logAction('VIEW_SENDER', 'security-alert@amozon-support.com')}>
                <div className="flex justify-between gap-3">
                  <strong>Amazon Security</strong>
                  <span className="text-xs text-black">10:42 AM</span>
                </div>
                <p className="truncate font-mono text-xs text-black">security-alert@amozon-support.com</p>
              </button>
            </header>
            <article className="space-y-4 p-5 leading-relaxed sm:p-6">
              <h2 className="text-xl font-bold">URGENT: Suspicious Login Detected</h2>
              <p>Dear Valued Customer,</p>
              <p>
                We detected a suspicious login attempt to your account from a new device in <strong>Moscow, Russia</strong>.
              </p>
              <button
                className="flex w-full items-center gap-3 rounded-xl border border-black bg-white p-4 text-left hover:border-primary"
                type="button"
                onClick={() => toggleIndicator('geo-scare')}
              >
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black">Attempted From</p>
                  <p className="text-sm font-semibold">IP: 185.156.174.22 (Russia)</p>
                </div>
              </button>
              <p>If this was not you, please secure your account immediately to prevent unauthorized access.</p>
              <div className="py-4 text-center">
                <button
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-3 font-bold text-white"
                  type="button"
                  onClick={() => void logAction('INSPECT_LINK', 'https://amozon-support.com/secure')}
                >
                  <Link2 className="h-4 w-4" />
                  Secure Account
                </button>
              </div>
            </article>
            <footer className="flex justify-between border-t border-black bg-white p-4 text-black">
              <button className="flex items-center gap-2 text-sm hover:text-black" type="button" onClick={() => void logAction('REPLY_MESSAGE', 'sender')}>
                <Reply className="h-5 w-5" />
                Reply
              </button>
              <button className="hover:text-black" type="button" aria-label="Delete message" onClick={() => void logAction('DELETE_MESSAGE', 'message')}>
                <Trash className="h-5 w-5" />
              </button>
            </footer>
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border border-outline-variant bg-surface p-5">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Red Flags</h2>
              </div>
              <div className="mt-4 space-y-2">
                {threatIndicators.map((indicator) => {
                  const selected = selectedIndicators.includes(indicator.id);
                  return (
                    <button
                      key={indicator.id}
                      className={`w-full rounded-lg border p-3 text-left transition ${
                        selected ? 'border-primary/50 bg-primary/10' : 'border-outline-variant bg-background hover:border-primary/35'
                      }`}
                      type="button"
                      onClick={() => toggleIndicator(indicator.id)}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold">{indicator.label}</span>
                        {selected ? <CheckCircle2 className="h-4 w-4 text-success" /> : <ChevronRight className="h-4 w-4 text-on-surface-variant" />}
                      </span>
                      <span className="mt-2 block text-xs leading-5 text-on-surface-variant">{indicator.detail}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-outline-variant bg-surface p-5">
              <div className="flex items-center gap-2">
                <MousePointerClick className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Action Trail</h2>
              </div>
              <div className="mt-4 space-y-2">
                {activityLog.length ? (
                  activityLog.map((item) => (
                    <div key={item.id} className="rounded-lg bg-background p-3">
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="mt-1 truncate text-xs text-on-surface-variant">{item.target ?? (item.localOnly ? 'Local preview' : 'Recorded')}</p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg bg-background p-3 text-sm text-on-surface-variant">Inspect the message to start building an action trail.</p>
                )}
              </div>
            </div>
          </aside>
        </section>

        {hintVisible ? (
          <section className="rounded-lg border border-primary/20 bg-primary/10 p-4">
            <div className="flex gap-3">
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h2 className="font-bold text-primary">Hint</h2>
                <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                  Start with the sender domain, then compare the message pressure and account button against what a real account alert would ask you to do.
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {decision ? (
          <section className={`rounded-lg border p-5 ${decision === 'reported' ? 'border-success/30 bg-success/10' : 'border-error/30 bg-error/10'}`}>
            <div className="flex gap-3">
              {decision === 'reported' ? <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-success" /> : <XCircle className="mt-1 h-5 w-5 shrink-0 text-error" />}
              <div>
                <h2 className="text-xl font-bold">{decision === 'reported' ? 'Correct response' : 'Risky response'}</h2>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  {decision === 'reported'
                    ? 'Reporting the message preserves evidence and avoids interacting with the suspicious link.'
                    : 'Treating this as safe would expose the learner to a credential-harvesting page. Verify through the official site or app instead.'}
                </p>
                {missedIndicators.length ? (
                  <div className="mt-4 rounded-lg bg-background p-3">
                    <p className="text-sm font-bold">Review missed indicators</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {missedIndicators.map((indicator) => (
                        <span key={indicator.id} className="rounded-full border border-outline-variant px-3 py-1 text-xs text-on-surface-variant">
                          {indicator.label}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        <section className="sticky bottom-20 z-20 lg:bottom-4">
          <div className="glass-card mx-auto flex max-w-xl gap-3 rounded-xl p-3">
            <button className="pressable flex-1 rounded-lg bg-surface-highest px-4 py-3 font-semibold text-on-surface-variant" type="button" onClick={chooseSafe}>
              Safe
            </button>
            <button className="pressable flex-[2] rounded-lg bg-primary-container px-4 py-3 font-bold text-on-primary-container" type="button" onClick={reportPhish}>
              <span className="inline-flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                Report Phish
              </span>
            </button>
            <button className="hidden rounded-lg border border-outline-variant bg-background px-4 py-3 text-on-surface-variant sm:inline-flex" type="button" onClick={() => toggleIndicator('urgency')}>
              <AlertTriangle className="h-5 w-5" />
              <span className="sr-only">Mark urgency</span>
            </button>
            <button className="hidden rounded-lg border border-outline-variant bg-background px-4 py-3 text-on-surface-variant sm:inline-flex" type="button" onClick={() => toggleIndicator('button-link')}>
              <Flag className="h-5 w-5" />
              <span className="sr-only">Mark call to action</span>
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
