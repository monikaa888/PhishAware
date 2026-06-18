import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { GenerateAndSaveChallengeDto } from './dto/generate-and-save-challenge.dto';

@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Get()
  list() {
    return this.challengesService.list();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.challengesService.findOne(id);
  }

  @Post()
  create(@Body() body: CreateChallengeDto) {
    return this.challengesService.create(body);
  }

  @Post('generate')
  generateAndSave(@Body() body: GenerateAndSaveChallengeDto) {
    return this.challengesService.generateAndSave(body);
  }
}
