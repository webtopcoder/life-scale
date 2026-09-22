import { api } from '@/integrations/api/client';
import { getCompletionPayload } from '@/lib/testCompletions';
import type { Addon } from '@/lib/addons';
import type { AddonDoc } from '@/lib/addonBuilders/types';

/** All add-on product keys the user already owns. */
export async function fetchOwnedAddonKeys(userId: string): Promise<Set<string>> {
  try {
    const data = await api.get<Array<{ productKey?: string; product_key?: string }>>('/dashboard/purchases');
    return new Set((data ?? [])
      .map((r) => r.productKey ?? r.product_key)
      .filter((key) => key?.startsWith('addon_')));
  } catch {
    return new Set();
  }
}

/** Read a previously generated document. Returns null if it has not been generated. */
export async function loadAddonDoc(userId: string, addon: Addon): Promise<AddonDoc | null> {
  try {
    const data = await api.get<Array<{ reportJson?: any; report_json?: any; reportType?: string; report_type?: string }>>('/dashboard/generated-reports');
    const report = data?.find((r) => (r.reportType ?? r.report_type) === addon.key);
    const doc = (report?.reportJson ?? report?.report_json ?? null) as unknown as AddonDoc | null;
    return doc && Array.isArray(doc.sections) ? doc : null;
  } catch {
    return null;
  }
}

/**
 * Generate the document ONCE, at purchase time, and persist it.
 * If a document already exists it is returned untouched — content is never
 * rebuilt on subsequent views.
 */
export async function generateAddonDoc(userId: string, addon: Addon): Promise<AddonDoc | null> {
  const existing = await loadAddonDoc(userId, addon);
  if (existing) return existing;

  const payload = (await getCompletionPayload(userId, addon.branch)) ?? {};
  let doc: AddonDoc;
  try {
    doc = addon.build(payload);
  } catch {
    return null;
  }

  try {
    await api.post('/dashboard/generated-reports', {
      reportType: addon.key,
      reportJson: doc,
    });
  } catch {
    /* the document is still returned; a later view will retry the insert */
  }
  return doc;
}

/**
 * In-app add-on charges use the Life-Scale `#ls-upsell` widget on
 * AddonCheckoutPage (partner has no server-to-server /api/upsell auth yet).
 * Fulfillment: webhook `upsell.completed` → AddonReportPage generates the doc.
 */
