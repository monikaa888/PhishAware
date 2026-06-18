export type ChallengeChannel = 'EMAIL' | 'SMS' | 'SOCIAL';
export type ChallengeDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export type LureMessage = {
  senderName: string;
  senderHandle: string;
  subject?: string;
  body: string;
  callToAction: string;
  linkUrl?: string;
  attachmentName?: string;
};

export type ChallengeExplanation = {
  whatIsWrong: string[];
  whyVulnerable: string;
  howToIdentify: string[];
  safeResponse: string;
};

export type GeneratedChallenge = {
  title: string;
  slug: string;
  channel: ChallengeChannel;
  difficulty: ChallengeDifficulty;
  targetAudience: string;
  scenarioSummary: string;
  lure: LureMessage;
  suspiciousIndicators: string[];
  learningObjectives: string[];
  scoringRules: {
    safeActions: string[];
    riskyActions: string[];
    maxScore: number;
  };
  explanation: ChallengeExplanation;
  safetyVerdict: {
    allowed: boolean;
    notes: string[];
  };
};

export type GenerateChallengeInput = {
  channel: ChallengeChannel;
  difficulty: ChallengeDifficulty;
  targetAudience: string;
  theme?: string;
  organizationName?: string;
  learningObjectives?: string[];
};
