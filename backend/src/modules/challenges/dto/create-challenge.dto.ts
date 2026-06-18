import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateChallengeDto {
  @IsString()
  @MaxLength(120)
  title!: string;

  @IsString()
  @MaxLength(60)
  type!: string;

  @IsString()
  @MaxLength(60)
  difficulty!: string;

  @IsOptional()
  @IsIn(['DRAFT', 'AVAILABLE', 'LOCKED', 'ARCHIVED'])
  status?: 'DRAFT' | 'AVAILABLE' | 'LOCKED' | 'ARCHIVED';
}
