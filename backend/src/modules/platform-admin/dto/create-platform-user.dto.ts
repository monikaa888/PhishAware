import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePlatformUserDto {
  @IsEmail()
  @MaxLength(160)
  email!: string;

  @IsString()
  @MaxLength(80)
  displayName!: string;

  @IsString()
  @MaxLength(80)
  businessId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  organization?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'PENDING_APPROVAL', 'REJECTED'])
  accountStatus?: 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED';

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
