import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRegularProductWithOneTimePrice, getEnvOrThrow } from './_shared/breezeScriptClient.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

// Replace these values before running the script.
const PRODUCT_DISPLAY_NAME = 'Genius Blueprint';
const PRODUCT_DESCRIPTION = 'One-time Genius Blueprint add-on';
const UNIT_AMOUNT = 100;
const CURRENCY = 'USD';

async function main(): Promise<void> {
  const apiKey = getEnvOrThrow('BREEZE_API_KEY');
  const displayName = PRODUCT_DISPLAY_NAME.trim();
  const description = PRODUCT_DESCRIPTION.trim();
  const currency = CURRENCY.trim().toUpperCase();
  const unitAmount = UNIT_AMOUNT;

  if (!displayName) throw new Error('PRODUCT_DISPLAY_NAME cannot be empty');
  if (!description) throw new Error('PRODUCT_DESCRIPTION cannot be empty');
  if (!currency) throw new Error('CURRENCY cannot be empty');
  if (!Number.isInteger(unitAmount) || unitAmount <= 0) {
    throw new Error('UNIT_AMOUNT must be a positive integer (minor units, e.g. cents)');
  }

  const { productId, priceId } = await createRegularProductWithOneTimePrice(apiKey, {
    displayName,
    description,
    unitAmount,
    currency,
  });

  // eslint-disable-next-line no-console
  console.log('\nBreeze regular product setup complete (Genius Blueprint).\n');
  // eslint-disable-next-line no-console
  console.log(`PRODUCT_ID=${productId}`);
  // eslint-disable-next-line no-console
  console.log(`PRICE_ID=${priceId}\n`);
  // eslint-disable-next-line no-console
  console.log('Suggested Nest API / Lambda secrets:');
  // eslint-disable-next-line no-console
  console.log(`BREEZE_GENIUS_BLUEPRINT_PRODUCT_ID=${productId}`);
  // eslint-disable-next-line no-console
  console.log(`BREEZE_GENIUS_BLUEPRINT_PRICE_ID=${priceId}`);
}

main().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Failed to create Breeze Genius Blueprint product/price:', error);
  process.exit(1);
});
