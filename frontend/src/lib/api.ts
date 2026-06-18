const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export type DashboardSummary = {
  level: number;
  rankName: string;
  xp: number;
  nextLevelXp: number;
  streak: number;
  securityScore: number;
  completedChallenges: number;
};

export type Challenge = {
  id: string;
  title: string;
  type: string;
  difficulty: string;
  xp: number;
  durationMinutes: number;
  status: 'available' | 'locked' | 'completed';
};

export type ChallengeSession = {
  id: string;
  challengeId: string;
  status: 'STARTED' | 'COMPLETED' | 'ABANDONED' | 'EXPIRED';
  startedAt: string;
};

export type ChallengeActionType =
  | 'OPEN_EMAIL'
  | 'VIEW_SENDER'
  | 'INSPECT_LINK'
  | 'CLICK_LINK'
  | 'REPORT_PHISHING'
  | 'DELETE_MESSAGE'
  | 'REPLY_MESSAGE'
  | 'REQUEST_HINT';

export type ChallengeAction = {
  id: string;
  sessionId: string;
  actionType: ChallengeActionType;
  target?: string;
  occurredAt: string;
};

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function postJson<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getDashboard(): Promise<DashboardSummary> {
  return getJson<DashboardSummary>('/dashboard');
}

export async function getChallenges(): Promise<Challenge[]> {
  return getJson<Challenge[]>('/challenges');
}

export async function startChallengeSession(challengeId: string): Promise<ChallengeSession> {
  return postJson<ChallengeSession>(`/sessions/${challengeId}/start`);
}

export async function recordChallengeAction(
  sessionId: string,
  input: { actionType: ChallengeActionType; target?: string },
): Promise<ChallengeAction> {
  return postJson<ChallengeAction>(`/sessions/${sessionId}/actions`, input);
}
