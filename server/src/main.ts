import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import type { AppConfig } from './shared/config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<AppConfig, true>);

  app.enableCors({ origin: configService.get('corsOrigin', { infer: true }) });

  await app.listen(configService.get('port', { infer: true }));
}
void bootstrap();
