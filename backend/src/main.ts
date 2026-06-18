import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { docsHtml } from './docs/docs-page';

type HtmlResponse = {
  setHeader: (name: string, value: string) => void;
  end: (body: string) => void;
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use('/docs', (_request: unknown, response: HtmlResponse) => {
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.end(docsHtml);
  });

  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = config.get<number>('PORT') ?? 4000;
  await app.listen(port);
}

void bootstrap();
