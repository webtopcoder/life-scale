import { loadQuestions, preloadQuestions as preloadLocalQuestions } from '@/engine/datasetLoader';

const blobCache = new Map<string, string>();
let inflightPromise: Promise<void> | null = null;

/**
 * Auto-discover all static SVG question IDs from the dataset,
 * fetch every SVG asset, and cache as blob URLs for instant rendering.
 */
export function preloadStaticSvgAssets(): Promise<void> {
  if (inflightPromise) return inflightPromise;

  inflightPromise = (async () => {
    // Use whatever questions are already in the cache. Do NOT trigger a
    // default preload here — that would clobber a flow-specific preload
    // (e.g. SHORT_IQ_V1) made by the caller right before.
    let questions = loadQuestions();
    if (!questions || questions.length === 0) {
      await preloadLocalQuestions();
      questions = loadQuestions();
    }

    // Auto-discover: any question whose image starts with "static_"
    const staticIds = new Set<string>();
    for (const q of questions) {
      if (q.image && q.image.startsWith('static_')) {
        // e.g. "static_q14" → "q14"
        staticIds.add(q.image.replace('static_', ''));
      }
    }

    // Build full URL list: problem + 6 answers per question
    const urls: string[] = [];
    for (const qId of staticIds) {
      const base = `/puzzles/${qId}`;
      urls.push(`${base}/problem.svg`);
      for (let i = 1; i <= 6; i++) {
        urls.push(`${base}/answer-${i}.svg`);
      }
    }

    // Fetch all in parallel, convert to blob URLs
    await Promise.allSettled(
      urls.map(async (url) => {
        if (blobCache.has(url)) return;
        try {
          const res = await fetch(url);
          if (!res.ok) return;
          const blob = await res.blob();
          blobCache.set(url, URL.createObjectURL(blob));
        } catch {
          // Silently skip — resolveStaticSvgSrc will fall back to raw path
        }
      }),
    );
  })();

  return inflightPromise;
}

/**
 * Returns the cached blob URL for a static SVG path, or the original path as fallback.
 */
export function resolveStaticSvgSrc(path: string): string {
  return blobCache.get(path) || path;
}

/**
 * Prefetch SVG assets for a specific static question (no-op if already cached).
 */
export function prefetchStaticSvgQuestion(imageKey: string): void {
  // Assets are bulk-prefetched by preloadStaticSvgAssets; this is a no-op fallback.
}

/**
 * Eagerly warm visual puzzle SVG assets. Here we delegate to the bulk
 * preloader which already fetches every static puzzle on boot, so this
 * is effectively a no-op kept for API parity with imported flows.
 */
export function warmAllVisualPuzzles(_imageKeys: string[], _concurrency = 3): void {
  void preloadStaticSvgAssets();
}
