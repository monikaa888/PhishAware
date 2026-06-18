import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool?: Pool;

  constructor(config: ConfigService) {
    const connectionString = config.get<string>('DATABASE_URL');
    if (connectionString) {
      this.pool = new Pool({ connectionString });
    }
  }

  get configured() {
    return Boolean(this.pool);
  }

  async query<T extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = []): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new Error('DATABASE_URL is not configured.');
    }
    return this.pool.query<T>(sql, params);
  }

  async onModuleDestroy() {
    await this.pool?.end();
  }
}
