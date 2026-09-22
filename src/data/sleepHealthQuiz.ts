// Sleep Health — the Body category's health screen. No headline score: seven
// domains, each returned as a plain-language status. Weights are load-style:
// higher weight = more concern (mirrors the Brain Health check-in).

import { Q, C, opts, type ScaleStep } from '@/data/scaleQuiz';

export type SleepDomain =
  | 'duration'
  | 'latency'
  | 'continuity'
  | 'rhythm'
  | 'environment'
  | 'stimulants'
  | 'daytime';

export const SLEEP_DOMAIN_LABEL: Record<SleepDomain, string> = {
  duration: 'How long you sleep',
  latency: 'Falling asleep',
  continuity: 'Staying asleep',
  rhythm: 'Timing & rhythm',
  environment: 'Room & wind-down',
  stimulants: 'Caffeine, alcohol & screens',
  daytime: 'How your days feel',
};

export const SLEEP_DOMAIN_BLURB: Record<SleepDomain, string> = {
  duration: 'Total time asleep on a normal night, not on your best night.',
  latency: 'How long it takes you to drop off once the light is out.',
  continuity: 'Whether the night runs through, or breaks into pieces.',
  rhythm: 'How steady your sleep and wake times are across the week.',
  environment: 'Light, noise, temperature, and what happens in the last hour.',
  stimulants: 'The inputs that quietly change sleep quality hours later.',
  daytime: 'The daytime signals that tell you what the night actually did.',
};

