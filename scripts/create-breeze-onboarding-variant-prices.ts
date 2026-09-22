import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRecurringPriceOnProduct, getEnvOrThrow } from './_shared/breezeScriptClient.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const PRODUCT_ID_ENV = 'BREEZE_IQ_SUBSCRIPTION_PRODUCT_ID';
const PRICE_CURRENCY = 'USD';
const BILLING_INTERVAL = 'month';
const BILLING_FREQUENCY = 1;

const VARIANT_PRICES = [
  {
    label: 'BOA',
    amount: 29.98,
    productEnv: 'BREEZE_IQ_BOA_SUBSCRIPTION_PRODUCT_ID',
    priceEnv: 'BREEZE_IQ_BOA_SUBSCRIPTION_RECURRING_PRICE_ID',
  },
  {
    label: 'RVR',
    amount: 29.97,
    productEnv: 'BREEZE_IQ_RVR_SUBSCRIPTION_PRODUCT_ID',
    priceEnv: 'BREEZE_IQ_RVR_SUBSCRIPTION_RECURRING_PRICE_ID',
  },
] as const;

async function main(): Promise<void> {
  const apiKey = getEnvOrThrow('BREEZE_API_KEY');
  const productId = getEnvOrThrow(PRODUCT_ID_ENV);

  const createdPrices = [];
  for (const variant of VARIANT_PRICES) {
    const { priceId } = await createRecurringPriceOnProduct(apiKey, {
      productId,
      amount: variant.amount,
      currency: PRICE_CURRENCY,
      interval: BILLING_INTERVAL,
      frequency: BILLING_FREQUENCY,
    });
    createdPrices.push({ ...variant, priceId });
  }

  console.log('\nBreeze onboarding variant prices created.\n');
  console.log(`PRODUCT_ID=${productId}\n`);
  console.log('Suggested Nest API / Lambda secrets:');

  for (const variant of createdPrices) {
    console.log(`${variant.productEnv}=${productId}`);
    console.log(`${variant.priceEnv}=${variant.priceId}`);
  }
}

main().catch((error: unknown) => {
  console.error('Failed to create Breeze onboarding variant prices:', error);
  process.exit(1);
});
