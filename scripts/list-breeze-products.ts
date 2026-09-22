import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEnvOrThrow, listAllProducts } from './_shared/breezeScriptClient.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

async function main(): Promise<void> {
  const apiKey = getEnvOrThrow('BREEZE_API_KEY');
  const products = await listAllProducts(apiKey);
  const productPrices = products.flatMap((product) =>
    (product.prices ?? []).map((price) => ({
      productId: product.id ?? '',
      priceId: price.id ?? '',
      displayName: product.displayName ?? '',
      priceType: price.type ?? '',
      amount: price.unitAmount ?? null,
    })),
  );
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(productPrices, null, 2));
}

main().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Failed to list Breeze products:', error);
  process.exit(1);
});
