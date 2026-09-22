export interface AddonTable {
  columns: string[];
  rows: string[][];
}

export interface AddonSection {
  heading: string;
  intro?: string;
  paragraphs?: string[];
  bullets?: string[];
  pairs?: { label: string; value: string }[];
  table?: AddonTable;
  callout?: { label: string; text: string };
}

export interface AddonDoc {
  /** Bump when a builder's output shape changes. Stored with the document. */
  version: number;
  title: string;
  subtitle: string;
  generatedAt: string;
  sections: AddonSection[];
}

export const ADDON_DOC_VERSION = 1;

export type AddonPayload = Record<string, unknown>;

export function baseDoc(title: string, subtitle: string, sections: AddonSection[]): AddonDoc {
  return {
    version: ADDON_DOC_VERSION,
    title,
    subtitle,
    generatedAt: new Date().toISOString(),
    sections,
  };
}
