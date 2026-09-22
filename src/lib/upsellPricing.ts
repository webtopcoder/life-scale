import { STORAGE_KEYS } from "@/constants/storage";

export interface ProductPricing {
  originalCents: number;
  winBackCents: number;
  originalLabel: string;
  winBackLabel: string;
  originalDiscount: string;
  winBackDiscount: string;
}

export const PRODUCT_PRICING: Record<string, ProductPricing> = {
  weakness_report: {
    originalCents: 100,
    winBackCents: 100,
    originalLabel: "$1.00",
    winBackLabel: "$1.00",
    originalDiscount: "97% Off",
    winBackDiscount: "97% Off",
  },
  genius_blueprint: {
    originalCents: 100,
    winBackCents: 100,
    originalLabel: "$1.00",
    winBackLabel: "$1.00",
    originalDiscount: "97% Off",
    winBackDiscount: "97% Off",
  },
  brain_coach: {
    originalCents: 100,
    winBackCents: 100,
    originalLabel: "$1.00",
    winBackLabel: "$1.00",
    originalDiscount: "98% Off",
    winBackDiscount: "98% Off",
  },
};

/** Read declined product keys from localStorage. */
export function getDeclinedProducts(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DECLINED_UPSELLS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Record a decline in localStorage (idempotent). */
export function recordDecline(productKey: string): void {
  const current = getDeclinedProducts();
  if (!current.includes(productKey)) {
    current.push(productKey);
    localStorage.setItem(STORAGE_KEYS.DECLINED_UPSELLS, JSON.stringify(current));
  }
}

export function clearDecline(productKey: string): void {
  const current = getDeclinedProducts();
  const next = current.filter((key) => key !== productKey);
  if (next.length === 0) {
    localStorage.removeItem(STORAGE_KEYS.DECLINED_UPSELLS);
  } else {
    localStorage.setItem(STORAGE_KEYS.DECLINED_UPSELLS, JSON.stringify(next));
  }
}
