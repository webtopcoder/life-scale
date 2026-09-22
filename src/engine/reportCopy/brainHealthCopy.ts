/**
 * Extended authored copy for the Brain Health report.
 *
 * brainHealthReport.ts owns the scoring bands and the core narrative.
 * This module owns the depth: why a domain matters, and what measurably
 * changes if the user acts on it. Deterministic, authored, no AI at render.
 *
 * Copy is intentionally tight — the full report targets ~1,470 rendered words.
 */

import { DOMAIN_LABEL, type Domain } from '@/data/brainHealthQuiz';

type Level = 'high' | 'mid' | 'low';

interface DomainDepth {
  /** Why this area matters — mechanism, in plain language. */
  whyItMatters: string;
  /** What changes if they act, per level. */
  whatChanges: Record<Level, string>;
  /** What people usually get wrong about this area. */
  commonMistake: string;
}

export const DOMAIN_DEPTH: Record<Domain, DomainDepth> = {
  cognitive: {
    whyItMatters:
      "Everyday thinking is the output of everything else here — which is why it responds fastest.",
    whatChanges: {
      high: "Holding this means not letting sleep, engagement and vascular health slide.",
      mid: "Fog thins within a fortnight of steady sleep and daily movement — and returns the week you stop.",
      low: "Aim for fewer bad days, not sharper days. Count foggy days per week.",
    },
    commonMistake:
      "Treating every lapse as a memory problem. Most forgetting is attention — you never encoded it.",
  },
  vascular: {
    whyItMatters:
      "Your brain takes about a fifth of your blood supply. Pressure, sugar and cholesterol reach it first, quietly.",
    whatChanges: {
      high: "The payoff compounds invisibly. Keeping numbers in range through midlife is well-evidenced.",
      mid: "Pressure moves with daily walking and less salt. Take a baseline and recheck in six weeks.",
      low: "Here a doctor beats any article, because the specific numbers matter.",
    },
    commonMistake:
      "Assuming that feeling fine means the numbers are fine. Raised pressure is silent for years.",
  },
  sleep: {
    whyItMatters:
      "Sleep is maintenance the brain can't run awake: memories consolidate and waste clears.",
    whatChanges: {
      high: "You're getting the benefit, so the job is protection. Good sleep degrades gradually.",
      mid: "Timing beats duration. The same half-hour window daily resets the rhythm in two weeks.",
      low: "Anchor the wake time first. If nothing shifts in a month, raise it with a doctor.",
    },
    commonMistake:
      "Fixing sleep with more time in bed — that strengthens the link between bed and being awake.",
  },
  movement: {
    whyItMatters:
      "Movement acts almost directly on brain tissue: more blood flow, more growth signals, better sleep that night.",
    whatChanges: {
      high: "Protect the floor rather than raising the ceiling. Bad weeks matter more than best weeks.",
      mid: "The threshold is low: brisk walking, thirty minutes, most days. Mood shifts in two weeks.",
      low: "Ten minutes counts. Month one is about not skipping on the days you don't feel like it.",
    },
    commonMistake:
      "Chasing intensity when frequency carries the benefit. A daily walk beats three hard sessions a month.",
  },
  sensory: {
    whyItMatters:
      "Hearing and vision are the brain's input channels. Degraded input burns capacity and makes people withdraw.",
    whatChanges: {
      high: "Checks every couple of years are enough — the point is catching drift early.",
      mid: "A hearing test is cheap, quick, and the highest-value single action here.",
      low: "Correction works, and works better early. It prevents the slow social withdrawal.",
    },
    commonMistake:
      "Treating this as vanity or a problem for later. It has the clearest fix and the longest delay.",
  },
  mood: {
    whyItMatters:
      "Sustained stress changes how the brain allocates resources — attention, working memory and speed all degrade.",
    whatChanges: {
      high: "Steady mood does quiet work everywhere else. Learn your own early warning signal.",
      mid: "Recovery has parts: undemanding company, something absorbing, and time outdoors.",
      low: "Attribute the cognitive symptoms to the load, not to your brain.",
    },
    commonMistake:
      "Waiting for a reason severe enough to justify support. Duration matters more than severity.",
  },
  reserve: {
    whyItMatters:
      "Reserve is the buffer built by learning, complex work and social contact — and it's buildable at any age.",
    whatChanges: {
      high: "What erodes buffer fastest is a life where nothing is genuinely difficult.",
      mid: "Novelty and difficulty are the ingredients. Something you're bad at beats something you do well.",
      low: "Social contact is the highest-yield start: complexity and mood benefit in one activity.",
    },
    commonMistake:
      "Thinking brain games count. Reserve comes from real difficulty in a real domain.",
  },
};

export function focusFraming(top3Labels: string[]): string {
  return (
    `These three are where the gap between where you are and a reasonable target is largest. ` +
    `${top3Labels[0]} is first because improvements there pull the others along.`
  );
}

export function trajectoryFraming(top3: Domain[]): string {
  const labels = top3.map(d => DOMAIN_LABEL[d]);
  return (
    `Almost nothing here produces a result you can feel in the first fortnight, which is why people quit. ` +
    `Your cycle is built around ${labels.join(', ')} — here is what three months actually looks like from the inside.`
  );
}

export function workingFraming(strengthLabels: string[]): string {
  return (
    `${strengthLabels[0]} and ${strengthLabels[1] ?? 'your second strongest area'} are doing real work for the rest ` +
    `of your results. Protecting them matters more than optimising anything else.`
  );
}

export const FACTORS_FRAMING =
  'Some of what shapes brain health cannot be changed. Naming those alongside what you control is how the ' +
  'controllable items get weighted properly. Nothing below is a diagnosis.';

export const MOMENTUM_FRAMING =
  'These are deliberately small: the failure mode of health plans is a first week so demanding that week two never ' +
  'happens. Start with the first three and add nothing until they feel automatic.';

export const DOCTOR_FRAMING =
  'General comments invite reassurance; a specific observation invites investigation. These are built from your ' +
  'answers and phrased so a clinician can act on them.';
