/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "brainwave",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: process.env.CI ? {} : { profile: "estrelar" },
      },
    };
  },
  async run() {
    const stage = process.env.SST_STAGE;
    if (!process.env.CI) {
      const dotenv = await import("dotenv");
      dotenv.config({ path: stage === "prod" ? ".env.prod" : ".env" });
    }
    // DNS is managed outside AWS (dns: false). Same ACM covers life-scale.com + api hosts.
    const certificateArn =
      process.env.BRAINWAVE_ACM_CERTIFICATE_ARN ??
      "arn:aws:acm:us-east-1:133954050840:certificate/154ac7f1-fd0c-4077-b7e7-136e0c56473d";

    const domainProd = process.env.BRAINWAVE_DOMAIN_PROD ?? "life-scale.com";
    const domainDev = process.env.BRAINWAVE_DOMAIN_DEV ?? "dev.life-scale.com";

    const basicAuthUser = process.env.BASIC_AUTH_USER;
    const basicAuthPass = process.env.BASIC_AUTH_PASS;
    const basicAuth = $resolve([basicAuthUser, basicAuthPass]).apply(
      ([username, password]) =>
        Buffer.from(`${username}:${password}`).toString("base64"),
    );

    const site = new sst.aws.StaticSite("BrainwaveWeb", {
      domain:
        stage === "prod"
          ? {
              name: domainProd,
              aliases: [`www.${domainProd}`],
              dns: false,
              cert: certificateArn,
            }
          : {
              name: domainDev,
              dns: false,
              cert: certificateArn,
            },
      build: {
        command: "npm run build",
        output: "dist",
      },
      environment: {
        VITE_API_URL:
          process.env.VITE_API_URL ??
          (stage === "prod"
            ? "https://api.life-scale.com"
            : "https://api-dev.life-scale.com"),
        VITE_COGNITO_USER_POOL_ID: process.env.VITE_COGNITO_USER_POOL_ID ?? "",
        VITE_COGNITO_CLIENT_ID: process.env.VITE_COGNITO_CLIENT_ID ?? "",
        VITE_COGNITO_DOMAIN: process.env.VITE_COGNITO_DOMAIN ?? "",
        VITE_COGNITO_REGION: process.env.VITE_COGNITO_REGION ?? "us-east-1",
        VITE_PUBLIC_POSTHOG_KEY: process.env.VITE_PUBLIC_POSTHOG_KEY ?? "",
        VITE_PUBLIC_POSTHOG_HOST: process.env.VITE_PUBLIC_POSTHOG_HOST ?? "",
        VITE_LIFESCALE_API_BASE_URL:
          process.env.VITE_LIFESCALE_API_BASE_URL ??
          "https://sirius.bigdog.app",
      },
      ...(stage !== "prod"
        ? {
            edge: {
              viewerRequest: {
                injection: $interpolate`
            if (
                !event.request.headers.authorization
                  || event.request.headers.authorization.value !== "Basic ${basicAuth}"
               ) {
              return {
                statusCode: 401,
                headers: {
                  "www-authenticate": { value: "Basic" }
                }
              };
            }`,
              },
            },
          }
        : {}),
    });
    return {
      url: site.url,
    };
  },
});
