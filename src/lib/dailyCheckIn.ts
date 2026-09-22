import { checkInDaily, type StreakCheckInResult } from "@/services/dashboardService";
import { STORAGE_KEYS } from "@/constants/storage";

/**
 * Daily check-in runner.
 *
 * The check-in endpoint is server-authoritative (once per UTC day), but the hook
 * that triggers it is mounted on many dashboard pages. This module makes sure the
 * request fires at most once per session, and that only ONE caller is told points
 * were awarded so toasts/celebrations never duplicate on navigation.
 */

export interface DailyCheckInOutcome {
  result: StreakCheckInResult | null;
  /** True only for the single caller that actually earned points. */
  awarded: boolean;
}

let inFlight: Promise<StreakCheckInResult | null> | null = null;
let cachedUserId: string | null = null;
let cachedResult: StreakCheckInResult | null = null;
let awardConsumed = false;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function localGuardKey(userId: string): string {
  return `${STORAGE_KEYS.LAST_CHECK_IN}:${userId}`;
}

function alreadyCheckedInLocally(userId: string): boolean {
  try {
    return localStorage.getItem(localGuardKey(userId)) === todayKey();
  } catch {
    return false;
  }
}

function markCheckedInLocally(userId: string): void {
  try {
    localStorage.setItem(localGuardKey(userId), todayKey());
  } catch {
    /* ignore quota */
  }
}

/** Reset in-memory state (used on user switch / sign-out). */
export function resetDailyCheckIn(): void {
  inFlight = null;
  cachedUserId = null;
  cachedResult = null;
  awardConsumed = false;
}

export async function runDailyCheckIn(userId: string): Promise<DailyCheckInOutcome> {
  if (cachedUserId && cachedUserId !== userId) resetDailyCheckIn();
  cachedUserId = userId;

  // Fast path: this browser already recorded today's check-in.
  if (!inFlight && alreadyCheckedInLocally(userId)) {
    return { result: cachedResult, awarded: false };
  }

  if (!inFlight) {
    inFlight = checkInDaily(userId)
      .then(result => {
        cachedResult = result;
        markCheckedInLocally(userId);
        return result;
      })
      .catch(err => {
        // Allow a later mount to retry.
        inFlight = null;
        console.error("Daily check-in failed:", err);
        return null;
      });
  }

  const result = await inFlight;
  const isAward =
    !!result && !result.already_checked_in && result.xp_bonus > 0 && !awardConsumed;
  if (isAward) awardConsumed = true;
  return { result, awarded: isAward };
}
