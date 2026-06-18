import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiGenerationService } from './ai-generation.service';
import { GeminiProviderService } from './gemini-provider.service';

@Module({
  controllers: [AiController],
  providers: [AiGenerationService, GeminiProviderService],
  exports: [AiGenerationService],
})
export class AiModule {}
