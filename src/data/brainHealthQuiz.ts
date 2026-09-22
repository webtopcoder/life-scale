// Brain Health Check-in — 30 self-report questions across 8 sections, scored
// into 7 domains. Copy is intentionally friendly and non-clinical. This is a
// wellbeing check-in, not a diagnostic form.

export type Domain =
  | 'cognitive'
  | 'vascular'
  | 'sleep'
  | 'movement'
  | 'sensory'
  | 'mood'
  | 'reserve';

export const DOMAIN_LABEL: Record<Domain, string> = {
  cognitive: 'Memory & focus',
  vascular: 'Heart & body',
  sleep: 'Sleep & recovery',
  movement: 'Movement',
  sensory: 'Hearing & vision',
  mood: 'Mood & connection',
  reserve: 'Mental challenge',
};

export const DOMAIN_BLURB: Record<Domain, string> = {
  cognitive:
    'Memory, focus, and how the small daily stuff feels day to day.',
  vascular:
    'Blood pressure, cholesterol, blood sugar and weight all shape long-term brain wellbeing.',
  sleep:
    'Short or restless sleep quietly changes how clear you feel.',
  movement:
    'Movement and time on your feet are two of the biggest levers for a healthy brain.',
  sensory:
    'Hearing and vision changes are easy to overlook and easy to support.',
  mood:
    'Mood, stress, and connection shape attention and everyday clarity.',
  reserve:
    'Learning and mental challenge keep the brain flexible over time.',
};

export interface QuizQuestion {
  kind: 'q';
  id: number;
  section: string;
  prompt: string;
  micro?: string;
  domain: Domain | null;
  options: string[];
  weights?: number[];
}

export interface QuizCard {
  kind: 'card';
  id: string;
  title: string;
  body: string;
}

export type QuizStep = QuizQuestion | QuizCard;

const Q = (q: QuizQuestion): QuizQuestion => q;
const C = (c: QuizCard): QuizCard => c;

