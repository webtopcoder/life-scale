// ---------------------------------------------------------------------------
// Sample report content for the public /sample page.
//
// It mirrors what a finished report looks like. Adding a sample for a new scale
// means adding one entry
// keyed by its ScaleKey — the page itself is registry-driven.
// ---------------------------------------------------------------------------

import type { ScaleKey } from '@/config/scales';

export interface SampleBar {
  label: string;
  /** 0-100 */
  value: number;
  note?: string;
}

export interface SampleSample {
  /** Example person the sample belongs to. */
  person: string;
  /** Headline number for scored scales, or null for status/archetype scales. */
  score: number | null;
  /** Denominator shown under a score ring (e.g. 'IQ', '/ 100'). */
  scoreCaption?: string;
  /** Max value used to fill the ring. */
  scoreMax?: number;
  /** Short badge, e.g. 'Bright range' or 'Solid, room to grow'. */
  band: string;
  /** One-line read of the result. */
  summary: string;
  /** Archetype card, for hidden-strengths scales. */
  archetype?: { name: string; read: string };
  /** Area breakdown. */
  bars: SampleBar[];
  /** Two or three short paragraphs written in that scale's voice. */
  paragraphs: string[];
  /** Named strengths / priorities. */
  highlights: { label: string; desc: string }[];
  /** Single blind spot or biggest lever. */
  lever: { label: string; desc: string };
  /** What the paid report adds beyond this preview. */
  fullReportAdds: string;
}

