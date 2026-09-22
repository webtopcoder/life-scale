/**
 * Life-Scale partner HTTP helpers (server → sirius / staging).
 * Auth: X-API-Key from LIFESCALE_API_KEY (no code default).
 */

export type LifeScaleAccessPayload = {
  active?: boolean;
  tier?: string | null;
  status?: string | null;
  next_charge_date?: string | null;
  [key: string]: unknown;
};

export function lifeScaleBaseUrl(): string | null {
  const base = process.env.LIFESCALE_API_BASE_URL?.trim().replace(/\/$/, "");
  return base || null;
}

/** Empty / missing means not configured — never invent a default key. */
export function lifeScaleApiKey(): string | null {
  const key = process.env.LIFESCALE_API_KEY?.trim();
  if (!key || key === "REPLACE_ME") return null;
  return key;
}

export function isLifeScaleApiConfigured(): boolean {
  return Boolean(lifeScaleBaseUrl() && lifeScaleApiKey());
}

export function lifeScaleJsonHeaders(apiKey: string): Record<string, string> {
  return {
    "X-API-Key": apiKey,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export function isLifeScaleAccessActive(
  payload: LifeScaleAccessPayload | null,
): boolean {
  if (!payload) return false;
  if (payload.active === true) return true;
  if (payload.active === false) return false;
  if (typeof payload.error === "string") return false;

  const status =
    typeof payload.status === "string" ? payload.status.toLowerCase() : "";
  if (
    status === "cancelled" ||
    status === "canceled" ||
    status === "expired" ||
    status === "suspended" ||
    status === "inactive"
  ) {
    return false;
  }
  if (
    status === "active" ||
    status === "trialing" ||
    status === "trial" ||
    status.includes("trial")
  ) {
    return true;
  }

  // Partner /api/access payload often omits `active`/`status` and returns
  // subscription fields instead (trial or paid). Treat those as access.
  if (
    typeof payload.subscription_id === "string" &&
    payload.subscription_id.trim()
  ) {
    return true;
  }
  if (
    typeof payload.next_charge_date === "string" &&
    payload.next_charge_date.trim()
  ) {
    return true;
  }
  if (typeof payload.offer_id === "string" && payload.offer_id.trim()) {
    return true;
  }
  return false;
}

/**
 * GET /api/access/:customer_id_or_email
 */
export async function fetchLifeScaleAccess(
  customerIdOrEmail: string,
): Promise<{
  ok: boolean;
  status: number;
  payload: LifeScaleAccessPayload | null;
  raw: string;
}> {
  const base = lifeScaleBaseUrl();
  const key = lifeScaleApiKey();
  if (!base || !key) {
    return { ok: false, status: 0, payload: null, raw: "" };
  }

  const r = await fetch(
    `${base}/api/access/${encodeURIComponent(customerIdOrEmail)}`,
    {
      method: "GET",
      headers: lifeScaleJsonHeaders(key),
    },
  );
  const raw = await r.text().catch(() => "");
  let payload: LifeScaleAccessPayload | null = null;
  try {
    payload = raw ? (JSON.parse(raw) as LifeScaleAccessPayload) : null;
  } catch {
    payload = null;
  }
  return { ok: r.ok, status: r.status, payload, raw };
}

/**
 * POST /api/ops/customer/:customer_id/cancel
 */
export async function postLifeScaleCustomerCancel(
  customerId: string,
): Promise<{ ok: boolean; status: number; raw: string }> {
  const base = lifeScaleBaseUrl();
  const key = lifeScaleApiKey();
  if (!base || !key) {
    return { ok: false, status: 0, raw: "" };
  }

  const r = await fetch(
    `${base}/api/ops/customer/${encodeURIComponent(customerId)}/cancel`,
    {
      method: "POST",
      headers: lifeScaleJsonHeaders(key),
    },
  );
  const raw = await r.text().catch(() => "");
  return { ok: r.ok, status: r.status, raw };
}
