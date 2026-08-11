import { Body, Controller, Delete, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { CreateChallengeDto } from '../challenges/dto/create-challenge.dto';
import { GenerateAndSaveChallengeDto } from '../challenges/dto/generate-and-save-challenge.dto';
import { CreateBusinessAdminDto } from './dto/create-business-admin.dto';
import { CreateInternalUserDto } from './dto/create-internal-user.dto';
import { CreatePlatformUserDto } from './dto/create-platform-user.dto';
import { DeveloperLoginDto } from './dto/developer-login.dto';
import { UpdatePlatformChallengeDto } from './dto/update-platform-challenge.dto';
import { UpdateChallengeStatusDto } from './dto/update-challenge-status.dto';
import { PlatformAdminService } from './platform-admin.service';

@Controller('platform-admin')
export class PlatformAdminController {
  constructor(private readonly platformAdminService: PlatformAdminService) {}

  @Post('login')
  login(@Body() body: DeveloperLoginDto) {
    return this.platformAdminService.login(body);
  }

  @Get('overview')
  overview(@Headers('authorization') authorization?: string) {
    return this.platformAdminService.overview(authorization);
  }

  @Post('challenges')
  createChallenge(@Headers('authorization') authorization: string | undefined, @Body() body: CreateChallengeDto) {
    return this.platformAdminService.createChallenge(authorization, body);
  }

  @Post('users')
  createUser(@Headers('authorization') authorization: string | undefined, @Body() body: CreatePlatformUserDto) {
    return this.platformAdminService.createUser(authorization, body);
  }

  @Post('internal-users')
  createInternalUser(@Headers('authorization') authorization: string | undefined, @Body() body: CreateInternalUserDto) {
    return this.platformAdminService.createInternalUser(authorization, body);
  }

  @Delete('users/:userId')
  deleteUser(@Headers('authorization') authorization: string | undefined, @Param('userId') userId: string) {
    return this.platformAdminService.deleteUser(authorization, userId);
  }

  @Post('businesses/:businessId/admins')
  createBusinessAdmin(
    @Headers('authorization') authorization: string | undefined,
    @Param('businessId') businessId: string,
    @Body() body: CreateBusinessAdminDto,
  ) {
    return this.platformAdminService.createBusinessAdmin(authorization, businessId, body);
  }

  @Delete('businesses/:businessId/admins/:adminId')
  deleteBusinessAdmin(
    @Headers('authorization') authorization: string | undefined,
    @Param('businessId') businessId: string,
    @Param('adminId') adminId: string,
  ) {
    return this.platformAdminService.deleteBusinessAdmin(authorization, businessId, adminId);
  }

  @Delete('assignments/:assignmentId')
  deleteAssignmentActivity(@Headers('authorization') authorization: string | undefined, @Param('assignmentId') assignmentId: string) {
    return this.platformAdminService.deleteAssignmentActivity(authorization, assignmentId);
  }

  @Post('challenges/generate')
  generateChallenge(@Headers('authorization') authorization: string | undefined, @Body() body: GenerateAndSaveChallengeDto) {
    return this.platformAdminService.generateChallenge(authorization, body);
  }

  @Patch('challenges/:challengeId/status')
  updateChallengeStatus(
    @Headers('authorization') authorization: string | undefined,
    @Param('challengeId') challengeId: string,
    @Body() body: UpdateChallengeStatusDto,
  ) {
    return this.platformAdminService.updateChallengeStatus(authorization, challengeId, body.status);
  }

  @Patch('challenges/:challengeId')
  updateChallenge(
    @Headers('authorization') authorization: string | undefined,
    @Param('challengeId') challengeId: string,
    @Body() body: UpdatePlatformChallengeDto,
  ) {
    return this.platformAdminService.updateChallenge(authorization, challengeId, body);
  }

  @Delete('challenges/:challengeId')
  deleteChallenge(@Headers('authorization') authorization: string | undefined, @Param('challengeId') challengeId: string) {
    return this.platformAdminService.deleteChallenge(authorization, challengeId);
  }
}