export const SLEEP_QUIZ_STEPS: ScaleStep[] = [
  // --- About you ---
  Q({ kind: 'q', id: 1, section: 'About you', domain: null,
      prompt: 'What is your age range?',
      options: opts(['Under 30', '30–39', '40–49', '50–59', '60+']) }),
  Q({ kind: 'q', id: 2, section: 'About you', domain: null,
      prompt: 'What brought you here?',
      micro: 'This shapes the plan you get afterwards.',
      options: opts([
        'I want to fall asleep faster',
        'I wake up in the night',
        'I sleep enough but feel unrested',
        'My hours are all over the place',
        'I just want to know where I stand',
      ]) }),

  // --- Duration ---
  Q({ kind: 'q', id: 3, section: 'How long you sleep', domain: 'duration',
      prompt: 'On a normal night, how long are you actually asleep?',
      options: opts(['7–8 hours', 'About 7 hours', '6–7 hours', '5–6 hours', 'Under 5 hours'], [0, 1, 2, 3, 4]) }),
  Q({ kind: 'q', id: 4, section: 'How long you sleep', domain: 'duration',
      prompt: 'How often do you get less sleep than you know you need?',
      options: opts(['Rarely', 'Once a week', 'Two or three nights', 'Most nights', 'Every night'], [0, 1, 2, 3, 4]) }),
  Q({ kind: 'q', id: 5, section: 'How long you sleep', domain: 'duration',
      prompt: 'Do you catch up on sleep at weekends?',
      options: opts(['No need to', 'An extra half hour', 'An extra hour or two', 'Much longer', 'I sleep as long as I possibly can'], [0, 1, 2, 3, 4]) }),

  C({ kind: 'card', id: 'card-1', title: 'Sleep is not one thing',
      body: 'Two people can both sleep seven hours and get completely different nights. This check-in separates length from quality, timing, and what your days are telling you.' }),

  // --- Latency ---
  Q({ kind: 'q', id: 6, section: 'Falling asleep', domain: 'latency',
      prompt: 'Once the light is out, how long until you are asleep?',
      options: opts(['Under 10 minutes', '10–20 minutes', '20–40 minutes', '40–60 minutes', 'Over an hour'], [0, 1, 2, 3, 4]) }),
  Q({ kind: 'q', id: 7, section: 'Falling asleep', domain: 'latency',
      prompt: 'What is usually keeping you awake?',
      options: opts(['Nothing, I drop off', 'Mild restlessness', 'A busy head', 'Worry or replaying the day', 'Physical discomfort'], [0, 1, 2, 3, 3]) }),
  Q({ kind: 'q', id: 8, section: 'Falling asleep', domain: 'latency',
      prompt: 'Do you fall asleep somewhere other than bed and then move?',
      options: opts(['Never', 'Rarely', 'Once a week', 'Several nights a week', 'Most nights'], [0, 1, 2, 3, 4]) }),

  // --- Continuity ---
  Q({ kind: 'q', id: 9, section: 'Staying asleep', domain: 'continuity',
      prompt: 'How many times do you wake in a normal night?',
      options: opts(['Not at all', 'Once briefly', 'Once and I am awake a while', 'Two or three times', 'Repeatedly'], [0, 1, 2, 3, 4]) }),
  Q({ kind: 'q', id: 10, section: 'Staying asleep', domain: 'continuity',
      prompt: 'If you wake, how easily do you get back to sleep?',
      options: opts(['Straight away', 'Within a few minutes', 'Ten to twenty minutes', 'Half an hour or more', 'I often stay awake until morning'], [0, 1, 2, 3, 4]) }),
  Q({ kind: 'q', id: 11, section: 'Staying asleep', domain: 'continuity',
      prompt: 'Has anyone told you that you snore heavily or stop breathing in your sleep?',
      micro: 'This is worth knowing, not worth worrying about tonight.',
      options: opts(['No', 'Light snoring only', 'Yes, heavy snoring', 'Yes, and pauses in breathing', 'I sleep alone and do not know'], [0, 1, 3, 4, 2]) }),

  // --- Rhythm ---
  Q({ kind: 'q', id: 12, section: 'Timing & rhythm', domain: 'rhythm',
      prompt: 'How steady is your bedtime across the week?',
      options: opts(['Within 15 minutes', 'Within half an hour', 'Within an hour', 'Varies by two hours', 'Completely irregular'], [0, 1, 2, 3, 4]) }),
  Q({ kind: 'q', id: 13, section: 'Timing & rhythm', domain: 'rhythm',
      prompt: 'How steady is your wake time?',
      options: opts(['Same time daily', 'Within half an hour', 'Within an hour', 'Very different at weekends', 'Different every day'], [0, 1, 2, 3, 4]) }),
  Q({ kind: 'q', id: 14, section: 'Timing & rhythm', domain: 'rhythm',
      prompt: 'Do you get daylight within an hour of waking?',
      options: opts(['Every day', 'Most days', 'Sometimes', 'Rarely', 'Never'], [0, 1, 2, 3, 4]) }),
  Q({ kind: 'q', id: 15, section: 'Timing & rhythm', domain: 'rhythm',
      prompt: 'Do you work shifts, nights, or across time zones?',
      options: opts(['No', 'Occasionally', 'A few times a month', 'Most weeks', 'Constantly'], [0, 1, 2, 3, 4]) }),

  C({ kind: 'card', id: 'card-2', title: 'Almost there',
      body: 'The last sections cover your room, your wind-down, and how your days feel. Those two together usually explain the rest.' }),

  // --- Environment ---
  Q({ kind: 'q', id: 16, section: 'Room & wind-down', domain: 'environment',
      prompt: 'How dark and quiet is your room?',
      options: opts(['Dark and quiet', 'Mostly fine', 'Some light or noise', 'Noticeably disturbed', 'Bright or loud most nights'], [0, 1, 2, 3, 4]) }),
  Q({ kind: 'q', id: 17, section: 'Room & wind-down', domain: 'environment',
      prompt: 'How comfortable is the temperature where you sleep?',
      options: opts(['Comfortably cool', 'Usually fine', 'Often too warm or too cold', 'I wake because of it', 'It ruins most nights'], [0, 1, 2, 3, 4]) }),
  Q({ kind: 'q', id: 18, section: 'Room & wind-down', domain: 'environment',
      prompt: 'What does the last hour before bed usually look like?',
      options: opts(['A calm routine', 'Quiet, no real routine', 'Chores and admin', 'Work or difficult conversations', 'Screens until I fall asleep'], [0, 1, 2, 3, 4]) }),

  // --- Stimulants ---
  Q({ kind: 'q', id: 19, section: 'Caffeine, alcohol & screens', domain: 'stimulants',
      prompt: 'When is your last caffeine of the day?',
      options: opts(['Before midday', 'Early afternoon', 'Late afternoon', 'Evening', 'Right up to bedtime'], [0, 1, 2, 3, 4]) }),
  Q({ kind: 'q', id: 20, section: 'Caffeine, alcohol & screens', domain: 'stimulants',
      prompt: 'How often do you drink alcohol in the evening?',
      options: opts(['Never', 'Once or twice a month', 'Once or twice a week', 'Most evenings', 'Daily'], [0, 1, 2, 3, 4]) }),
  Q({ kind: 'q', id: 21, section: 'Caffeine, alcohol & screens', domain: 'stimulants',
      prompt: 'How close to sleep are you on a screen?',
      options: opts(['An hour or more before', 'About half an hour', 'Until I get into bed', 'In bed for a while', 'Until my eyes close'], [0, 1, 2, 3, 4]) }),

  // --- Daytime ---
  Q({ kind: 'q', id: 22, section: 'How your days feel', domain: 'daytime',
      prompt: 'How refreshed do you feel on waking?',
      options: opts(['Refreshed', 'Reasonably', 'Not really', 'Rarely', 'Never'], [0, 1, 2, 3, 4]) }),
  Q({ kind: 'q', id: 23, section: 'How your days feel', domain: 'daytime',
      prompt: 'How often do you fight sleepiness during the day?',
      options: opts(['Rarely', 'Once a week', 'A few days a week', 'Most days', 'All day, every day'], [0, 1, 2, 3, 4]) }),
  Q({ kind: 'q', id: 24, section: 'How your days feel', domain: 'daytime',
      prompt: 'Have you nodded off unintentionally — on a sofa, a train, at a desk?',
      options: opts(['Never', 'Very rarely', 'Once a month', 'Weekly', 'Often'], [0, 1, 2, 3, 4]) }),
  Q({ kind: 'q', id: 25, section: 'How your days feel', domain: 'daytime',
      prompt: 'How is your mood and patience on a short night?',
      options: opts(['Barely changes', 'Slightly shorter fuse', 'Noticeably worse', 'Bad enough that others notice', 'It shapes my whole day'], [0, 1, 2, 3, 4]) }),
];
