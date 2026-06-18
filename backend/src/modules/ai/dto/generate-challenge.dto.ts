import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { ChallengeChannel, ChallengeDifficulty } from '../ai.types';

export class GenerateChallengeDto {
  @IsIn(['EMAIL', 'SMS', 'SOCIAL'])
  channel!: ChallengeChannel;

  @IsIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
  difficulty!: ChallengeDifficulty;

  @IsString()
  @MaxLength(120)
  targetAudience!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  theme?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  organizationName?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  learningObjectives?: string[];
}
