import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BREEZE_API_BASE,
  ensureSucceeded,
  getEnvOrThrow,
  getJson,
} from './_shared/breezeScriptClient.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

// Replace this value before running the script.
const CUSTOMER_REFERENCE_ID = 'ed041bed-809b-460c-b559-b6644b208704';

async function main(): Promise<void> {
  const apiKey = getEnvOrThrow('BREEZE_API_KEY');
  const referenceId = CUSTOMER_REFERENCE_ID.trim();
  if (!referenceId) throw new Error('CUSTOMER_REFERENCE_ID cannot be empty');

  const url = `${BREEZE_API_BASE}/v1/customers?${new URLSearchParams({ referenceId })}`;
  const response = await getJson<Record<string, unknown>>(url, apiKey);
  const customer = ensureSucceeded('Get customer by referenceId', response);

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(customer, null, 2));
}

main().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Failed to get Breeze customer:', error);
  process.exit(1);
});
