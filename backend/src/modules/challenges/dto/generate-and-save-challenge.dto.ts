import { GenerateChallengeDto } from '../../ai/dto/generate-challenge.dto';
import { IsIn, IsOptional } from 'class-validator';

export class GenerateAndSaveChallengeDto extends GenerateChallengeDto {
  @IsOptional()
  @IsIn(['DRAFT', 'AVAILABLE'])
  status?: 'DRAFT' | 'AVAILABLE';
}
