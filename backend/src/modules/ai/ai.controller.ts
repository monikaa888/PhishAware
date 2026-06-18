import { Body, Controller, Post } from '@nestjs/common';
import { AiGenerationService } from './ai-generation.service';
import { GenerateChallengeDto } from './dto/generate-challenge.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiGenerationService: AiGenerationService) {}

  @Post('challenges/generate')
  generateChallenge(@Body() body: GenerateChallengeDto) {
    return this.aiGenerationService.generateChallenge(body);
  }
}
