import { BadGatewayException, Injectable } from '@nestjs/common';
import { GeminiProviderService } from './gemini-provider.service';
import type { GeneratedChallenge, GenerateChallengeInput } from './ai.types';

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

@Injectable()
export class AiGenerationService {
  constructor(private readonly geminiProvider: GeminiProviderService) {}

  async generateChallenge(input: GenerateChallengeInput): Promise<GeneratedChallenge & { provider: 'mock' | 'gemini' }> {
    if (!this.geminiProvider.configured) {
      return { ...this.mockChallenge(input), provider: 'mock' };
    }

    const generated = await this.geminiProvider.generateJson(this.buildPrompt(input));
    return { ...this.normalizeGeminiOutput(generated, input), provider: 'gemini' };
  }

  private buildPrompt(input: GenerateChallengeInput) {
    return `
You are generating a safe cybersecurity awareness challenge for PhishAware.
Return JSON only. Do not include markdown.

Rules:
- Create defensive training content only.
- Use fake domains ending in .example or .test.
- Do not include real credential collection, malware, exploit steps, or instructions to bypass security.
- The lure should be realistic enough for awareness training, but safe.
- The explanation must teach what is wrong, why it is vulnerable, and how to identify phishing.

JSON shape:
{
  "title": "string",
  "channel": "EMAIL" | "SMS" | "SOCIAL",
  "difficulty": "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
  "targetAudience": "string",
  "scenarioSummary": "string",
  "lure": {
    "senderName": "string",
    "senderHandle": "string",
    "subject": "string optional",
    "body": "string",
    "callToAction": "string",
    "linkUrl": "https://safe-training.example/path optional",
    "attachmentName": "string optional"
  },
  "suspiciousIndicators": ["string"],
  "learningObjectives": ["string"],
  "scoringRules": {
    "safeActions": ["string"],
    "riskyActions": ["string"],
    "maxScore": 100
  },
  "explanation": {
    "whatIsWrong": ["string"],
    "whyVulnerable": "string",
    "howToIdentify": ["string"],
    "safeResponse": "string"
  },
  "safetyVerdict": {
    "allowed": true,
    "notes": ["string"]
  }
}

Request:
channel=${input.channel}
difficulty=${input.difficulty}
targetAudience=${input.targetAudience}
theme=${input.theme ?? 'phishing awareness'}
organizationName=${input.organizationName ?? 'PhishAware Training'}
learningObjectives=${(input.learningObjectives ?? []).join('; ')}
`;
  }

  private normalizeGeminiOutput(output: unknown, input: GenerateChallengeInput): GeneratedChallenge {
    if (!isObject(output)) {
      throw new BadGatewayException('Gemini returned invalid challenge JSON.');
    }

    const fallback = this.mockChallenge(input);
    const title = typeof output.title === 'string' ? output.title : fallback.title;

    return {
      title,
      slug: slugify(title),
      channel: output.channel === 'EMAIL' || output.channel === 'SMS' || output.channel === 'SOCIAL' ? output.channel : input.channel,
      difficulty:
        output.difficulty === 'BEGINNER' || output.difficulty === 'INTERMEDIATE' || output.difficulty === 'ADVANCED'
          ? output.difficulty
          : input.difficulty,
      targetAudience: typeof output.targetAudience === 'string' ? output.targetAudience : input.targetAudience,
      scenarioSummary: typeof output.scenarioSummary === 'string' ? output.scenarioSummary : fallback.scenarioSummary,
      lure: isObject(output.lure) ? { ...fallback.lure, ...output.lure } : fallback.lure,
      suspiciousIndicators: Array.isArray(output.suspiciousIndicators) ? output.suspiciousIndicators.map(String).slice(0, 8) : fallback.suspiciousIndicators,
      learningObjectives: Array.isArray(output.learningObjectives) ? output.learningObjectives.map(String).slice(0, 6) : fallback.learningObjectives,
      scoringRules: isObject(output.scoringRules)
        ? {
            safeActions: Array.isArray(output.scoringRules.safeActions) ? output.scoringRules.safeActions.map(String).slice(0, 8) : fallback.scoringRules.safeActions,
            riskyActions: Array.isArray(output.scoringRules.riskyActions) ? output.scoringRules.riskyActions.map(String).slice(0, 8) : fallback.scoringRules.riskyActions,
            maxScore: 100,
          }
        : fallback.scoringRules,
      explanation: isObject(output.explanation) ? { ...fallback.explanation, ...output.explanation } : fallback.explanation,
      safetyVerdict: {
        allowed: true,
        notes: ['Generated for defensive awareness training', 'Output normalized by backend safety contract'],
      },
    };
  }

  private mockChallenge(input: GenerateChallengeInput): GeneratedChallenge {
    const theme = input.theme ?? (input.channel === 'SMS' ? 'delivery fee' : input.channel === 'SOCIAL' ? 'recruiter verification' : 'account verification');
    const title = `${theme} ${input.channel.toLowerCase()} challenge`.replace(/\b\w/g, (letter) => letter.toUpperCase());
    const linkHost = `${slugify(theme) || 'training'}-verify.example`;

    return {
      title,
      slug: slugify(title),
      channel: input.channel,
      difficulty: input.difficulty,
      targetAudience: input.targetAudience,
      scenarioSummary: `A ${input.channel.toLowerCase()} lure targets ${input.targetAudience} with urgency and a suspicious verification request.`,
      lure: {
        senderName: input.channel === 'SOCIAL' ? 'Campus Careers' : input.channel === 'SMS' ? 'Delivery Notice' : 'Account Security Team',
        senderHandle: input.channel === 'EMAIL' ? `security@${linkHost}` : input.channel === 'SMS' ? '+1 (555) 014-8801' : '@campus-careers-help',
        subject: input.channel === 'EMAIL' ? 'Action required: verify access' : undefined,
        body: `Your ${theme} request needs immediate verification. Open https://${linkHost}/check to continue.`,
        callToAction: 'Open the message, inspect the link, and choose the safest response.',
        linkUrl: `https://${linkHost}/check`,
      },
      suspiciousIndicators: [
        'Urgent language pressures quick action.',
        'The destination uses a lookalike training domain.',
        'The message asks the learner to verify sensitive account access.',
      ],
      learningObjectives: input.learningObjectives?.length
        ? input.learningObjectives
        : ['Inspect sender identity', 'Check link destinations', 'Avoid entering credentials from message links', 'Report suspicious content'],
      scoringRules: {
        safeActions: ['REPORT_MESSAGE', 'BLOCK_SENDER', 'INSPECT_LINK'],
        riskyActions: ['OPEN_LINK_AND_SUBMIT', 'REPLY_WITH_SECRET', 'DOWNLOAD_ATTACHMENT'],
        maxScore: 100,
      },
      explanation: {
        whatIsWrong: ['The message creates urgency.', 'The sender/domain does not match a trusted source.', 'The link leads to a verification page from the message.'],
        whyVulnerable: 'A learner could disclose credentials or payment details to a fake page controlled by an attacker.',
        howToIdentify: ['Compare sender and domain carefully.', 'Avoid links that ask for passwords or payments.', 'Use official apps or known bookmarks instead of message links.'],
        safeResponse: 'Do not submit data. Report the message and verify through an official channel.',
      },
      safetyVerdict: {
        allowed: true,
        notes: ['Mock provider output', 'Uses .example domain', 'No real credential collection'],
      },
    };
  }
}
