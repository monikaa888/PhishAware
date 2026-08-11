import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Document } from 'mongodb';
import { DatabaseService } from '../../database/database.service';
import { MongoDatabaseService } from '../../database/mongo-database.service';
import { ChallengesService, type ChallengeRecord } from '../challenges/challenges.service';
import type { RecordActionDto } from './dto/record-action.dto';

type SessionRecord = {
  id: string;
  challengeId: string;
  status: 'STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  score?: number;
  riskScore?: number;
  startedAt: string;
  completedAt?: string;
};

type SessionRow = {
  id: string;
  challenge_id: string;
  status: SessionRecord['status'];
  score: number | null;
  risk_score: number | null;
  started_at: Date;
  completed_at: Date | null;
};

type SessionDocument = SessionRecord & Document;

type UserActionDocument = Document & {
  id: string;
  sessionId: string;
  actionType: string;
  target?: string;
  metadata?: Record<string, unknown>;
  occurredAt: string;
  result: Record<string, unknown>;
};

@Injectable()
export class SessionsService {
  private readonly memorySessions = new Map<string, SessionRecord>();

  constructor(
    private readonly database: DatabaseService,
    private readonly mongo: MongoDatabaseService,
    private readonly challengesService: ChallengesService,
  ) {}

  async start(challengeId: string) {
    await this.challengesService.findOne(challengeId);

    if (this.mongo.configured) {
      const session: SessionRecord = {
        id: randomUUID(),
        challengeId,
        status: 'STARTED',
        startedAt: new Date().toISOString(),
      };
      await (await this.mongo.collection<SessionDocument>('challenge_sessions')).insertOne(session);
      return session;
    }

    if (!this.database.configured) {
      const session: SessionRecord = {
        id: randomUUID(),
        challengeId,
        status: 'STARTED',
        startedAt: new Date().toISOString(),
      };
      this.memorySessions.set(session.id, session);
      return session;
    }

    const result = await this.database.query<SessionRow>(
      `INSERT INTO challenge_sessions (challenge_id, status)
       VALUES ($1, 'STARTED')
       RETURNING id, challenge_id, status, score, risk_score, started_at, completed_at`,
      [challengeId],
    );
    return this.fromRow(result.rows[0]);
  }

  async recordAction(sessionId: string, body: RecordActionDto) {
    const session = await this.getSession(sessionId);
    const challenge = await this.challengesService.findOne(session.challengeId);
    const result = this.evaluateAction(challenge, body.actionType);

    if (this.mongo.configured) {
      const nextSession: SessionRecord = {
        ...session,
        status: 'COMPLETED',
        score: result.score,
        riskScore: result.riskScore,
        completedAt: new Date().toISOString(),
      };
      await (await this.mongo.collection<SessionDocument>('challenge_sessions')).updateOne(
        { id: sessionId },
        { $set: nextSession },
      );

      const action = {
        id: randomUUID(),
        sessionId,
        ...body,
        occurredAt: new Date().toISOString(),
        result,
      };
      await (await this.mongo.collection<UserActionDocument>('user_actions')).insertOne(action);
      return action;
    }

    if (!this.database.configured) {
      const nextSession: SessionRecord = {
        ...session,
        status: 'COMPLETED',
        score: result.score,
        riskScore: result.riskScore,
        completedAt: new Date().toISOString(),
      };
      this.memorySessions.set(sessionId, nextSession);
      return {
        id: randomUUID(),
        sessionId,
        ...body,
        occurredAt: new Date().toISOString(),
        result,
      };
    }

    await this.database.query(
      `INSERT INTO user_actions (session_id, action_type, target, metadata)
       VALUES ($1, $2, $3, $4::jsonb)`,
      [sessionId, body.actionType, body.target ?? null, JSON.stringify(body.metadata ?? {})],
    );
    await this.database.query(
      `UPDATE challenge_sessions
       SET status = 'COMPLETED', score = $2, risk_score = $3, completed_at = now()
       WHERE id = $1`,
      [sessionId, result.score, result.riskScore],
    );

    return {
      id: randomUUID(),
      sessionId,
      ...body,
      occurredAt: new Date().toISOString(),
      result,
    };
  }

  private async getSession(sessionId: string) {
    if (this.mongo.configured) {
      const session = await (await this.mongo.collection<SessionDocument>('challenge_sessions')).findOne({ id: sessionId });
      if (!session) {
        throw new Error('Session not found');
      }
      return this.fromDocument(session);
    }

    if (!this.database.configured) {
      const session = this.memorySessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }
      return session;
    }

    const result = await this.database.query<SessionRow>(
      `SELECT id, challenge_id, status, score, risk_score, started_at, completed_at
       FROM challenge_sessions
       WHERE id = $1`,
      [sessionId],
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error('Session not found');
    }
    return this.fromRow(row);
  }

  private evaluateAction(challenge: ChallengeRecord, actionType: string) {
    const safeActions = this.stringArray(challenge.scoringSpec.safeActions);
    const riskyActions = this.stringArray(challenge.scoringSpec.riskyActions);
    const isSafe = safeActions.includes(actionType);
    const isRisky = riskyActions.includes(actionType);

    return {
      outcome: isRisky ? 'RISKY' : isSafe ? 'SAFE' : 'NEUTRAL',
      score: isRisky ? 20 : isSafe ? 100 : 60,
      riskScore: isRisky ? 90 : isSafe ? 10 : 40,
      explanation: challenge.explanation ?? challenge.simulationSpec.explanation ?? {},
      suspiciousIndicators: challenge.suspiciousIndicators,
    };
  }

  private stringArray(value: unknown) {
    return Array.isArray(value) ? value.map(String) : [];
  }

  private fromRow(row: SessionRow): SessionRecord {
    return {
      id: row.id,
      challengeId: row.challenge_id,
      status: row.status,
      score: row.score ?? undefined,
      riskScore: row.risk_score ?? undefined,
      startedAt: row.started_at.toISOString(),
      completedAt: row.completed_at?.toISOString(),
    };
  }

  private fromDocument(row: SessionDocument): SessionRecord {
    return {
      id: row.id,
      challengeId: row.challengeId,
      status: row.status,
      score: row.score,
      riskScore: row.riskScore,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
    };
  }
}
