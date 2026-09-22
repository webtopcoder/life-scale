import { Global, Injectable, Module, OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../generated/prisma/client";

function createAdapter() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  // `pg` does not understand Prisma's `?schema=` query param.
  const cleaned = connectionString
    .replace(/[?&]schema=[^&]*/g, "")
    .replace(/\?$/, "");

  const url = new URL(cleaned);
  const sslRequired =
    url.searchParams.get("sslmode") === "require" ||
    url.searchParams.has("ssl") ||
    url.hostname.includes("rds.amazonaws.com");

  // Strip sslmode so pg doesn't double-handle it alongside our ssl option.
  url.searchParams.delete("sslmode");
  url.searchParams.delete("ssl");

  const pool = new Pool({
    connectionString: url.toString(),
    ...(sslRequired ? { ssl: { rejectUnauthorized: false } } : {}),
  });

  return new PrismaPg(pool);
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({ adapter: createAdapter() });
  }

  async onModuleInit() {
    await this.$connect();
  }
}

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
