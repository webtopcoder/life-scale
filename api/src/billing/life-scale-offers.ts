import { createHmac, timingSafeEqual } from "crypto";

/** Shared Life-Scale offer helpers for the Nest API (mirrors frontend catalog). */

export type LifeScaleTier = "insight" | "guide" | "focus" | "complete";

export type ParsedOffer = {
  offerId: string;
  tier: LifeScaleTier;
  trialDays: number;
  introCents: number;
  rebillCents: number;
};

const TIER_SET = new Set<LifeScaleTier>([
  "complete",
  "focus",
  "guide",
  "insight",
]);

function dollarsToCents(raw: string): number {
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

/** Parse `complete_1.00_3d_38.99_28d` → structured fields. */
export function parseOfferId(offerId: string): ParsedOffer | null {
  const m = offerId
    .trim()
    .match(
      /^(complete|focus|guide|insight)_(\d+(?:\.\d+)?)_(\d+)d_(\d+(?:\.\d+)?)_(\d+)d$/,
    );
  if (!m) return null;
  const tier = m[1] as LifeScaleTier;
  if (!TIER_SET.has(tier)) return null;
  return {
    offerId,
    tier,
    introCents: dollarsToCents(m[2]),
    trialDays: Number.parseInt(m[3], 10),
    rebillCents: dollarsToCents(m[4]),
  };
}

export function verifyLifeScaleSignature(
  rawBody: string | Buffer,
  signatureHeader: string | undefined,
  secret: string,
): boolean {
  if (!signatureHeader) return false;
  const expected =
    "sha256=" +
    createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    const a = Buffer.from(signatureHeader);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Partner add-on offer id = catalog key (no `_upsell` / `_dashboard` suffix). */
export function toPartnerAddonOfferId(catalogKey: string): string {
  return stripAddonOfferSuffix(catalogKey);
}

/** @deprecated Use toPartnerAddonOfferId. */
export function toUpsellWidgetOfferId(catalogKey: string): string {
  return toPartnerAddonOfferId(catalogKey);
}

/** @deprecated Use toPartnerAddonOfferId. */
export function toDashboardOfferId(catalogKey: string): string {
  return toPartnerAddonOfferId(catalogKey);
}

function stripAddonOfferSuffix(offerId: string): string {
  return offerId.trim().replace(/_upsell$|_dashboard$/, "");
}

/**
 * Map partner offer id → catalog `addon_*` product key.
 * Unknown non-addon offers return null (caller may keep the raw id).
 */
export function normalizeAddonOfferId(offerId: string): string | null {
  const raw = offerId.trim();
  if (!raw) return null;
  const stripped = stripAddonOfferSuffix(raw);
  if (stripped.startsWith("addon_")) return stripped;
  return null;
}
