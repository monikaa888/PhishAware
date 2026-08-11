import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePlatformChallengeDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  difficulty?: string;

  @IsOptional()
  @IsIn(['DRAFT', 'AVAILABLE', 'LOCKED', 'ARCHIVED'])
  status?: 'DRAFT' | 'AVAILABLE' | 'LOCKED' | 'ARCHIVED';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  context?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  lure?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  scheduledReleaseAt?: string;
}
