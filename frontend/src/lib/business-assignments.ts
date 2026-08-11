import type { AuthUser } from './api';

export type BusinessAssignment = {
  id: string;
  challengeId: string;
  challengeTitle: string;
  assigneeType: 'all' | 'user';
  assigneeId?: string;
  assigneeName: string;
  assignedAt: string;
};

export type BusinessChallengeCustomization = {
  challengeId: string;
  audience: string;
  tone: string;
  companyContext: string;
  reviewedAt?: string;
};

function storage() {
  return typeof window === 'undefined' ? undefined : window.localStorage;
}

export function assignmentStorageKey(businessId: string) {
  return `phishaware_business_assignments:${businessId}`;
}

export function reviewedStorageKey(businessId: string) {
  return `phishaware_business_reviewed_challenges:${businessId}`;
}

export function customizationStorageKey(businessId: string) {
  return `phishaware_business_challenge_customizations:${businessId}`;
}

function parseArray<T>(value: string | null): T[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

export function getBusinessAssignments(businessId?: string) {
  if (!businessId) return [];
  return parseArray<BusinessAssignment>(storage()?.getItem(assignmentStorageKey(businessId)) ?? null);
}

export function saveBusinessAssignments(businessId: string, assignments: BusinessAssignment[]) {
  storage()?.setItem(assignmentStorageKey(businessId), JSON.stringify(assignments));
}

export function getAssignmentsForUser(user: AuthUser | null) {
  if (!user?.businessId) return [];
  return getBusinessAssignments(user.businessId).filter((assignment) => assignment.assigneeType === 'all' || assignment.assigneeId === user.id);
}

export function getReviewedChallengeIds(businessId?: string) {
  if (!businessId) return [];
  return parseArray<string>(storage()?.getItem(reviewedStorageKey(businessId)) ?? null);
}

export function saveReviewedChallengeIds(businessId: string, challengeIds: string[]) {
  storage()?.setItem(reviewedStorageKey(businessId), JSON.stringify(challengeIds));
}

export function getBusinessCustomizations(businessId?: string) {
  if (!businessId) return [];
  return parseArray<BusinessChallengeCustomization>(storage()?.getItem(customizationStorageKey(businessId)) ?? null);
}

export function saveBusinessCustomizations(businessId: string, customizations: BusinessChallengeCustomization[]) {
  storage()?.setItem(customizationStorageKey(businessId), JSON.stringify(customizations));
}

export function getCustomizationForChallenge(businessId: string | undefined, challengeId: string) {
  return getBusinessCustomizations(businessId).find((item) => item.challengeId === challengeId);
}
