import { Body, Controller, Param, Post } from '@nestjs/common';
import { RecordActionDto } from './dto/record-action.dto';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post(':challengeId/start')
  start(@Param('challengeId') challengeId: string) {
    return this.sessionsService.start(challengeId);
  }

  @Post(':sessionId/actions')
  recordAction(@Param('sessionId') sessionId: string, @Body() body: RecordActionDto) {
    return this.sessionsService.recordAction(sessionId, body);
  }
}
