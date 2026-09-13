import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// CommonJS interop for cookie-parser
const cookieParser = require('cookie-parser');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3000';

  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());
  app.enableCors({
    origin: webOrigin,
    credentials: true,
  });

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`HireUp API listening on ${port}`);
}

bootstrap();
