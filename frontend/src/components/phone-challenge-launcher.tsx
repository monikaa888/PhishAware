'use client';

import {
  Archive,
  CheckCircle2,
  ChevronLeft,
  ExternalLink,
  FileText,
  Flag,
  Globe2,
  Inbox,
  LockKeyhole,
  Mail,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Paperclip,
  Search,
  Send,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type AppKey = 'email';
type LabScreen = 'inbox' | 'email' | 'browser' | 'attachment';
type WebAppKind = 'school-login' | 'payment' | 'career-verify' | 'bank-login' | 'cloud-login' | 'vendor-login' | 'library';
type ActivityKind = 'delivered' | 'inbox_view' | 'message_open' | 'reply' | 'link_open' | 'attachment_open' | 'browser_close' | 'form_touch' | 'form_submit' | 'message_action' | 'browser_action' | 'lab_close';
type ActivityEvent = {
  kind: ActivityKind;
  label: string;
  detail?: string;
  value?: string;
  at: string;
};

type MessageItem = {
  id: string;
  challengeId?: string;
  sender: string;
  meta: string;
  title: string;
  preview: string;
  body: string;
  time: string;
  action: string;
  linkUrl?: string;
  attachmentName?: string;
  attachmentSummary?: string;
  webApp?: WebAppKind;
  risky?: boolean;
};

const emailMessages: MessageItem[] = [
  {
    id: 'student-aid',
    challengeId: 'student-aid-confirmation',
    sender: 'Student Aid Office',
    meta: 'aid-office@grant-verify.example',
    title: 'Scholarship confirmation required',
    preview: 'Your award is pending. Confirm your school login before 5 PM.',
    body: 'Your scholarship award is pending. Confirm your school login before 5 PM to avoid losing eligibility.',
    time: '9:12 AM',
    action: 'Report email',
    linkUrl: 'https://grant-verify.example/login',
    webApp: 'school-login',
    risky: true,
  },
  {
    id: 'delivery',
    challengeId: 'delivery-fee-email',
    sender: 'Delivery Notice',
    meta: 'support@parcel-update.example',
    title: 'Package held for redelivery',
    preview: 'Pay the small redelivery fee to release your package today.',
    body: 'Your package could not be delivered. Pay the $1.80 redelivery fee at parcel-update.example/pay before the end of the day.',
    time: '10:04 AM',
    action: 'Report email',
    linkUrl: 'https://parcel-update.example/pay',
    webApp: 'payment',
    risky: true,
  },
  {
    id: 'careers',
    challengeId: 'recruiter-verification-email',
    sender: 'Campus Careers',
    meta: 'recruiter@campus-careers-help.example',
    title: 'Paid internship eligibility check',
    preview: 'Verify your student profile to continue with the recruiter.',
    body: 'We found your profile for a paid internship. Verify your student email and password at campus-careers-help.example/verify so the recruiter can continue.',
    time: '10:32 AM',
    action: 'Report email',
    linkUrl: 'https://campus-careers-help.example/verify',
    webApp: 'career-verify',
    risky: true,
  },
  {
    id: 'account-protection',
    challengeId: 'homograph-account-alert',
    sender: 'Account Protection',
    meta: 'security@paypaI-alerts.example',
    title: 'Account access limited',
    preview: 'Confirm recent activity to keep your account available.',
    body: 'We noticed a new sign-in attempt. Confirm recent activity at paypaI-alerts.example/secure to keep your account available.',
    time: '11:15 AM',
    action: 'Report email',
    linkUrl: 'https://paypaI-alerts.example/secure',
    webApp: 'bank-login',
    risky: true,
  },
  {
    id: 'mfa-code',
    challengeId: 'mfa-code-pressure-email',
    sender: 'IT Desk',
    meta: 'helpdesk@account-lockout.example',
    title: 'Code required to stop account lockout',
    preview: 'Reply with the 6-digit code you just received.',
    body: 'Your account is queued for lockout. Reply to this email with the 6-digit code you just received so we can stop it.',
    time: '11:43 AM',
    action: 'Report email',
    risky: true,
  },
  {
    id: 'gift-card',
    challengeId: 'gift-card-emergency-email',
    sender: 'Professor Hale',
    meta: 'prof.hale@faculty-help.example',
    title: 'Quick favor before my meeting ends',
    preview: 'Please buy two gift cards and email the codes. I will reimburse you.',
    body: 'I am in a meeting and cannot call. Please buy two gift cards and email the codes here. I will reimburse you before end of day.',
    time: '12:08 PM',
    action: 'Report email',
    risky: true,
  },
  {
    id: 'shared-document',
    challengeId: 'cloud-document-share',
    sender: 'Shared Documents',
    meta: 'no-reply@docs-access.example',
    title: 'Document shared: salary-review.pdf',
    preview: 'A protected document was shared with you. Sign in to view it.',
    body: 'A protected document named salary-review.pdf was shared with you. Sign in at docs-access.example/view to open it.',
    time: '12:26 PM',
    action: 'Report email',
    linkUrl: 'https://docs-access.example/view',
    attachmentName: 'salary-review.pdf',
    attachmentSummary: 'Protected document preview requires sign-in before the file opens.',
    webApp: 'cloud-login',
    risky: true,
  },
  {
    id: 'ceo-payment',
    challengeId: 'ceo-fraud',
    sender: 'Executive Office',
    meta: 'ceo.office@company-payments.example',
    title: 'Vendor payment change',
    preview: 'Handle this privately before noon. Use the new vendor details.',
    body: 'I need this handled privately before noon. Open company-payments.example/vendor and update the vendor details for today only.',
    time: '12:42 PM',
    action: 'Flag request',
    linkUrl: 'https://company-payments.example/vendor',
    attachmentName: 'updated_vendor_details.pdf',
    attachmentSummary: 'Vendor bank details changed for today only. The message asks to keep the request private.',
    webApp: 'vendor-login',
    risky: true,
  },
  {
    id: 'library',
    sender: 'Campus Library',
    meta: 'library@school.example',
    title: 'Book hold ready',
    preview: 'Your requested book is available at the front desk.',
    body: 'Your requested book is ready for pickup at the front desk. Bring your student ID.',
    time: 'Yesterday',
    action: 'Archive',
    linkUrl: 'https://library.school.example/holds',
    webApp: 'library',
  },
];

type EmailLabLauncherProps = {
  open: boolean;
  onClose: () => void;
  onToggle: () => void;
  embedded?: boolean;
};

type StartChallengeEvent = CustomEvent<{
  app: AppKey;
  messageId: string;
  challengeId: string;
}>;

type InteractionFeedback = {
  reason: string;
  submissionState?: 'empty' | 'partial' | 'filled';
  submittedFields?: string[];
  missingFields?: string[];
  activityTrail?: ActivityEvent[];
  replyText?: string;
  linkClicked?: boolean;
  formTouched?: boolean;
  browserOpened?: boolean;
  browserSubmitted?: boolean;
  browserClosedWithoutSubmit?: boolean;
};

function emitChallengeFeedback(message: MessageItem, feedback: InteractionFeedback) {
  if (typeof window === 'undefined' || !message.challengeId) return;

  window.dispatchEvent(
    new CustomEvent('phishaware:challenge-feedback', {
      detail: {
        challengeId: message.challengeId,
        messageId: message.id,
        ...feedback,
      },
    }),
  );
}

function defaultMessageId() {
  return emailMessages.find((item) => !item.challengeId)?.id ?? emailMessages[0].id;
}

function visibleMessagesFor(activeChallengeIds: string[]) {
  return emailMessages
    .filter((item) => !item.challengeId || activeChallengeIds.includes(item.challengeId))
    .sort((first, second) => {
      const firstActive = first.challengeId ? activeChallengeIds.includes(first.challengeId) : false;
      const secondActive = second.challengeId ? activeChallengeIds.includes(second.challengeId) : false;
      return Number(secondActive) - Number(firstActive);
    });
}

function cleanUrl(rawUrl: string) {
  return rawUrl.replace(/[.,!?;:)\\\]}]+$/, '');
}

