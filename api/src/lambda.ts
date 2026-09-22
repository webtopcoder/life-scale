import serverlessExpress from "@codegenie/serverless-express";
import type { Callback, Context, Handler } from "aws-lambda";
import { createBrainwaveApp } from "./bootstrap";

let cachedHandler: Handler | undefined;

async function bootstrapHandler(): Promise<Handler> {
  if (!cachedHandler) {
    const { expressApp } = await createBrainwaveApp();
    cachedHandler = serverlessExpress({ app: expressApp });
  }
  return cachedHandler;
}

export const handler: Handler = async (
  event: unknown,
  context: Context,
  callback: Callback,
) => {
  // Reuse the Nest app across warm invocations
  context.callbackWaitsForEmptyEventLoop = false;
  const server = await bootstrapHandler();
  return server(event, context, callback);
};
