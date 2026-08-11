import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { docsHtml } from './docs/docs-page';

type HtmlResponse = {
  setHeader: (name: string, value: string) => void;
  end: (body: string) => void;
};

function corsOrigins(config: ConfigService) {
  const configured = config.get<string>('FRONTEND_URL');
  const defaults = ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001'];

  if (!configured) {
    return defaults;
  }

  return Array.from(new Set([...configured.split(',').map((origin) => origin.trim()).filter(Boolean), ...defaults]));
}

function isAllowedCorsOrigin(origin: string | undefined, allowedOrigins: string[]) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  return /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+):\d+$/.test(origin);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use('/docs', (_request: unknown, response: HtmlResponse) => {
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.end(docsHtml);
  });

  app.setGlobalPrefix('api/v1');
  const allowedOrigins = corsOrigins(config);
  app.enableCors({
    origin: (origin, callback) => {
      callback(null, isAllowedCorsOrigin(origin, allowedOrigins));
    },
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = config.get<number>('PORT') ?? 4000;
  await app.listen(port);
}

void bootstrap();
