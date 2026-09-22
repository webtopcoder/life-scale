import * as path from "path";
import * as cdk from "aws-cdk-lib";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as apigwv2Integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as certificatemanager from "aws-cdk-lib/aws-certificatemanager";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

export interface ApiStackProps extends cdk.StackProps {
  stage: string;
  userPool: cognito.IUserPool;
  userPoolClient: cognito.IUserPoolClient;
}

/** life-scale.com ACM (CloudFront + API Gateway). DNS is external — no Route53. */
const DEFAULT_ACM_CERTIFICATE_ARN =
  "arn:aws:acm:us-east-1:133954050840:certificate/154ac7f1-fd0c-4077-b7e7-136e0c56473d";
const RDS_SECRET_NAME = "estrelar/rds/postgres";

const PLACEHOLDER = "REPLACE_ME";

/**
 * Values for the L2 Secret construct only. CloudFormation does **not** apply
 * SecretString (see PropertyDeletionOverride below) — live values are managed
 * out-of-band in Secrets Manager. Keep api/.env filled for local Nest runs.
 */
function secretFromEnv(key: string, fallback: string = ""): string {
  const raw = process.env[key]?.trim();
  if (raw && raw !== PLACEHOLDER) return raw;
  return fallback;
}

/**
 * NestJS API on Lambda (pruned zip) + HTTP API.
 * Reuses estrelar-infra Postgres via Secrets Manager (public RDS — Lambda stays out of VPC).
 * Databases: iq_scale_dev (dev) / iq_scale (prod).
 *
 * Package with `npm run package:lambda` in api/ before CDK deploy
 * (produces api/.lambda-package).
 */
