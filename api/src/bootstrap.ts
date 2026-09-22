import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ExpressAdapter } from "@nestjs/platform-express";
import express, { type Express } from "express";
import { AppModule } from "./app.module";
import { loadRuntimeSecrets } from "./config/load-secrets";

export type BrainwaveNestApp = {
  expressApp: Express;
  nestApp: Awaited<ReturnType<typeof NestFactory.create>>;
};

/**
 * Shared Nest bootstrap for local HTTP server and Lambda.
 */
export async function createBrainwaveApp(): Promise<BrainwaveNestApp> {
  await loadRuntimeSecrets();

  const expressApp = express();
  const nestApp = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
    { rawBody: true },
  );

  const origins = (
    process.env.ALLOWED_ORIGINS ||
    "http://localhost:8080,http://localhost:5173"
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  nestApp.enableCors({
    origin: origins,
    credentials: true,
  });
  nestApp.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  nestApp.setGlobalPrefix("api", { exclude: ["health"] });
  await nestApp.init();

  return { expressApp, nestApp };
}
