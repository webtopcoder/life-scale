import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  disclaimer,
  statementDescriptorNote,
} from '@/content/legalCopy';

const SRC = join(process.cwd(), 'src');

/** Files allowed to author this wording. */
const ALLOWED = [
  join('src', 'content', 'legalCopy.ts'),
  join('src', 'data', 'likert-tests.ts'),
  join('src', 'test', 'legalCopy.test.ts'),
];

/** Literal fragments that must only ever live in the shared copy module. */
const BANNED = [
  'not a medical test',
  'not a medical assessment',
  'LIFE-SCALE.COM',
  'not a clinical, diagnostic',
  'entertainment purposes',
  'not medical, psychological, or professional advice',
  '$30.00, or $40.00 per month',
  '$8, $14, $30, or $40',
  '$8.00, $14.00',
  '$14.00, $28.99',
];


function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe('legal copy is centralized', () => {
  it('no banned disclaimer fragment appears outside the shared module', () => {
    const offenders: string[] = [];
    for (const file of walk(SRC)) {
      const rel = file.slice(file.indexOf(`src${'/'}`));
      if (ALLOWED.some((a) => rel.endsWith(a))) continue;
      const text = readFileSync(file, 'utf8');
      for (const fragment of BANNED) {
        if (text.includes(fragment)) offenders.push(`${rel}: "${fragment}"`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('descriptor note names a single static descriptor', () => {
    const note = statementDescriptorNote();
    expect(note).toContain('LIFE SCALE');
    expect(note).not.toContain('LIFE-SCALE.COM');
  });

  it('category overrides fall back to the shared default', () => {
    expect(disclaimer('reportShort')).toBe(disclaimer('reportShort', 'money'));
    expect(disclaimer('assessmentShort', 'body')).toContain('wellbeing');
  });
});
