import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Collection, Db, Document, MongoClient } from 'mongodb';

@Injectable()
export class MongoDatabaseService implements OnModuleDestroy, OnModuleInit {
  private readonly logger = new Logger(MongoDatabaseService.name);
  private readonly client?: MongoClient;
  private dbInstance?: Db;
  private readonly dbName: string;

  constructor(config: ConfigService) {
    const uri = config.get<string>('MONGODB_URI');
    this.dbName = config.get<string>('MONGODB_DB_NAME') ?? 'phishaware';

    if (uri) {
      this.client = new MongoClient(uri);
    }
  }

  get configured() {
    return Boolean(this.client);
  }

  async onModuleInit() {
    if (!this.client) return;

    try {
      await this.client.connect();
      this.dbInstance = this.client.db(this.dbName);
      await this.dbInstance.admin().ping();
      this.logger.log(`Connected to MongoDB database "${this.dbName}".`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown MongoDB connection error.';
      this.logger.error(`MongoDB connection failed: ${message}`);
      this.logger.error('Start MongoDB first, or run ./script.sh from the project root so database, backend, and frontend start together.');
      throw error;
    }
  }

  async collection<TSchema extends Document = Document>(name: string): Promise<Collection<TSchema>> {
    if (!this.client) {
      throw new Error('MONGODB_URI is not configured.');
    }

    if (!this.dbInstance) {
      await this.client.connect();
      this.dbInstance = this.client.db(this.dbName);
    }

    return this.dbInstance.collection<TSchema>(name);
  }

  async onModuleDestroy() {
    await this.client?.close();
  }
}
