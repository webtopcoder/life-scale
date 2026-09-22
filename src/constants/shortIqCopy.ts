import { createElement, type ReactNode } from 'react';

export interface ShortIqTheme {
  optionDefault: string;
  optionSelected: string;
  optionTouchDefault: string;
  optionTouchSelected: string;
}

const THEME: ShortIqTheme = {
  optionDefault: 'bg-primary/[0.06] hover:bg-primary/10',
  optionSelected: 'bg-primary/15 ring-1 ring-primary/60',
  optionTouchDefault: 'hsl(var(--primary) / 0.06)',
  optionTouchSelected: 'hsl(var(--primary) / 0.15)',
};

export function getShortIqTheme(): ShortIqTheme {
  return THEME;
}

export interface ReinforcementVariant {
  titleTemplate: string;
  message: string;
  percentile?: number;
}

export interface ReinforcementVariants {
  success: ReinforcementVariant;
  miss: ReinforcementVariant;
}

export interface ShortIqCopy {
  intro: { title: string; subtitle: ReactNode; cta: string; heroAlt: string };
  calculatingHeading: string;
  calculatingBars: { label: string; durationMs: number; target: number }[];
  calculatingPopups: { question: string; yesLabel: string; noLabel: string }[];
  reinforcement: {
    speed: ReinforcementVariants;
    score: ReinforcementVariants;
    category: ReinforcementVariants;
    momentum: ReinforcementVariants;
  };
  email: {
    heading: string;
    subhead: ReactNode;
    rows: { label: string; value: string }[];
    cta: string;
  };
}

const SHORT_IQ_COPY: ShortIqCopy = {
  intro: {
    title: 'How High Is Your IQ?',
    subtitle: [
      'Only ',
      createElement('strong', { key: 'a' }, '3% of people score above 130'),
      '\nAre you one of them?\n\n',
      createElement('strong', { key: 'c' }, 'Find out in 2 minutes'),
      '\n',
    ],
    cta: 'Start',
    heroAlt: 'IQ bell curve illustration',
  },
  calculatingHeading: 'Calculating your IQ Score',
  calculatingBars: [
    { label: 'Memory recall', durationMs: 800, target: 100 },
    { label: 'Logical reasoning', durationMs: 800, target: 100 },
    { label: 'Pattern recognition', durationMs: 800, target: 100 },
    { label: 'Verbal reasoning', durationMs: 800, target: 100 },
    { label: 'Finalizing IQ score', durationMs: 1000, target: 100 },
  ],
  calculatingPopups: [
    { question: 'Curious how your IQ compares to the average?', yesLabel: 'Yes', noLabel: 'Not really' },
    { question: 'Do you regularly challenge your mind with puzzles or problems?', yesLabel: 'Yes', noLabel: 'No' },
    { question: 'Want tips to push your IQ score even higher?', yesLabel: 'Yes', noLabel: 'Maybe' },
  ],
  reinforcement: {
    speed: {
      success: { titleTemplate: 'Sharp eye — top {p}%', message: 'You spotted the odd one out faster than most test-takers. Visual attention is a strong IQ signal.', percentile: 68 },
      miss: { titleTemplate: 'Tricky one.', message: 'Visual attention scrambles even strong test-takers. Keep going — the next ones reveal more.' },
    },
    score: {
      success: { titleTemplate: 'Self-awareness matters.', message: 'How you perceive your own thinking is part of the IQ profile we build for you.' },
      miss: { titleTemplate: 'Self-awareness matters.', message: 'How you perceive your own thinking is part of the IQ profile we build for you.' },
    },
    category: {
      success: { titleTemplate: 'Pattern recognition\nTop {p}%', message: 'Spotting patterns quickly is one of the clearest markers of fluid intelligence — the core engine behind high IQ scores.', percentile: 12 },
      miss: { titleTemplate: 'Pattern recognition is sharpening.', message: 'These get harder on purpose — the next ones reveal more about how you reason.' },
    },
    momentum: {
      success: { titleTemplate: "You're almost done!", message: 'A few more answers and your IQ Score will be ready.', percentile: 95 },
      miss: { titleTemplate: 'Almost done.', message: 'The last stretch matters most for your IQ score. Stay with it.' },
    },
  },
  email: {
    heading: 'Your IQ Score Is Ready',
    subhead: 'Enter your email to unlock your IQ score and see how you compare to the population',
    rows: [
      { label: 'IQ Score', value: 'Calculated' },
      { label: 'Strongest Domain', value: 'Pattern Recognition' },
      { label: 'Percentile Rank', value: 'Top tier' },
    ],
    cta: 'Continue',
  },
};

export function getShortIqCopy(): ShortIqCopy {
  return SHORT_IQ_COPY;
}