/**
 * Verifies connectivity to the stage database (iq_scale_dev / iq_scale).
 * Databases are created on the shared estrelar-infra RDS instance — this does not create them.
 *
 * Run: npx ts-node scripts/bootstrap-schema.ts
 */
import { Client } from "pg";

async function main() {
  const url = process.env.DATABASE_URL;
  const stage = process.env.STAGE || "dev";
  const databaseName =
    process.env.DB_NAME || (stage === "prod" ? "iq_scale" : "iq_scale_dev");

  const client = url
    ? new Client({
        connectionString: url,
        ssl: url.includes("sslmode=require")
          ? { rejectUnauthorized: false }
          : undefined,
      })
    : new Client({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: databaseName,
        ssl: { rejectUnauthorized: false },
      });

  await client.connect();
  const { rows } = await client.query<{ current_database: string }>(
    "SELECT current_database()",
  );
  console.log(`Connected to database: ${rows[0]?.current_database}`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
