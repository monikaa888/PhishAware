import { Body, Controller, Delete, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterBusinessDto } from './dto/register-business.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('business/register')
  registerBusiness(@Body() body: RegisterBusinessDto) {
    return this.authService.registerBusiness(body);
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Get('me')
  me(@Headers('authorization') authorization?: string) {
    return this.authService.me(authorization);
  }

  @Patch('me')
  updateMe(@Headers('authorization') authorization: string | undefined, @Body() body: UpdateProfileDto) {
    return this.authService.updateMe(authorization, body);
  }

  @Get('business')
  businessDashboard(@Headers('authorization') authorization?: string) {
    return this.authService.businessDashboard(authorization);
  }

  @Get('business/reviews')
  businessReviews(@Headers('authorization') authorization?: string) {
    return this.authService.businessReviews(authorization);
  }

  @Post('business/reviews/:challengeId')
  saveBusinessReview(
    @Headers('authorization') authorization: string | undefined,
    @Param('challengeId') challengeId: string,
    @Body() body: { audience?: string; tone?: string; companyContext?: string; reviewed?: boolean },
  ) {
    return this.authService.saveBusinessReview(authorization, challengeId, body);
  }

  @Get('business/assignments')
  businessAssignments(@Headers('authorization') authorization?: string) {
    return this.authService.businessAssignments(authorization);
  }

  @Post('business/assignments')
  assignBusinessChallenge(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { challengeId: string; challengeTitle: string; assigneeType: 'all' | 'user'; assigneeId?: string; assigneeName?: string },
  ) {
    return this.authService.assignBusinessChallenge(authorization, body);
  }

  @Delete('business/assignments/:assignmentId')
  deleteBusinessAssignment(@Headers('authorization') authorization: string | undefined, @Param('assignmentId') assignmentId: string) {
    return this.authService.deleteBusinessAssignment(authorization, assignmentId);
  }

  @Get('assignments')
  myAssignments(@Headers('authorization') authorization?: string) {
    return this.authService.myAssignments(authorization);
  }

  @Post('business/users/:userId/approve')
  approveBusinessUser(@Headers('authorization') authorization: string | undefined, @Param('userId') userId: string) {
    return this.authService.approveBusinessUser(authorization, userId);
  }

  @Post('business/users/:userId/reject')
  rejectBusinessUser(@Headers('authorization') authorization: string | undefined, @Param('userId') userId: string) {
    return this.authService.rejectBusinessUser(authorization, userId);
  }
}
