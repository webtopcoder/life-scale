import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TARGET_RELATIVE_PATH =
  "public/.well-known/apple-developer-merchantid-domain-association";

function getEnvOrThrow(name: string): string {
  const value = process.env[name];
  if (!value) {
    // In CI (GitHub Actions), fail fast so the workflow doesn't deploy an incorrect file.
    if (process.env.GITHUB_ACTIONS === "true" || process.env.CI === "true") {
      throw new Error(`Missing required env var in CI: ${name}`);
    }
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function validateHexString(hex: string): void {
  const trimmed = hex.trim();
  if (!/^[0-9a-fA-F]+$/.test(trimmed)) {
    throw new Error("APPLE_MERCHANTID_DOMAIN_ASSOCIATION_HEX must be a hex string (0-9a-f).");
  }
  if (trimmed.length % 2 !== 0) {
    throw new Error("APPLE_MERCHANTID_DOMAIN_ASSOCIATION_HEX must have an even number of characters.");
  }
}

function validateDecodedJson(hex: string): void {
  const trimmed = hex.trim();
  const raw = Buffer.from(trimmed, "hex").toString("utf-8");
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Decoded APPLE merchant association JSON is not an object.");
  }
  const obj = parsed as Record<string, unknown>;
  const requiredKeys = ["pspId", "version", "createdOn", "signature"];
  for (const key of requiredKeys) {
    if (!(key in obj)) {
      throw new Error(`Decoded APPLE merchant association JSON missing key: ${key}`);
    }
  }
}

function getProjectRoot(): string {
  // scripts/ -> project root
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  return path.resolve(__dirname, "..");
}

async function main(): Promise<void> {
  const hex = getEnvOrThrow("APPLE_MERCHANTID_DOMAIN_ASSOCIATION_HEX");
  validateHexString(hex);
  validateDecodedJson(hex);

  const projectRoot = getProjectRoot();
  const targetPath = path.join(projectRoot, TARGET_RELATIVE_PATH);
  const targetDir = path.dirname(targetPath);
  fs.mkdirSync(targetDir, { recursive: true });

  // The checked-in file is a hex-encoded UTF-8 JSON blob; we keep it as-is.
  fs.writeFileSync(targetPath, hex.trim(), "utf-8");

  // eslint-disable-next-line no-console
  console.log(`Wrote ${TARGET_RELATIVE_PATH}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to generate Apple merchant association:", err);
  process.exit(1);
});

