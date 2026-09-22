import { registerKlaviyoProfile, trackKlaviyoQuizCompleted, type KlaviyoFunnelVersion } from '@/services/klaviyoClient';
import type { Category, CategoryScores } from '@/types/funnel';

const inFlight = new Set<string>();

export type { KlaviyoFunnelVersion };

export type SyncKlaviyoQuizInput = {
  email: string;
  finalScore: number | null;
  scores: CategoryScores;
  strongestCategory: Category;
  funnel: KlaviyoFunnelVersion;
  logPrefix?: string;
};

export function identifyKlaviyoEmail(
  email: string,
  options?: { funnel?: KlaviyoFunnelVersion },
): void {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || typeof window === 'undefined') return;
  const payload: Record<string, string> = { email: trimmed };
  if (options?.funnel) payload.funnel = options.funnel;
  window.klaviyo?.push(['identify', payload]);
}

/** Server-side subscribe + quiz profile properties (idempotent per session). */
export function syncKlaviyoQuizLeadInBackground(input: SyncKlaviyoQuizInput): void {
  const trimmedEmail = input.email.trim().toLowerCase();
  const logPrefix = input.logPrefix ?? '[klaviyoSync]';
  const klaviyoKey = `klaviyo_profile_registered:${trimmedEmail}`;

  if (!trimmedEmail || inFlight.has(trimmedEmail) || sessionStorage.getItem(klaviyoKey)) {
    return;
  }

  inFlight.add(trimmedEmail);
  sessionStorage.setItem(klaviyoKey, 'pending');

  void (async () => {
    try {
      await registerKlaviyoProfile(trimmedEmail);
      sessionStorage.setItem(klaviyoKey, 'done');

      const eventKey = `klaviyo_event_sent:quiz_completed:${trimmedEmail}`;
      if (!sessionStorage.getItem(eventKey) && input.finalScore) {
        sessionStorage.setItem(eventKey, 'pending');
        try {
          await trackKlaviyoQuizCompleted({
            email: trimmedEmail,
            iqScore: input.finalScore,
            scores: input.scores,
            strongestCategory: input.strongestCategory,
            funnel: input.funnel,
          });
          sessionStorage.setItem(eventKey, 'done');
        } catch (err) {
          console.error(`${logPrefix} Klaviyo quiz completed event failed:`, err);
        }
      }
    } catch (err) {
      console.error(`${logPrefix} Klaviyo profile registration failed:`, err);
    } finally {
      inFlight.delete(trimmedEmail);
    }
  })();
}
