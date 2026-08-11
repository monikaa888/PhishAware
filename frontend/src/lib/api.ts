function apiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:4000/api/v1`;
  }

  return 'http://localhost:4000/api/v1';
}

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

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  organization?: string;
  role: 'USER' | 'ADMIN' | 'BUSINESS_ADMIN';
  accountStatus: 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED';
  businessId?: string;
  businessDomain?: string;
  createdAt: string;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
};

export type PendingRegistrationResponse = {
  status: 'PENDING_APPROVAL';
  message: string;
  user: AuthUser;
};

export type RegisterResponse = AuthResponse | PendingRegistrationResponse;

export type BusinessDashboard = {
  business: {
    id: string;
    name: string;
    domain: string;
    adminUserId: string;
    adminEmail: string;
    createdAt: string;
  };
  users: AuthUser[];
  pendingUsers: AuthUser[];
  approvedUsers: AuthUser[];
  rejectedUsers: AuthUser[];
};

export type BusinessAssignment = {
  id: string;
  businessId: string;
  challengeId: string;
  challengeTitle: string;
  assigneeType: 'all' | 'user';
  assigneeId?: string;
  assigneeName: string;
  assignedAt: string;
};

export type BusinessChallengeReview = {
  id: string;
  businessId: string;
  challengeId: string;
  audience: string;
  tone: string;
  companyContext: string;
  reviewed: boolean;
  reviewedAt?: string;
  updatedAt: string;
};

export type PlatformChallenge = Omit<Challenge, 'status'> & {
  status: 'DRAFT' | 'AVAILABLE' | 'LOCKED' | 'ARCHIVED' | 'COMPLETED';
  suspiciousIndicators?: string[];
  scheduledReleaseAt?: string;
  simulationSpec?: Record<string, unknown>;
};

export type DeveloperAdminSession = {
  accessToken: string;
  user: {
    role: 'DEVELOPER_ADMIN';
    displayName: string;
  };
};

export type PlatformOverview = {
  metrics: {
    totalUsers: number;
    activeUsers: number;
    pendingUsers: number;
    rejectedUsers: number;
    totalBusinesses: number;
    totalAssignments: number;
    reviewedChallenges: number;
    totalChallenges: number;
    releasedChallenges: number;
    draftChallenges: number;
  };
  businesses: Array<{
    id: string;
    name: string;
    domain: string;
    createdAt: string;
    userCount: number;
    admins?: Array<{
      id: string;
      email: string;
      displayName: string;
      createdAt: string;
    }>;
  }>;
  users: Array<{
    id: string;
    email: string;
    displayName: string;
    organization?: string;
    role: 'USER' | 'ADMIN' | 'BUSINESS_ADMIN';
    accountStatus: 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED';
    businessId?: string;
    businessDomain?: string;
    createdAt: string;
  }>;
  recentAssignments: Array<{
    id: string;
    businessId: string;
    challengeId: string;
    challengeTitle?: string;
    assigneeName?: string;
    assignedAt: string;
  }>;
  challenges: PlatformChallenge[];
};

async function errorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { message?: string | string[]; error?: string };
    if (Array.isArray(payload.message)) return payload.message.join(' ');
    return payload.message ?? payload.error ?? `API request failed: ${response.status}`;
  } catch {
    return `API request failed: ${response.status}`;
  }
}

async function getJson<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, { cache: 'no-store' });
  } catch {
    throw new Error(`Backend is not reachable at ${apiBaseUrl()}. Start it with ./script.sh and check that port 4000 is running.`);
  }
  if (!response.ok) {
    throw new Error(await errorMessage(response));
  }
  return response.json() as Promise<T>;
}

async function postJson<T>(path: string, body?: unknown, token?: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(`Backend is not reachable at ${apiBaseUrl()}. Start it with ./script.sh and check that port 4000 is running.`);
  }

  if (!response.ok) {
    throw new Error(await errorMessage(response));
  }

  return response.json() as Promise<T>;
}

async function authGetJson<T>(path: string, token: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error(`Backend is not reachable at ${apiBaseUrl()}. Start it with ./script.sh and check that port 4000 is running.`);
  }

  if (!response.ok) {
    throw new Error(await errorMessage(response));
  }

  return response.json() as Promise<T>;
}

async function authPatchJson<T>(path: string, token: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(`Backend is not reachable at ${apiBaseUrl()}. Start it with ./script.sh and check that port 4000 is running.`);
  }

  if (!response.ok) {
    throw new Error(await errorMessage(response));
  }

  return response.json() as Promise<T>;
}

async function authDeleteJson<T>(path: string, token: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error(`Backend is not reachable at ${apiBaseUrl()}. Start it with ./script.sh and check that port 4000 is running.`);
  }

  if (!response.ok) {
    throw new Error(await errorMessage(response));
  }

  return response.json() as Promise<T>;
}

export async function getDashboard(token?: string | null): Promise<DashboardSummary> {
  return token ? authGetJson<DashboardSummary>('/dashboard', token) : getJson<DashboardSummary>('/dashboard');
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

export async function registerUser(input: { email: string; displayName: string; organization?: string; password: string }): Promise<AuthResponse> {
  return postJson<RegisterResponse>('/auth/register', input) as Promise<AuthResponse>;
}

export async function registerUserWithApproval(
  input: { email: string; displayName: string; organization?: string; password: string },
): Promise<RegisterResponse> {
  return postJson<RegisterResponse>('/auth/register', input);
}

export async function registerBusiness(input: { businessName: string; domain: string; adminEmail: string; adminName: string; password: string }): Promise<AuthResponse> {
  return postJson<AuthResponse>('/auth/business/register', input);
}

export async function loginUser(input: { email: string; password: string }): Promise<AuthResponse> {
  return postJson<AuthResponse>('/auth/login', input);
}

export async function getCurrentUser(token: string): Promise<AuthUser> {
  return authGetJson<AuthUser>('/auth/me', token);
}

export async function updateCurrentUser(
  token: string,
  input: { displayName?: string; organization?: string; currentPassword?: string; newPassword?: string },
): Promise<AuthUser> {
  return authPatchJson<AuthUser>('/auth/me', token, input);
}

export async function getBusinessDashboard(token: string): Promise<BusinessDashboard> {
  return authGetJson<BusinessDashboard>('/auth/business', token);
}

export async function approveBusinessUser(token: string, userId: string): Promise<AuthUser> {
  return postJson<AuthUser>(`/auth/business/users/${userId}/approve`, undefined, token);
}

export async function rejectBusinessUser(token: string, userId: string): Promise<AuthUser> {
  return postJson<AuthUser>(`/auth/business/users/${userId}/reject`, undefined, token);
}

export async function getBusinessReviews(token: string): Promise<BusinessChallengeReview[]> {
  return authGetJson<BusinessChallengeReview[]>('/auth/business/reviews', token);
}

export async function saveBusinessReview(
  token: string,
  challengeId: string,
  input: { audience?: string; tone?: string; companyContext?: string; reviewed?: boolean },
): Promise<BusinessChallengeReview> {
  return postJson<BusinessChallengeReview>(`/auth/business/reviews/${challengeId}`, input, token);
}

export async function getBusinessAssignments(token: string): Promise<BusinessAssignment[]> {
  return authGetJson<BusinessAssignment[]>('/auth/business/assignments', token);
}

export async function assignBusinessChallenge(
  token: string,
  input: { challengeId: string; challengeTitle: string; assigneeType: 'all' | 'user'; assigneeId?: string; assigneeName?: string },
): Promise<BusinessAssignment> {
  return postJson<BusinessAssignment>('/auth/business/assignments', input, token);
}

export async function deleteBusinessAssignment(token: string, assignmentId: string): Promise<{ deleted: true }> {
  return authDeleteJson<{ deleted: true }>(`/auth/business/assignments/${assignmentId}`, token);
}

export async function getMyAssignments(token: string): Promise<BusinessAssignment[]> {
  return authGetJson<BusinessAssignment[]>('/auth/assignments', token);
}

export async function developerAdminLogin(input: { password: string }): Promise<DeveloperAdminSession> {
  return postJson<DeveloperAdminSession>('/platform-admin/login', input);
}

export async function getPlatformOverview(token: string): Promise<PlatformOverview> {
  return authGetJson<PlatformOverview>('/platform-admin/overview', token);
}

export async function createPlatformChallenge(
  token: string,
  input: { title: string; type: string; difficulty: string; status?: 'DRAFT' | 'AVAILABLE' | 'LOCKED' | 'ARCHIVED' },
): Promise<Challenge> {
  return postJson<Challenge>('/platform-admin/challenges', input, token);
}

export async function createPlatformUser(
  token: string,
  input: {
    email: string;
    displayName: string;
    businessId: string;
    organization?: string;
    accountStatus?: 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED';
    password: string;
  },
): Promise<AuthUser> {
  return postJson<AuthUser>('/platform-admin/users', input, token);
}

export async function createPlatformInternalUser(
  token: string,
  input: { email: string; displayName: string; password: string },
): Promise<AuthUser> {
  return postJson<AuthUser>('/platform-admin/internal-users', input, token);
}

export async function deletePlatformUser(token: string, userId: string): Promise<{ deleted: true }> {
  return authDeleteJson<{ deleted: true }>(`/platform-admin/users/${userId}`, token);
}

export async function createBusinessAdmin(
  token: string,
  businessId: string,
  input: { email: string; displayName: string; password: string },
): Promise<AuthUser> {
  return postJson<AuthUser>(`/platform-admin/businesses/${businessId}/admins`, input, token);
}

export async function deleteBusinessAdmin(token: string, businessId: string, adminId: string): Promise<{ deleted: true }> {
  return authDeleteJson<{ deleted: true }>(`/platform-admin/businesses/${businessId}/admins/${adminId}`, token);
}

export async function deletePlatformAssignmentActivity(token: string, assignmentId: string): Promise<{ deleted: true }> {
  return authDeleteJson<{ deleted: true }>(`/platform-admin/assignments/${assignmentId}`, token);
}

export async function generatePlatformChallenge(
  token: string,
  input: {
    channel: 'EMAIL' | 'SMS' | 'SOCIAL';
    difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    targetAudience: string;
    theme?: string;
    organizationName?: string;
    learningObjectives?: string[];
    status?: 'DRAFT' | 'AVAILABLE';
  },
): Promise<Challenge> {
  return postJson<Challenge>('/platform-admin/challenges/generate', input, token);
}

export async function updatePlatformChallengeStatus(
  token: string,
  challengeId: string,
  status: 'DRAFT' | 'AVAILABLE' | 'LOCKED' | 'ARCHIVED',
): Promise<Challenge> {
  return authPatchJson<Challenge>(`/platform-admin/challenges/${challengeId}/status`, token, { status });
}

export async function updatePlatformChallenge(
  token: string,
  challengeId: string,
  input: {
    title?: string;
    type?: string;
    difficulty?: string;
    status?: 'DRAFT' | 'AVAILABLE' | 'LOCKED' | 'ARCHIVED';
    context?: string;
    lure?: string;
    scheduledReleaseAt?: string;
  },
): Promise<PlatformChallenge> {
  return authPatchJson<PlatformChallenge>(`/platform-admin/challenges/${challengeId}`, token, input);
}

export async function deletePlatformChallenge(token: string, challengeId: string): Promise<{ deleted: true }> {
  return authDeleteJson<{ deleted: true }>(`/platform-admin/challenges/${challengeId}`, token);
}
