// Hidden Athlete report copy. ~1,470 words. No score, no ranking.
// Non-literal conclusions synthesised from the three directional axes.

import type { ReportSection } from '@/components/scale/ScaleReportShell';
import { ATHLETE_AXIS_LABEL, type AthleteAxis } from '@/data/hiddenAthleteQuiz';
import type { HiddenAthleteResult } from '@/engine/bodyScoring';

const AXES: AthleteAxis[] = ['endurance', 'volume', 'structure'];

const AXIS_READ: Record<AthleteAxis, { high: string; low: string }> = {
  endurance: {
    high: 'You are built to keep going. Effort that stretches out suits you, and you tend to be strongest in the part of a session where other people start negotiating with themselves.',
    low: 'You are built for concentrated output. Short and forceful suits you; long and even feels like a punishment you agreed to for no reason.',
  },
  volume: {
    high: 'You tolerate accumulation well. Turning up often, at a manageable size, does more for you than any single heroic session.',
    low: 'You get more from fewer, sharper sessions. Piling up volume dulls you rather than building you, and the fatigue arrives before the fitness does.',
  },
  structure: {
    high: 'You work better inside a plan. Edges — defined work, defined rest, a defined end — are not a constraint on you; they are what lets you go hard without overreaching.',
    low: 'You work better on instinct. A rigid plan turns training into admin for you, and adherence collapses long before capacity does.',
  },
};

const AXIS_COST: Record<AthleteAxis, { high: string; low: string }> = {
  endurance: {
    high: 'The cost is top end. You can hold a pace for a very long time and then find you have nothing above it, because nothing ever asked you for it.',
    low: 'The cost is durability. You have output and no base underneath it, so the third hard session of a week arrives on empty.',
  },
  volume: {
    high: 'The cost is that you rarely stop. High tolerance means the warning signs are quiet, and you find the ceiling by hitting it rather than by seeing it.',
    low: 'The cost is consistency. Sharp weeks and blank weeks average out to less than a modest, unbroken month would have produced.',
  },
  structure: {
    high: 'The cost is rigidity. A missed session reads as a broken plan, and one broken week can end a block that was otherwise working.',
    low: 'The cost is drift. Without edges, hard days get softer and easy days get harder until every session is the same medium effort.',
  },
};

