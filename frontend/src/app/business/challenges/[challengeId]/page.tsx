'use client';

import { ArrowLeft, CheckCircle2, ClipboardCheck, FileText, Mail, Save, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { getBusinessDashboard, getBusinessReviews, saveBusinessReview, type BusinessChallengeReview, type BusinessDashboard } from '@/lib/api';
import { getAuthToken } from '@/lib/auth';
import { getChallengeById } from '@/lib/challenge-activity';
import { getBusinessChallengeReview } from '@/lib/challenge-review';

export default function BusinessChallengeReviewPage() {
  const params = useParams<{ challengeId: string }>();
  const challengeId = params.challengeId;
  const challenge = getChallengeById(challengeId);
  const review = getBusinessChallengeReview(challengeId);
  const [dashboard, setDashboard] = useState<BusinessDashboard | null>(null);
  const [reviews, setReviews] = useState<BusinessChallengeReview[]>([]);
  const [audience, setAudience] = useState('Early-career SME employees');
  const [tone, setTone] = useState('Clear, professional workplace language');
  const [companyContext, setCompanyContext] = useState('');
  const currentReview = reviews.find((item) => item.challengeId === challengeId);
  const reviewed = Boolean(currentReview?.reviewed);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    void getBusinessDashboard(token).then((nextDashboard) => {
      setDashboard(nextDashboard);
      void getBusinessReviews(token).then((nextReviews) => {
        const savedReview = nextReviews.find((item) => item.challengeId === challengeId);
        setReviews(nextReviews);
        setAudience(savedReview?.audience ?? 'Early-career SME employees');
        setTone(savedReview?.tone ?? 'Clear, professional workplace language');
        setCompanyContext(savedReview?.companyContext ?? `${nextDashboard.business.name} employees using @${nextDashboard.business.domain}`);
      });
    });
  }, [challengeId]);

  async function saveCustomization(markReviewed = false) {
    const token = getAuthToken();
    if (!token || !dashboard) return;
    const savedReview = await saveBusinessReview(token, challengeId, {
      audience,
      tone,
      companyContext,
      reviewed: markReviewed ? true : currentReview?.reviewed,
    });
    setReviews([savedReview, ...reviews.filter((item) => item.challengeId !== challengeId)]);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-5">
        <Link className="inline-flex items-center gap-2 text-sm font-bold text-primary" href="/business">
          <ArrowLeft className="h-4 w-4" />
          Back to business dashboard
        </Link>

        <section className="rounded-2xl bg-white/5 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Business challenge review</p>
              <h1 className="mt-2 text-2xl font-black tracking-tight md:text-4xl">{challenge?.title ?? 'Challenge review'}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">{review.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-black px-3 py-1.5 text-xs font-bold text-white/60">{challenge?.difficulty ?? 'Custom'} level</span>
                <span className="rounded-full bg-black px-3 py-1.5 text-xs font-bold text-white/60">{challenge?.duration ?? 'Variable'}</span>
                <span className="rounded-full bg-black px-3 py-1.5 text-xs font-bold text-white/60">{challenge?.category ?? 'Email security'}</span>
              </div>
            </div>
            <button
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black ${reviewed ? 'bg-primary/15 text-primary' : 'bg-primary text-black'}`}
              type="button"
              onClick={() => void saveCustomization(true)}
            >
              <CheckCircle2 className="h-4 w-4" />
              {reviewed ? 'Reviewed' : 'Tick as reviewed'}
            </button>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <article className="overflow-hidden rounded-2xl bg-white text-black">
              <div className="flex items-center justify-between bg-[#F3F4F6] px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Mail className="h-4 w-4 text-primary" />
                  Email sample reviewed by business
                </div>
                <span className="text-xs font-semibold text-black/45">Training content preview</span>
              </div>
              <div className="border-b border-black/10 p-4">
                <p className="text-sm"><span className="font-bold">From:</span> {review.email.from}</p>
                <p className="mt-1 text-sm"><span className="font-bold">To:</span> {review.email.to}</p>
                <p className="mt-1 text-sm"><span className="font-bold">Subject:</span> {review.email.subject}</p>
              </div>
              <div className="space-y-4 p-5 text-sm leading-6">
                {review.email.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                <div className="rounded-xl bg-primary px-4 py-3 text-center font-black text-white">{review.email.linkText}</div>
                <p className="rounded-xl bg-[#F3F4F6] p-3 font-mono text-xs text-black/70">{review.email.linkUrl}</p>
                {review.email.attachment ? (
                  <div className="flex items-center gap-3 rounded-xl bg-[#F3F4F6] p-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="font-semibold">{review.email.attachment}</span>
                  </div>
                ) : null}
              </div>
            </article>

            <article className="rounded-2xl bg-white/5 p-5">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                <ClipboardCheck className="h-4 w-4" />
                Solve questions visible to business
              </p>
              <div className="mt-4 space-y-4">
                {review.questions.map((question, index) => (
                  <div key={question.prompt} className="rounded-xl bg-black p-4">
                    <p className="text-sm font-black">Question {index + 1}: {question.prompt}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {question.options.map((option) => (
                        <span key={option} className={`rounded-lg px-3 py-2 text-xs font-semibold ${option === question.answer ? 'bg-primary/15 text-primary' : 'bg-white/5 text-white/60'}`}>
                          {option}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-xs leading-5 text-white/60">{question.explanation}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <aside className="space-y-5">
            <article className="rounded-2xl bg-white/5 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Organization style</p>
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-white/45">Audience</span>
                  <input className="mt-2 w-full rounded-xl bg-black px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-primary" value={audience} onChange={(event) => setAudience(event.target.value)} />
                </label>
                <label className="block">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-white/45">Tone</span>
                  <input className="mt-2 w-full rounded-xl bg-black px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-primary" value={tone} onChange={(event) => setTone(event.target.value)} />
                </label>
                <label className="block">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-white/45">Company context</span>
                  <textarea className="mt-2 min-h-28 w-full resize-none rounded-xl bg-black px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-primary" value={companyContext} onChange={(event) => setCompanyContext(event.target.value)} />
                </label>
                <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-black text-white" type="button" onClick={() => void saveCustomization(false)}>
                  <Save className="h-4 w-4" />
                  Save customization
                </button>
              </div>
            </article>

            <article className="rounded-2xl bg-white/5 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">What this lab teaches</p>
              <ul className="mt-4 space-y-2">
                {review.objectives.map((item) => <li key={item} className="text-sm leading-6 text-white/65">{item}</li>)}
              </ul>
            </article>

            <article className="rounded-2xl bg-white/5 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Indicators business can review</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {review.indicators.map((item) => <span key={item} className="rounded-full bg-black px-3 py-1.5 text-xs font-bold text-white/65">{item}</span>)}
              </div>
            </article>

            <article className="rounded-2xl bg-white/5 p-5">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                <ShieldCheck className="h-4 w-4" />
                Expected reporting guidance
              </p>
              <ul className="mt-4 space-y-2">
                {review.reporting.map((item) => <li key={item} className="text-sm leading-6 text-white/65">{item}</li>)}
              </ul>
            </article>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}
