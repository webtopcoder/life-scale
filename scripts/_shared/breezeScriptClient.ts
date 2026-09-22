export const BREEZE_API_BASE = 'https://api.breeze.cash';

export type BreezeApiResponse<T> = {
  status?: string;
  data?: T;
  errorCode?: string;
  errorMessage?: string;
};

type CreateRegularProductData = {
  id?: string;
  defaultPriceId?: string;
  prices?: Array<{ id?: string; type?: string }>;
};

type CreatePriceData = {
  id?: string;
};

export type GetProductPrice = {
  id?: string;
  type?: string;
  unitAmount?: number;
  currency?: string;
  status?: string;
};

export type GetProductData = {
  id?: string;
  displayName?: string;
  description?: string;
  type?: string;
  status?: string;
  defaultPriceId?: string;
  prices?: GetProductPrice[];
};

export function getEnvOrThrow(name: string): string {
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

export function ensureSucceeded<T>(
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

export async function postJson<T>(
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

export async function getJson<T>(url: string, apiKey: string): Promise<BreezeApiResponse<T>> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: toBasicAuth(apiKey),
    },
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

export async function getProduct(apiKey: string, productId: string): Promise<GetProductData> {
  const response = await getJson<GetProductData>(
    `${BREEZE_API_BASE}/v2/products/${encodeURIComponent(productId)}`,
    apiKey,
  );
  return ensureSucceeded('Get product', response);
}

export type BreezeListProductsApiResponse = BreezeApiResponse<GetProductData[]> & {
  hasMore?: boolean;
  nextCursorToken?: string;
};

export async function listProductsPage(
  apiKey: string,
  options?: { limit?: number; cursorToken?: string },
): Promise<{ products: GetProductData[]; hasMore: boolean; nextCursorToken?: string }> {
  const url = new URL(`${BREEZE_API_BASE}/v2/products`);
  if (options?.limit !== undefined) {
    url.searchParams.set('limit', String(options.limit));
  }
  if (options?.cursorToken) {
    url.searchParams.set('cursorToken', options.cursorToken);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: toBasicAuth(apiKey),
    },
  });

  const json = (await response.json()) as BreezeListProductsApiResponse;
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

  const products = ensureSucceeded('List products', json);
  return {
    products,
    hasMore: json.hasMore ?? false,
    nextCursorToken: json.nextCursorToken,
  };
}

export async function listAllProducts(
  apiKey: string,
  pageLimit = 50,
): Promise<GetProductData[]> {
  const all: GetProductData[] = [];
  let cursorToken: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const page = await listProductsPage(apiKey, { limit: pageLimit, cursorToken });
    all.push(...page.products);
    hasMore = page.hasMore;
    cursorToken = page.nextCursorToken;
  }

  return all;
}

/**
 * Creates a REGULAR (one-time) Breeze product and resolves a one-time price id.
 * Prefers `defaultPriceId` from the create response; otherwise POSTs a ONE_TIME price.
 */
export async function createRegularProductWithOneTimePrice(
  apiKey: string,
  params: { displayName: string; description: string; unitAmount: number; currency: string },
): Promise<{ productId: string; priceId: string }> {
  const createProductPayload: Record<string, unknown> = {
    displayName: params.displayName,
    description: params.description,
    type: 'REGULAR',
    unitAmount: params.unitAmount,
    currency: params.currency,
  };

  const productRes = await postJson<CreateRegularProductData>(
    `${BREEZE_API_BASE}/v2/products`,
    apiKey,
    createProductPayload,
  );
  const productData = ensureSucceeded('Create regular product', productRes);
  const productId = productData.id;
  if (!productId) throw new Error('Create regular product succeeded but missing product id');

  let priceId = productData.defaultPriceId?.trim();
  if (!priceId && productData.prices?.length) {
    const oneTime = productData.prices.find((p) => p.type === 'ONE_TIME');
    priceId = (oneTime?.id ?? productData.prices[0]?.id)?.trim();
  }

  if (!priceId) {
    const priceRes = await postJson<CreatePriceData>(
      `${BREEZE_API_BASE}/v2/products/${productId}/price`,
      apiKey,
      {
        currency: params.currency,
        amount: params.unitAmount,
        type: 'ONE_TIME',
      },
    );
    const priceData = ensureSucceeded('Create one-time price', priceRes);
    priceId = priceData.id;
    if (!priceId) throw new Error('Create one-time price succeeded but missing price id');
  }

  return { productId, priceId };
}

export async function createRecurringPriceOnProduct(
  apiKey: string,
  params: {
    productId: string;
    amount: number;
    currency: string;
    interval: string;
    frequency: number;
  },
): Promise<{ productId: string; priceId: string }> {
  const productId = params.productId.trim();
  if (!productId) throw new Error('productId cannot be empty');
  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    throw new Error('amount must be a positive number');
  }
  if (!params.currency.trim()) throw new Error('currency cannot be empty');
  if (!params.interval.trim()) throw new Error('interval cannot be empty');
  if (!Number.isFinite(params.frequency) || params.frequency <= 0) {
    throw new Error('frequency must be a positive number');
  }

  const priceRes = await postJson<CreatePriceData>(
    `${BREEZE_API_BASE}/v2/products/${encodeURIComponent(productId)}/price`,
    apiKey,
    {
      currency: params.currency.trim().toUpperCase(),
      amount: params.amount,
      type: 'RECURRING',
      billingCycleConfig: {
        interval: params.interval.trim(),
        frequency: params.frequency,
      },
    },
  );
  const priceData = ensureSucceeded('Create recurring price', priceRes);
  const priceId = priceData.id;
  if (!priceId) throw new Error('Create recurring price succeeded but missing price id');

  return { productId, priceId };
}
