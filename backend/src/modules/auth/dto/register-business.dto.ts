import { IsEmail, IsFQDN, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterBusinessDto {
  @IsString()
  @MaxLength(120)
  businessName!: string;

  @IsFQDN()
  @MaxLength(160)
  domain!: string;

  @IsEmail()
  @MaxLength(160)
  adminEmail!: string;

  @IsString()
  @MaxLength(80)
  adminName!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
