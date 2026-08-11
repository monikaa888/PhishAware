import { Award, Eye, KeyRound, Mail, ShieldCheck, Target, Trophy, type LucideIcon } from 'lucide-react';
import type { AuthUser } from './api';
import { getSolvedChallengeIds, getSolvedChallengeStreak } from './challenge-progress';

const RECENT_KEY_PREFIX = 'phishaware_recent_challenges';

export type ChallengeActivity = {
  id: string;
  title: string;
  type: 'Email';
  category: string;
  duration: string;
  difficulty: string;
  icon: LucideIcon;
};

export const challengeCatalog: ChallengeActivity[] = [
  {
    id: 'student-aid-confirmation',
    title: 'Scholarship Confirmation',
    type: 'Email',
    category: 'Credential safety',
    duration: '8 mins',
    difficulty: 'Easy',
    icon: Mail,
  },
  {
    id: 'delivery-fee-email',
    title: 'Delivery Fee Email',
    type: 'Email',
    category: 'Payment link safety',
    duration: '10 mins',
    difficulty: 'Medium',
    icon: Mail,
  },
  {
    id: 'recruiter-verification-email',
    title: 'Recruiter Verification Email',
    type: 'Email',
    category: 'Human manipulation',
    duration: '12 mins',
    difficulty: 'Medium',
    icon: Mail,
  },
  {
    id: 'homograph-account-alert',
    title: 'Homograph Account Alert',
    type: 'Email',
    category: 'Lookalike domain',
    duration: '12 mins',
    difficulty: 'Hard',
    icon: Mail,
  },
  {
    id: 'mfa-code-pressure-email',
    title: 'MFA Code Pressure Email',
    type: 'Email',
    category: 'OTP theft',
    duration: '9 mins',
    difficulty: 'Medium',
    icon: Mail,
  },
  {
    id: 'gift-card-emergency-email',
    title: 'Gift Card Emergency Email',
    type: 'Email',
    category: 'Emotional pressure',
    duration: '11 mins',
    difficulty: 'Medium',
    icon: Mail,
  },
  {
    id: 'cloud-document-share',
    title: 'Cloud Document Share',
    type: 'Email',
    category: 'Document lure',
    duration: '10 mins',
    difficulty: 'Medium',
    icon: Mail,
  },
  {
    id: 'ceo-fraud',
    title: 'CEO Fraud',
    type: 'Email',
    category: 'Authority pressure',
    duration: '15 mins',
    difficulty: 'Hard',
    icon: Mail,
  },
];

export const badgeCatalog = [
  { title: 'First Signal', subtitle: 'First challenge solved', icon: Target, kind: 'solved', threshold: 1, tone: 'blue' },
  { title: 'Link Inspector', subtitle: 'URL pattern review', icon: Eye, kind: 'solved', threshold: 2, tone: 'amber' },
  { title: 'Scam Spotter', subtitle: 'Three challenges solved', icon: ShieldCheck, kind: 'solved', threshold: 3, tone: 'white' },
  { title: 'Pattern Hunter', subtitle: 'Five challenges solved', icon: Eye, kind: 'solved', threshold: 5, tone: 'amber' },
  { title: 'Response Ready', subtitle: 'All current scenarios solved', icon: Award, kind: 'solved', threshold: 8, tone: 'blue' },
  { title: 'Daily Defender', subtitle: 'Two day learning streak', icon: KeyRound, kind: 'streak', threshold: 2, tone: 'amber' },
  { title: 'Watchtower', subtitle: 'Five day learning streak', icon: Trophy, kind: 'streak', threshold: 5, tone: 'white' },
];

type RecentRecord = {
  id: string;
  accessedAt: string;
};

function storage() {
  return typeof window === 'undefined' ? undefined : window.localStorage;
}

function userKey(user: AuthUser | null) {
  return `${RECENT_KEY_PREFIX}:${user?.id ?? user?.email ?? 'guest'}`;
}

function relativeTime(value: string) {
  const elapsed = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.round(elapsed / 60000));
  if (minutes < 1) return 'Now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
}

export function getChallengeById(challengeId: string) {
  return challengeCatalog.find((challenge) => challenge.id === challengeId);
}

export function recordRecentChallenge(user: AuthUser | null, challengeId: string) {
  const current = getRecentChallengeRecords(user).filter((item) => item.id !== challengeId);
  const next = [{ id: challengeId, accessedAt: new Date().toISOString() }, ...current].slice(0, 6);
  storage()?.setItem(userKey(user), JSON.stringify(next));
}

export function getRecentChallengeRecords(user: AuthUser | null): RecentRecord[] {
  const raw = storage()?.getItem(userKey(user));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is RecentRecord => Boolean(item && typeof item === 'object' && 'id' in item && 'accessedAt' in item))
      .map((item) => ({ id: String(item.id), accessedAt: String(item.accessedAt) }));
  } catch {
    return [];
  }
}

export function getRecentChallenges(user: AuthUser | null) {
  const records = getRecentChallengeRecords(user);
  const recent = records
    .map((record) => {
      const challenge = getChallengeById(record.id);
      return challenge ? { ...challenge, time: relativeTime(record.accessedAt) } : null;
    })
    .filter(Boolean) as Array<ChallengeActivity & { time: string }>;

  if (recent.length) return recent.slice(0, 3);
  return challengeCatalog.slice(0, 3).map((challenge) => ({ ...challenge, time: 'Not started' }));
}

export function getEarnedBadges(completed: number, streak = 0) {
  return badgeCatalog.filter((badge) => {
    if (badge.kind === 'streak') return streak >= badge.threshold;
    return completed >= badge.threshold;
  });
}

export function getActivityStats(user: AuthUser | null, streak = 0) {
  const solvedIds = getSolvedChallengeIds(user);
  const completed = solvedIds.length;
  const activityStreak = Math.max(streak, getSolvedChallengeStreak(user));
  const total = challengeCatalog.length;
  const progress = total ? Math.round((completed / total) * 100) : 0;
  const rankName = completed >= 4 ? 'Awareness Defender' : completed >= 2 ? 'Signal Analyst' : completed >= 1 ? 'New Investigator' : 'New Learner';
  const level = Math.max(1, Math.min(5, completed + 1));
  const securityScore = Math.min(100, 35 + completed * 15);

  return {
    solvedIds,
    completed,
    total,
    progress,
    rankName,
    level,
    securityScore,
    nextChallenge: challengeCatalog.find((challenge) => !solvedIds.includes(challenge.id)) ?? challengeCatalog[0],
    earnedBadges: getEarnedBadges(completed, activityStreak),
    streak: activityStreak,
  };
}
