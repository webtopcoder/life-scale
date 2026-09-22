import { QUIZ_STEPS, type QuizStep } from './brainHealthQuiz';

export type SectionKey = 'opening' | 'memory' | 'vascular' | 'movement' | 'mood';

export interface QuizInterrupt {
  kind: 'interrupt';
  id: string;
  headline: string;
  subline: string;
  durationMs: number;
}

export interface QuizReinforcement {
  kind: 'reinforcement';
  id: string;
  sectionKey: SectionKey;
}

export type QuizStepV2 = QuizStep | QuizInterrupt | QuizReinforcement;

const REINFORCEMENT_FOR_CARD: Record<string, SectionKey> = {
  'card-after-3': 'opening',
  'card-after-8': 'memory',
  'card-after-13': 'vascular',
  'card-after-28': 'mood',
};

export interface ReinforcementLine { headline: string; body: string; }
export interface ReinforcementConfig {
  label: string;
  headline: string;
  questionIds: number[];
  lines: Record<number, Record<number, ReinforcementLine>>;
  neutral: ReinforcementLine;
}

export const SECTION_REINFORCEMENTS: Record<SectionKey, ReinforcementConfig> = {
  opening: {
    label: 'Welcome',
    headline: 'A few questions in — here’s where we’re going.',
    questionIds: [],
    lines: {},
    neutral: {
      headline: 'A few questions in — here’s where we’re going.',
      body: 'Next we look at the patterns most tied to long-term brain wellbeing, and which ones you can shift.',
    },
  },
  memory: {
    label: 'Memory & focus',
    headline: 'Memory shifts are worth a closer look.',
    questionIds: [4, 5, 6, 7, 8],
    lines: {
      4: {
        1: { headline: 'You said slips happen sometimes.',
             body: 'A few slips are normal. What matters is the pattern over time, not any one moment.' },
        2: { headline: 'You’re noticing more slips than before.',
             body: 'A rising trend is one of the first patterns to look at, and most causes can be improved.' },
        3: { headline: 'You said memory slips are on your mind.',
             body: 'The fact that you notice is a good signal. Most causes respond well to small changes.' },
      },
      5: {
        0: { headline: 'Word-finding moments stood out for you.',
             body: 'These usually trace back to sleep, stress, or focus — not memory itself.' },
        1: { headline: 'You mentioned forgetting names lately.',
             body: 'One of the most common slips. It usually reflects attention, not memory.' },
        2: { headline: 'You said you misplace things often.',
             body: 'Misplacing things is almost always about attention. We’ll look at why.' },
        3: { headline: 'You said you lose the thread mid-sentence.',
             body: 'That usually points to sleep or stress, not memory.' },
      },
      6: {
        1: { headline: 'Someone close to you has noticed too.',
             body: 'When the people around you start to notice, it’s worth a closer look.' },
        2: { headline: 'People close to you have mentioned it a few times.',
             body: 'When others notice more than once, it can also be a good idea to bring it up with your doctor.' },
        3: { headline: 'Others are noticing changes regularly.',
             body: 'When it comes up regularly, mentioning it to your doctor is a good next step.' },
      },
      7: {
        1: { headline: 'You had one moment with a clear reason.',
             body: 'One-off moments with a clear cause are usually fine.' },
        2: { headline: 'You said you sometimes feel turned around in familiar places.',
             body: 'This is one to keep an eye on, and worth chatting with your doctor about.' },
        3: { headline: 'Feeling turned around in places you know is happening.',
             body: 'This is one to bring up with your doctor.' },
      },
      8: {
        1: { headline: 'Daily tasks feel slightly harder for you.',
             body: 'Small changes here matter. They often respond well to focused habit shifts.' },
        2: { headline: 'You said daily tasks are noticeably harder.',
             body: 'Changes in daily function are a strong signal to act on early.' },
        3: { headline: 'You lean on others for some daily tasks now.',
             body: 'This is one to bring up with your doctor sooner rather than later.' },
      },
    },
    neutral: {
      headline: 'Your memory answers look steady so far.',
      body: 'We’ll still fold them into your full brain wellbeing profile.',
    },
  },
  vascular: {
    label: 'Heart & body',
    headline: 'Heart numbers shape brain numbers.',
    questionIds: [9, 10, 11, 12, 13],
    lines: {
      9: {
        1: { headline: 'Your blood pressure sits on the upper side sometimes.',
             body: 'This range is worth watching. Tracking it for a few weeks gives a much clearer picture.' },
        2: { headline: 'Your blood pressure runs high often.',
             body: 'Higher blood pressure is one of the biggest levers for long-term brain wellbeing.' },
        3: { headline: 'You don’t track your blood pressure yet.',
             body: 'Not tracking it is common, and easy to fix. A 7-day log is a great first step.' },
      },
      10: {
        1: { headline: 'Your blood pressure has been borderline.',
             body: 'Borderline numbers add up over years. Catching them early is one of the biggest wins.' },
        2: { headline: 'Your blood pressure is steady now.',
             body: 'Staying in range is great for the brain. Your plan will help you keep it there.' },
        3: { headline: 'Your blood pressure is a work in progress.',
             body: 'Getting this steady is one of the most impactful things you can do for your brain.' },
        4: { headline: 'You’re not sure where your blood pressure stands.',
             body: 'A quick check this month is one of the simplest, highest-value steps you can take.' },
      },
      11: {
        1: { headline: 'Your cholesterol is a little higher than ideal.',
             body: 'Small daily changes here add up. It’s one of the easier levers to move.' },
        2: { headline: 'Your cholesterol is on the higher side.',
             body: 'Worth addressing. Simple food and movement shifts do a lot here.' },
        3: { headline: 'You haven’t checked in a while.',
             body: 'A basic check is quick, and it tells us a lot about long-term brain wellbeing.' },
      },
      12: {
        1: { headline: 'Your blood sugar has been a little elevated.',
             body: 'This is very reversible, and getting it steady is one of the best things for the brain.' },
        2: { headline: 'You’re managing blood sugar with routines.',
             body: 'Staying steady protects the brain over time. Your plan helps you keep it that way.' },
        3: { headline: 'Blood sugar is still a work in progress.',
             body: 'Bringing it steady is one of the biggest brain wellbeing wins available to you.' },
      },
      13: {
        1: { headline: 'You said you carry a little extra weight.',
             body: 'Small, steady changes here lower long-term risk more than most people expect.' },
        2: { headline: 'You’re carrying more weight than you’d like.',
             body: 'This is one of the more changeable areas, and one of the highest-impact.' },
      },
    },
    neutral: {
      headline: 'Your heart and body answers look steady.',
      body: 'We’ll still fold them into your full brain wellbeing profile.',
    },
  },
  movement: {
    label: 'Movement',
    headline: 'Movement is one of the biggest brain levers.',
    questionIds: [18, 19, 20],
    lines: {
      18: {
        1: { headline: 'You move 3 to 4 days a week.',
             body: 'You’re already in a good zone. A small bump to 5 days makes a real difference.' },
        2: { headline: 'You move only 1 to 2 days a week.',
             body: 'Adding even one more day of movement is one of the strongest gains available.' },
        3: { headline: 'You said you rarely move during the week.',
             body: 'Low activity is one of the patterns tied to brain aging. Small starts add up fast.' },
      },
      19: {
        1: { headline: 'You sit 4 to 6 hours on a typical day.',
             body: 'Breaking up long sits with short walks helps the brain almost as much as planned workouts.' },
        2: { headline: 'You sit 7 to 9 hours on a typical day.',
             body: 'Long sitting is a quiet drag on brain wellbeing. Short breaks every hour help a lot.' },
        3: { headline: 'You sit 10+ hours on a typical day.',
             body: 'A lot of sitting is one of the patterns we flag. It’s also one of the easiest to chip away at.' },
      },
      20: {
        1: { headline: 'Aches or balance slightly limit your movement.',
             body: 'Working around them early keeps the door open for movement that protects the brain.' },
        2: { headline: 'Aches or balance often limit your movement.',
             body: 'This matters — both for brain wellbeing and for feeling steady long term.' },
        3: { headline: 'Aches or balance really limit your movement.',
             body: 'We’ll build a plan that meets you where you are, not where a textbook says you should be.' },
      },
    },
    neutral: {
      headline: 'Your movement answers look steady.',
      body: 'We’ll still fold them into your full brain wellbeing profile.',
    },
  },
  mood: {
    label: 'Mood & connection',
    headline: 'Mood and connection quietly shape the brain.',
    questionIds: [25, 26, 27, 28],
    lines: {
      25: {
        1: { headline: 'You’ve felt a bit low a few days lately.',
             body: 'Low mood tugs on focus and memory. It’s one of the most changeable patterns.' },
        2: { headline: 'You’ve felt low more than half the days.',
             body: 'Worth taking seriously — both for how you feel and for long-term brain wellbeing.' },
        3: { headline: 'You’ve felt low almost every day.',
             body: 'Please consider talking with your doctor. It’s very supportable, and it matters for the brain.' },
      },
      26: {
        1: { headline: 'Your stress level is moderate.',
             body: 'Moderate stress is normal. The goal is keeping it from becoming the default setting.' },
        2: { headline: 'Your stress level is high.',
             body: 'High stress over time is one of the patterns we flag for brain wellbeing.' },
        3: { headline: 'Stress feels hard to shake right now.',
             body: 'This is one to address early — both for how you feel and for long-term focus.' },
      },
      27: {
        1: { headline: 'You connect with people a few times a week.',
             body: 'Connection is brain food. Even a small bump in frequency helps.' },
        2: { headline: 'You rarely have meaningful conversations.',
             body: 'Feeling disconnected is one of the patterns tied to brain aging.' },
        3: { headline: 'You almost never have meaningful conversations.',
             body: 'It’s one of the most-studied brain wellbeing patterns, and one of the most changeable.' },
      },
      28: {
        1: { headline: 'You challenge your brain a few times a week.',
             body: 'You’re building reserve. A small step up compounds over years.' },
        2: { headline: 'You rarely challenge your brain with something new.',
             body: 'Mental challenge is one of the best long-term supports we know of.' },
        3: { headline: 'You almost never challenge your brain with something new.',
             body: 'Starting small here pays off for years. We’ll give you a simple way in.' },
      },
    },
    neutral: {
      headline: 'Your mood and connection answers look steady.',
      body: 'We’ll still fold them into your full brain wellbeing profile.',
    },
  },
};

