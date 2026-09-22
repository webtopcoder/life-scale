import { generatePuzzle } from '@/engine/puzzleGenerator';
import { preloadQuestions as preloadLocalQuestions, loadQuestions } from '@/engine/datasetLoader';
import { preloadStaticSvgAssets } from '@/engine/staticSvgCache';

type PuzzleResult = ReturnType<typeof generatePuzzle>;

const cache: Record<string, PuzzleResult> = {};
let warmupPromise: Promise<void> | null = null;

/**
 * Start the full warmup pipeline (idempotent).
 * 1. Critical: preload local questions + fetch static SVGs into blob cache
 * 2. Background: generate all visual puzzle cache entries in chunks
 */
export function startDevPuzzleWarmup(): Promise<void> {
  if (warmupPromise) return warmupPromise;

  warmupPromise = (async () => {
    // Critical phase — fetch static SVGs (also calls preloadLocalQuestions internally)
    await preloadStaticSvgAssets();

    // Background phase — generate puzzle cache entries without blocking UI
    const questions = loadQuestions();
    const puzzleQuestions = questions.filter(
      (q) => q.image && (q.type === 'visualPuzzle' || q.type === 'spatial'),
    );

    // Process in chunks to avoid frame drops
    const CHUNK = 5;
    for (let i = 0; i < puzzleQuestions.length; i += CHUNK) {
      const chunk = puzzleQuestions.slice(i, i + CHUNK);
      for (const q of chunk) {
        const key = `${q.image}_${q.difficulty}_${q.id}`;
        if (!cache[key]) {
          cache[key] = generatePuzzle(q.image!, q.difficulty, q.id);
        }
      }
      // Yield to browser between chunks
      if (i + CHUNK < puzzleQuestions.length) {
        await new Promise<void>((r) =>
          typeof requestIdleCallback !== 'undefined'
            ? requestIdleCallback(() => r())
            : setTimeout(r, 0),
        );
      }
    }
  })();

  return warmupPromise;
}

/**
 * Wait for critical warmup (static SVGs fetched) with a hard timeout.
 * Background puzzle generation continues regardless.
 */
export async function waitForCriticalWarmup(maxMs: number): Promise<{ timedOut: boolean }> {
  // Ensure warmup is started
  const wp = startDevPuzzleWarmup();

  const result = await Promise.race([
    wp.then(() => ({ timedOut: false })),
    new Promise<{ timedOut: boolean }>((r) => setTimeout(() => r({ timedOut: true }), maxMs)),
  ]);

  return result;
}

/**
 * Legacy sync API — still works for backward compat.
 * Now async internally but safe to call as fire-and-forget.
 */
export function preloadAllPuzzles() {
  preloadLocalQuestions();
  startDevPuzzleWarmup();
}

/** Get a cached puzzle result, or generate on-the-fly as fallback. */
export function getCachedPuzzle(image: string, difficulty: number, id: number): PuzzleResult {
  const key = `${image}_${difficulty}_${id}`;
  if (!cache[key]) {
    cache[key] = generatePuzzle(image, difficulty, id);
  }
  return cache[key];
}
