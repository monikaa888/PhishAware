import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @MaxLength(160)
  email!: string;

  @IsString()
  @MaxLength(80)
  displayName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  organization?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
