import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AiGenerationService } from '../ai/ai-generation.service';
import type { GeneratedChallenge } from '../ai/ai.types';
import { DatabaseService } from '../../database/database.service';
import type { CreateChallengeDto } from './dto/create-challenge.dto';
import type { GenerateAndSaveChallengeDto } from './dto/generate-and-save-challenge.dto';

export type ChallengeRecord = {
  id: string;
  title: string;
  type: string;
  difficulty: string;
  xp: number;
  durationMinutes: number;
  status: 'DRAFT' | 'AVAILABLE' | 'LOCKED' | 'ARCHIVED' | 'COMPLETED';
  simulationSpec: Record<string, unknown>;
  scoringSpec: Record<string, unknown>;
  suspiciousIndicators: string[];
  explanation?: Record<string, unknown>;
};

type ChallengeRow = {
  id: string;
  title: string;
  challenge_type: string;
  difficulty: string;
  status: ChallengeRecord['status'];
  simulation_spec: Record<string, unknown>;
  scoring_spec: Record<string, unknown>;
  suspicious_indicators: string[];
};

const seedChallenges: ChallengeRecord[] = [
  {
    id: 'email-paypal-invoice',
    title: 'PayPal Invoice Scam',
    type: 'Email Phishing',
    difficulty: 'BEGINNER',
    xp: 50,
    durationMinutes: 3,
    status: 'AVAILABLE',
    simulationSpec: {},
    scoringSpec: {},
    suspiciousIndicators: ['Unexpected invoice', 'External payment link'],
  },
  {
    id: 'it-support-trap',
    title: 'The IT Support Trap',
    type: 'Social Engineering',
    difficulty: 'INTERMEDIATE',
    xp: 100,
    durationMinutes: 5,
    status: 'AVAILABLE',
    simulationSpec: {},
    scoringSpec: {},
    suspiciousIndicators: ['Authority pressure', 'Password request'],
  },
  {
    id: 'deepfake-voice',
    title: 'Deepfake Voice Clip',
    type: 'AI Phishing',
    difficulty: 'ADVANCED',
    xp: 250,
    durationMinutes: 8,
    status: 'AVAILABLE',
    simulationSpec: {},
    scoringSpec: {},
    suspiciousIndicators: ['Voice impersonation', 'Urgent payment request'],
  },
];

@Injectable()
export class ChallengesService {
  private readonly memoryChallenges = [...seedChallenges];

  constructor(
    private readonly database: DatabaseService,
    private readonly aiGenerationService: AiGenerationService,
  ) {}

  async list() {
    if (!this.database.configured) {
      return this.memoryChallenges;
    }

    const result = await this.database.query<ChallengeRow>(
      `SELECT id, title, challenge_type, difficulty, status, simulation_spec, scoring_spec, suspicious_indicators
       FROM challenges
       ORDER BY created_at DESC`,
    );
    return result.rows.map((row) => this.fromRow(row));
  }

  async findOne(id: string) {
    if (!this.database.configured) {
      const challenge = this.memoryChallenges.find((item) => item.id === id);
      if (!challenge) throw new NotFoundException('Challenge not found');
      return challenge;
    }

    const result = await this.database.query<ChallengeRow>(
      `SELECT id, title, challenge_type, difficulty, status, simulation_spec, scoring_spec, suspicious_indicators
       FROM challenges
       WHERE id = $1`,
      [id],
    );
    const row = result.rows[0];
    if (!row) throw new NotFoundException('Challenge not found');
    return this.fromRow(row);
  }

  async create(input: CreateChallengeDto) {
    const challenge: ChallengeRecord = {
      id: this.slugOrUuid(input.title),
      title: input.title,
      type: input.type,
      difficulty: input.difficulty,
      xp: 50,
      durationMinutes: 5,
      status: input.status ?? 'AVAILABLE',
      simulationSpec: {},
      scoringSpec: {},
      suspiciousIndicators: [],
    };

    if (!this.database.configured) {
      this.memoryChallenges.push(challenge);
      return challenge;
    }

    const result = await this.database.query<ChallengeRow>(
      `INSERT INTO challenges (title, challenge_type, difficulty, status, simulation_spec, scoring_spec, suspicious_indicators)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb)
       RETURNING id, title, challenge_type, difficulty, status, simulation_spec, scoring_spec, suspicious_indicators`,
      [challenge.title, challenge.type, challenge.difficulty, challenge.status, '{}', '{}', '[]'],
    );
    return this.fromRow(result.rows[0]);
  }

  async generateAndSave(input: GenerateAndSaveChallengeDto) {
    const generated = await this.aiGenerationService.generateChallenge(input);
    const challenge = this.fromGenerated(generated, input.status ?? 'DRAFT');

    if (!this.database.configured) {
      this.memoryChallenges.unshift(challenge);
      return challenge;
    }

    const result = await this.database.query<ChallengeRow>(
      `INSERT INTO challenges (title, challenge_type, difficulty, status, simulation_spec, scoring_spec, suspicious_indicators)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb)
       RETURNING id, title, challenge_type, difficulty, status, simulation_spec, scoring_spec, suspicious_indicators`,
      [
        challenge.title,
        challenge.type,
        challenge.difficulty,
        challenge.status,
        JSON.stringify(challenge.simulationSpec),
        JSON.stringify(challenge.scoringSpec),
        JSON.stringify(challenge.suspiciousIndicators),
      ],
    );
    return this.fromRow(result.rows[0]);
  }

  private fromGenerated(generated: GeneratedChallenge & { provider?: string }, status: 'DRAFT' | 'AVAILABLE'): ChallengeRecord {
    return {
      id: generated.slug || randomUUID(),
      title: generated.title,
      type: generated.channel,
      difficulty: generated.difficulty,
      xp: generated.difficulty === 'ADVANCED' ? 250 : generated.difficulty === 'INTERMEDIATE' ? 100 : 50,
      durationMinutes: generated.difficulty === 'ADVANCED' ? 12 : generated.difficulty === 'INTERMEDIATE' ? 8 : 5,
      status,
      simulationSpec: {
        provider: generated.provider ?? 'unknown',
        channel: generated.channel,
        targetAudience: generated.targetAudience,
        scenarioSummary: generated.scenarioSummary,
        lure: generated.lure,
        learningObjectives: generated.learningObjectives,
        explanation: generated.explanation,
      },
      scoringSpec: generated.scoringRules,
      suspiciousIndicators: generated.suspiciousIndicators,
      explanation: generated.explanation,
    };
  }

  private fromRow(row: ChallengeRow): ChallengeRecord {
    return {
      id: row.id,
      title: row.title,
      type: row.challenge_type,
      difficulty: row.difficulty,
      xp: row.difficulty === 'ADVANCED' ? 250 : row.difficulty === 'INTERMEDIATE' ? 100 : 50,
      durationMinutes: row.difficulty === 'ADVANCED' ? 12 : row.difficulty === 'INTERMEDIATE' ? 8 : 5,
      status: row.status,
      simulationSpec: row.simulation_spec,
      scoringSpec: row.scoring_spec,
      suspiciousIndicators: row.suspicious_indicators,
      explanation: row.simulation_spec.explanation as Record<string, unknown> | undefined,
    };
  }

  private slugOrUuid(title: string) {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return slug || randomUUID();
  }
}
