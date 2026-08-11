import { BadRequestException, ConflictException, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { pbkdf2Sync, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { MongoServerError, type Document } from 'mongodb';
import { MongoDatabaseService } from '../../database/mongo-database.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterBusinessDto } from './dto/register-business.dto';
import type { RegisterDto } from './dto/register.dto';
import type { UpdateProfileDto } from './dto/update-profile.dto';

type UserRole = 'USER' | 'ADMIN' | 'BUSINESS_ADMIN';
type AccountStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED';

type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  organization?: string;
  role: UserRole;
  accountStatus: AccountStatus;
  businessId?: string;
  businessDomain?: string;
  createdAt: string;
};

type StoredUser = AuthUser & {
  passwordHash: string;
};

type StoredUserDocument = StoredUser & Document;

type StoredBusiness = {
  id: string;
  name: string;
  domain: string;
  adminUserId: string;
  adminEmail: string;
  createdAt: string;
};

type StoredBusinessDocument = StoredBusiness & Document;

type StoredBusinessAssignment = {
  id: string;
  businessId: string;
  challengeId: string;
  challengeTitle: string;
  assigneeType: 'all' | 'user';
  assigneeId?: string;
  assigneeName: string;
  assignedAt: string;
};

type StoredBusinessAssignmentDocument = StoredBusinessAssignment & Document;

type StoredBusinessReview = {
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

type StoredBusinessReviewDocument = StoredBusinessReview & Document;

type AuthSessionDocument = Document & {
  token: string;
  userId: string;
  createdAt: string;
};

type StoredAuthSession = {
  token: string;
  userId: string;
  createdAt: string;
};

type LocalAuthStore = {
  users: StoredUser[];
  businesses?: StoredBusiness[];
  assignments?: StoredBusinessAssignment[];
  reviews?: StoredBusinessReview[];
  sessions: StoredAuthSession[];
};

type AuthResponse = {
  user: AuthUser;
  accessToken: string;
};

type PendingRegistrationResponse = {
  status: 'PENDING_APPROVAL';
  message: string;
  user: AuthUser;
};

type BusinessDashboard = {
  business: StoredBusiness;
  users: AuthUser[];
  pendingUsers: AuthUser[];
  approvedUsers: AuthUser[];
  rejectedUsers: AuthUser[];
};

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly usersByEmail = new Map<string, StoredUser>();
  private readonly usersById = new Map<string, StoredUser>();
  private readonly businessesByDomain = new Map<string, StoredBusiness>();
  private readonly businessesById = new Map<string, StoredBusiness>();
  private readonly assignmentsById = new Map<string, StoredBusinessAssignment>();
  private readonly reviewsById = new Map<string, StoredBusinessReview>();
  private readonly sessions = new Map<string, string>();
  private readonly localStorePath = join(process.cwd(), '.data', 'auth-store.json');

  constructor(private readonly mongo: MongoDatabaseService) {
    if (!this.mongo.configured) {
      this.loadLocalStore();
    }
  }

  async onModuleInit() {
    if (this.mongo.configured) {
      await this.migrateLocalStoreToMongo();
    }
  }

  async register(input: RegisterDto): Promise<AuthResponse | PendingRegistrationResponse> {
    const email = this.normalizeEmail(input.email);
    const emailDomain = this.emailDomain(email);
    const business = emailDomain ? await this.findBusinessByDomain(emailDomain) : undefined;
    if (!emailDomain || !business) {
      throw new BadRequestException('Employee accounts require a work email domain that is registered by a business on PhishAware.');
    }

    const existingUser = this.mongo.configured
      ? await (await this.mongo.collection<StoredUserDocument>('users')).findOne({ email })
      : this.usersByEmail.get(email);

    if (existingUser) {
      throw new ConflictException('An account already exists for this email.');
    }

    const user: StoredUser = {
      id: randomUUID(),
      email,
      displayName: input.displayName.trim(),
      organization: input.organization?.trim() || business.name,
      role: 'USER',
      accountStatus: 'PENDING_APPROVAL',
      businessId: business.id,
      businessDomain: business.domain,
      createdAt: new Date().toISOString(),
      passwordHash: this.hashPassword(input.password),
    };

    if (this.mongo.configured) {
      const users = await this.mongo.collection<StoredUserDocument>('users');
      await users.createIndex({ email: 1 }, { unique: true });

      try {
        await users.insertOne(user);
      } catch (error) {
        if (error instanceof MongoServerError && error.code === 11000) {
          throw new ConflictException('An account already exists for this email.');
        }
        throw error;
      }

      return user.accountStatus === 'PENDING_APPROVAL' ? this.pendingResponse(user) : this.createSession(user);
    }

    this.usersByEmail.set(email, user);
    this.usersById.set(user.id, user);
    this.persistLocalStore();

    return user.accountStatus === 'PENDING_APPROVAL' ? this.pendingResponse(user) : this.createSession(user);
  }

  async registerBusiness(input: RegisterBusinessDto): Promise<AuthResponse> {
    const domain = this.normalizeDomain(input.domain);
    const adminEmail = this.normalizeEmail(input.adminEmail);
    const existingBusiness = await this.findBusinessByDomain(domain);
    if (existingBusiness) {
      throw new ConflictException('A business is already registered for this domain.');
    }

    const existingUser = this.mongo.configured
      ? await (await this.mongo.collection<StoredUserDocument>('users')).findOne({ email: adminEmail })
      : this.usersByEmail.get(adminEmail);

    if (existingUser) {
      throw new ConflictException('An account already exists for this email.');
    }

    const business: StoredBusiness = {
      id: randomUUID(),
      name: input.businessName.trim(),
      domain,
      adminUserId: '',
      adminEmail,
      createdAt: new Date().toISOString(),
    };

    const user: StoredUser = {
      id: randomUUID(),
      email: adminEmail,
      displayName: input.adminName.trim(),
      organization: business.name,
      role: 'BUSINESS_ADMIN',
      accountStatus: 'ACTIVE',
      businessId: business.id,
      businessDomain: business.domain,
      createdAt: new Date().toISOString(),
      passwordHash: this.hashPassword(input.password),
    };
    business.adminUserId = user.id;

    if (this.mongo.configured) {
      const businesses = await this.mongo.collection<StoredBusinessDocument>('businesses');
      const users = await this.mongo.collection<StoredUserDocument>('users');
      await businesses.createIndex({ domain: 1 }, { unique: true });
      await users.createIndex({ email: 1 }, { unique: true });
      try {
        await businesses.insertOne(business);
        await users.insertOne(user);
      } catch (error) {
        if (error instanceof MongoServerError && error.code === 11000) {
          throw new ConflictException('Business domain or admin email is already registered.');
        }
        throw error;
      }
      return this.createSession(user);
    }

    this.businessesByDomain.set(domain, business);
    this.businessesById.set(business.id, business);
    this.usersByEmail.set(adminEmail, user);
    this.usersById.set(user.id, user);
    this.persistLocalStore();

    return this.createSession(user);
  }

  async login(input: LoginDto): Promise<AuthResponse> {
    const email = this.normalizeEmail(input.email);
    const user = this.mongo.configured
      ? await (await this.mongo.collection<StoredUserDocument>('users')).findOne({ email })
      : this.usersByEmail.get(email);

    if (!user || !this.verifyPassword(input.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    if (user.accountStatus === 'PENDING_APPROVAL') {
      throw new UnauthorizedException('Your account is waiting for business admin approval.');
    }
    if (user.accountStatus === 'REJECTED') {
      throw new UnauthorizedException('Your account request was rejected by the business admin.');
    }

    return this.createSession(user);
  }

  async businessDashboard(authorization?: string): Promise<BusinessDashboard> {
    const admin = await this.requireBusinessAdmin(authorization);
    if (!admin.businessId) {
      throw new UnauthorizedException('Business admin account is not linked to a business.');
    }

    const business = await this.findBusinessById(admin.businessId);
    if (!business) {
      throw new UnauthorizedException('Business record not found.');
    }

    const users = await this.findUsersByBusinessId(business.id);
    const publicUsers = users.map((user) => this.publicUser(user));
    return {
      business,
      users: publicUsers,
      pendingUsers: publicUsers.filter((user) => user.accountStatus === 'PENDING_APPROVAL'),
      approvedUsers: publicUsers.filter((user) => user.accountStatus === 'ACTIVE'),
      rejectedUsers: publicUsers.filter((user) => user.accountStatus === 'REJECTED'),
    };
  }

  async businessReviews(authorization?: string): Promise<StoredBusinessReview[]> {
    const admin = await this.requireBusinessAdmin(authorization);
    if (!admin.businessId) return [];

    if (this.mongo.configured) {
      return (await this.mongo.collection<StoredBusinessReviewDocument>('business_challenge_reviews'))
        .find({ businessId: admin.businessId })
        .sort({ updatedAt: -1 })
        .toArray();
    }

    return Array.from(this.reviewsById.values()).filter((review) => review.businessId === admin.businessId);
  }

  async saveBusinessReview(
    authorization: string | undefined,
    challengeId: string,
    input: { audience?: string; tone?: string; companyContext?: string; reviewed?: boolean },
  ): Promise<StoredBusinessReview> {
    const admin = await this.requireBusinessAdmin(authorization);
    if (!admin.businessId) {
      throw new UnauthorizedException('Business admin account is not linked to a business.');
    }

    const now = new Date().toISOString();
    const existing = await this.findReview(admin.businessId, challengeId);
    const review: StoredBusinessReview = {
      id: existing?.id ?? randomUUID(),
      businessId: admin.businessId,
      challengeId,
      audience: input.audience?.trim() || existing?.audience || 'Early-career SME employees',
      tone: input.tone?.trim() || existing?.tone || 'Clear, professional workplace language',
      companyContext: input.companyContext?.trim() || existing?.companyContext || `${admin.organization ?? 'Business'} employees`,
      reviewed: input.reviewed ?? existing?.reviewed ?? false,
      reviewedAt: input.reviewed ? now : existing?.reviewedAt,
      updatedAt: now,
    };

    if (this.mongo.configured) {
      const reviews = await this.mongo.collection<StoredBusinessReviewDocument>('business_challenge_reviews');
      await reviews.createIndex({ businessId: 1, challengeId: 1 }, { unique: true });
      await reviews.updateOne(
        { businessId: admin.businessId, challengeId },
        { $set: review },
        { upsert: true },
      );
    } else {
      this.reviewsById.set(review.id, review);
      this.persistLocalStore();
    }

    return review;
  }

  async businessAssignments(authorization?: string): Promise<StoredBusinessAssignment[]> {
    const admin = await this.requireBusinessAdmin(authorization);
    if (!admin.businessId) return [];
    return this.findAssignmentsByBusinessId(admin.businessId);
  }

  async assignBusinessChallenge(
    authorization: string | undefined,
    input: { challengeId: string; challengeTitle: string; assigneeType: 'all' | 'user'; assigneeId?: string; assigneeName?: string },
  ): Promise<StoredBusinessAssignment> {
    const admin = await this.requireBusinessAdmin(authorization);
    if (!admin.businessId) {
      throw new UnauthorizedException('Business admin account is not linked to a business.');
    }

    if (!input.challengeId?.trim() || !input.challengeTitle?.trim()) {
      throw new BadRequestException('Challenge id and title are required.');
    }

    if (input.assigneeType === 'user') {
      if (!input.assigneeId) throw new BadRequestException('Assignee id is required.');
      const target = await this.findUserById(input.assigneeId);
      if (!target || target.businessId !== admin.businessId || target.accountStatus !== 'ACTIVE') {
        throw new BadRequestException('Assignee must be an approved user from this business.');
      }
    }

    const assignment: StoredBusinessAssignment = {
      id: randomUUID(),
      businessId: admin.businessId,
      challengeId: input.challengeId.trim(),
      challengeTitle: input.challengeTitle.trim(),
      assigneeType: input.assigneeType === 'user' ? 'user' : 'all',
      assigneeId: input.assigneeType === 'user' ? input.assigneeId : undefined,
      assigneeName: input.assigneeType === 'user' ? input.assigneeName?.trim() || 'Assigned employee' : 'All approved employees',
      assignedAt: new Date().toISOString(),
    };

    if (this.mongo.configured) {
      await (await this.mongo.collection<StoredBusinessAssignmentDocument>('business_assignments')).insertOne(assignment);
    } else {
      this.assignmentsById.set(assignment.id, assignment);
      this.persistLocalStore();
    }

    return assignment;
  }

  async deleteBusinessAssignment(authorization: string | undefined, assignmentId: string): Promise<{ deleted: true }> {
    const admin = await this.requireBusinessAdmin(authorization);
    const assignment = await this.findAssignmentById(assignmentId);
    if (!assignment || assignment.businessId !== admin.businessId) {
      throw new BadRequestException('Assignment not found for this business.');
    }

    if (this.mongo.configured) {
      await (await this.mongo.collection<StoredBusinessAssignmentDocument>('business_assignments')).deleteOne({ id: assignmentId });
    } else {
      this.assignmentsById.delete(assignmentId);
      this.persistLocalStore();
    }

    return { deleted: true };
  }

  async myAssignments(authorization?: string): Promise<StoredBusinessAssignment[]> {
    const user = await this.requireActiveUser(authorization);
    if (!user.businessId) return [];
    const assignments = await this.findAssignmentsByBusinessId(user.businessId);
    return assignments.filter((assignment) => assignment.assigneeType === 'all' || assignment.assigneeId === user.id);
  }

  async approveBusinessUser(authorization: string | undefined, userId: string): Promise<AuthUser> {
    const admin = await this.requireBusinessAdmin(authorization);
    const target = await this.findUserById(userId);
    if (!target || target.businessId !== admin.businessId) {
      throw new BadRequestException('User does not belong to this business.');
    }

    const updatedUser = { ...target, accountStatus: 'ACTIVE' as const };
    if (this.mongo.configured) {
      await (await this.mongo.collection<StoredUserDocument>('users')).updateOne(
        { id: target.id },
        { $set: { accountStatus: 'ACTIVE' } },
      );
    } else {
      this.usersByEmail.set(updatedUser.email, updatedUser);
      this.usersById.set(updatedUser.id, updatedUser);
      this.persistLocalStore();
    }

    return this.publicUser(updatedUser);
  }

  async rejectBusinessUser(authorization: string | undefined, userId: string): Promise<AuthUser> {
    const admin = await this.requireBusinessAdmin(authorization);
    const target = await this.findUserById(userId);
    if (!target || target.businessId !== admin.businessId) {
      throw new BadRequestException('User does not belong to this business.');
    }

    const updatedUser = { ...target, accountStatus: 'REJECTED' as const };
    if (this.mongo.configured) {
      await (await this.mongo.collection<StoredUserDocument>('users')).updateOne(
        { id: target.id },
        { $set: { accountStatus: 'REJECTED' } },
      );
    } else {
      this.usersByEmail.set(updatedUser.email, updatedUser);
      this.usersById.set(updatedUser.id, updatedUser);
      this.persistLocalStore();
    }

    return this.publicUser(updatedUser);
  }

  async me(authorization?: string): Promise<AuthUser> {
    const token = this.tokenFromHeader(authorization);
    const user = await this.findUserByToken(token);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired session.');
    }
    return this.publicUser(user);
  }

  async updateMe(authorization: string | undefined, input: UpdateProfileDto): Promise<AuthUser> {
    const token = this.tokenFromHeader(authorization);
    const user = await this.findUserByToken(token);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired session.');
    }

    const updates: Partial<StoredUser> = {};
    if (input.displayName !== undefined) {
      const displayName = input.displayName.trim();
      if (!displayName) {
        throw new BadRequestException('Display name cannot be empty.');
      }
      updates.displayName = displayName;
    }

    if (input.organization !== undefined) {
      updates.organization = input.organization.trim() || undefined;
    }

    if (input.newPassword !== undefined || input.currentPassword !== undefined) {
      if (!input.currentPassword || !input.newPassword) {
        throw new BadRequestException('Current password and new password are required.');
      }

      if (!this.verifyPassword(input.currentPassword, user.passwordHash)) {
        throw new UnauthorizedException('Current password is incorrect.');
      }

      updates.passwordHash = this.hashPassword(input.newPassword);
    }

    if (!Object.keys(updates).length) {
      return this.publicUser(user);
    }

    const updatedUser = { ...user, ...updates };

    if (this.mongo.configured) {
      const setUpdates = { ...updates };
      const unsetUpdates: Record<string, ''> = {};
      if ('organization' in setUpdates && setUpdates.organization === undefined) {
        delete setUpdates.organization;
        unsetUpdates.organization = '';
      }

      await (await this.mongo.collection<StoredUserDocument>('users')).updateOne(
        { id: user.id },
        {
          ...(Object.keys(setUpdates).length ? { $set: setUpdates } : {}),
          ...(Object.keys(unsetUpdates).length ? { $unset: unsetUpdates } : {}),
        },
      );
    } else {
      this.usersByEmail.set(updatedUser.email, updatedUser);
      this.usersById.set(updatedUser.id, updatedUser);
      this.persistLocalStore();
    }

    return this.publicUser(updatedUser);
  }

  private async createSession(user: StoredUser): Promise<AuthResponse> {
    const accessToken = randomBytes(32).toString('hex');
    if (this.mongo.configured) {
      const sessions = await this.mongo.collection<AuthSessionDocument>('auth_sessions');
      await sessions.createIndex({ token: 1 }, { unique: true });
      await sessions.insertOne({
        token: accessToken,
        userId: user.id,
        createdAt: new Date().toISOString(),
      });
    } else {
      this.sessions.set(accessToken, user.id);
      this.persistLocalStore();
    }

    return {
      user: this.publicUser(user),
      accessToken,
    };
  }

  private async findUserByToken(token: string) {
    if (!this.mongo.configured) {
      const userId = this.sessions.get(token);
      return userId ? this.usersById.get(userId) : undefined;
    }

    const session = await (await this.mongo.collection<AuthSessionDocument>('auth_sessions')).findOne({ token });
    if (!session) return undefined;

    return (await this.mongo.collection<StoredUserDocument>('users')).findOne({ id: session.userId });
  }

  private publicUser(user: StoredUser): AuthUser {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      organization: user.organization,
      role: user.role,
      accountStatus: user.accountStatus ?? 'ACTIVE',
      businessId: user.businessId,
      businessDomain: user.businessDomain,
      createdAt: user.createdAt,
    };
  }

  private pendingResponse(user: StoredUser): PendingRegistrationResponse {
    return {
      status: 'PENDING_APPROVAL',
      message: `Your account matches ${user.businessDomain} and is waiting for business admin approval.`,
      user: this.publicUser(user),
    };
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private normalizeDomain(domain: string) {
    return domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }

  private emailDomain(email: string) {
    return email.includes('@') ? email.split('@').pop()?.toLowerCase() : undefined;
  }

  private async findBusinessByDomain(domain: string) {
    const normalized = this.normalizeDomain(domain);
    if (!this.mongo.configured) return this.businessesByDomain.get(normalized);
    return (await this.mongo.collection<StoredBusinessDocument>('businesses')).findOne({ domain: normalized });
  }

  private async findBusinessById(id: string) {
    if (!this.mongo.configured) return this.businessesById.get(id);
    return (await this.mongo.collection<StoredBusinessDocument>('businesses')).findOne({ id });
  }

  private async findUserById(id: string) {
    if (!this.mongo.configured) return this.usersById.get(id);
    return (await this.mongo.collection<StoredUserDocument>('users')).findOne({ id });
  }

  private async findUsersByBusinessId(businessId: string) {
    if (!this.mongo.configured) {
      return Array.from(this.usersById.values()).filter((user) => user.businessId === businessId);
    }
    return (await this.mongo.collection<StoredUserDocument>('users')).find({ businessId }).toArray();
  }

  private async findAssignmentsByBusinessId(businessId: string) {
    if (!this.mongo.configured) {
      return Array.from(this.assignmentsById.values())
        .filter((assignment) => assignment.businessId === businessId)
        .sort((first, second) => second.assignedAt.localeCompare(first.assignedAt));
    }

    return (await this.mongo.collection<StoredBusinessAssignmentDocument>('business_assignments'))
      .find({ businessId })
      .sort({ assignedAt: -1 })
      .toArray();
  }

  private async findAssignmentById(id: string) {
    if (!this.mongo.configured) return this.assignmentsById.get(id);
    return (await this.mongo.collection<StoredBusinessAssignmentDocument>('business_assignments')).findOne({ id });
  }

  private async findReview(businessId: string, challengeId: string) {
    if (!this.mongo.configured) {
      return Array.from(this.reviewsById.values()).find((review) => review.businessId === businessId && review.challengeId === challengeId);
    }

    return (await this.mongo.collection<StoredBusinessReviewDocument>('business_challenge_reviews')).findOne({ businessId, challengeId });
  }

  private async requireBusinessAdmin(authorization?: string) {
    const token = this.tokenFromHeader(authorization);
    const user = await this.findUserByToken(token);
    if (!user || user.role !== 'BUSINESS_ADMIN') {
      throw new UnauthorizedException('Business admin access required.');
    }
    return user;
  }

  private async requireActiveUser(authorization?: string) {
    const token = this.tokenFromHeader(authorization);
    const user = await this.findUserByToken(token);
    if (!user || user.accountStatus !== 'ACTIVE') {
      throw new UnauthorizedException('Active user session required.');
    }
    return user;
  }

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const derived = pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex');
    return `${salt}:${derived}`;
  }

  private verifyPassword(password: string, storedHash: string) {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;

    const derived = pbkdf2Sync(password, salt, 120000, 32, 'sha256');
    const expected = Buffer.from(hash, 'hex');
    return expected.length === derived.length && timingSafeEqual(expected, derived);
  }

  private tokenFromHeader(authorization?: string) {
    const [scheme, token] = authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Missing bearer token.');
    }
    return token;
  }

  private loadLocalStore() {
    if (!existsSync(this.localStorePath)) return;

    try {
      const store = JSON.parse(readFileSync(this.localStorePath, 'utf8')) as LocalAuthStore;
      for (const user of store.users ?? []) {
        user.accountStatus ??= 'ACTIVE';
        this.usersByEmail.set(user.email, user);
        this.usersById.set(user.id, user);
      }

      for (const business of store.businesses ?? []) {
        this.businessesByDomain.set(business.domain, business);
        this.businessesById.set(business.id, business);
      }

      for (const assignment of store.assignments ?? []) {
        this.assignmentsById.set(assignment.id, assignment);
      }

      for (const review of store.reviews ?? []) {
        this.reviewsById.set(review.id, review);
      }

      for (const session of store.sessions ?? []) {
        this.sessions.set(session.token, session.userId);
      }
    } catch {
      this.usersByEmail.clear();
      this.usersById.clear();
      this.assignmentsById.clear();
      this.reviewsById.clear();
      this.sessions.clear();
    }
  }

  private async migrateLocalStoreToMongo() {
    if (!existsSync(this.localStorePath)) return;

    try {
      const store = JSON.parse(readFileSync(this.localStorePath, 'utf8')) as LocalAuthStore;
      const users = await this.mongo.collection<Document>('users');
      const businesses = await this.mongo.collection<Document>('businesses');
      const sessions = await this.mongo.collection<Document>('auth_sessions');
      const assignments = await this.mongo.collection<Document>('business_assignments');
      const reviews = await this.mongo.collection<Document>('business_challenge_reviews');

      await Promise.all([
        users.createIndex({ email: 1 }, { unique: true }),
        businesses.createIndex({ domain: 1 }, { unique: true }),
        sessions.createIndex({ token: 1 }, { unique: true }),
      ]);

      for (const business of store.businesses ?? []) {
        await businesses.updateOne({ domain: business.domain }, { $setOnInsert: business }, { upsert: true });
      }

      for (const user of store.users ?? []) {
        user.accountStatus ??= 'ACTIVE';
        await users.updateOne({ email: user.email }, { $setOnInsert: user }, { upsert: true });
      }

      for (const session of store.sessions ?? []) {
        await sessions.updateOne({ token: session.token }, { $setOnInsert: session }, { upsert: true });
      }

      for (const assignment of store.assignments ?? []) {
        await assignments.updateOne({ id: assignment.id }, { $setOnInsert: assignment }, { upsert: true });
      }

      for (const review of store.reviews ?? []) {
        await reviews.updateOne(
          { businessId: review.businessId, challengeId: review.challengeId },
          { $setOnInsert: review },
          { upsert: true },
        );
      }
    } catch {
      // Local-store migration is best effort so an old malformed file cannot block Mongo startup.
    }
  }

  private persistLocalStore() {
    if (this.mongo.configured) return;

    mkdirSync(dirname(this.localStorePath), { recursive: true });
    const store: LocalAuthStore = {
      users: Array.from(this.usersById.values()),
      businesses: Array.from(this.businessesById.values()),
      assignments: Array.from(this.assignmentsById.values()),
      reviews: Array.from(this.reviewsById.values()),
      sessions: Array.from(this.sessions.entries()).map(([token, userId]) => ({
        token,
        userId,
        createdAt: new Date().toISOString(),
      })),
    };

    writeFileSync(this.localStorePath, JSON.stringify(store, null, 2));
  }
}
