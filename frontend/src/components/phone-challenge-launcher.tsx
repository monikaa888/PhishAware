'use client';

import {
  Archive,
  BatteryFull,
  CheckCircle2,
  ChevronLeft,
  Flag,
  Globe2,
  LockKeyhole,
  Mail,
  MessageCircle,
  MonitorSmartphone,
  MoreHorizontal,
  Paperclip,
  Search,
  Send,
  ShieldAlert,
  Smartphone,
  TriangleAlert,
  Wifi,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type AppKey = 'email' | 'sms' | 'social';
type PhoneScreen = 'list' | 'detail' | 'browser';
type ChatLine = { id: string; from: 'them' | 'user' | 'system'; text: string; time: string };

type MessageItem = {
  id: string;
  challengeId?: string;
  sender: string;
  meta: string;
  title: string;
  preview: string;
  body: string;
  time: string;
  clue: string;
  action: string;
  linkUrl?: string;
  risky?: boolean;
};

const appMeta = {
  email: { label: 'Email', icon: Mail },
  sms: { label: 'SMS', icon: Smartphone },
  social: { label: 'Social', icon: MessageCircle },
};

const appMessages: Record<AppKey, MessageItem[]> = {
  email: [
    {
      id: 'student-aid',
      challengeId: 'student-aid-confirmation',
      sender: 'Student Aid Office',
      meta: 'aid-office@grant-verify.example',
      title: 'Scholarship confirmation required',
      preview: 'Your award is pending. Confirm your school login before 5 PM.',
      body: 'Your award is pending. Confirm your school login before 5 PM to avoid losing eligibility.',
      time: '9:12 AM',
      clue: 'Lookalike domain and deadline pressure.',
      action: 'Report email',
      linkUrl: 'https://grant-verify.example/login',
      risky: true,
    },
    {
      id: 'library',
      challengeId: 'library-book-hold',
      sender: 'Campus Library',
      meta: 'library@school.example',
      title: 'Book hold ready',
      preview: 'Your requested book is available at the front desk.',
      body: 'Your requested book is ready for pickup at the front desk. Bring your student ID.',
      time: '8:40 AM',
      clue: 'Expected sender and no credential request.',
      action: 'Mark safe',
      linkUrl: 'https://library.school.example/holds',
    },
  ],
  sms: [
    {
      id: 'delivery',
      challengeId: 'delivery-fee-sms',
      sender: 'Delivery Notice',
      meta: '+1 (555) 014-8801',
      title: 'Package held',
      preview: 'Pay a $1.80 redelivery fee at parcel-update.example.',
      body: 'Your package could not be delivered. Pay a $1.80 redelivery fee at parcel-update.example.',
      time: '10:04 AM',
      clue: 'Unexpected fee and suspicious destination.',
      action: 'Block sender',
      linkUrl: 'https://parcel-update.example/pay',
      risky: true,
    },
    {
      id: 'advisor',
      challengeId: 'advisor-reminder',
      sender: 'Academic Advisor',
      meta: '+1 (555) 019-2210',
      title: 'Appointment reminder',
      preview: 'Reminder: advising appointment at 3:00 PM today.',
      body: 'Reminder: your advising appointment is today at 3:00 PM in Room 204.',
      time: 'Yesterday',
      clue: 'Normal reminder with no link or urgent payment.',
      action: 'Mark safe',
    },
  ],
  social: [
    {
      id: 'careers',
      challengeId: 'social-recruiter',
      sender: 'Campus Careers',
      meta: '@campus-careers-help',
      title: 'Paid internship offer',
      preview: 'Send your email password so our recruiter can verify your student status.',
      body: 'We found your profile. Send your email password so our recruiter can verify your student status.',
      time: 'Now',
      clue: 'Credential request in a direct message.',
      action: 'Report profile',
      linkUrl: 'https://campus-careers-help.example/verify',
      risky: true,
    },
    {
      id: 'classmate',
      challengeId: 'study-group-message',
      sender: 'Maya Chen',
      meta: '@maya-study',
      title: 'Study group',
      preview: 'Are you joining the study session at 6?',
      body: 'Are you joining the study session at 6? We are meeting in the student center.',
      time: '1h',
      clue: 'Known contact and no sensitive data request.',
      action: 'Mark safe',
    },
  ],
};

type PhoneChallengeLauncherProps = {
  open: boolean;
  onClose: () => void;
  onToggle: () => void;
};

type StartChallengeEvent = CustomEvent<{
  app: AppKey;
  messageId: string;
  challengeId: string;
}>;

function emitChallengeFeedback(message: MessageItem, reason: string) {
  if (typeof window === 'undefined' || !message.challengeId) return;

  window.dispatchEvent(
    new CustomEvent('phishaware:challenge-feedback', {
      detail: {
        challengeId: message.challengeId,
        messageId: message.id,
        reason,
      },
    }),
  );
}

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-2 text-[11px] font-semibold text-white">
      <span>9:41</span>
      <div className="flex items-center gap-1">
        <Wifi className="h-3.5 w-3.5" />
        <BatteryFull className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}