const INTERRUPT_AFTER_Q20: QuizInterrupt = {
  kind: 'interrupt',
  id: 'interrupt-q20',
  headline: 'of your answers point to areas worth focusing on.',
  subline: 'Keep going — your full check-in is still being built.',
  durationMs: 2500,
};

export const OPENING_LINES: {
  family: Record<number, ReinforcementLine>;
  intent: Record<number, ReinforcementLine>;
} = {
  family: {
    1: {
      headline: 'A parent with memory trouble is a real signal, not a verdict.',
      body: 'Family history is only part of the picture. The rest is patterns this check-in is built to surface.',
    },
    2: {
      headline: 'A grandparent with memory trouble shifts the odds, not the outcome.',
      body: 'Most of the picture sits outside genetics. We’ll focus on the parts you can actually move.',
    },
    3: {
      headline: 'More than one relative is worth taking seriously.',
      body: 'It also means the changeable side matters more for you, not less. That’s what we map next.',
    },
  },
  intent: {
    0: {
      headline: 'Wanting to look after your memory is a great reason to be here.',
      body: 'We’ll show you which areas move the needle most, and where to start.',
    },
    1: {
      headline: 'Small memory or focus changes are usually about something else.',
      body: 'Sleep, stress, hearing, and blood pressure mimic memory changes every day. We’ll check those first.',
    },
    2: {
      headline: 'Family history is one piece, not the whole picture.',
      body: 'Most of what shapes brain wellbeing sits outside genes. The next few minutes map the changeable parts.',
    },
    3: {
      headline: 'You’re doing the highest-leverage version of this.',
      body: 'Acting before anything shifts is where the biggest gains are. We’ll show you where to start.',
    },
    4: {
      headline: 'Curiosity is a perfectly good reason to be here.',
      body: 'You’ll leave with a clearer picture of which brain wellbeing areas matter most for you.',
    },
  },
};

function transformSteps(steps: QuizStep[]): QuizStepV2[] {
  const out: QuizStepV2[] = [];
  for (const s of steps) {
    if (s.kind === 'card' && REINFORCEMENT_FOR_CARD[s.id]) {
      out.push({
        kind: 'reinforcement',
        id: s.id,
        sectionKey: REINFORCEMENT_FOR_CARD[s.id],
      });
    } else {
      out.push(s);
    }
    if (s.kind === 'q' && s.id === 20) out.push(INTERRUPT_AFTER_Q20);
  }
  return out;
}

export const QUIZ_STEPS_V2: QuizStepV2[] = transformSteps(QUIZ_STEPS);
export const QUIZ_QUESTION_COUNT_V2 = QUIZ_STEPS_V2.filter((s) => s.kind === 'q').length;
export { DOMAIN_LABEL, DOMAIN_BLURB } from './brainHealthQuiz';
export type { Domain, QuizQuestion, QuizCard, QuizStep } from './brainHealthQuiz';
