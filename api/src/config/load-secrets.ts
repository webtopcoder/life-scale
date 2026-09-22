import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

type RdsSecret = {
  username?: string;
  password?: string;
  host?: string;
  port?: string | number;
  dbname?: string;
};

/**
 * Builds DATABASE_URL from DB_* env vars and/or RDS_SECRET_ARN,
 * then merges APP_SECRET_ARN JSON into process.env.
 * Databases: iq_scale_dev (dev) / iq_scale (prod) on shared estrelar-infra RDS.
 */
export async function loadRuntimeSecrets(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    await ensureDatabaseUrl();
  }

  const appSecretArn = process.env.APP_SECRET_ARN;
  if (!appSecretArn) return;

  try {
    const parsed = await getSecretJson(appSecretArn);
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v !== "string") continue;
      if (process.env[k] === undefined || process.env[k] === "") {
        process.env[k] = v;
      }
    }
  } catch (err) {
    console.warn("[secrets] Failed to load APP_SECRET_ARN", err);
  }
}

async function ensureDatabaseUrl(): Promise<void> {
  let user = process.env.DB_USERNAME;
  let pass = process.env.DB_PASSWORD;
  let host = process.env.DB_HOST;
  let port = process.env.DB_PORT || "5432";

  const rdsSecretArn = process.env.RDS_SECRET_ARN;
  if (rdsSecretArn && (!user || !pass || !host)) {
    try {
      const rds = (await getSecretJson(rdsSecretArn)) as RdsSecret;
      user = user || rds.username;
      pass = pass || rds.password;
      host = host || rds.host;
      port = String(process.env.DB_PORT || rds.port || "5432");
    } catch (err) {
      console.warn("[secrets] Failed to load RDS_SECRET_ARN", err);
    }
  }

  if (!user || !pass || !host) return;

  const stage = process.env.STAGE || "dev";
  const db =
    process.env.DB_NAME || (stage === "prod" ? "iq_scale" : "iq_scale_dev");
  process.env.DATABASE_URL = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${db}?sslmode=require`;
}

async function getSecretJson(
  secretId: string,
): Promise<Record<string, unknown>> {
  const client = new SecretsManagerClient({
    region: process.env.AWS_REGION || "us-east-1",
  });
  const res = await client.send(
    new GetSecretValueCommand({ SecretId: secretId }),
  );
  if (!res.SecretString) return {};
  return JSON.parse(res.SecretString) as Record<string, unknown>;
}