function responseFor(message: MessageItem, app: AppKey) {
  if (message.risky) {
    return app === 'email'
      ? 'Training reply: this sender keeps pushing for a login. Reporting is safer than replying.'
      : 'Training reply: they repeated the pressure. Do not share passwords or payment details.';
  }
  return 'Training reply: this looks consistent with normal communication, but continue verifying context.';
}

function visibleUrl(url: string) {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function cleanUrl(rawUrl: string) {
  return rawUrl.replace(/[.,!?;:)\\\]}]+$/, '');
}

function browserUrlFrom(rawUrl: string) {
  const cleaned = cleanUrl(rawUrl);
  return /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
}

function textLinks(text: string) {
  const urlPattern = /((?:https?:\/\/|www\.)[^\s<>()]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s<>()]*)?)/gi;
  return Array.from(text.matchAll(urlPattern), (match) => {
    const raw = cleanUrl(match[0]);
    const start = match.index ?? 0;
    return {
      start,
      end: start + raw.length,
      raw,
    };
  });
}

export function PhoneChallengeLauncher({ open, onClose, onToggle }: PhoneChallengeLauncherProps) {
  const [activeApp, setActiveApp] = useState<AppKey>('email');
  const [screen, setScreen] = useState<PhoneScreen>('list');
  const [selectedId, setSelectedId] = useState<Record<AppKey, string>>({
    email: appMessages.email[0].id,
    sms: appMessages.sms[0].id,
    social: appMessages.social[0].id,
  });
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [threads, setThreads] = useState<Record<string, ChatLine[]>>({});
  const [completedAction, setCompletedAction] = useState<string | null>(null);
  const [browserUrl, setBrowserUrl] = useState(appMessages.email[0].linkUrl ?? 'https://search.example');

  const messages = appMessages[activeApp];
  const selected = messages.find((item) => item.id === selectedId[activeApp]) ?? messages[0];
  const threadKey = `${activeApp}:${selected.id}`;
  const thread = useMemo<ChatLine[]>(
    () =>
      threads[threadKey] ?? [
        {
          id: `${threadKey}:seed`,
          from: 'them',
          text: selected.body,
          time: selected.time,
        },
      ],
    [selected.body, selected.time, threadKey, threads],
  );
  const draft = drafts[threadKey] ?? '';
  const ActiveIcon = appMeta[activeApp].icon;

  useEffect(() => {
    function handleStartChallenge(event: Event) {
      const detail = (event as StartChallengeEvent).detail;
      const targetMessages = appMessages[detail.app];
      const targetMessage = targetMessages.find((item) => item.id === detail.messageId);
      if (!targetMessage) return;

      setActiveApp(detail.app);
      setSelectedId((current) => ({ ...current, [detail.app]: detail.messageId }));
      setScreen('detail');
      setCompletedAction(null);
      setBrowserUrl(targetMessage.linkUrl ?? 'https://search.example');
    }

    window.addEventListener('phishaware:start-challenge', handleStartChallenge);
    return () => window.removeEventListener('phishaware:start-challenge', handleStartChallenge);
  }, []);

  function selectApp(key: AppKey) {
    setActiveApp(key);
    setScreen('list');
    setCompletedAction(null);
    setBrowserUrl(appMessages[key][0].linkUrl ?? 'https://search.example');
  }

  function selectMessage(id: string) {
    setSelectedId((current) => ({ ...current, [activeApp]: id }));
    setScreen('detail');
    setCompletedAction(null);
    const next = appMessages[activeApp].find((item) => item.id === id);
    if (next?.linkUrl) setBrowserUrl(next.linkUrl);
  }

  function updateDraft(value: string) {
    setDrafts((current) => ({ ...current, [threadKey]: value }));
  }

  function sendReply() {
    const trimmed = draft.trim();
    if (!trimmed) return;

    const now = 'Now';
    const nextThread = [
      ...thread,
      { id: `${threadKey}:user:${Date.now()}`, from: 'user' as const, text: trimmed, time: now },
      { id: `${threadKey}:reply:${Date.now()}`, from: 'them' as const, text: responseFor(selected, activeApp), time: now },
    ];
    setThreads((current) => ({ ...current, [threadKey]: nextThread }));
    updateDraft('');
  }

  function openBrowser(url = selected.linkUrl ?? browserUrl) {
    const nextBrowserUrl = browserUrlFrom(url);
    setBrowserUrl(nextBrowserUrl);
    setScreen('browser');
    setCompletedAction(null);
    if (selected.risky && selected.linkUrl && nextBrowserUrl === browserUrlFrom(selected.linkUrl)) {
      emitChallengeFeedback(selected, 'Suspicious link opened');
    }
  }

  function recordAction(action: string) {
    setCompletedAction(action);
    emitChallengeFeedback(selected, action);
  }

  function renderLinkedMessageText(text: string) {
    const links = textLinks(text);
    if (!links.length) return <p>{text}</p>;

    const parts = [];
    let cursor = 0;

    for (const link of links) {
      if (link.start > cursor) {
        parts.push(
          <span key={`text:${cursor}`}>
            {text.slice(cursor, link.start)}
          </span>,
        );
      }

      parts.push(
        <button
          key={`link:${link.start}:${link.raw}`}
          className="inline-flex max-w-full align-baseline font-bold underline decoration-black/40 underline-offset-2"
          type="button"
          onClick={() => openBrowser(link.raw)}
        >
          {link.raw}
        </button>,
      );

      cursor = link.end;
    }

    if (cursor < text.length) {
      parts.push(
        <span key={`text:${cursor}`}>
          {text.slice(cursor)}
        </span>,
      );
    }

    return <p>{parts}</p>;
  }

  function renderInbox() {
    return (
      <div className="rounded-3xl bg-white text-black">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-black">
              <ActiveIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold">{activeApp === 'email' ? 'Inbox' : activeApp === 'sms' ? 'Messages' : 'WhatsApp'}</p>
              <p className="text-[11px] text-black/60">{messages.length} conversations</p>
            </div>
          </div>
          <MoreHorizontal className="h-5 w-5 text-black/60" />
        </div>

        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 rounded-full bg-black/5 px-3 py-2 text-xs text-black/55">
            <Search className="h-4 w-4" />
            {activeApp === 'email' ? 'Search mail' : 'Search messages'}
          </div>
        </div>

        <div className="max-h-[520px] overflow-y-auto px-3 pb-3">
          {messages.map((item) => {
            const active = item.id === selected.id;
            const liveThread = threads[`${activeApp}:${item.id}`];
            const latest = liveThread?.[liveThread.length - 1]?.text ?? item.preview;
            return (
              <button
                key={item.id}
                className={`mb-2 w-full rounded-2xl p-3 text-left transition ${active ? 'bg-secondary text-black' : 'bg-black/5 hover:bg-black/10'}`}
                type="button"
                onClick={() => selectMessage(item.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{item.sender}</p>
                    <p className="truncate text-xs text-black/60">{item.title}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-black/55">{liveThread ? 'Now' : item.time}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-black/65">{latest}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function renderEmailDetail() {
    return (
      <div className="rounded-3xl bg-white p-4 text-black">
        <div className="mb-4 flex items-center justify-between">
          <button className="flex items-center gap-1 text-xs font-semibold text-black/60" type="button" onClick={() => setScreen('list')}>
            <ChevronLeft className="h-4 w-4" />
            Gmail-style inbox
          </button>
          <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${selected.risky ? 'bg-secondary text-black' : 'bg-black/10 text-black'}`}>
            {selected.risky ? 'Review' : 'Normal'}
          </span>
        </div>
        <h3 className="text-lg font-bold">{selected.title}</h3>
        <div className="mt-4 flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-black">
            {selected.sender.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-bold">{selected.sender}</p>
              <span className="text-[10px] text-black/50">{selected.time}</span>
            </div>
            <p className="truncate font-mono text-[11px] text-black/60">{selected.meta}</p>
            <div className="mt-3 text-sm leading-6 text-black/75">{renderLinkedMessageText(selected.body)}</div>
            {selected.linkUrl ? (
              <button
                className="mt-3 flex w-full items-center justify-between gap-3 rounded-2xl bg-black/5 px-3 py-3 text-left text-xs font-semibold text-black hover:bg-black/10"
                type="button"
                onClick={() => openBrowser(selected.linkUrl)}
              >
                <span className="min-w-0 truncate">{visibleUrl(selected.linkUrl)}</span>
                <Globe2 className="h-4 w-4 shrink-0 text-black/55" />
              </button>
            ) : null}
          </div>
        </div>
        {thread.slice(1).map((line) => (
          <div key={line.id} className={`mt-3 rounded-2xl px-3 py-2 text-sm ${line.from === 'user' ? 'ml-10 bg-secondary text-black' : 'mr-8 bg-black/5 text-black'}`}>
            {renderLinkedMessageText(line.text)}
          </div>
        ))}
        <div className="mt-4 rounded-2xl bg-black/5 p-3">
          <textarea
            className="min-h-20 w-full resize-none bg-transparent text-sm outline-none placeholder:text-black/40"
            placeholder="Reply safely..."
            value={draft}
            onChange={(event) => updateDraft(event.target.value)}
          />
          <div className="mt-2 flex items-center justify-between">
            <Paperclip className="h-4 w-4 text-black/45" />
            <button className="flex items-center gap-2 rounded-full bg-secondary px-3 py-2 text-xs font-bold text-black" type="button" onClick={sendReply}>
              Send
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderChatDetail() {
    const whatsapp = activeApp === 'social';
    return (
      <div className={`rounded-3xl p-4 text-black ${whatsapp ? 'bg-white' : 'bg-white'}`}>
        <div className={`-m-4 mb-4 flex items-center gap-3 rounded-t-3xl px-4 py-3 ${whatsapp ? 'bg-secondary text-black' : 'bg-black text-white'}`}>
          <button className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/10" type="button" onClick={() => setScreen('list')} aria-label="Back to messages">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className={`flex h-9 w-9 items-center justify-center rounded-full ${whatsapp ? 'bg-black text-white' : 'bg-secondary text-black'}`}>
            <ActiveIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{selected.sender}</p>
            <p className={`truncate text-[11px] ${whatsapp ? 'text-black/65' : 'text-white/65'}`}>{selected.meta}</p>
          </div>
          <MoreHorizontal className="h-5 w-5" />
        </div>
        <div className="max-h-[260px] min-h-[220px] overflow-y-auto rounded-2xl bg-black/5 p-3">
          {thread.map((line) => (
            <div key={line.id} className={`mb-2 flex ${line.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-5 ${line.from === 'user' ? 'rounded-br-sm bg-secondary text-black' : 'rounded-bl-sm bg-white text-black'}`}>
                {renderLinkedMessageText(line.text)}
                {line.id.endsWith(':seed') && selected.linkUrl ? (
                  <button
                    className="mt-2 flex max-w-full items-center gap-1 rounded-full bg-black/5 px-2 py-1 text-left text-[11px] font-semibold text-black hover:bg-black/10"
                    type="button"
                    onClick={() => openBrowser(selected.linkUrl)}
                  >
                    <Globe2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{visibleUrl(selected.linkUrl)}</span>
                  </button>
                ) : null}
                <p className="mt-1 text-right text-[10px] text-black/45">{line.time}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-full bg-black/5 px-3 py-2">
          <input
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-black/45"
            placeholder={whatsapp ? 'Message' : 'Text message'}
            value={draft}
            onChange={(event) => updateDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') sendReply();
            }}
          />
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-black" type="button" onClick={sendReply} aria-label="Send message">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  function renderBrowser() {
    const risky = selected.linkUrl === browserUrl ? selected.risky : browserUrl.includes('verify') || browserUrl.includes('update');
    const knownSafeTrainingPage = browserUrl.includes('library.school.example');
    const safeTitle = knownSafeTrainingPage ? 'Campus Library' : 'Browser preview';
    const safeBody = knownSafeTrainingPage
      ? 'This simulated page matches the sender and does not request payment, passwords, or urgent credential verification.'
      : 'This simulated page was opened from a typed or received URL. Check the address, sender context, and whether it asks for sensitive information.';
    return (
      <div className="overflow-hidden rounded-3xl bg-white text-black">
        <div className="flex items-center gap-2 bg-black px-3 py-3 text-white">
          <button className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10" type="button" onClick={() => setScreen('detail')} aria-label="Back to message">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white px-3 py-2 text-black">
            {risky ? <TriangleAlert className="h-4 w-4 shrink-0 text-black" /> : <LockKeyhole className="h-4 w-4 shrink-0 text-black" />}
            <span className="truncate font-mono text-[11px]">{visibleUrl(browserUrl)}</span>
          </div>
          <MoreHorizontal className="h-5 w-5 text-white/75" />
        </div>

        <div className="bg-white p-4">
          {risky ? (
            <>
              <div className="mb-4 rounded-2xl bg-secondary/20 p-3">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-xs font-bold uppercase">Suspicious page</p>
                    <p className="mt-1 text-xs leading-5 text-black/65">This simulated site asks for sensitive data after pressure from a message.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-black p-4 text-white">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-black">
                      <LockKeyhole className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Account verification</p>
                      <p className="font-mono text-[10px] text-white/55">{visibleUrl(browserUrl)}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="block">
                    <span className="text-[11px] font-semibold text-white/65">Email or username</span>
                    <input className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm text-black outline-none" placeholder="student@school.edu" readOnly />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-semibold text-white/65">Password</span>
                    <input className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm text-black outline-none" placeholder="Do not enter passwords" readOnly type="password" />
                  </label>
                  <button className="w-full rounded-full bg-secondary py-3 text-sm font-bold text-black" type="button" onClick={() => recordAction('Suspicious site reported')}>
                    Report this site
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-3xl bg-black p-4 text-white">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-black">
                  <Globe2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">{safeTitle}</p>
                  <p className="font-mono text-[10px] text-white/55">{visibleUrl(browserUrl)}</p>
                </div>
              </div>
              <div className="space-y-3 rounded-2xl bg-white p-3 text-black">
                <p className="text-sm font-bold">{knownSafeTrainingPage ? 'Book hold ready' : visibleUrl(browserUrl)}</p>
                <p className="text-xs leading-5 text-black/65">{safeBody}</p>
                <button className="w-full rounded-full bg-black py-2.5 text-xs font-bold text-white" type="button" onClick={() => recordAction('Safe page noted')}>
                  Mark as expected
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button className="rounded-xl bg-black/5 py-3 text-xs font-bold text-black hover:bg-black/10" type="button" onClick={() => setScreen('detail')}>
              Back to message
            </button>
            <button className="rounded-xl bg-secondary py-3 text-xs font-bold text-black" type="button" onClick={() => recordAction(risky ? 'Browser warning saved' : 'Page checked')}>
              Save result
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {open ? (
        <aside className="fixed inset-y-0 right-0 z-40 flex w-full items-center justify-center bg-black p-0 text-white sm:w-[420px]">
          <div className="absolute right-3 top-3 z-10">
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-secondary hover:text-black" type="button" aria-label="Close simulator" onClick={onClose}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="h-dvh w-full bg-white p-2 text-black shadow-2xl shadow-secondary/40 sm:h-[calc(100dvh-16px)] sm:w-[390px] sm:rounded-[2.2rem] sm:p-3">
            <div className="flex h-full flex-col overflow-hidden rounded-[1.55rem] bg-black p-3 text-white sm:rounded-[1.75rem] sm:p-4">
              <StatusBar />

              <div className="mt-3 grid shrink-0 grid-cols-3 gap-2 rounded-2xl bg-white/5 p-1">
                {(Object.keys(appMeta) as AppKey[]).map((key) => {
                  const Icon = appMeta[key].icon;
                  const selectedApp = activeApp === key;
                  return (
                    <button
                      key={key}
                      className={`flex items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-semibold transition ${selectedApp ? 'bg-secondary text-black' : 'text-white/65 hover:bg-white/10 hover:text-white'}`}
                      type="button"
                      onClick={() => selectApp(key)}
                    >
                      <Icon className="h-4 w-4" />
                      {appMeta[key].label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
                {screen === 'list'
                  ? renderInbox()
                  : screen === 'browser'
                    ? renderBrowser()
                    : activeApp === 'email'
                      ? renderEmailDetail()
                      : renderChatDetail()}
              </div>

              {screen === 'detail' ? (
                <div className="shrink-0">
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button className="flex items-center justify-center gap-2 rounded-xl bg-white/10 py-2.5 text-sm font-bold text-white" type="button" onClick={() => recordAction('Archived')}>
                      <Archive className="h-4 w-4" />
                      Archive
                    </button>
                    <button className="flex items-center justify-center gap-2 rounded-xl bg-secondary py-2.5 text-sm font-bold text-black" type="button" onClick={() => recordAction(selected.action)}>
                      <Flag className="h-4 w-4" />
                      {selected.action}
                    </button>
                  </div>

                  {completedAction ? (
                    <div className="mt-2 rounded-xl bg-white/10 p-2.5 text-xs text-white">
                      <CheckCircle2 className="mr-2 inline h-4 w-4 text-secondary" />
                      <span className="font-semibold text-secondary">{completedAction}</span> recorded for this simulated app.
                    </div>
                  ) : null}
                </div>
              ) : screen === 'browser' ? (
                completedAction ? (
                  <div className="mt-2 shrink-0 rounded-xl bg-white/10 p-2.5 text-xs text-white">
                    <CheckCircle2 className="mr-2 inline h-4 w-4 text-secondary" />
                    <span className="font-semibold text-secondary">{completedAction}</span> recorded from browser inspection.
                  </div>
                ) : (
                  <div className="mt-2 shrink-0 rounded-2xl bg-secondary/15 p-2.5 text-xs text-white/75">
                    Use the address bar and page content to judge whether the link matches the original message.
                  </div>
                )
              ) : (
                <div className="mt-2 shrink-0 rounded-2xl bg-secondary/15 p-2.5 text-xs text-white/75">
                  Select a message to inspect it, reply, and practice the safest response.
                </div>
              )}
            </div>
          </div>
        </aside>
      ) : null}

      <button
        className={`fixed bottom-24 right-5 z-50 h-14 w-14 items-center justify-center rounded-full bg-secondary text-black shadow-2xl shadow-secondary/40 active:scale-95 md:bottom-6 ${open ? 'hidden' : 'flex'}`}
        type="button"
        aria-label={open ? 'Close mobile simulator' : 'Open mobile simulator'}
        onClick={onToggle}
      >
        <MonitorSmartphone className="h-6 w-6" />
      </button>
    </>
  );
}
