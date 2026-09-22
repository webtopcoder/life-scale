import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEnvOrThrow, getProduct } from './_shared/breezeScriptClient.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

// Replace this value before running the script.
const PRODUCT_ID = 'prd_899d8ab59c87d75d';

async function main(): Promise<void> {
  const apiKey = getEnvOrThrow('BREEZE_API_KEY');
  const productId = PRODUCT_ID.trim();
  if (!productId) throw new Error('PRODUCT_ID cannot be empty');

  const product = await getProduct(apiKey, productId);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(product, null, 2));
}

main().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Failed to get Breeze product:', error);
  process.exit(1);
});