export const QUIZ_STEPS: QuizStep[] = [
  // Section 1 — About you (context only)
  Q({ kind: 'q', id: 1, section: 'About you', domain: null,
      prompt: 'What is your age range?',
      options: ['Under 40', '40–49', '50–59', '60–69', '70+'] }),
  Q({ kind: 'q', id: 2, section: 'About you', domain: null,
      prompt: 'Has anyone in your family had memory trouble as they got older?',
      options: ['No', 'Yes, a parent', 'Yes, a grandparent', 'Yes, more than one relative', 'I’m not sure'] }),
  Q({ kind: 'q', id: 3, section: 'About you', domain: null,
      prompt: 'What made you click today?',
      options: [
        'I want to look after my long-term memory',
        'I’ve noticed small changes in focus or memory',
        'Memory trouble runs in the family',
        'I want a simple plan for my brain',
        'I’m just curious',
      ] }),

  C({ kind: 'card', id: 'card-after-3',
      title: 'Memory is only one piece of the picture.',
      body: 'How you sleep, move, and feel each day shapes how sharp your brain feels tomorrow.' }),

  // Section 2 — Memory & focus
  Q({ kind: 'q', id: 4, section: 'Memory & focus', domain: 'cognitive',
      prompt: 'In the past year, have you noticed more small memory slips than before?',
      options: ['No, not really', 'Occasionally', 'Yes, more often than before', 'Yes, and I think about it'],
      weights: [0, 1, 2, 3] }),
  Q({ kind: 'q', id: 5, section: 'Memory & focus', domain: 'cognitive',
      prompt: 'Which of these happens most often?',
      options: ['Forgetting names', 'Walking into a room and forgetting why', 'Misplacing my phone or keys', 'Losing my train of thought', 'None of these'],
      weights: [2, 2, 2, 2, 0] }),
  Q({ kind: 'q', id: 6, section: 'Memory & focus', domain: 'cognitive',
      prompt: 'Do people close to you say your thinking has changed?',
      options: ['No', 'Once or twice', 'A few times', 'Yes, regularly'],
      weights: [0, 1, 3, 3] }),
  Q({ kind: 'q', id: 7, section: 'Memory & focus', domain: 'cognitive',
      prompt: 'Have you ever felt turned around in a place you know well?',
      options: ['No', 'Once, with a clear reason', 'A few times', 'Yes, and it stuck with me'],
      weights: [0, 1, 3, 3] }),
  Q({ kind: 'q', id: 8, section: 'Memory & focus', domain: 'cognitive',
      prompt: 'Are everyday tasks feeling harder than they used to?',
      options: ['No', 'A little', 'Noticeably', 'Yes, and I lean on others more'],
      weights: [0, 1, 3, 3] }),

  C({ kind: 'card', id: 'card-after-8',
      title: 'Heart and brain move together.',
      body: 'Blood pressure, cholesterol, blood sugar, and weight are some of the most trackable pieces of long-term brain wellbeing.' }),

  // Section 3 — Heart & body
  Q({ kind: 'q', id: 9, section: 'Heart & body', domain: 'vascular',
      prompt: 'How would you describe your blood pressure lately?',
      micro: 'Not sure is fine too — your plan can start with a simple 7-day log.',
      options: ['Usually on the low or normal side', 'Sometimes on the higher side', 'Often on the higher side', 'I don’t really track it'],
      weights: [0, 1, 3, 2] }),
  Q({ kind: 'q', id: 10, section: 'Heart & body', domain: 'vascular',
      prompt: 'Has a doctor ever mentioned high blood pressure to you?',
      options: ['No', 'They said it was borderline', 'Yes, and it’s steady now', 'Yes, and it’s still a work in progress', 'I’m not sure'],
      weights: [0, 2, 1, 3, 2] }),
  Q({ kind: 'q', id: 11, section: 'Heart & body', domain: 'vascular',
      prompt: 'How’s your cholesterol been lately?',
      options: ['In a good range', 'A little higher than ideal', 'On the high side', 'I haven’t checked in a while'],
      weights: [0, 2, 3, 2] }),
  Q({ kind: 'q', id: 12, section: 'Heart & body', domain: 'vascular',
      prompt: 'How’s your blood sugar been?',
      options: ['In a healthy range', 'A little elevated', 'Managed with routines', 'Still a work in progress', 'I’m not sure'],
      weights: [0, 2, 1, 3, 1] }),
  Q({ kind: 'q', id: 13, section: 'Heart & body', domain: 'vascular',
      prompt: 'How do you feel about your weight and shape lately?',
      options: ['Happy where I am', 'Carrying a little extra', 'Carrying quite a bit more than I’d like', 'I’m not sure', 'Prefer not to say'],
      weights: [0, 1, 3, 1, 1] }),

  C({ kind: 'card', id: 'card-after-13',
      title: 'Sleep changes how sharp tomorrow feels.',
      body: 'Your check-in will show whether sleep and recovery are the areas to focus on first.' }),

  // Section 4 — Sleep & recovery
  Q({ kind: 'q', id: 14, section: 'Sleep & recovery', domain: 'sleep',
      prompt: 'How many hours do you usually sleep?',
      micro: 'Rough sleep can make memory feel worse even when memory isn’t really the issue.',
      options: ['7–9 hours', '5–7 hours', 'Less than 5 hours', 'More than 9 hours'],
      weights: [0, 1, 3, 2] }),
  Q({ kind: 'q', id: 15, section: 'Sleep & recovery', domain: 'sleep',
      prompt: 'How often do you wake up feeling mentally clear?',
      options: ['Most days', 'About half the time', 'Rarely', 'Almost never'],
      weights: [0, 1, 2, 3] }),
  Q({ kind: 'q', id: 16, section: 'Sleep & recovery', domain: 'sleep',
      prompt: 'Have you (or a partner) noticed loud snoring or pauses in your breathing at night?',
      options: ['No', 'A little snoring sometimes', 'Loud snoring often', 'Yes, breathing pauses have come up', 'I’m not sure'],
      weights: [0, 1, 2, 3, 1] }),
  Q({ kind: 'q', id: 17, section: 'Sleep & recovery', domain: 'sleep',
      prompt: 'How often do you feel mentally foggy during the day?',
      options: ['Rarely', 'Sometimes', 'Often', 'Most days'],
      weights: [0, 1, 2, 3] }),

  // Section 5 — Movement
  Q({ kind: 'q', id: 18, section: 'Movement', domain: 'movement',
      prompt: 'How many days a week do you get at least 30 minutes of movement?',
      options: ['5+ days', '3–4 days', '1–2 days', 'Rarely'],
      weights: [0, 1, 2, 3] }),
  Q({ kind: 'q', id: 19, section: 'Movement', domain: 'movement',
      prompt: 'How much time do you spend sitting on a typical day?',
      options: ['Less than 4 hours', '4–6 hours', '7–9 hours', '10+ hours'],
      weights: [0, 1, 2, 3] }),
  Q({ kind: 'q', id: 20, section: 'Movement', domain: 'movement',
      prompt: 'Do aches, joints, or balance get in the way of moving?',
      options: ['No', 'A little', 'Often', 'A lot'],
      weights: [0, 1, 2, 3] }),

  // Section 6 — Hearing & vision
  Q({ kind: 'q', id: 21, section: 'Hearing & vision', domain: 'sensory',
      prompt: 'Do you struggle to follow conversations in noisy places?',
      micro: 'Hearing is one of the most overlooked pieces of brain wellbeing.',
      options: ['No', 'Sometimes', 'Often', 'I skip noisy places because of it'],
      weights: [0, 1, 2, 3] }),
  Q({ kind: 'q', id: 22, section: 'Hearing & vision', domain: 'sensory',
      prompt: 'Do you often ask people to repeat themselves, or turn up the volume?',
      options: ['No', 'Sometimes', 'Often', 'Regularly'],
      weights: [0, 1, 2, 3] }),
  Q({ kind: 'q', id: 23, section: 'Hearing & vision', domain: 'sensory',
      prompt: 'When was your hearing last checked?',
      options: ['Within 2 years', '2–5 years ago', 'More than 5 years ago', 'Never, or I don’t remember'],
      weights: [0, 1, 2, 3] }),
  Q({ kind: 'q', id: 24, section: 'Hearing & vision', domain: 'sensory',
      prompt: 'How’s your vision — does it feel fully corrected?',
      options: ['Yes, no issues', 'Mild issues that don’t bother me', 'Yes, and it gets in the way sometimes', 'I haven’t checked in a while'],
      weights: [0, 1, 3, 2] }),

  // Section 7 — Mood & connection
  Q({ kind: 'q', id: 25, section: 'Mood & connection', domain: 'mood',
      prompt: 'Over the past two weeks, how often have you felt low or lost interest in things you enjoy?',
      options: ['Rarely or not at all', 'A few days', 'More than half the days', 'Almost every day'],
      weights: [0, 1, 2, 3] }),
  Q({ kind: 'q', id: 26, section: 'Mood & connection', domain: 'mood',
      prompt: 'How would you describe your current stress level?',
      options: ['Low', 'Moderate', 'High', 'Very high, hard to shake'],
      weights: [0, 1, 2, 3] }),
  Q({ kind: 'q', id: 27, section: 'Mood & connection', domain: 'mood',
      prompt: 'How often do you have meaningful conversations with people you care about?',
      options: ['Daily or almost daily', 'A few times a week', 'Rarely', 'Almost never'],
      weights: [0, 1, 2, 3] }),
  Q({ kind: 'q', id: 28, section: 'Mood & connection', domain: 'reserve',
      prompt: 'How often do you challenge your brain with reading, puzzles, learning, or new skills?',
      options: ['Daily', 'A few times a week', 'Rarely', 'Almost never'],
      weights: [0, 1, 2, 3] }),

  C({ kind: 'card', id: 'card-after-28',
      title: 'We’re building your check-in across 7 areas.',
      body: 'Brain wellbeing is about more than memory. Next up, we pull it all together.' }),

  // Section 8 — Readiness (context only)
  Q({ kind: 'q', id: 29, section: 'Readiness', domain: null,
      prompt: 'What would be most useful for you right now?',
      options: [
        'Knowing my top 3 areas to focus on',
        'A clear 4-week plan',
        'Tracking sleep, movement, and heart health',
        'Small memory and focus practices',
        'Ideas of what to bring up with my doctor',
      ] }),
  Q({ kind: 'q', id: 30, section: 'Readiness', domain: null,
      prompt: 'How much time could you realistically spend on it each day?',
      options: ['5 minutes', '10 minutes', '15 minutes', '20+ minutes', 'I’m not sure yet'] }),
];

export const QUIZ_TOTAL = QUIZ_STEPS.length;
export const QUIZ_QUESTION_COUNT = QUIZ_STEPS.filter((s) => s.kind === 'q').length;
