'use client';

import { BookOpenCheck, CheckCircle2, Clock, ExternalLink, Mail, Send, ShieldCheck, Users, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import {
  approveBusinessUser,
  assignBusinessChallenge,
  deleteBusinessAssignment,
  getBusinessAssignments as getBusinessAssignmentsApi,
  getBusinessDashboard,
  getBusinessReviews,
  rejectBusinessUser,
  saveBusinessReview,
  type BusinessAssignment,
  type BusinessChallengeReview,
  type BusinessDashboard,
} from '@/lib/api';
import { challengeCatalog } from '@/lib/challenge-activity';
import { getAuthToken } from '@/lib/auth';

const challengeReviewContent: Record<string, { emailSample: string; questions: string[]; indicators: string[] }> = {
  'student-aid-confirmation': {
    emailSample: 'A credential-verification email asks the employee to confirm account access before a deadline.',
    questions: ['Which domain owns the login page?', 'What should an employee do before entering credentials?'],
    indicators: ['Unexpected credential request', 'Deadline pressure', 'Domain mismatch'],
  },
  'delivery-fee-email': {
    emailSample: 'A parcel notice asks for a small fee and redirects to a payment form.',
    questions: ['Why are small unexpected fees risky?', 'Where should shipment status be verified?'],
    indicators: ['Tiny payment request', 'Generic parcel domain', 'Card-data form'],
  },
  'recruiter-verification-email': {
    emailSample: 'A recruiter-themed email asks for profile or account verification.',
    questions: ['What verification channel is safe?', 'Why is job opportunity pressure effective?'],
    indicators: ['Career bait', 'Unverified sender', 'Credential request'],
  },
};

function defaultReviewContent(challengeId: string) {
  return challengeReviewContent[challengeId] ?? {
    emailSample: 'A workplace email creates pressure to act through a link, reply, attachment, or form.',
    questions: ['What request is being made?', 'Which sender/domain details should be verified?', 'What is the safest business response?'],
    indicators: ['Sender mismatch', 'Urgency or authority pressure', 'Unverified link or attachment'],
  };
}

export default function BusinessPage() {
  const [dashboard, setDashboard] = useState<BusinessDashboard | null>(null);
  const [error, setError] = useState('');
  const [loadingUserId, setLoadingUserId] = useState('');
  const [assignments, setAssignments] = useState<BusinessAssignment[]>([]);
  const [reviews, setReviews] = useState<BusinessChallengeReview[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState(challengeCatalog[0]?.id ?? '');
  const [assignee, setAssignee] = useState('all');
  const pendingUsers = dashboard?.pendingUsers ?? [];
  const approvedUsers = dashboard?.approvedUsers ?? [];
  const rejectedUsers = dashboard?.rejectedUsers ?? [];
  const selectedChallenge = challengeCatalog.find((challenge) => challenge.id === selectedChallengeId) ?? challengeCatalog[0];
  const selectedChallengeReviewed = selectedChallenge ? reviews.some((review) => review.challengeId === selectedChallenge.id && review.reviewed) : false;
  const selectedCustomization = reviews.find((item) => item.challengeId === selectedChallengeId) ?? {
    challengeId: selectedChallengeId,
    audience: 'Early-career employees',
    tone: 'Plain workplace language',
    companyContext: dashboard?.business.name ? `${dashboard.business.name} internal awareness training` : 'SME workplace awareness training',
  };
  const selectedReviewContent = defaultReviewContent(selectedChallengeId);

  async function loadDashboard() {
    const token = getAuthToken();
    if (!token) return;
    const nextDashboard = await getBusinessDashboard(token);
    setDashboard(nextDashboard);
    const [nextAssignments, nextReviews] = await Promise.all([getBusinessAssignmentsApi(token), getBusinessReviews(token)]);
    setAssignments(nextAssignments);
    setReviews(nextReviews);
  }

  useEffect(() => {
    void loadDashboard().catch((caughtError) => {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not load business dashboard.');
    });
  }, []);

  async function approveUser(userId: string) {
    const token = getAuthToken();
    if (!token) return;
    setError('');
    setLoadingUserId(userId);
    try {
      await approveBusinessUser(token, userId);
      await loadDashboard();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not approve user.');
    } finally {
      setLoadingUserId('');
    }
  }

  async function rejectUser(userId: string) {
    const token = getAuthToken();
    if (!token) return;
    setError('');
    setLoadingUserId(userId);
    try {
      await rejectBusinessUser(token, userId);
      await loadDashboard();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not reject user.');
    } finally {
      setLoadingUserId('');
    }
  }

  async function saveCustomization(update: Partial<BusinessChallengeReview>) {
    const token = getAuthToken();
    if (!token || !selectedChallenge) return;
    const savedReview = await saveBusinessReview(token, selectedChallenge.id, {
      audience: update.audience ?? selectedCustomization.audience,
      tone: update.tone ?? selectedCustomization.tone,
      companyContext: update.companyContext ?? selectedCustomization.companyContext,
      reviewed: update.reviewed ?? selectedChallengeReviewed,
    });
    setReviews([savedReview, ...reviews.filter((item) => item.challengeId !== selectedChallenge.id)]);
  }

  async function assignChallenge() {
    const token = getAuthToken();
    if (!token || !selectedChallenge) return;
    const targetUser = assignee === 'all' ? undefined : approvedUsers.find((user) => user.id === assignee);
    const assignment = await assignBusinessChallenge(token, {
      challengeId: selectedChallenge.id,
      challengeTitle: selectedChallenge.title,
      assigneeType: assignee === 'all' ? 'all' : 'user',
      assigneeId: targetUser?.id,
      assigneeName: targetUser?.displayName ?? 'All approved employees',
    });
    setAssignments([assignment, ...assignments].slice(0, 20));
  }

  async function removeAssignment(assignmentId: string) {
    const token = getAuthToken();
    if (!token) return;
    await deleteBusinessAssignment(token, assignmentId);
    setAssignments(assignments.filter((assignment) => assignment.id !== assignmentId));
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-2xl bg-white/5 p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Business dashboard</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">{dashboard?.business.name ?? 'Business account'}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/65">
                Manage employees joining with your registered company domain. New users from the same domain require approval before they can access training.
              </p>
            </div>
            <div className="rounded-2xl bg-black p-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/45">Registered domain</p>
              <p className="mt-2 font-mono text-lg font-black text-primary">{dashboard?.business.domain ?? '-'}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          {[
            { label: 'Total employees', value: dashboard?.users.length ?? 0, icon: Users },
            { label: 'Pending approval', value: pendingUsers.length, icon: Clock },
            { label: 'Approved users', value: approvedUsers.length, icon: ShieldCheck },
            { label: 'Rejected', value: rejectedUsers.length, icon: XCircle },
            { label: 'Reviewed labs', value: `${reviews.filter((review) => review.reviewed).length}/${challengeCatalog.length}`, icon: BookOpenCheck },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-2xl bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-white/45">{item.label}</span>
                </div>
                <p className="mt-5 text-3xl font-black">{item.value}</p>
              </div>
            );
          })}
        </section>

        {error ? <p className="rounded-xl bg-white/10 p-4 text-sm text-white">{error}</p> : null}

        <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-2xl bg-white/5 p-5 lg:col-span-2">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Challenge assignments</p>
                <h2 className="mt-1 text-xl font-black">Assign email labs to the company</h2>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-white/60">
                  Choose a challenge and assign it to all approved employees or one specific employee. This section is business-level training management.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-black px-3 py-1.5 text-xs font-bold text-white/55">{approvedUsers.length} assignable employees</span>
                <span className="rounded-full bg-black px-3 py-1.5 text-xs font-bold text-white/55">{assignments.length} assignments</span>
              </div>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_0.85fr_auto_auto]">
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-widest text-white/45">Challenge</span>
                <select className="mt-2 w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white outline-none" value={selectedChallengeId} onChange={(event) => setSelectedChallengeId(event.target.value)}>
                  {challengeCatalog.map((challenge) => (
                    <option key={challenge.id} value={challenge.id}>{challenge.title} - {challenge.difficulty}</option>
                  ))}
                </select>
              </label>
              <Link className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-black lg:self-end" href={`/business/challenges/${selectedChallengeId}`}>
                <ExternalLink className="h-4 w-4" />
                Open review
              </Link>
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-widest text-white/45">Assign to</span>
                <select className="mt-2 w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white outline-none" value={assignee} onChange={(event) => setAssignee(event.target.value)}>
                  <option value="all">All approved employees</option>
                  {approvedUsers.map((user) => (
                    <option key={user.id} value={user.id}>{user.displayName} - {user.email}</option>
                  ))}
                </select>
              </label>
              <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-black disabled:opacity-50 lg:self-end" type="button" disabled={!approvedUsers.length || !selectedChallenge || !selectedChallengeReviewed} onClick={() => void assignChallenge()}>
                <Send className="h-4 w-4" />
                Assign
              </button>
            </div>
            {!selectedChallengeReviewed ? (
              <p className="mt-3 rounded-xl bg-black p-3 text-xs leading-5 text-white/60">
                Business review is required before assignment. Open the dedicated challenge review page, inspect the full content and questions, then tick it as reviewed.
              </p>
            ) : null}

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
              <div className="rounded-2xl bg-black p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Business review detail</p>
                <h3 className="mt-2 text-xl font-black">{selectedChallenge?.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/65">{selectedReviewContent.emailSample}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-white/45">Indicators</p>
                    <ul className="mt-2 space-y-2">
                      {selectedReviewContent.indicators.map((item) => (
                        <li key={item} className="text-xs leading-5 text-white/65">{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-white/45">Solve questions</p>
                    <ul className="mt-2 space-y-2">
                      {selectedReviewContent.questions.map((item) => (
                        <li key={item} className="text-xs leading-5 text-white/65">{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-black p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Organizational style</p>
                <div className="mt-4 space-y-3">
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-white/45">Audience</span>
                    <input className="mt-2 w-full rounded-xl bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-primary" value={selectedCustomization.audience} onChange={(event) => void saveCustomization({ audience: event.target.value })} />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-white/45">Tone</span>
                    <input className="mt-2 w-full rounded-xl bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-primary" value={selectedCustomization.tone} onChange={(event) => void saveCustomization({ tone: event.target.value })} />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-white/45">Company context</span>
                    <textarea className="mt-2 min-h-24 w-full resize-none rounded-xl bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-primary" value={selectedCustomization.companyContext} onChange={(event) => void saveCustomization({ companyContext: event.target.value })} />
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {challengeCatalog.map((challenge) => {
                const reviewed = reviews.some((review) => review.challengeId === challenge.id && review.reviewed);
                return (
                  <Link key={challenge.id} className="rounded-xl bg-black p-4 transition hover:bg-white/10" href={`/business/challenges/${challenge.id}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-black">{challenge.title}</h3>
                        <p className="mt-1 text-xs text-white/55">{challenge.category} - {challenge.difficulty}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${reviewed ? 'bg-primary/15 text-primary' : 'bg-white/10 text-white/45'}`}>
                        {reviewed ? 'Reviewed' : 'Needs review'}
                      </span>
                    </div>
                    <p className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary">
                      Open full review
                      <ExternalLink className="h-3.5 w-3.5" />
                    </p>
                  </Link>
                );
              })}
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {assignments.length ? assignments.map((assignment) => (
                <article key={assignment.id} className="rounded-xl bg-black p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-black">{assignment.challengeTitle}</h3>
                      <p className="mt-1 truncate text-xs text-white/55">Assigned to: {assignment.assigneeName}</p>
                      <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-white/35">
                        {new Date(assignment.assignedAt).toLocaleString()}
                      </p>
                    </div>
                    <button className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white/65" type="button" onClick={() => void removeAssignment(assignment.id)}>
                      Remove
                    </button>
                  </div>
                </article>
              )) : (
                <p className="rounded-xl bg-black p-4 text-sm text-white/60">No challenges assigned yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">Approval queue</h2>
                <p className="mt-1 text-sm text-white/60">Employees who signed up with @{dashboard?.business.domain ?? 'company.com'}.</p>
              </div>
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-5 space-y-3">
              {pendingUsers.length ? pendingUsers.map((user) => (
                <article key={user.id} className="flex flex-col gap-4 rounded-xl bg-black p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-black">{user.displayName}</h3>
                      <p className="truncate text-xs text-white/55">{user.email}</p>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-black text-black disabled:opacity-60"
                      type="button"
                      disabled={loadingUserId === user.id}
                      onClick={() => void approveUser(user.id)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {loadingUserId === user.id ? 'Working...' : 'Accept'}
                    </button>
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-black text-white disabled:opacity-60"
                      type="button"
                      disabled={loadingUserId === user.id}
                      onClick={() => void rejectUser(user.id)}
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                </article>
              )) : (
                <p className="rounded-xl bg-black p-4 text-sm text-white/60">No employees are waiting for approval.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">Approved employees</h2>
                <p className="mt-1 text-sm text-white/60">Users with active training access.</p>
              </div>
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-5 space-y-3">
              {approvedUsers.map((user) => (
                <article key={user.id} className="rounded-xl bg-black p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-black">{user.displayName}</h3>
                      <p className="truncate text-xs text-white/55">{user.email}</p>
                    </div>
                    <span className="rounded-full bg-primary/15 px-3 py-1 text-[10px] font-black uppercase text-primary">Active</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black">Rejected requests</h2>
              <p className="mt-1 text-sm text-white/60">Users who requested access but were rejected by the business admin.</p>
            </div>
            <XCircle className="h-5 w-5 text-white/45" />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {rejectedUsers.length ? rejectedUsers.map((user) => (
              <article key={user.id} className="rounded-xl bg-black p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-black">{user.displayName}</h3>
                    <p className="truncate text-xs text-white/55">{user.email}</p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase text-white/55">Rejected</span>
                </div>
              </article>
            )) : (
              <p className="rounded-xl bg-black p-4 text-sm text-white/60">No rejected requests.</p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