export function buildAthleteReport(r: HiddenAthleteResult): {
  headline: string;
  subhead: string;
  sections: ReportSection[];
} {
  const a = r.archetype;
  const n = r.normalized;
  const dominant = [...AXES].sort((x, y) => Math.abs(n[y]) - Math.abs(n[x]))[0];
  const closest = [...AXES].sort((x, y) => Math.abs(n[x]) - Math.abs(n[y]))[0];

  const read = (axis: AthleteAxis) => (n[axis] >= 0 ? AXIS_READ[axis].high : AXIS_READ[axis].low);
  const cost = (axis: AthleteAxis) => (n[axis] >= 0 ? AXIS_COST[axis].high : AXIS_COST[axis].low);

  const sections: ReportSection[] = [
    {
      heading: `Why you came out as ${a.name}`,
      paragraphs: [
        'This is not a fitness result and it does not rank you against anybody. It reads three things about how your body prefers to work: whether you lean toward lasting or toward output, whether you thrive on accumulation or on sharpness, and whether you need a plan or need room. Those three, together, describe eight recognisable ways of training — and yours is not a matter of preference. It is closer to a constraint you can either work with or fight.',
        a.summary,
      ],
      addonKey: 'addon_athlete_archetype_deep_dive',
      addonTeaser: 'Your archetype at full length, with the secondary pattern sitting underneath it.',
    },
    {
      heading: 'Your three dials, read one at a time',
      paragraphs: [
        'Each of these is a direction, not a grade. Neither end is better; each end is good at something different and blind to something specific.',
        read('endurance'),
        read('volume'),
        read('structure'),
      ],
      callout: {
        label: 'Your strongest signal',
        text: `${ATHLETE_AXIS_LABEL[dominant][n[dominant] >= 0 ? 1 : 0]} came through most clearly. When you have to choose, choose in that direction — it is where your body cooperates instead of resisting.`,
      },
    },
    {
      heading: 'What this combination is genuinely good at',
      paragraphs: [
        `Taken together, these three dials explain something you have probably noticed without having language for: certain training feels like it works for you while other training feels like effort spent for nothing. That is not motivation. It is the difference between a session that matches your wiring and one that fights it.`,
        `${a.name} gets results from a specific set of conditions, and they are not complicated. What matters is that you stop treating them as a preference you should grow out of and start treating them as the design specification for your training.`,
      ],
      bullets: a.trainsBestWith,
    },
    {
      heading: 'What the same wiring costs you',
      paragraphs: [
        'Every profile pays for its strengths, and the payment is always in the same place: the thing your wiring makes you least likely to do. This is the part of the report worth re-reading in three months, because it will describe exactly how the plan fell apart if it does.',
        cost(dominant),
        cost(closest === dominant ? 'volume' : closest),
      ],
      bullets: a.breaksDownWhen,
      addonKey: 'addon_athlete_training_blueprint',
      addonTeaser: 'A week-by-week training shape written for your archetype rather than a generic one.',
    },
    {
      heading: 'Your secondary pattern',
      paragraphs: [
        `Your ${ATHLETE_AXIS_LABEL[closest][0].toLowerCase()}–${ATHLETE_AXIS_LABEL[closest][1].toLowerCase()} dial sat close to the middle, which means you are not locked to one side of it. In practice that gives you access to a second way of working: ${r.secondary.name}. ${r.secondary.summary}`,
        'A near-centre dial is an advantage rather than an ambiguity. It means you can borrow from the other side deliberately — using it when circumstances demand and returning to your default when they do not. The people who plateau are usually the ones with no second gear at all.',
      ],
    },
    {
      heading: 'How to build a week around this',
      paragraphs: [
        'The point of knowing your archetype is not identity — it is dosing. Two people with identical goals need differently shaped weeks, and most training plans fail not because they were wrong but because they were shaped for somebody else. Yours should feel slightly under-ambitious on paper and highly repeatable in practice.',
        'Hold one hard rule regardless of type: one session a week should be genuinely easy, and it should stay easy even when you feel good. Every archetype has its own reason for breaking this rule, and every archetype pays the same price for it.',
      ],
      bullets: [
        n.endurance >= 0
          ? 'Keep one session a week that asks for output, not duration — otherwise your top end disappears.'
          : 'Keep one easy aerobic session a week — it is the base the rest of your output sits on.',
        n.volume >= 0
          ? 'Cap your weekly total in advance. Your tolerance will let you overshoot before you notice.'
          : 'Set a weekly floor, not a target. Consistency is your limiting factor, not effort.',
        n.structure >= 0
          ? 'Write the block down and finish it. Judge it at the end, not in week two.'
          : 'Keep a short menu of sessions and choose on the day. Structure the menu, not the calendar.',
      ],
    },
    {
      heading: 'The next ninety days',
      paragraphs: [
        'Your dashboard turns this into a three-phase arc. Foundations establishes the sessions your type will actually repeat, at a size that survives a bad week. Build adds load and precision once the habit is genuinely automatic rather than merely intended. Mastery holds the standard and stress-tests it, including through the weeks that would have ended a previous attempt.',
        'One honest caveat. This profile reads how you work, not how fit you are, and it cannot see injury, illness, or anything a clinician would find. If something hurts in a way that changes how you move, that is a conversation with a professional rather than a problem to train through — and no archetype changes that.',
      ],
    },
  ];

  return {
    headline: `You are ${a.name}.`,
    subhead: `${a.tagline}. Secondary pattern: ${r.secondary.name}.`,
    sections,
  };
}
