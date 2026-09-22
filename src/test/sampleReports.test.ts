// Guards the contract that the public sample reports only advertise areas and
// archetypes the real engines can actually produce.

import { describe, it, expect } from 'vitest';
import { SAMPLE_REPORTS } from '@/data/sampleReports';
import { CATEGORY_LABELS } from '@/pages/ReportPage';
import { DOMAIN_LABEL } from '@/data/brainHealthQuiz';
import { BODY_DOMAIN_LABEL } from '@/data/bodyIqQuiz';
import { SLEEP_DOMAIN_LABEL } from '@/data/sleepHealthQuiz';
import { ATHLETE_AXIS_LABEL } from '@/data/hiddenAthleteQuiz';
import { TRAIT_LABEL, ARCHETYPES } from '@/engine/hiddenGeniusScoring';
import { ATHLETE_ARCHETYPES } from '@/engine/bodyScoring';

const ALLOWED_BAR_LABELS: Record<string, string[]> = {
  iq: Object.values(CATEGORY_LABELS),
  'brain-health': Object.values(DOMAIN_LABEL),
  'hidden-genius': Object.values(TRAIT_LABEL),
  body: Object.values(BODY_DOMAIN_LABEL),
  'sleep-health': Object.values(SLEEP_DOMAIN_LABEL),
  'hidden-athlete': Object.values(ATHLETE_AXIS_LABEL).map(([low, high]) => `${low} / ${high}`),
};

const ALLOWED_ARCHETYPES: Record<string, string[]> = {
  'hidden-genius': Object.values(ARCHETYPES).map((a) => a.name),
  'hidden-athlete': Object.values(ATHLETE_ARCHETYPES).map((a) => a.name),
};

describe('sample reports match the real reports', () => {
  for (const [key, sample] of Object.entries(SAMPLE_REPORTS)) {
    if (!sample) continue;

    it(`${key}: every bar label is a real area name`, () => {
      const allowed = ALLOWED_BAR_LABELS[key];
      expect(allowed, `no allowed label set defined for ${key}`).toBeTruthy();
      for (const bar of sample.bars) {
        expect(allowed, `"${bar.label}" is not an area ${key} produces`).toContain(bar.label);
      }
    });

    it(`${key}: the archetype is one the engine can return`, () => {
      if (!sample.archetype) return;
      const allowed = ALLOWED_ARCHETYPES[key];
      expect(allowed, `no allowed archetype set defined for ${key}`).toBeTruthy();
      expect(allowed).toContain(sample.archetype.name);
    });
  }
});
