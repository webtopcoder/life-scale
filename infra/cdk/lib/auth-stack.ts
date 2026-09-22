import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

export interface AuthStackProps extends cdk.StackProps {
  stage: string;
}

/**
 * Cognito User Pool for brainwave SPA (email/password + Google OAuth via Hosted UI).
 */
export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    const { stage } = props;
    const paramPrefix = `/brainwave/cognito/${stage}`;
    const domainPrefix = `brainwave-${stage}`;

    const callbackUrls =
      stage === "prod"
        ? [
            "https://life-scale.com/",
            "https://life-scale.com/auth-gate",
            "https://www.life-scale.com/",
            "https://www.life-scale.com/auth-gate",
          ]
        : [
            "http://localhost:5173/",
            "http://localhost:5173/auth-gate",
            "http://localhost:8080/",
            "http://localhost:8080/auth-gate",
            "https://dev.life-scale.com/",
            "https://dev.life-scale.com/auth-gate",
          ];

    this.userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: `brainwave-${stage}`,
      signInAliases: { email: true },
      autoVerify: { email: true },
      selfSignUpEnabled: true,
      standardAttributes: {
        email: { required: true, mutable: true },
        fullname: { required: false, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy:
        stage === "prod" ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    const googleCreds = secretsmanager.Secret.fromSecretNameV2(
      this,
      "GoogleOAuthSecret",
      `brainwave/cognito/${stage}/google`,
    );

    const googleProvider = new cognito.UserPoolIdentityProviderGoogle(
      this,
      "Google",
      {
        userPool: this.userPool,
        clientId: googleCreds.secretValueFromJson("clientId").unsafeUnwrap(),
        clientSecretValue: googleCreds.secretValueFromJson("clientSecret"),
        scopes: ["profile", "email", "openid"],
        attributeMapping: {
          email: cognito.ProviderAttribute.GOOGLE_EMAIL,
          fullname: cognito.ProviderAttribute.GOOGLE_NAME,
        },
      },
    );

    this.userPool.addDomain("Domain", {
      cognitoDomain: { domainPrefix },
    });

    this.userPoolClient = this.userPool.addClient("WebClient", {
      userPoolClientName: `brainwave-web-${stage}`,
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      preventUserExistenceErrors: true,
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
        cognito.UserPoolClientIdentityProvider.GOOGLE,
      ],
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls,
        logoutUrls: callbackUrls,
      },
    });
    this.userPoolClient.node.addDependency(googleProvider);

    const cognitoDomainHost = `${domainPrefix}.auth.${this.region}.amazoncognito.com`;

    new ssm.StringParameter(this, "UserPoolId", {
      parameterName: `${paramPrefix}/userPoolId`,
      stringValue: this.userPool.userPoolId,
    });

    new ssm.StringParameter(this, "ClientId", {
      parameterName: `${paramPrefix}/clientId`,
      stringValue: this.userPoolClient.userPoolClientId,
    });

    new ssm.StringParameter(this, "Region", {
      parameterName: `${paramPrefix}/region`,
      stringValue: this.region,
    });

    new ssm.StringParameter(this, "Domain", {
      parameterName: `${paramPrefix}/domain`,
      stringValue: cognitoDomainHost,
    });

    new cdk.CfnOutput(this, "UserPoolIdOutput", {
      value: this.userPool.userPoolId,
    });
    new cdk.CfnOutput(this, "ClientIdOutput", {
      value: this.userPoolClient.userPoolClientId,
    });
    new cdk.CfnOutput(this, "CognitoDomainOutput", {
      value: cognitoDomainHost,
    });
  }
}
