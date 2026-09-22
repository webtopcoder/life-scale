// Body IQ — the core Body scale. 24 questions across 7 domains, scored into a
// single headline number on the 100-mean / 15-SD scale, plus domain sub-scores.
// Weights are positive-good: higher weight = healthier answer.

import { Q, C, opts, type ScaleStep } from '@/data/scaleQuiz';

export type BodyDomain =
  | 'energy'
  | 'movement'
  | 'nutrition'
  | 'recovery'
  | 'resilience'
  | 'vitals'
  | 'load';

export const BODY_DOMAIN_LABEL: Record<BodyDomain, string> = {
  energy: 'Daily energy',
  movement: 'Movement & strength',
  nutrition: 'Food & hydration',
  recovery: 'Rest & recovery',
  resilience: 'Physical resilience',
  vitals: 'Numbers you know',
  load: 'Stress load',
};

export const BODY_DOMAIN_BLURB: Record<BodyDomain, string> = {
  energy: 'How much usable energy you actually have across a normal day.',
  movement: 'How often you move, how hard, and whether strength is in the mix.',
  nutrition: 'What you eat and drink most days, not on your best day.',
  recovery: 'Whether your body gets real recovery between demands.',
  resilience: 'How quickly your body bounces back from illness, effort, and travel.',
  vitals: 'The basic numbers you know about your own body.',
  load: 'How much physical strain sits on you before you even train.',
};