function browserUrlFrom(rawUrl: string) {
  const cleaned = cleanUrl(rawUrl);
  return /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
}

function visibleUrl(url: string) {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function textLinks(text: string) {
  const urlPattern = /((?:https?:\/\/|www\.)[^\s<>()]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s<>()]*)?)/gi;
  return Array.from(text.matchAll(urlPattern), (match) => {
    const raw = cleanUrl(match[0]);
    const start = match.index ?? 0;
    return { start, end: start + raw.length, raw };
  });
}

function responseFor(message: MessageItem) {
  if (!message.risky) return 'Thanks. This message has been filed.';
  return 'Please complete the requested step so we can keep processing this request.';
}

export function EmailLabLauncher({ open, onClose, onToggle, embedded = false }: EmailLabLauncherProps) {
  const [screen, setScreen] = useState<LabScreen>('inbox');
  const [selectedId, setSelectedId] = useState(defaultMessageId());
  const [startedChallengeIds, setStartedChallengeIds] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [replyThreads, setReplyThreads] = useState<Record<string, { id: string; text: string; from: 'user' | 'sender'; time: string }[]>>({});
  const [completedAction, setCompletedAction] = useState<string | null>(null);
  const [browserUrl, setBrowserUrl] = useState(emailMessages.find((item) => item.id === defaultMessageId())?.linkUrl ?? 'https://search.example');
  const [browserForms, setBrowserForms] = useState<Record<string, Record<string, string>>>({});
  const [notification, setNotification] = useState('');
  const activityByChallengeRef = useRef<Record<string, ActivityEvent[]>>({});

  const messages = visibleMessagesFor(startedChallengeIds);
  const selected = messages.find((item) => item.id === selectedId) ?? messages[0] ?? emailMessages[0];
  const threadKey = `email:${selected.id}`;
  const draft = drafts[threadKey] ?? '';
  const replies = replyThreads[threadKey] ?? [];
  const replyFrom = 'learner@phishaware.local';
  const replySubject = `Re: ${selected.title}`;

  useEffect(() => {
    function handleStartChallenge(event: Event) {
      const detail = (event as StartChallengeEvent).detail;
      const targetMessage = emailMessages.find((item) => item.id === detail.messageId);
      if (!targetMessage) return;

      setStartedChallengeIds((current) => (current.includes(detail.challengeId) ? current : [...current, detail.challengeId]));
      setSelectedId(detail.messageId);
      setScreen('inbox');
      setCompletedAction(null);
      setBrowserUrl(targetMessage.linkUrl ?? 'https://search.example');
      setNotification(`New email: ${targetMessage.title}`);
      appendChallengeActivity(targetMessage, {
        kind: 'delivered',
        label: 'Email delivered',
        detail: 'The email appeared at the top of the lab inbox.',
      });
    }

    window.addEventListener('phishaware:start-challenge', handleStartChallenge);
    return () => window.removeEventListener('phishaware:start-challenge', handleStartChallenge);
  }, []);

  useEffect(() => {
    function removeChallengeEmail(challengeId: string, message: string) {
      setStartedChallengeIds((current) => current.filter((item) => item !== challengeId));
      activityByChallengeRef.current = Object.fromEntries(Object.entries(activityByChallengeRef.current).filter(([key]) => key !== challengeId));
      const remainingIds = startedChallengeIds.filter((item) => item !== challengeId);
      const nextMessage = visibleMessagesFor(remainingIds)[0] ?? emailMessages[0];
      setSelectedId(nextMessage.id);
      setScreen('inbox');
      setCompletedAction(null);
      setBrowserUrl(nextMessage.linkUrl ?? 'https://search.example');
      setNotification(message);
    }

    function handleChallengeSolved(event: Event) {
      removeChallengeEmail((event as CustomEvent<{ challengeId: string }>).detail.challengeId, 'Email removed from the lab inbox.');
    }

    function handleChallengeStopped(event: Event) {
      const challengeId = (event as CustomEvent<{ challengeId: string }>).detail.challengeId;
      const message = emailMessages.find((item) => item.challengeId === challengeId);
      if (message) {
        appendChallengeActivity(message, {
          kind: 'lab_close',
          label: 'Lab stopped',
          detail: 'The email was removed before the review was completed.',
        });
      }
      removeChallengeEmail(challengeId, 'Challenge stopped. Email removed from the lab inbox.');
    }

    window.addEventListener('phishaware:challenge-solved', handleChallengeSolved);
    window.addEventListener('phishaware:challenge-stopped', handleChallengeStopped);
    return () => {
      window.removeEventListener('phishaware:challenge-solved', handleChallengeSolved);
      window.removeEventListener('phishaware:challenge-stopped', handleChallengeStopped);
    };
  }, [startedChallengeIds]);

  function updateDraft(value: string) {
    setDrafts((current) => ({ ...current, [threadKey]: value }));
  }

  function selectMessage(id: string) {
    const next = messages.find((item) => item.id === id);
    if (!next) return;

    setSelectedId(id);
    setScreen('email');
    setCompletedAction(null);
    if (next.linkUrl) setBrowserUrl(next.linkUrl);
    appendChallengeActivity(next, {
      kind: 'message_open',
      label: 'Email opened',
      detail: `${next.sender} - ${next.title}`,
    });
  }

  function closeLab() {
    for (const challengeId of startedChallengeIds) {
      const message = emailMessages.find((item) => item.challengeId === challengeId);
      if (message) {
        appendChallengeActivity(message, {
          kind: 'lab_close',
          label: 'Email lab closed',
          detail: 'The lab was closed before the challenge was solved.',
        });
      }
    }
    setStartedChallengeIds([]);
    activityByChallengeRef.current = {};
    setSelectedId(defaultMessageId());
    setScreen('inbox');
    setCompletedAction(null);
    setNotification('');
    onClose();
  }

  function sendReply() {
    const trimmed = draft.trim();
    if (!trimmed) return;

    const now = 'Now';
    setReplyThreads((current) => ({
      ...current,
      [threadKey]: [
        ...(current[threadKey] ?? []),
        { id: `${threadKey}:user:${Date.now()}`, from: 'user', text: trimmed, time: now },
        { id: `${threadKey}:sender:${Date.now()}`, from: 'sender', text: responseFor(selected), time: now },
      ],
    }));
    appendChallengeActivity(
      selected,
      {
        kind: 'reply',
        label: 'Email reply sent',
        detail: trimmed,
        value: trimmed,
      },
      { replyText: trimmed },
    );
    updateDraft('');
  }

  function openBrowser(url = selected.linkUrl ?? browserUrl) {
    const nextBrowserUrl = browserUrlFrom(url);
    setBrowserUrl(nextBrowserUrl);
    setScreen('browser');
    setCompletedAction(null);
    appendChallengeActivity(selected, {
      kind: 'link_open',
      label: 'Email link opened',
      detail: visibleUrl(nextBrowserUrl),
      value: nextBrowserUrl,
    });
  }

  function openAttachment() {
    setScreen('attachment');
    setCompletedAction(null);
    appendChallengeActivity(selected, {
      kind: 'attachment_open',
      label: 'Attachment opened',
      detail: selected.attachmentName ?? 'Attachment preview opened.',
    });
  }

  function recordAction(action: string, feedback?: Omit<InteractionFeedback, 'reason'>) {
    setCompletedAction(action);
    appendChallengeActivity(
      selected,
      {
        kind: screen === 'browser' ? 'browser_action' : 'message_action',
        label: action,
        detail: screen === 'browser' ? 'Action recorded from browser view.' : 'Action recorded from email view.',
      },
      feedback,
    );
  }

  function browserFormValue(name: string) {
    return browserForms[threadKey]?.[name] ?? '';
  }

  function updateBrowserForm(name: string, value: string) {
    setBrowserForms((current) => ({
      ...current,
      [threadKey]: {
        ...(current[threadKey] ?? {}),
        [name]: value,
      },
    }));
    if (selected.challengeId && value.length > 0) {
      appendChallengeActivity(selected, {
        kind: 'form_touch',
        label: 'Form field edited',
        detail: `${name} field was edited.`,
        value: name,
      });
    }
  }

  function submitWebApp(action: string, requiredFields: string[]) {
    const currentValues = browserForms[threadKey] ?? {};
    const submittedFields = requiredFields.filter((field) => currentValues[field]?.trim());
    const missingFields = requiredFields.filter((field) => !currentValues[field]?.trim());
    const submissionState = submittedFields.length === 0 ? 'empty' : missingFields.length > 0 ? 'partial' : 'filled';

    appendChallengeActivity(
      selected,
      {
        kind: 'form_submit',
        label: action,
        detail: submissionState === 'empty' ? 'Submitted with no required fields filled.' : submissionState === 'partial' ? 'Submitted with some required fields filled.' : 'Submitted with all required fields filled.',
      },
      { reason: action, submissionState, submittedFields, missingFields },
    );
    setCompletedAction(action);
  }

  function summarizeActivity(trail: ActivityEvent[], extra?: Partial<InteractionFeedback>) {
    const latestReply = [...trail].reverse().find((item) => item.kind === 'reply')?.value;
    const browserOpened = trail.some((item) => item.kind === 'link_open');
    const browserSubmitted = trail.some((item) => item.kind === 'form_submit');
    const formTouched = trail.some((item) => item.kind === 'form_touch');
    const browserClosedWithoutSubmit = trail.some((item) => item.kind === 'browser_close') && !browserSubmitted;
    return {
      activityTrail: trail,
      replyText: latestReply,
      linkClicked: browserOpened,
      browserOpened,
      formTouched,
      browserSubmitted,
      browserClosedWithoutSubmit,
      ...extra,
    };
  }

  function appendChallengeActivity(message: MessageItem, input: Omit<ActivityEvent, 'at'>, feedback?: Partial<InteractionFeedback>) {
    if (!message.challengeId) return;

    const event = { ...input, at: new Date().toISOString() };
    const currentTrail = activityByChallengeRef.current[message.challengeId] ?? [];
    const nextTrail = [...currentTrail, event];
    activityByChallengeRef.current = { ...activityByChallengeRef.current, [message.challengeId]: nextTrail };
    emitChallengeFeedback(message, {
      reason: feedback?.reason ?? event.label,
      ...summarizeActivity(nextTrail, feedback),
    });
  }

  function closeBrowser() {
    const submitted = selected.challengeId ? (activityByChallengeRef.current[selected.challengeId] ?? []).some((item) => item.kind === 'form_submit') : false;
    appendChallengeActivity(selected, {
      kind: 'browser_close',
      label: submitted ? 'Browser closed after interaction' : 'Browser closed without form submission',
      detail: submitted ? 'The learner returned from the web page after submitting or saving an action.' : 'The learner opened the web page and returned without submitting a form.',
    });
    setScreen('email');
  }

  function renderLinkedMessageText(text: string) {
    const links = textLinks(text);
    if (!links.length) return <p>{text}</p>;

    const parts = [];
    let cursor = 0;

    for (const link of links) {
      if (link.start > cursor) parts.push(<span key={`text:${cursor}`}>{text.slice(cursor, link.start)}</span>);
      parts.push(
        <button key={`link:${link.start}:${link.raw}`} className="inline-flex max-w-full align-baseline font-bold text-primary underline underline-offset-2" type="button" onClick={() => openBrowser(link.raw)}>
          {link.raw}
        </button>,
      );
      cursor = link.end;
    }

    if (cursor < text.length) parts.push(<span key={`text:${cursor}`}>{text.slice(cursor)}</span>);
    return <p>{parts}</p>;
  }

  function renderInbox() {
    return (
      <div className="grid h-full min-h-0 grid-cols-1 overflow-hidden bg-white text-black lg:grid-cols-[300px_1fr]">
        <aside className="min-h-0 bg-[#f6f8fb]">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
                <Inbox className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black">Inbox</p>
                <p className="text-[11px] text-black/55">{messages.length} emails</p>
              </div>
            </div>
            <MoreHorizontal className="h-5 w-5 text-black/50" />
          </div>
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs text-black/50 shadow-sm">
              <Search className="h-4 w-4" />
              Search mail
            </div>
          </div>
          <div className="max-h-[calc(100dvh-190px)] overflow-y-auto px-2 pb-3">
            {messages.map((item) => {
              const active = item.id === selected.id;
              return (
                <button key={item.id} className={`mb-1 grid w-full grid-cols-[10px_1fr] gap-2 rounded-xl px-2 py-3 text-left transition ${active ? 'bg-white shadow-sm' : 'hover:bg-white/70'}`} type="button" onClick={() => selectMessage(item.id)}>
                  <span className={`mt-1.5 h-2 w-2 rounded-full ${item.risky ? 'bg-secondary' : 'bg-primary'}`} />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-black text-black">{item.sender}</p>
                        <span className="shrink-0 text-[10px] text-black/45">{item.time}</span>
                      </div>
                      <p className="truncate text-xs font-semibold text-black/70">{item.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-black/55">{item.preview}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
        <section className="hidden min-h-0 overflow-y-auto p-5 lg:block">
          {renderEmailDetail(false)}
        </section>
      </div>
    );
  }

  function renderEmailDetail(wrapped = true) {
    return (
      <div className={wrapped ? 'bg-white p-4 text-black' : 'text-black'}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <button className="flex items-center gap-1 text-xs font-semibold text-black/55 lg:hidden" type="button" onClick={() => setScreen('inbox')}>
            <ChevronLeft className="h-4 w-4" />
            Inbox
          </button>
          <div className="hidden items-center gap-2 text-xs text-black/45 lg:flex">
            <button className="rounded-lg px-2 py-1 hover:bg-black/5" type="button" onClick={() => recordAction('Archived')}>Archive</button>
            <button className="rounded-lg px-2 py-1 hover:bg-black/5" type="button" onClick={() => recordAction(selected.action)}>{selected.action}</button>
          </div>
          <span className="rounded-lg bg-black/5 px-2 py-1 text-[10px] font-bold uppercase text-black/55">Mail</span>
        </div>
        <h3 className="text-2xl font-black tracking-tight">{selected.title}</h3>
        <div className="mt-5 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e7eefc] text-sm font-black text-primary">
            {selected.sender.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-black">{selected.sender}</p>
              <span className="text-[10px] text-black/45">{selected.time}</span>
            </div>
            <p className="truncate font-mono text-[11px] text-black/55">{selected.meta}</p>
            <div className="mt-5 max-w-3xl text-sm leading-7 text-black/75">
              <p className="mb-4">Hello,</p>
              {renderLinkedMessageText(selected.body)}
              <p className="mt-5">Regards,</p>
              <p className="font-semibold">{selected.sender}</p>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {selected.linkUrl ? (
                <button className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-[#f1f5f9] px-3 py-3 text-left text-xs font-semibold text-black hover:bg-[#e2e8f0]" type="button" onClick={() => openBrowser(selected.linkUrl)}>
                  <span className="min-w-0 truncate">{visibleUrl(selected.linkUrl)}</span>
                  <ExternalLink className="h-4 w-4 shrink-0 text-black/55" />
                </button>
              ) : null}
              {selected.attachmentName ? (
                <button className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-[#f1f5f9] px-3 py-3 text-left text-xs font-semibold text-black hover:bg-[#e2e8f0]" type="button" onClick={openAttachment}>
                  <span className="min-w-0 truncate">{selected.attachmentName}</span>
                  <Paperclip className="h-4 w-4 shrink-0 text-black/55" />
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {replies.map((line) => (
          <div key={line.id} className="mt-5 rounded-xl bg-[#f8fafc] p-3 text-sm text-black">
            <p className="text-[11px] font-bold uppercase tracking-widest text-black/40">{line.from === 'user' ? 'You replied' : selected.sender}</p>
            <p className="mt-2">{line.text}</p>
            <p className="mt-2 text-right text-[10px] text-black/45">{line.time}</p>
          </div>
        ))}

        <div className="mt-5 overflow-hidden rounded-xl bg-[#f8fafc]">
          <div className="grid gap-0 text-xs text-black/65">
            <div className="grid grid-cols-[72px_1fr] items-center px-3 py-2">
              <span className="font-bold text-black/45">From</span>
              <span className="truncate font-mono">{replyFrom}</span>
            </div>
            <div className="grid grid-cols-[72px_1fr] items-center px-3 py-2">
              <span className="font-bold text-black/45">To</span>
              <span className="truncate font-mono">{selected.meta}</span>
            </div>
            <div className="grid grid-cols-[72px_1fr] items-center px-3 py-2">
              <span className="font-bold text-black/45">Subject</span>
              <span className="truncate font-semibold text-black/75">{replySubject}</span>
            </div>
          </div>
          <textarea className="min-h-24 w-full resize-none bg-white px-3 py-3 text-sm outline-none placeholder:text-black/40" placeholder="Write your email reply..." value={draft} onChange={(event) => updateDraft(event.target.value)} />
          <div className="flex items-center justify-between px-3 py-3">
            <Paperclip className="h-4 w-4 text-black/45" />
            <button className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white" type="button" onClick={sendReply}>
              Send
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderAttachment() {
    return (
      <div className="rounded-2xl bg-white p-4 text-black">
        <button className="mb-4 flex items-center gap-1 text-xs font-semibold text-black/55" type="button" onClick={() => setScreen('email')}>
          <ChevronLeft className="h-4 w-4" />
          Back to email
        </button>
        <div className="rounded-2xl bg-black p-5 text-white">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
              <FileText className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white/45">Attachment preview</p>
              <h3 className="mt-1 text-xl font-black">{selected.attachmentName ?? 'Document preview'}</h3>
              <p className="mt-2 text-sm leading-6 text-white/70">{selected.attachmentSummary ?? 'This attachment asks the reader to continue through the email action path.'}</p>
            </div>
          </div>
          <div className="mt-5 rounded-xl bg-white/10 p-4">
            <p className="text-sm font-bold">Document content</p>
            <p className="mt-2 text-sm leading-6 text-white/65">The document preview references an urgent action, a link, or private account details. Review whether the sender, domain, request, and attachment purpose belong together.</p>
          </div>
          <button className="mt-4 w-full rounded-full bg-secondary px-4 py-3 text-sm font-black text-black" type="button" onClick={() => recordAction('Attachment reviewed')}>
            Mark attachment reviewed
          </button>
        </div>
      </div>
    );
  }

  function renderBrowser() {
    const webApp = selected.webApp ?? 'library';

    function renderCredentialApp(title: string, subtitle: string, action: string, success: string, requiredFields = ['email', 'password']) {
      return (
        <div className="rounded-2xl bg-white p-4 text-black">
          <div className="mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <p className="mt-3 text-lg font-black">{title}</p>
            <p className="font-mono text-[10px] text-black/45">{visibleUrl(browserUrl)}</p>
            <p className="mt-3 text-sm leading-5 text-black/65">{subtitle}</p>
          </div>
          <div className="space-y-3">
            {requiredFields.includes('name') ? (
              <label className="block">
                <span className="text-[11px] font-semibold text-black/55">Full name</span>
                <input className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm outline-none" value={browserFormValue('name')} onChange={(event) => updateBrowserForm('name', event.target.value)} />
              </label>
            ) : null}
            <label className="block">
              <span className="text-[11px] font-semibold text-black/55">Email</span>
              <input className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm outline-none" placeholder="name@example.com" value={browserFormValue('email')} onChange={(event) => updateBrowserForm('email', event.target.value)} />
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold text-black/55">Password</span>
              <input className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm outline-none" placeholder="Password" type="password" value={browserFormValue('password')} onChange={(event) => updateBrowserForm('password', event.target.value)} />
            </label>
            {requiredFields.includes('note') ? (
              <label className="block">
                <span className="text-[11px] font-semibold text-black/55">Vendor note</span>
                <input className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm outline-none" value={browserFormValue('note')} onChange={(event) => updateBrowserForm('note', event.target.value)} />
              </label>
            ) : null}
            <button className="w-full rounded-full bg-primary py-3 text-sm font-bold text-white" type="button" onClick={() => submitWebApp(action, requiredFields)}>
              Continue
            </button>
          </div>
          {completedAction ? <p className="mt-3 rounded-xl bg-white p-3 text-xs text-black/65">{success}</p> : null}
        </div>
      );
    }

    function renderPaymentApp() {
      return (
        <div className="rounded-2xl bg-white p-4 text-black">
          <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-black/45">Redelivery fee</p>
            <p className="mt-1 text-3xl font-black">$1.80</p>
            <p className="mt-1 font-mono text-[10px] text-black/45">{visibleUrl(browserUrl)}</p>
          </div>
          <div className="space-y-3">
            <label className="block">
              <span className="text-[11px] font-semibold text-black/55">Card number</span>
              <input className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm outline-none" placeholder="1234 5678 9012 3456" value={browserFormValue('card')} onChange={(event) => updateBrowserForm('card', event.target.value)} />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[11px] font-semibold text-black/55">Expiry</span>
                <input className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm outline-none" placeholder="MM/YY" value={browserFormValue('expiry')} onChange={(event) => updateBrowserForm('expiry', event.target.value)} />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold text-black/55">CVV</span>
                <input className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm outline-none" placeholder="123" value={browserFormValue('cvv')} onChange={(event) => updateBrowserForm('cvv', event.target.value)} />
              </label>
            </div>
            <button className="w-full rounded-full bg-primary py-3 text-sm font-bold text-white" type="button" onClick={() => submitWebApp('Payment form submitted', ['card', 'expiry', 'cvv'])}>
              Pay fee
            </button>
          </div>
          {completedAction ? <p className="mt-3 rounded-xl bg-white p-3 text-xs text-black/65">Payment successful. Redelivery has been scheduled.</p> : null}
        </div>
      );
    }

    const app =
      webApp === 'school-login'
        ? renderCredentialApp('Student Portal', 'Sign in to continue scholarship confirmation.', 'Portal sign in submitted', 'Sign in successful. Your session is active.')
        : webApp === 'payment'
          ? renderPaymentApp()
          : webApp === 'career-verify'
            ? renderCredentialApp('Campus Careers', 'Verify student eligibility to continue the recruiter process.', 'Career verification submitted', 'Verification successful. Your recruiter profile has been updated.')
            : webApp === 'bank-login'
              ? renderCredentialApp('Account Protection', 'Confirm account access to remove the temporary hold.', 'Account protection submitted', 'Account confirmed. Access has been restored.')
              : webApp === 'cloud-login'
                ? renderCredentialApp('Secure Document Viewer', 'Sign in to continue opening the protected document.', 'Document sign in submitted', 'Document access confirmed. Opening shared file.')
                : webApp === 'vendor-login'
                  ? renderCredentialApp('Vendor Access', 'Sign in to review the pending vendor update.', 'Vendor update submitted', 'Request accepted. The update has been submitted.', ['email', 'password', 'note'])
                  : renderCredentialApp('Campus Library', 'Review your book hold from the library portal.', 'Safe page noted', 'Book hold confirmed.', ['email']);

    return (
      <div className="overflow-hidden rounded-2xl bg-white text-black">
        <div className="flex items-center gap-2 bg-black px-3 py-3 text-white">
          <button className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10" type="button" onClick={closeBrowser} aria-label="Back to email">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white px-3 py-2 text-black">
            <LockKeyhole className="h-4 w-4 shrink-0 text-black" />
            <span className="truncate font-mono text-[11px]">{visibleUrl(browserUrl)}</span>
          </div>
          <MoreHorizontal className="h-5 w-5 text-white/75" />
        </div>
        <div className="bg-white p-4">
          {app}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button className="rounded-xl bg-black/5 py-3 text-xs font-bold text-black hover:bg-black/10" type="button" onClick={closeBrowser}>
              Back to email
            </button>
            <button className="rounded-xl bg-secondary py-3 text-xs font-bold text-black" type="button" onClick={() => recordAction('Page checked')}>
              Save result
            </button>
          </div>
        </div>
      </div>
    );
  }

  const closeFullscreen = embedded ? onClose : closeLab;
  const mailClient = (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-white text-black">
      <div className="flex shrink-0 items-center justify-between gap-3 bg-[#f6f8fb] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black">Mail</p>
            <p className="text-xs text-black/55">Inbox, message viewer, links, attachments, and replies.</p>
          </div>
        </div>
        <div className="mr-10" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-white">
        {notification ? (
          <div className="m-3 rounded-xl bg-[#e7eefc] p-3 text-black">
            <p className="text-[10px] font-bold uppercase tracking-widest text-black/50">Notification</p>
            <p className="mt-1 text-sm font-bold">{notification}</p>
          </div>
        ) : null}
        {screen === 'inbox' ? renderInbox() : screen === 'browser' ? renderBrowser() : screen === 'attachment' ? renderAttachment() : renderEmailDetail()}
      </div>

      {screen === 'email' || screen === 'attachment' ? (
        <div className="shrink-0 bg-[#f6f8fb] p-3">
          <div className="grid grid-cols-2 gap-2">
            <button className="flex items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-bold text-black shadow-sm" type="button" onClick={() => recordAction('Archived')}>
              <Archive className="h-4 w-4" />
              Archive
            </button>
            <button className="flex items-center justify-center gap-2 rounded-xl bg-secondary py-2.5 text-sm font-bold text-black" type="button" onClick={() => recordAction(selected.action)}>
              <Flag className="h-4 w-4" />
              {selected.action}
            </button>
          </div>
          {completedAction ? (
            <div className="mt-2 rounded-xl bg-white p-2.5 text-xs text-black shadow-sm">
              <CheckCircle2 className="mr-2 inline h-4 w-4 text-secondary" />
              <span className="font-semibold text-secondary">{completedAction}</span> recorded.
            </div>
          ) : null}
        </div>
      ) : screen === 'browser' && completedAction ? (
        <div className="shrink-0 bg-[#f6f8fb] p-3 text-xs text-black">
          <CheckCircle2 className="mr-2 inline h-4 w-4 text-secondary" />
          <span className="font-semibold text-secondary">{completedAction}</span> recorded.
        </div>
      ) : (
        <div className="shrink-0 bg-[#f6f8fb] p-3 text-xs text-black/60">
          Open an email to inspect the sender, wording, links, attachments, and reply path.
        </div>
      )}

      <button
        className="absolute bottom-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black text-white shadow-xl active:scale-95"
        type="button"
        aria-label={open ? 'Close fullscreen' : 'Open fullscreen'}
        onClick={open ? closeFullscreen : onToggle}
      >
        {open ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
      </button>
    </div>
  );

  if (embedded) {
    return (
      <>
        <div className="h-[620px] min-h-[520px] overflow-hidden rounded-2xl bg-white text-black">
          {mailClient}
        </div>
        {open ? (
          <aside className="fixed inset-0 z-[80] bg-white text-black">
            {mailClient}
          </aside>
        ) : null}
      </>
    );
  }

  return (
    <>
      {open ? (
        <aside className="fixed inset-0 z-40 flex w-full items-stretch justify-center bg-white p-0 text-white">
          <div className="absolute right-3 top-3 z-10">
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-black/10 text-black hover:bg-secondary hover:text-black" type="button" aria-label="Close email lab" onClick={closeLab}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="h-dvh w-full bg-white text-black shadow-2xl shadow-black/20">
            {mailClient}
          </div>
        </aside>
      ) : null}

      <button className={`fixed bottom-24 right-5 z-50 h-14 w-14 items-center justify-center rounded-full bg-secondary text-black shadow-2xl shadow-secondary/40 active:scale-95 md:bottom-6 ${open ? 'hidden' : 'flex'}`} type="button" aria-label={open ? 'Close email lab' : 'Open email lab'} onClick={onToggle}>
        <Mail className="h-6 w-6" />
      </button>
    </>
  );
}
