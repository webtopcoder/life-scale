#!/usr/bin/env node
import * as path from "path";
import * as fs from "fs";
import * as cdk from "aws-cdk-lib";
import { AuthStack } from "../lib/auth-stack";
import { ApiStack } from "../lib/api-stack";

const app = new cdk.App();

const stage = (app.node.tryGetContext("stage") as string) || "dev";
if (stage !== "dev" && stage !== "prod") {
  throw new Error(`Invalid stage "${stage}". Use -c stage=dev|prod`);
}

// Load api/.env for local reference / optional tooling. Secret *values* in AWS
// are not overwritten by CDK anymore (ApiStack PropertyDeletionOverride on
// SecretString). Missing keys here must not matter for deploy.
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const dotenv = require("dotenv") as typeof import("dotenv");
  const apiDir = path.resolve(__dirname, "../../../api");
  const candidates =
    stage === "prod"
      ? [path.join(apiDir, ".env.prod"), path.join(apiDir, ".env")]
      : [path.join(apiDir, ".env")];
  for (const file of candidates) {
    if (fs.existsSync(file)) {
      dotenv.config({ path: file });
      console.log(`[cdk] Loaded API secrets env from ${file}`);
      break;
    }
  }
} catch {
  console.warn(
    "[cdk] dotenv not available — AppSecrets will use REPLACE_ME unless env vars are already set",
  );
}

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT ?? "133954050840",
  region: process.env.CDK_DEFAULT_REGION ?? "us-east-1",
};

const auth = new AuthStack(app, `BrainwaveAuth-${stage}`, {
  env,
  stage,
});

new ApiStack(app, `BrainwaveApi-${stage}`, {
  env,
  stage,
  userPool: auth.userPool,
  userPoolClient: auth.userPoolClient,
});
