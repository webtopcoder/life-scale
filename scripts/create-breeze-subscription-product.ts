import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Replace these values before running the script.
const PRODUCT_DISPLAY_NAME = 'Full IQ Report';
const PRODUCT_DESCRIPTION = '1 Week Access';
const PRICE_CURRENCY = 'USD';
const PRICE_AMOUNT = 29.99;
const BILLING_INTERVAL = 'month';
const BILLING_FREQUENCY = 1;

type BreezeApiResponse<T> = {
  status?: string;
  data?: T;
  errorCode?: string;
  errorMessage?: string;
};

type CreateProductData = {
  id?: string;
  status?: string;
};

type CreatePriceData = {
  id?: string;
  currency?: string;
  amountStr?: string;
};

function getEnvOrThrow(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function toBasicAuth(apiKey: string): string {
  const token = Buffer.from(`${apiKey}:`, 'utf8').toString('base64');
  return `Basic ${token}`;
}

function ensureSucceeded<T extends { id?: string }>(
  label: string,
  response: BreezeApiResponse<T>,
): T {
  if (response.status !== 'SUCCEEDED' || !response.data) {
    throw new Error(
      `${label} failed: ${JSON.stringify({
        status: response.status,
        errorCode: response.errorCode,
        errorMessage: response.errorMessage,
      })}`,
    );
  }
  return response.data;
}

async function postJson<T>(
  url: string,
  apiKey: string,
  payload?: Record<string, unknown>,
): Promise<BreezeApiResponse<T>> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: toBasicAuth(apiKey),
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });

  const json = (await response.json()) as BreezeApiResponse<T>;
  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} from ${url}: ${JSON.stringify({
        status: json.status,
        errorCode: json.errorCode,
        errorMessage: json.errorMessage,
        data: json.data,
      })}`,
    );
  }
  return json;
}

async function main(): Promise<void> {
  const apiKey = getEnvOrThrow('BREEZE_API_KEY');
  const displayName = PRODUCT_DISPLAY_NAME.trim();
  const description = PRODUCT_DESCRIPTION.trim();
  const currency = PRICE_CURRENCY.trim().toUpperCase();
  const amount = PRICE_AMOUNT;
  const interval = BILLING_INTERVAL.trim();
  const frequency = BILLING_FREQUENCY;

  if (!displayName) throw new Error('PRODUCT_DISPLAY_NAME cannot be empty');
  if (!description) throw new Error('PRODUCT_DESCRIPTION cannot be empty');
  if (!currency) throw new Error('PRICE_CURRENCY cannot be empty');
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('PRICE_AMOUNT must be a positive number');
  if (!interval) throw new Error('BILLING_INTERVAL cannot be empty');
  if (!Number.isFinite(frequency) || frequency <= 0) {
    throw new Error('BILLING_FREQUENCY must be a positive number');
  }

  const createProductPayload: Record<string, unknown> = {
    displayName,
    type: 'SUBSCRIPTION',
    description,
  };

  const productRes = await postJson<CreateProductData>(
    'https://api.breeze.cash/v2/products',
    apiKey,
    createProductPayload,
  );
  const productData = ensureSucceeded('Create subscription product', productRes);
  const productId = productData.id;
  if (!productId) throw new Error('Create subscription product succeeded but missing product id');

  await postJson<CreateProductData>(
    `https://api.breeze.cash/v2/products/${productId}/activate`,
    apiKey,
  ).then((res) => ensureSucceeded('Activate subscription product', res));

  const createPricePayload = {
    currency,
    amount,
    type: 'RECURRING',
    billingCycleConfig: {
      interval,
      frequency,
    },
  };

  const priceRes = await postJson<CreatePriceData>(
    `https://api.breeze.cash/v2/products/${productId}/price`,
    apiKey,
    createPricePayload,
  );
  const priceData = ensureSucceeded('Create recurring price', priceRes);
  const priceId = priceData.id;
  if (!priceId) throw new Error('Create recurring price succeeded but missing price id');

  // eslint-disable-next-line no-console
  console.log('\nBreeze subscription setup complete.\n');
  // eslint-disable-next-line no-console
  console.log(`PRODUCT_ID=${productId}`);
  // eslint-disable-next-line no-console
  console.log(`PRICE_ID=${priceId}\n`);
  // eslint-disable-next-line no-console
  console.log('Suggested Nest API / Lambda secrets:');
  // eslint-disable-next-line no-console
  console.log(`BREEZE_IQ_SUBSCRIPTION_PRODUCT_ID=${productId}`);
  // eslint-disable-next-line no-console
  console.log(`BREEZE_IQ_SUBSCRIPTION_RECURRING_PRICE_ID=${priceId}`);
}

main().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Failed to create Breeze subscription product/price:', error);
  process.exit(1);
});
