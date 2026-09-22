import { api } from '@/integrations/api/client';
import { cognitoAuth } from '@/integrations/api/cognitoAuth';
import { isScaleKey, type ScaleKey } from '@/config/scales';

export type Branch = ScaleKey;

const LOCAL_KEY = 'iqscale.completions';
const LOCAL_PAYLOAD_PREFIX = 'iqscale.completion_payload.';

function readLocal(): Set<Branch> {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((v): v is Branch => isScaleKey(v)));
  } catch {
    return new Set();
  }
}
function writeLocal(set: Set<Branch>) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify([...set])); } catch { /* noop */ }
}
function stashLocalPayload(branch: Branch, payload: Record<string, unknown> | null | undefined) {
  if (!payload) return;
  try { localStorage.setItem(LOCAL_PAYLOAD_PREFIX + branch, JSON.stringify(payload)); } catch { /* noop */ }
}
function popLocalPayload(branch: Branch): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(LOCAL_PAYLOAD_PREFIX + branch);
    if (!raw) return null;
    return JSON.parse(raw) as Record<string, unknown>;
  } catch { return null; }
}
/** Read the locally mirrored payload for a branch (fast path, may be stale). */
export function readLocalCompletionPayload(branch: Branch): Record<string, unknown> | null {
  return popLocalPayload(branch);
}
function clearLocalPayload(branch: Branch) {
  try { localStorage.removeItem(LOCAL_PAYLOAD_PREFIX + branch); } catch { /* noop */ }
}

/**
 * Mark a test as completed. When signed in, upserts into test_completions
 * (including an optional payload with quiz answers). When unauthenticated,
 * records locally so the next sign-in can sync it up.
 */
export async function markCompleted(
  branch: Branch,
  payload?: Record<string, unknown>,
): Promise<void> {
  try {
    const user = await cognitoAuth.getAuthUser();
    if (!user) {
      const set = readLocal();
      set.add(branch);
      writeLocal(set);
      stashLocalPayload(branch, payload);
      return;
    }
    await api.put('/dashboard/test-completions', { branch, payload });
  } catch {
    const set = readLocal();
    set.add(branch);
    writeLocal(set);
    stashLocalPayload(branch, payload);
  }
}

/** Returns the set of completed branches for the current user (DB + local mirror). */
export async function listCompletions(userId: string): Promise<Set<Branch>> {
  const merged = readLocal();
  try {
    const data = await api.get<Array<{ branch: string }>>('/dashboard/test-completions');
    if (data) {
      for (const row of data) merged.add(row.branch as Branch);
    }
  } catch { /* fall through with local set */ }
  return merged;
}

/** Sync any local-only completions (and their payloads) into the DB. */
export async function syncLocalCompletions(userId: string): Promise<void> {
  const local = readLocal();
  if (local.size === 0) return;
  try {
    for (const branch of local) {
      const payload = popLocalPayload(branch);
      await api.put('/dashboard/test-completions', { branch, payload });
    }
    try { localStorage.removeItem(LOCAL_KEY); } catch { /* noop */ }
    for (const b of local) clearLocalPayload(b);
  } catch { /* keep local for next attempt */ }
}

/** Fetch the stored payload for a given completion (e.g. BH answers). */
export async function getCompletionPayload(userId: string, branch: Branch): Promise<Record<string, unknown> | null> {
  try {
    const data = await api.get<Array<{ branch: string; payload?: Record<string, unknown> }>>('/dashboard/test-completions');
    const completion = data?.find((c) => c.branch === branch);
    return completion?.payload ?? null;
  } catch { return null; }
}
