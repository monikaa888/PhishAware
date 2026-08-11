import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { MongoDatabaseService } from './mongo-database.service';

@Global()
@Module({
  providers: [DatabaseService, MongoDatabaseService],
  exports: [DatabaseService, MongoDatabaseService],
})
export class DatabaseModule {}
