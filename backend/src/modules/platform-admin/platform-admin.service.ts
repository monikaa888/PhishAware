import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import type { Document } from 'mongodb';
import { MongoDatabaseService } from '../../database/mongo-database.service';
import { ChallengesService, type ChallengeRecord } from '../challenges/challenges.service';
import type { CreateChallengeDto } from '../challenges/dto/create-challenge.dto';
import type { GenerateAndSaveChallengeDto } from '../challenges/dto/generate-and-save-challenge.dto';
import type { CreateBusinessAdminDto } from './dto/create-business-admin.dto';
import type { CreateInternalUserDto } from './dto/create-internal-user.dto';
import type { CreatePlatformUserDto } from './dto/create-platform-user.dto';
import type { UpdatePlatformChallengeDto } from './dto/update-platform-challenge.dto';

type StoredUserDocument = Document & {
  id: string;
  email: string;
  displayName: string;
  organization?: string;
  role: 'USER' | 'ADMIN' | 'BUSINESS_ADMIN';
  accountStatus: 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED';
  businessId?: string;
  businessDomain?: string;
  createdAt: string;
  passwordHash: string;
};

type StoredBusinessDocument = Document & {
  id: string;
  name: string;
  domain: string;
  adminUserId?: string;
  adminEmail?: string;
  createdAt: string;
};

type StoredAssignmentDocument = Document & {
  id: string;
  businessId: string;
  challengeId: string;
  challengeTitle?: string;
  assigneeName?: string;
  assignedAt: string;
};

type StoredReviewDocument = Document & {
  id: string;
  businessId: string;
  challengeId: string;
  reviewed: boolean;
};

@Injectable()
export class PlatformAdminService {
  private readonly sessions = new Map<string, string>();
  private readonly password: string;

  constructor(
    config: ConfigService,
    private readonly mongo: MongoDatabaseService,
    private readonly challengesService: ChallengesService,
  ) {
    this.password = config.get<string>('DEV_ADMIN_PASSWORD') ?? 'phishaware-dev-admin';
  }

  login(input: { password: string }) {
    if (input.password !== this.password) {
      throw new UnauthorizedException('Invalid developer admin password.');
    }

    const accessToken = randomBytes(32).toString('hex');
    this.sessions.set(accessToken, new Date().toISOString());
    return {
      accessToken,
      user: {
        role: 'DEVELOPER_ADMIN',
        displayName: 'PhishAware Developer',
      },
    };
  }

  async overview(authorization?: string) {
    this.requireDeveloper(authorization);
    const challenges = await this.challengesService.list();

    if (!this.mongo.configured) {
      return {
        metrics: this.emptyMetrics(challenges),
        businesses: [],
        users: [],
        recentAssignments: [],
        challenges,
      };
    }

    const users = await this.mongo.collection<StoredUserDocument>('users');
    const businesses = await this.mongo.collection<StoredBusinessDocument>('businesses');
    const assignments = await this.mongo.collection<StoredAssignmentDocument>('business_assignments');
    const reviews = await this.mongo.collection<StoredReviewDocument>('business_challenge_reviews');

    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      rejectedUsers,
      totalBusinesses,
      totalAssignments,
      reviewedChallenges,
      businessRows,
      userRows,
      recentAssignments,
    ] = await Promise.all([
      users.countDocuments({ role: 'USER' }),
      users.countDocuments({ role: 'USER', accountStatus: 'ACTIVE' }),
      users.countDocuments({ role: 'USER', accountStatus: 'PENDING_APPROVAL' }),
      users.countDocuments({ role: 'USER', accountStatus: 'REJECTED' }),
      businesses.countDocuments(),
      assignments.countDocuments(),
      reviews.countDocuments({ reviewed: true }),
      businesses.find().sort({ createdAt: -1 }).limit(20).toArray(),
      users.find({ role: 'ADMIN' }).sort({ createdAt: -1 }).limit(50).toArray(),
      assignments.find().sort({ assignedAt: -1 }).limit(10).toArray(),
    ]);

