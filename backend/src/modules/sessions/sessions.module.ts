import { Module } from '@nestjs/common';
import { ChallengesModule } from '../challenges/challenges.module';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

@Module({
  imports: [ChallengesModule],
  controllers: [SessionsController],
  providers: [SessionsService],
})
export class SessionsModule {}
