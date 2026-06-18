import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChallengesModule } from './modules/challenges/challenges.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DatabaseModule } from './database/database.module';
import { SessionsModule } from './modules/sessions/sessions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    DashboardModule,
    ChallengesModule,
    SessionsModule,
    AiModule,
  ],
})
export class AppModule {}