    const userCountsByBusiness = await users.aggregate<{ _id: string; count: number }>([
      { $match: { businessId: { $exists: true } } },
      { $group: { _id: '$businessId', count: { $sum: 1 } } },
    ]).toArray();
    const userCountMap = new Map(userCountsByBusiness.map((item) => [item._id, item.count]));

    return {
      metrics: {
        totalUsers,
        activeUsers,
        pendingUsers,
        rejectedUsers,
        totalBusinesses,
        totalAssignments,
        reviewedChallenges,
        totalChallenges: challenges.length,
        releasedChallenges: challenges.filter((challenge) => challenge.status === 'AVAILABLE').length,
        draftChallenges: challenges.filter((challenge) => challenge.status === 'DRAFT').length,
      },
      businesses: await Promise.all(businessRows.map(async (business) => ({
        id: business.id,
        name: business.name,
        domain: business.domain,
        adminUserId: business.adminUserId,
        adminEmail: business.adminEmail,
        createdAt: business.createdAt,
        userCount: userCountMap.get(business.id) ?? 0,
        admins: (await users.find({ role: 'BUSINESS_ADMIN', businessId: business.id }).sort({ createdAt: -1 }).toArray()).map((admin) => ({
          id: admin.id,
          email: admin.email,
          displayName: admin.displayName,
          createdAt: admin.createdAt,
        })),
      }))),
      users: userRows.map((user) => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        organization: user.organization,
        role: user.role,
        accountStatus: user.accountStatus,
        businessId: user.businessId,
        businessDomain: user.businessDomain,
        createdAt: user.createdAt,
      })),
      recentAssignments,
      challenges,
    };
  }

  async createUser(authorization: string | undefined, input: CreatePlatformUserDto) {
    this.requireDeveloper(authorization);
    if (!this.mongo.configured) {
      throw new BadRequestException('MongoDB is required for developer user management.');
    }

    const businesses = await this.mongo.collection<StoredBusinessDocument>('businesses');
    const business = await businesses.findOne({ id: input.businessId });
    if (!business) {
      throw new BadRequestException('Business not found.');
    }

    const email = input.email.trim().toLowerCase();
    const domain = email.split('@').pop()?.toLowerCase();
    if (domain !== business.domain) {
      throw new BadRequestException(`User email must use the selected business domain: ${business.domain}`);
    }

    const users = await this.mongo.collection<StoredUserDocument>('users');
    await users.createIndex({ email: 1 }, { unique: true });
    const existing = await users.findOne({ email });
    if (existing) {
      throw new ConflictException('A user already exists with this email.');
    }

    const user = {
      id: randomUUID(),
      email,
      displayName: input.displayName.trim(),
      organization: input.organization?.trim() || business.name,
      role: 'USER' as const,
      accountStatus: input.accountStatus ?? 'PENDING_APPROVAL',
      businessId: business.id,
      businessDomain: business.domain,
      createdAt: new Date().toISOString(),
      passwordHash: this.hashPassword(input.password),
    };
    await users.insertOne(user);

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      organization: user.organization,
      role: user.role,
      accountStatus: user.accountStatus,
      businessId: user.businessId,
      businessDomain: user.businessDomain,
      createdAt: user.createdAt,
    };
  }

  async createInternalUser(authorization: string | undefined, input: CreateInternalUserDto) {
    this.requireDeveloper(authorization);
    if (!this.mongo.configured) {
      throw new BadRequestException('MongoDB is required for developer user management.');
    }

    const users = await this.mongo.collection<StoredUserDocument>('users');
    const email = input.email.trim().toLowerCase();
    await users.createIndex({ email: 1 }, { unique: true });
    if (await users.findOne({ email })) {
      throw new ConflictException('A user already exists with this email.');
    }

    const user = {
      id: randomUUID(),
      email,
      displayName: input.displayName.trim(),
      organization: 'PhishAware',
      role: 'ADMIN' as const,
      accountStatus: 'ACTIVE' as const,
      createdAt: new Date().toISOString(),
      passwordHash: this.hashPassword(input.password),
    };
    await users.insertOne(user);
    return this.publicUser(user);
  }

  async createBusinessAdmin(authorization: string | undefined, businessId: string, input: CreateBusinessAdminDto) {
    this.requireDeveloper(authorization);
    if (!this.mongo.configured) {
      throw new BadRequestException('MongoDB is required for organization admin management.');
    }

    const businesses = await this.mongo.collection<StoredBusinessDocument>('businesses');
    const business = await businesses.findOne({ id: businessId });
    if (!business) throw new BadRequestException('Business not found.');

    const email = input.email.trim().toLowerCase();
    const domain = email.split('@').pop()?.toLowerCase();
    if (domain !== business.domain) {
      throw new BadRequestException(`Business admin email must use ${business.domain}.`);
    }

    const users = await this.mongo.collection<StoredUserDocument>('users');
    await users.createIndex({ email: 1 }, { unique: true });
    if (await users.findOne({ email })) {
      throw new ConflictException('A user already exists with this email.');
    }

    const admin = {
      id: randomUUID(),
      email,
      displayName: input.displayName.trim(),
      organization: business.name,
      role: 'BUSINESS_ADMIN' as const,
      accountStatus: 'ACTIVE' as const,
      businessId: business.id,
      businessDomain: business.domain,
      createdAt: new Date().toISOString(),
      passwordHash: this.hashPassword(input.password),
    };
    await users.insertOne(admin);
    return this.publicUser(admin);
  }

  async deleteBusinessAdmin(authorization: string | undefined, businessId: string, adminId: string) {
    this.requireDeveloper(authorization);
    if (!this.mongo.configured) {
      throw new BadRequestException('MongoDB is required for organization admin management.');
    }

    const users = await this.mongo.collection<StoredUserDocument>('users');
    const admin = await users.findOne({ id: adminId, businessId, role: 'BUSINESS_ADMIN' });
    if (!admin) throw new BadRequestException('Business admin not found.');
    await users.deleteOne({ id: adminId });
    await (await this.mongo.collection<Document>('auth_sessions')).deleteMany({ userId: adminId });
    return { deleted: true };
  }

  async deleteUser(authorization: string | undefined, userId: string) {
    this.requireDeveloper(authorization);
    if (!this.mongo.configured) {
      throw new BadRequestException('MongoDB is required for developer user management.');
    }

    const users = await this.mongo.collection<StoredUserDocument>('users');
    const user = await users.findOne({ id: userId });
    if (!user) {
      throw new BadRequestException('User not found.');
    }
    if (user.role !== 'ADMIN') {
      throw new BadRequestException('Only PhishAware internal users can be removed from this panel.');
    }

    await users.deleteOne({ id: userId });
    await (await this.mongo.collection<Document>('auth_sessions')).deleteMany({ userId });
    await (await this.mongo.collection<StoredAssignmentDocument>('business_assignments')).deleteMany({ assigneeId: userId });
    return { deleted: true };
  }

  async deleteAssignmentActivity(authorization: string | undefined, assignmentId: string) {
    this.requireDeveloper(authorization);
    if (!this.mongo.configured) {
      throw new BadRequestException('MongoDB is required for developer activity management.');
    }

    await (await this.mongo.collection<StoredAssignmentDocument>('business_assignments')).deleteOne({ id: assignmentId });
    return { deleted: true };
  }

  async createChallenge(authorization: string | undefined, input: CreateChallengeDto) {
    this.requireDeveloper(authorization);
    return this.challengesService.create(input);
  }

  async generateChallenge(authorization: string | undefined, input: GenerateAndSaveChallengeDto) {
    this.requireDeveloper(authorization);
    try {
      return await this.challengesService.generateAndSave(input);
    } catch {
      return this.createLocalGeneratedDraft(input);
    }
  }

  async updateChallengeStatus(authorization: string | undefined, challengeId: string, status: ChallengeRecord['status']) {
    this.requireDeveloper(authorization);
    return this.challengesService.updateStatus(challengeId, status);
  }

  async updateChallenge(authorization: string | undefined, challengeId: string, input: UpdatePlatformChallengeDto) {
    this.requireDeveloper(authorization);
    return this.challengesService.update(challengeId, input);
  }

  async deleteChallenge(authorization: string | undefined, challengeId: string) {
    this.requireDeveloper(authorization);
    return this.challengesService.delete(challengeId);
  }

  private publicUser(user: StoredUserDocument | {
    id: string;
    email: string;
    displayName: string;
    organization?: string;
    role: 'USER' | 'ADMIN' | 'BUSINESS_ADMIN';
    accountStatus: 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED';
    businessId?: string;
    businessDomain?: string;
    createdAt: string;
  }) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      organization: user.organization,
      role: user.role,
      accountStatus: user.accountStatus,
      businessId: user.businessId,
      businessDomain: user.businessDomain,
      createdAt: user.createdAt,
    };
  }

  private async createLocalGeneratedDraft(input: GenerateAndSaveChallengeDto) {
    const theme = input.theme?.trim() || 'Credential Safety';
    const audience = input.targetAudience?.trim() || 'early-career employees';
    const organization = input.organizationName?.trim() || 'the organization';
    const difficulty = input.difficulty || 'BEGINNER';
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 12);
    const title = `${theme} Email Lab ${timestamp}`;
    const objectives = input.learningObjectives?.length
      ? input.learningObjectives
      : ['Inspect sender identity', 'Verify link destinations', 'Identify pressure tactics'];

    const lure = [
      `From: IT Service Desk <security-update@${organization.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'company'}-verify.com>`,
      `To: ${audience}`,
      `Subject: Action required: ${theme}`,
      '',
      `Hello,`,
      '',
      `We need you to confirm your mailbox access today to keep your ${organization} account active.`,
      `Open the secure verification page and complete the requested account check.`,
      '',
      `Verify account: https://login-${organization.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'company'}-secure.example/reset`,
      '',
      `Regards,`,
      `Service Operations`,
    ].join('\n');

    const challenge = await this.challengesService.create({
      title,
      type: input.channel === 'EMAIL' ? 'Email Phishing' : `${input.channel} Phishing`,
      difficulty,
      status: input.status ?? 'DRAFT',
    });

    return this.challengesService.update(challenge.id, {
      context: [
        `Generated local draft for ${audience}.`,
        `Scenario theme: ${theme}.`,
        `Review focus: ${objectives.join(', ')}.`,
        'This fallback draft was created because the AI provider was not available.',
      ].join('\n'),
      lure,
      status: input.status ?? 'DRAFT',
    });
  }

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const derived = pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex');
    return `${salt}:${derived}`;
  }

  private requireDeveloper(authorization?: string) {
    const [scheme, token] = authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token || !this.sessions.has(token)) {
      throw new UnauthorizedException('Developer admin login required.');
    }
  }

  private emptyMetrics(challenges: ChallengeRecord[]) {
    return {
      totalUsers: 0,
      activeUsers: 0,
      pendingUsers: 0,
      rejectedUsers: 0,
      totalBusinesses: 0,
      totalAssignments: 0,
      reviewedChallenges: 0,
      totalChallenges: challenges.length,
      releasedChallenges: challenges.filter((challenge) => challenge.status === 'AVAILABLE').length,
      draftChallenges: challenges.filter((challenge) => challenge.status === 'DRAFT').length,
    };
  }
}
