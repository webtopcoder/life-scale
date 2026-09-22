import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRecurringPriceOnProduct, getEnvOrThrow } from './_shared/breezeScriptClient.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Replace these values before running the script.
const PRODUCT_ID = 'prd_e41ae4baa2146534';
const PRICE_CURRENCY = 'USD';
const PRICE_AMOUNT = 29.99;
const BILLING_INTERVAL = 'month';
const BILLING_FREQUENCY = 1;

async function main(): Promise<void> {
  const apiKey = getEnvOrThrow('BREEZE_API_KEY');
  const productId = PRODUCT_ID.trim();
  if (!productId) throw new Error('PRODUCT_ID cannot be empty');

  const { priceId } = await createRecurringPriceOnProduct(apiKey, {
    productId,
    amount: PRICE_AMOUNT,
    currency: PRICE_CURRENCY,
    interval: BILLING_INTERVAL,
    frequency: BILLING_FREQUENCY,
  });

  // eslint-disable-next-line no-console
  console.log('\nBreeze subscription price created.\n');
  // eslint-disable-next-line no-console
  console.log(`PRODUCT_ID=${productId}`);
  // eslint-disable-next-line no-console
  console.log(`PRICE_ID=${priceId}\n`);
  // eslint-disable-next-line no-console
  console.log('Suggested Nest API / Lambda secrets:');
  // eslint-disable-next-line no-console
  console.log(`BREEZE_IQ_SUBSCRIPTION_RECURRING_PRICE_ID=${priceId}`);
  // eslint-disable-next-line no-console
  console.log(`BREEZE_IQ_ALT_SUBSCRIPTION_RECURRING_PRICE_ID=${priceId}`);
}

main().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Failed to create Breeze subscription price:', error);
  process.exit(1);
});
