import { IsIn } from 'class-validator';

export class UpdateChallengeStatusDto {
  @IsIn(['DRAFT', 'AVAILABLE', 'LOCKED', 'ARCHIVED'])
  status!: 'DRAFT' | 'AVAILABLE' | 'LOCKED' | 'ARCHIVED';
}
