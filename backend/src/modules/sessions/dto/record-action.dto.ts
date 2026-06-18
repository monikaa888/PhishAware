import { IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class RecordActionDto {
  @IsIn(['OPEN_LINK', 'SUBMIT_SECRET', 'REPORT_MESSAGE', 'BLOCK_SENDER', 'MARK_SAFE', 'ARCHIVE', 'REPLY', 'DOWNLOAD_ATTACHMENT'])
  actionType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  target?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