export const BODY_QUIZ_STEPS: ScaleStep[] = [
  // --- Section 1: About you (context) ---
  Q({ kind: 'q', id: 1, section: 'About you', domain: null,
      prompt: 'What is your age range?',
      options: opts(['Under 30', '30–39', '40–49', '50–59', '60+']) }),
  Q({ kind: 'q', id: 2, section: 'About you', domain: null,
      prompt: 'What made you take this today?',
      micro: 'This shapes the plan you get afterwards.',
      options: opts([
        'I want more energy day to day',
        'I want to get stronger or fitter',
        'I want to lose weight or change shape',
        'Something feels off and I want a baseline',
        'I want one number to track over time',
      ]) }),

  C({ kind: 'card', id: 'card-1', title: 'One number, seven areas',
      body: 'Body IQ works like an IQ score: 100 is the middle of the range. It is built from seven everyday areas, so you can see exactly which one is holding the number down.' }),

  // --- Section 2: Energy ---
  Q({ kind: 'q', id: 3, section: 'Energy', domain: 'energy',
      prompt: 'How do you feel in the first hour after waking?',
      options: opts(['Clear and ready', 'Fine after a few minutes', 'Slow for about an hour', 'Heavy most mornings', 'Wiped before the day starts'], [4, 3, 2, 1, 0]) }),
  Q({ kind: 'q', id: 4, section: 'Energy', domain: 'energy',
      prompt: 'What happens to your energy in the afternoon?',
      options: opts(['Holds steady', 'Small dip, passes quickly', 'Real dip I work through', 'I need caffeine or sugar to continue', 'I lose the afternoon most days'], [4, 3, 2, 1, 0]) }),
  Q({ kind: 'q', id: 5, section: 'Energy', domain: 'energy',
      prompt: 'By the evening, how much is left in the tank?',
      options: opts(['Enough for what I want to do', 'Enough for something small', 'Only enough for the sofa', 'Nothing, most nights', 'I am running on empty and still going'], [4, 3, 2, 1, 0]) }),

  // --- Section 3: Movement ---
  Q({ kind: 'q', id: 6, section: 'Movement', domain: 'movement',
      prompt: 'In a normal week, how many days do you move on purpose for 20 minutes or more?',
      options: opts(['5 or more', '3–4', '1–2', 'Less than one', 'None'], [4, 3, 2, 1, 0]) }),
  Q({ kind: 'q', id: 7, section: 'Movement', domain: 'movement',
      prompt: 'Do you do anything that loads your muscles — weights, resistance, hard hills, carrying?',
      options: opts(['Twice a week or more', 'About once a week', 'Occasionally', 'Almost never', 'Never'], [4, 3, 2, 1, 0]) }),
  Q({ kind: 'q', id: 8, section: 'Movement', domain: 'movement',
      prompt: 'How does a flight of stairs feel at normal pace?',
      options: opts(['Easy, no change in breathing', 'Slightly out of breath at the top', 'Noticeably out of breath', 'I pause partway', 'I avoid stairs when I can'], [4, 3, 2, 1, 0]) }),
  Q({ kind: 'q', id: 9, section: 'Movement', domain: 'movement',
      prompt: 'How many hours a day are you sitting?',
      options: opts(['Under 4', '4–6', '6–8', '8–10', 'More than 10'], [4, 3, 2, 1, 0]) }),

  C({ kind: 'card', id: 'card-2', title: 'Movement is the loudest lever',
      body: 'Of the seven areas, movement and recovery move a Body IQ score faster than anything else. Keep going — the next questions cover what you eat and how you recover.' }),

  // --- Section 4: Food & hydration ---
  Q({ kind: 'q', id: 10, section: 'Food & hydration', domain: 'nutrition',
      prompt: 'How many of your meals are cooked from mostly whole ingredients?',
      options: opts(['Nearly all', 'Most', 'About half', 'A few', 'Almost none'], [4, 3, 2, 1, 0]) }),
  Q({ kind: 'q', id: 11, section: 'Food & hydration', domain: 'nutrition',
      prompt: 'How often do you eat vegetables or fruit?',
      options: opts(['Every meal', 'Most meals', 'Once a day', 'A few times a week', 'Rarely'], [4, 3, 2, 1, 0]) }),
  Q({ kind: 'q', id: 12, section: 'Food & hydration', domain: 'nutrition',
      prompt: 'How much water do you drink on a normal day?',
      options: opts(['Plenty, I rarely feel thirsty', 'Usually enough', 'Some, but I notice thirst', 'Not much', 'Almost none — mostly other drinks'], [4, 3, 2, 1, 0]) }),
  Q({ kind: 'q', id: 13, section: 'Food & hydration', domain: 'nutrition',
      prompt: 'How often do you eat past the point of feeling full, or eat because of stress?',
      options: opts(['Rarely', 'Occasionally', 'Once or twice a week', 'Most days', 'Every day'], [4, 3, 2, 1, 0]) }),

  // --- Section 5: Rest & recovery ---
  Q({ kind: 'q', id: 14, section: 'Rest & recovery', domain: 'recovery',
      prompt: 'How many hours of sleep do you usually get?',
      options: opts(['7–8', 'About 7', '6–7', '5–6', 'Under 5'], [4, 3, 2, 1, 0]) }),
  Q({ kind: 'q', id: 15, section: 'Rest & recovery', domain: 'recovery',
      prompt: 'How sore or stiff do you feel a day after normal effort?',
      options: opts(['Barely anything', 'Mild, clears quickly', 'Noticeable for a day', 'Two days or more', 'I stay sore most of the time'], [4, 3, 2, 1, 0]) }),
  Q({ kind: 'q', id: 16, section: 'Rest & recovery', domain: 'recovery',
      prompt: 'Do you have any real downtime in a week — hours with nothing demanded of you?',
      options: opts(['Several stretches', 'One decent stretch', 'An hour here and there', 'Almost none', 'None at all'], [4, 3, 2, 1, 0]) }),

  // --- Section 6: Resilience ---
  Q({ kind: 'q', id: 17, section: 'Resilience', domain: 'resilience',
      prompt: 'How often do you pick up colds or minor infections?',
      options: opts(['Almost never', 'Once or twice a year', 'Three or four times a year', 'Every couple of months', 'Constantly'], [4, 3, 2, 1, 0]) }),
  Q({ kind: 'q', id: 18, section: 'Resilience', domain: 'resilience',
      prompt: 'When you push harder than usual, how long does it take to feel normal again?',
      options: opts(['Same day', 'Next morning', 'A couple of days', 'Most of a week', 'I avoid pushing because of it'], [4, 3, 2, 1, 0]) }),
  Q({ kind: 'q', id: 19, section: 'Resilience', domain: 'resilience',
      prompt: 'Do you carry any ongoing aches that shape what you do?',
      options: opts(['None', 'One, and it is manageable', 'One that limits me', 'Two or more', 'Pain decides my day'], [4, 3, 2, 1, 0]) }),

  // --- Section 7: Numbers you know ---
  Q({ kind: 'q', id: 20, section: 'Your numbers', domain: 'vitals',
      prompt: 'Do you know your blood pressure?',
      options: opts(['Yes, and it is in range', 'Yes, and it is borderline', 'Yes, and it is high', 'I knew it once', 'No idea'], [4, 3, 1, 2, 0]) }),
  Q({ kind: 'q', id: 21, section: 'Your numbers', domain: 'vitals',
      prompt: 'When did you last have basic bloods done — sugar, cholesterol, iron?',
      options: opts(['Within a year', 'One to two years', 'Two to five years', 'Longer than that', 'Never'], [4, 3, 2, 1, 0]) }),
  Q({ kind: 'q', id: 22, section: 'Your numbers', domain: 'vitals',
      prompt: 'How would you describe your weight over the last two years?',
      options: opts(['Stable and comfortable', 'Stable but not where I want it', 'Slowly rising', 'Rising quickly', 'Up and down repeatedly'], [4, 3, 2, 1, 1]) }),

  // --- Section 8: Load ---
  Q({ kind: 'q', id: 23, section: 'Load', domain: 'load',
      prompt: 'How much physical strain does a normal day put on you before any exercise?',
      options: opts(['Very little', 'Some, manageable', 'A fair amount', 'A lot', 'My day already exhausts my body'], [4, 3, 2, 1, 0]) }),
  Q({ kind: 'q', id: 24, section: 'Load', domain: 'load',
      prompt: 'How often does stress show up in your body — jaw, gut, shoulders, chest?',
      options: opts(['Rarely', 'Occasionally', 'Weekly', 'Most days', 'All the time'], [4, 3, 2, 1, 0]) }),
];