export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { stage, userPool, userPoolClient } = props;
    const databaseName = stage === "prod" ? "iq_scale" : "iq_scale_dev";
    const apiDomainName =
      stage === "prod" ? "api.life-scale.com" : "api-dev.life-scale.com";

    cdk.Tags.of(this).add("Project", "brainwave");
    cdk.Tags.of(this).add("Environment", stage);

    const dbSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      "EstrelarRdsSecret",
      RDS_SECRET_NAME,
    );

    const defaultOrigins =
      stage === "prod"
        ? "https://life-scale.com,https://www.life-scale.com"
        : "https://dev.life-scale.com,http://localhost:5173,http://localhost:8080,https://996b0294-6728-40aa-9527-0bc0066f1f31.lovableproject.com,https://id-preview--996b0294-6728-40aa-9527-0bc0066f1f31.lovable.app";

    // App secrets live in Secrets Manager `brainwave/api/{stage}`.
    // Historically secretObjectValue was re-applied every deploy from api/.env, and
    // missing keys became REPLACE_ME — wiping live webhook secrets (401s).
    // We still declare the Secret resource for IAM/ARN wiring, but CloudFormation
    // must not manage SecretString after create (see PropertyDeletionOverride).
    const appSecret = new secretsmanager.Secret(this, "AppSecrets", {
      secretName: `brainwave/api/${stage}`,
      description: `Brainwave API app secrets (${stage}) — values managed out-of-band; CDK must not overwrite.`,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      secretObjectValue: {
        LIFESCALE_WEBHOOK_SECRET: cdk.SecretValue.unsafePlainText(
          secretFromEnv("LIFESCALE_WEBHOOK_SECRET"),
        ),
        LIFESCALE_API_BASE_URL: cdk.SecretValue.unsafePlainText(
          secretFromEnv(
            "LIFESCALE_API_BASE_URL",
            "https://sirius.bigdog.app",
          ),
        ),
        LIFESCALE_API_KEY: cdk.SecretValue.unsafePlainText(
          secretFromEnv("LIFESCALE_API_KEY"),
        ),
        REPORT_GRANT_SECRET: cdk.SecretValue.unsafePlainText(
          secretFromEnv("REPORT_GRANT_SECRET"),
        ),
        OPENROUTER_API_KEY: cdk.SecretValue.unsafePlainText(
          secretFromEnv("OPENROUTER_API_KEY"),
        ),
        SENDGRID_API_KEY: cdk.SecretValue.unsafePlainText(
          secretFromEnv("SENDGRID_API_KEY"),
        ),
        SENDGRID_FROM_EMAIL: cdk.SecretValue.unsafePlainText(
          secretFromEnv("SENDGRID_FROM_EMAIL", "noreply@life-scale.com"),
        ),
        KLAVIYO_API_KEY: cdk.SecretValue.unsafePlainText(
          secretFromEnv("KLAVIYO_API_KEY"),
        ),
        ALLOWED_ORIGINS: cdk.SecretValue.unsafePlainText(
          secretFromEnv("ALLOWED_ORIGINS", defaultOrigins),
        ),
      },
    });

    // Drop SecretString from the CFN template so deploys never overwrite SM values.
    const cfnAppSecret = appSecret.node.defaultChild as secretsmanager.CfnSecret;
    cfnAppSecret.addPropertyDeletionOverride("SecretString");

    const lambdaPackageDir = path.join(
      __dirname,
      "../../../api/.lambda-package",
    );

    const fn = new lambda.Function(this, "ApiFunction", {
      functionName: `brainwave-api-${stage}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.X86_64,
      handler: "lambda.handler",
      code: lambda.Code.fromAsset(lambdaPackageDir),
      memorySize: 1024,
      // HTTP API integration max is 30s
      timeout: cdk.Duration.seconds(30),
      environment: {
        NODE_ENV: stage === "prod" ? "production" : "development",
        STAGE: stage,
        DB_NAME: databaseName,
        COGNITO_USER_POOL_ID: userPool.userPoolId,
        COGNITO_CLIENT_ID: userPoolClient.userPoolClientId,
        COGNITO_REGION: this.region,
        RDS_SECRET_ARN: dbSecret.secretArn,
        APP_SECRET_ARN: appSecret.secretArn,
      },
      logRetention: logs.RetentionDays.TWO_WEEKS,
    });

    dbSecret.grantRead(fn);
    appSecret.grantRead(fn);
    fn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "cognito-idp:AdminCreateUser",
          "cognito-idp:AdminSetUserPassword",
          "cognito-idp:AdminGetUser",
          "cognito-idp:ListUsers",
        ],
        resources: [userPool.userPoolArn],
      }),
    );

    const httpApi = new apigwv2.HttpApi(this, "HttpApi", {
      apiName: `brainwave-api-${stage}`,
      description: `Brainwave Nest API (${stage})`,
      corsPreflight: {
        allowHeaders: ["Authorization", "Content-Type", "X-Requested-With"],
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.PUT,
          apigwv2.CorsHttpMethod.PATCH,
          apigwv2.CorsHttpMethod.DELETE,
          apigwv2.CorsHttpMethod.OPTIONS,
        ],
        allowOrigins:
          stage === "prod"
            ? ["https://life-scale.com", "https://www.life-scale.com"]
            : [
                "https://dev.life-scale.com",
                "http://localhost:5173",
                "http://localhost:8080",
                "http://127.0.0.1:5173",
                "https://996b0294-6728-40aa-9527-0bc0066f1f31.lovableproject.com",
                "https://id-preview--996b0294-6728-40aa-9527-0bc0066f1f31.lovable.app",
              ],
        allowCredentials: true,
        maxAge: cdk.Duration.hours(1),
      },
    });

    const integration = new apigwv2Integrations.HttpLambdaIntegration(
      "LambdaIntegration",
      fn,
      {
        payloadFormatVersion: apigwv2.PayloadFormatVersion.VERSION_2_0,
      },
    );

    httpApi.addRoutes({
      path: "/{proxy+}",
      methods: [apigwv2.HttpMethod.ANY],
      integration,
    });
    httpApi.addRoutes({
      path: "/",
      methods: [apigwv2.HttpMethod.ANY],
      integration,
    });

    const certificate = certificatemanager.Certificate.fromCertificateArn(
      this,
      "ApiCertificate",
      process.env.BRAINWAVE_ACM_CERTIFICATE_ARN ?? DEFAULT_ACM_CERTIFICATE_ARN,
    );

    const domainName = new apigwv2.DomainName(this, "CustomDomain", {
      domainName: apiDomainName,
      certificate,
    });

    new apigwv2.ApiMapping(this, "ApiMapping", {
      api: httpApi,
      domainName,
      stage: httpApi.defaultStage!,
    });

    new cdk.CfnOutput(this, "HttpApiUrl", { value: httpApi.apiEndpoint });
    new cdk.CfnOutput(this, "ApiCustomDomainTarget", {
      value: domainName.regionalDomainName,
      description: `CNAME ${apiDomainName} → this target (DNS managed externally)`,
    });
    new cdk.CfnOutput(this, "ApiDomainName", {
      value: apiDomainName,
    });
    new cdk.CfnOutput(this, "AppSecretArn", { value: appSecret.secretArn });
    new cdk.CfnOutput(this, "ApiFunctionName", {
      value: fn.functionName,
    });
  }
}