// Every bar label below must be a real area name produced by that scale's
// engine, and every archetype must be one the engine can actually return.
// `src/test/sampleReports.test.ts` enforces both.
export const SAMPLE_REPORTS: Partial<Record<ScaleKey, SampleSample>> = {
  /* ------------------------------- Mind ------------------------------- */
  iq: {
    person: 'Sophie, 34',
    score: 127,
    scoreCaption: 'IQ',
    scoreMax: 160,
    band: 'Bright range',
    summary: 'Higher than most test-takers. Fast on reasoning and self-read, slower on spatial rotation.',
    bars: [
      { label: 'Logical Reasoning', value: 92, note: 'Strongest area' },
      { label: 'Pattern Recognition', value: 90 },
      { label: 'Spatial Awareness', value: 62, note: 'Weakest area' },
      { label: 'Processing Speed', value: 85 },
      { label: 'Self-Assessment', value: 88 },
    ],
    paragraphs: [
      'Sophie solves problems by finding the rule first and only then doing the work. On the logic and pattern items she almost never brute-forces an answer — she looks for the structure, tests it once, and commits. That is why her accuracy stays high even as the items get harder.',
      'Her spatial score is the outlier, and it is the kind of gap that is easy to mistake for a ceiling. It is not. Rotation and folding tasks respond to practice faster than almost any other area, and lifting them tends to pull overall speed up with them.',
      'The pattern to watch is what happens under time pressure: she is quick, but her fastest answers are also where her few mistakes cluster. A one-beat pause before locking an answer would recover most of them.',
    ],
    highlights: [
      { label: 'Rule-finder', desc: 'Spots the underlying structure before starting the work.' },
      { label: 'Holds accuracy', desc: 'Stays precise as difficulty climbs instead of drifting.' },
      { label: 'Reads herself well', desc: 'Knows which answers she is unsure about.' },
    ],
    lever: {
      label: 'Spatial reps',
      desc: 'Two short rotation sessions a week is the single highest-return move available.',
    },
    fullReportAdds:
      'Your own report reads all five areas in your own numbers, explains what your strongest and weakest pairing means day to day, and hands you a practice sequence built around your weakest area.',
  },

  'brain-health': {
    person: 'Sophie, 34',
    score: null,
    band: 'Solid, room to grow',
    summary: 'Sleep and mental challenge are carrying things. Movement and heart health are the open levers.',
    bars: [
      { label: 'Memory & focus', value: 84 },
      { label: 'Heart & body', value: 63, note: 'Priority area' },
      { label: 'Sleep & recovery', value: 82 },
      { label: 'Movement', value: 58, note: 'Priority area' },
      { label: 'Hearing & vision', value: 77 },
      { label: 'Mood & connection', value: 79 },
      { label: 'Mental challenge', value: 88 },
    ],
    paragraphs: [
      'This is not a diagnosis and there is no score attached to it on purpose. What it shows is a status read across the seven everyday areas that decide how your brain feels week to week — and the read here is a good one with two soft spots.',
      'The strong parts are real. Sleep is regular enough to do its job, memory and focus feel steady, and mental challenge is high: reading, problem-solving, and conversation are all doing quiet work. Those are the hardest habits to build and they are already in place.',
      'Movement and the heart-and-body answers are where the friction sits. Both show the same signature: fine on ordinary days, first to collapse on busy ones. That makes them a scheduling problem more than a willpower one, which is good news, because scheduling is fixable.',
    ],
    highlights: [
      { label: 'Regular nights', desc: 'A consistent sleep window, which most people never get.' },
      { label: 'Busy mind', desc: 'Daily reading and problem-solving already built in.' },
      { label: 'People nearby', desc: 'Real conversation most days, which buffers stress.' },
    ],
    lever: {
      label: 'Protect the busy days',
      desc: 'One 20-minute walk and one prepared meal on your two hardest days each week.',
    },
    fullReportAdds:
      'Your own report turns each of the seven areas into specific weekly habits sized to your schedule, then tracks whether they actually stuck.',
  },

  'hidden-genius': {
    person: 'Sophie, 34',
    score: null,
    band: 'Archetype profile',
    archetype: {
      name: 'The Strategic Operator',
      read: 'You lead by seeing the whole board. Best with room to think, worst when pushed for a snap answer.',
    },
    summary: 'A systems thinker who reads rooms quickly and works best inside a plan she set herself.',
    bars: [
      { label: 'Systems Thinking', value: 91 },
      { label: 'People Focus', value: 86 },
      { label: 'Structure', value: 83 },
      { label: 'Risk Appetite', value: 54 },
      { label: 'Openness', value: 61 },
    ],
    paragraphs: [
      'There is no score here, and that is the point. This scale is about shape, not level — the way your thinking behaves when nobody is grading it. Your shape is unusually consistent: you orient before you act, almost every time.',
      'That shows up as strategy. You see where a plan breaks two steps before other people do, and you tend to be the one who says the quiet thing in a meeting. The same wiring makes you slower to improvise, because improvising means acting before you have the board.',
      'The third thing is easy to miss: your structure score is high but your appetite for risk is not, so you build careful plans and then hold them slightly too long. Deciding in advance what would make you change course is worth more than another round of planning.',
    ],
    highlights: [
      { label: 'Sees the break early', desc: 'Finds the failure point in a plan before it happens.' },
      { label: 'Reads the room', desc: 'Picks up mood and motive from small signals.' },
      { label: 'Builds the frame', desc: 'Turns a vague goal into something with edges.' },
    ],
    lever: {
      label: 'Decision timer',
      desc: 'A 60-second cap on low-stakes calls, so the strategist brain does not spend itself on small things.',
    },
    fullReportAdds:
      'Your own report names your archetype from all eight, reads every trait in your profile, maps the situations that bring out your best, and gives you the practice arc that fits your shape.',
  },

  /* ------------------------------- Body ------------------------------- */
  body: {
    person: 'Marcus, 41',
    score: 108,
    scoreCaption: 'Body IQ',
    scoreMax: 160,
    band: 'Above average',
    summary: 'Movement and resilience are strong. Rest and recovery is the drag on everything else.',
    bars: [
      { label: 'Daily energy', value: 72 },
      { label: 'Movement & strength', value: 88 },
      { label: 'Food & hydration', value: 66 },
      { label: 'Rest & recovery', value: 54, note: 'Weakest area' },
      { label: 'Physical resilience', value: 84 },
      { label: 'Numbers you know', value: 76 },
      { label: 'Stress load', value: 70 },
    ],
    paragraphs: [
      'One number for how your body is actually doing, built from seven areas rather than a single test. Marcus lands above average, and the shape of the result matters more than the number: he is doing the hard parts and skipping the easy one.',
      'Movement and strength, resilience, and the numbers he keeps an eye on are all well above his own average. He trains, he recovers from setbacks, and he keeps going through weeks that would stop most people. Nothing in the plan needs to add more effort.',
      'Rest and recovery is the ceiling. Low recovery drags daily energy down, makes food choices worse late in the day, and quietly caps the return on everything he already does well. Fixing it is not more work — it is less, placed better.',
    ],
    highlights: [
      { label: 'Trains consistently', desc: 'Shows up whether or not the week cooperates.' },
      { label: 'Bounces back', desc: 'Recovers from disruption without losing the habit.' },
      { label: 'Strong base', desc: 'Enough strength to build on rather than start from.' },
    ],
    lever: {
      label: 'One real rest day',
      desc: 'A single protected low-load day per week would lift energy, food, and output at once.',
    },
    fullReportAdds:
      'Your own report explains each of the seven areas in your own numbers and hands you a plan that follows your score instead of a generic template.',
  },

  'sleep-health': {
    person: 'Marcus, 41',
    score: null,
    band: 'Broken nights, fixable',
    summary: 'Falling asleep is fine. Staying asleep and the wind-down before bed are not.',
    bars: [
      { label: 'How long you sleep', value: 68 },
      { label: 'Falling asleep', value: 81 },
      { label: 'Staying asleep', value: 49, note: 'Priority area' },
      { label: 'Timing & rhythm', value: 62 },
      { label: 'Room & wind-down', value: 45, note: 'Priority area' },
      { label: 'Caffeine, alcohol & screens', value: 57 },
      { label: 'How your days feel', value: 60 },
    ],
    paragraphs: [
      'No score here — sleep is a status, not a grade. Across seven areas the picture is clear: the nights are long enough on paper and still not doing their job, because they are being interrupted rather than shortened.',
      'The two weak areas are connected. A rushed wind-down leaves the nervous system still running at lights-out, which is exactly what produces the 3am wake-ups showing in the staying-asleep answers. Treating them as one problem is faster than treating them as two.',
      'The good parts give you leverage. Falling asleep is not the issue and the timing of the week is roughly steady, so nothing has to be rebuilt from scratch. This is a sequencing fix in the last 45 minutes of the day.',
    ],
    highlights: [
      { label: 'Falls asleep easily', desc: 'No onset problem to solve, which removes the hardest part.' },
      { label: 'Enough hours', desc: 'The length of the night is not what is failing here.' },
      { label: 'Stable schedule', desc: 'Roughly the same bedtime most nights.' },
    ],
    lever: {
      label: 'A real wind-down',
      desc: 'A fixed 30-minute low-stimulation block before bed, same order every night.',
    },
    fullReportAdds:
      'Your own report gives every one of the seven areas a plain-language status for your nights and a sequence that starts with the one holding the others back.',
  },

  'hidden-athlete': {
    person: 'Marcus, 41',
    score: null,
    band: 'Archetype profile',
    archetype: {
      name: 'The Metronome',
      read: 'Your body rewards volume and rhythm. It punishes sudden maximal effort with no ramp.',
    },
    summary: 'Built for sustained, repeatable work inside a plan rather than short explosive bursts.',
    bars: [
      { label: 'Power / Endurance', value: 89, note: 'Leans endurance' },
      { label: 'Intensity / Volume', value: 85, note: 'Leans volume' },
      { label: 'Instinct / Structure', value: 62, note: 'Leans structure' },
    ],
    paragraphs: [
      'No score, no ranking — this reads three things about how your body prefers to train: whether you lean toward lasting or toward output, whether you thrive on accumulation or on sharpness, and whether you need a plan or need room. Yours leans the same way on all three.',
      'That preference has a cost. Efforts that ask for everything in a few seconds feel worse than they should and take longer to recover from, especially without a proper ramp. Programs built around max lifts and sprints will read as failure when they are really a mismatch.',
      'The structure lean is the one to watch. Edges are what let you train hard safely, but they also mean a missed session reads as a broken plan — and one broken week can end a block that was otherwise working.',
    ],
    highlights: [
      { label: 'Sustains output', desc: 'Holds a pace long after the interesting part is over.' },
      { label: 'Repeats well', desc: 'Can do it again tomorrow, which compounds.' },
      { label: 'Works to a plan', desc: 'Defined work and defined rest keep you progressing.' },
    ],
    lever: {
      label: 'Ramp before you push',
      desc: 'Ten minutes of graded warm-up turns your worst sessions into ordinary ones.',
    },
    fullReportAdds:
      'Your own report names your archetype from all eight, reads each of the three dials with its upside and its cost, and shapes your training weeks around it.',
  },
};


export function getSample(key: ScaleKey): SampleSample | null {
  return SAMPLE_REPORTS[key] ?? null;
}
