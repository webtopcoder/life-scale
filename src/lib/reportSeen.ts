// DB-backed report-seen flag with a localStorage cache so the redirect
// fires exactly once per (user, branch) even across devices.

import type { Branch } from '@/lib/testCompletions';
import { api } from '@/integrations/api/client';
import { cognitoAuth } from '@/integrations/api/cognitoAuth';

const KEY = 'iqscale.reportSeen';

function branchColumn(branch: Branch): string {
  switch (branch) {
    case 'iq': return 'first_report_seen_iq_at';
    case 'brain-health': return 'first_report_seen_bh_at';
    case 'hidden-genius': return 'first_report_seen_hg_at';
  }
}

function read(): Set<Branch> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((v): v is Branch =>
      v === 'iq' || v === 'brain-health' || v === 'hidden-genius'));
  } catch { return new Set(); }
}
function write(set: Set<Branch>) {
  try { localStorage.setItem(KEY, JSON.stringify([...set])); } catch { /* noop */ }
}

/** Synchronous local check (used inline in effects). */
export function hasSeenReport(branch: Branch): boolean {
  return read().has(branch);
}

/**
 * Async check that also consults the DB. Falls back to the local flag if
 * the DB is unreachable or the user is signed out.
 */
export async function hasSeenReportRemote(userId: string | null | undefined, branch: Branch): Promise<boolean> {
  if (read().has(branch)) return true;
  if (!userId) return false;
  try {
    const data = await api.get<Record<string, any>>('/dashboard/profile');
    const val = data?.[branchColumn(branch)] ?? null;
    if (val) {
      const s = read();
      s.add(branch);
      write(s);
      return true;
    }
    return false;
  } catch { return false; }
}

/** Mark seen locally + persist to the profile row when signed in. */
export function markReportSeen(branch: Branch): void {
  const s = read();
  if (!s.has(branch)) { s.add(branch); write(s); }
  // Fire-and-forget DB write.
  void (async () => {
    try {
      const user = await cognitoAuth.getAuthUser();
      if (!user) return;
      await api.patch('/dashboard/profile', { [branchColumn(branch)]: new Date().toISOString() });
    } catch { /* noop */ }
  })();
}
