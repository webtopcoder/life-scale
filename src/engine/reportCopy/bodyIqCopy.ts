// Body IQ report copy. ~1,470 words, plain language, no jargon.
// Never quotes a question or an option label — everything is expressed as a
// finding about the reader.

import type { ReportSection } from '@/components/scale/ScaleReportShell';
import { BODY_DOMAIN_LABEL, type BodyDomain } from '@/data/bodyIqQuiz';
import type { BodyIqResult } from '@/engine/bodyScoring';
import { disclaimer } from '@/content/legalCopy';

const BAND_HEADLINE: Record<BodyIqResult['band'], string> = {
  exceptional: 'Your body is running well ahead of the middle of the range.',
  strong: 'Your body is running above the middle of the range.',
  typical: 'Your body is sitting around the middle of the range.',
  below: 'Your body is sitting below the middle of the range.',
  low: 'Your body is under more strain than it should be carrying.',
};

const BAND_OPENING: Record<BodyIqResult['band'], string> = {
  exceptional:
    'A number this far above the middle is not luck. It comes from a set of habits that are already doing their job, mostly without you having to think about them. That is worth naming, because the risk for you is not decline through neglect — it is drift. Scores at this level usually fall slowly and invisibly, one skipped week at a time, and the person is the last to notice.',
  strong:
    'A number above the middle means the foundations are largely in place. You move, you eat reasonably, and your body recovers when you ask it to. What separates a score like yours from a much higher one is rarely effort — it is one specific area that has been quietly left out while everything else got attention.',
  typical:
    'The middle of the range is the most improvable place to be, and it is where most people sit. Nothing is broken; a few things are unmanaged. Bodies here respond quickly, because the gap between what you are doing and what would work is small enough to close without reorganising your life around it.',
  below:
    'A number below the middle is not a verdict on you, and it is not a health diagnosis. It says that several everyday systems are running with less support than they need, and that they are compounding each other. That compounding is also why change tends to arrive faster than people expect from here.',
  low: 'A low number almost always comes from the same place: a body that is being asked for output all day and given very little back. That is a load problem before it is a discipline problem. The route out is not a harder version of what you are already doing — it is putting something back in.',
};

const WEAK_DIAGNOSIS: Record<BodyDomain, string> = {
  energy:
    'Your energy is the area holding your number down. Energy is rarely the root problem — it is the readout. When it dips hard in the afternoon or arrives already low in the morning, it is usually reporting on sleep, on food timing, or on a body that has not moved enough to feel awake. Treat it as a signal to follow rather than a thing to fix directly, and it becomes far less mysterious.',
  movement:
    'Movement is the area holding your number down, and it is the one with the highest return. A body that is not asked to do anything difficult gradually loses the ability to do difficult things, and it does that quietly — you notice on stairs, or carrying something, long before you notice anywhere else. The good news is the dose required to reverse that is much smaller than most people assume.',
  nutrition:
    'Food and hydration are the area holding your number down. This is rarely about knowledge. Almost nobody who scores low here is confused about vegetables. It is about default meals — the ones that happen when nobody has decided anything — and about drinking water only once thirst has already arrived. Defaults are what a score reflects, not your best week.',
  recovery:
    'Rest and recovery are the area holding your number down. Recovery is where adaptation actually happens: the training does not make you fitter, recovering from the training does. When sleep is short and there is no genuine downtime in a week, everything else you do buys less than it should. This is the area where doing less produces more.',
  resilience:
    'Physical resilience is the area holding your number down. Frequent minor illness, long recovery after ordinary effort, and aches that shape your choices all point the same direction: your body is running with a thin margin. Resilience is not something you train directly — it is what appears when sleep, food, and load stop competing with each other.',
  vitals:
    'The numbers you know about yourself are the area holding your score down. This one is unusual, because it is not about how your body is performing — it is about how much you can see. Unmeasured blood pressure and years-old bloodwork mean any change you make is a guess about whether it worked. That is a solvable problem with one appointment.',
  load: 'Stress load is the area holding your number down. Your body is already spending a great deal before you add anything voluntary to it, whether that is physical work, caring for people, or stress that lands in your jaw, your gut, or your shoulders. Until some of that is offset, additional effort tends to cost more than it returns.',
};

const STRONG_NOTE: Record<BodyDomain, string> = {
  energy: 'Your energy holds up across the day, which is a genuine advantage — it means you can act on any change you decide to make.',
  movement: 'Movement is your strongest area. You already have the habit; the leverage now is in what surrounds it rather than in more of it.',
  nutrition: 'Food and hydration are your strongest area. That base makes everything else easier and is worth protecting when life gets busy.',
  recovery: 'Recovery is your strongest area, which is rarer than it sounds. You have the thing most people are missing.',
  resilience: 'Your resilience is your strongest area — your body absorbs ordinary demands well and comes back quickly.',
  vitals: 'You know your own numbers, which puts you ahead of most people. It means you can measure whether change is working.',
  load: 'Your day is not physically punishing you before you start, which gives you room others do not have.',
};

const LEVERS: Record<BodyDomain, string[]> = {
  energy: [
    'Anchor your wake time first. A steady wake time does more for daytime energy than anything you do in the evening.',
    'Move for ten minutes within an hour of waking, outdoors if possible.',
    'Put a real meal in front of the afternoon dip instead of caffeine behind it.',
  ],
  movement: [
    'Three sessions a week, two of which load your muscles: squat, push, carry. Nothing exotic.',
    'Ten unbroken minutes of walking on the days you do not train.',
    'Break sitting every hour with sixty seconds of standing and moving.',
  ],
  nutrition: [
    'Decide two default meals you can make without thinking, and keep the ingredients in the house.',
    'Protein and vegetables first on the plate, carbohydrate last and eaten last.',
    'A full glass of water before the first caffeine, and one with every meal.',
  ],
  recovery: [
    'Set a fixed wake time and protect the seven hours before it rather than chasing sleep after the fact.',
    'Book one genuinely undemanded stretch of time into the week, in advance.',
    'Five minutes of slow mobility on the two areas that complain most.',
  ],
  resilience: [
    'Reduce total load before adding training. Resilience appears when systems stop competing.',
    'Treat soreness lasting more than two days as information, not weakness.',
    'Deal with the one recurring ache properly instead of routing around it for another year.',
  ],
  vitals: [
    'Get blood pressure measured this month. It costs nothing and changes the picture.',
    'Ask for basic bloods: sugar, cholesterol, iron. Bring the results back here.',
    'Track one number consistently rather than four inconsistently.',
  ],
  load: [
    'Insert a two-minute break at midday, before you feel you need it.',
    'Match voluntary effort to the day you have already had, not to the plan you wrote on Sunday.',
    'Give the physical stress somewhere to go: walking, slow breathing, or heat.',
  ],
};

export function buildBodyIqReport(r: BodyIqResult): {
  headline: string;
  subhead: string;
  sections: ReportSection[];
} {
  const weakLabel = BODY_DOMAIN_LABEL[r.weakest];
  const strongLabel = BODY_DOMAIN_LABEL[r.strongest];
  const middle = r.ordered.slice(1, -1);

  const sections: ReportSection[] = [
    {
      heading: 'What your number actually means',
      paragraphs: [
        `Body IQ is built the same way an intelligence score is built. One hundred is the middle of the range, and every fifteen points is a meaningful step away from it. Your ${r.score} is not a grade and it is not a prediction. It is a summary of seven everyday areas, weighted by how much each one tends to change the others.`,
        BAND_OPENING[r.band],
      ],
      addonKey: 'addon_body_weak_area_deep_dive',
      addonTeaser: 'The full breakdown of the one area pulling your score down, and the order to fix it in.',
    },
    {
      heading: `The area holding your score down: ${weakLabel.toLowerCase()}`,
      paragraphs: [
        WEAK_DIAGNOSIS[r.weakest],
        'It is worth being precise about why this area matters more than the others for you. The seven areas do not sit side by side — they feed each other. Weakness in one shows up as a symptom in two more, which is why people so often treat the symptom and get nowhere. Working on the source is slower to feel and faster to work.',
      ],
      bullets: LEVERS[r.weakest],
      callout: {
        label: 'Start here',
        text: `For the next two weeks, ${LEVERS[r.weakest][0].toLowerCase()}`,
      },
    },
    {
      heading: `What is already working: ${strongLabel.toLowerCase()}`,
      paragraphs: [
        STRONG_NOTE[r.strongest],
        'Strong areas are not finished areas, but they are not where your attention belongs right now. The common mistake is to keep improving the thing you are already good at, because it is more enjoyable and the progress is easier to see. Hold this area steady, and spend your effort where the return is larger.',
      ],
    },
    {
      heading: 'The seven areas, read together',
      paragraphs: [
        'Individually, each of these areas is a habit. Together, they describe how much capacity your body has on an ordinary day — and capacity is the thing you actually feel. Here is how the middle of your profile reads, in order.',
      ],
      bullets: middle.map((d) => {
        const label = BODY_DOMAIN_LABEL[d.domain];
        if (d.value >= 70) return `${label} is in good shape and needs protecting, not fixing.`;
        if (d.value >= 45) return `${label} is doing enough to be invisible, which is exactly when it starts to slide.`;
        return `${label} is underperforming quietly and will become your next priority once the first one is handled.`;
      }),
      addonKey: 'addon_body_your_day_rebuilt',
      addonTeaser: 'An hour-by-hour day built around the areas your score flagged.',
    },
    {
      heading: 'What actually moves the number',
      paragraphs: [
        'Three things move a Body IQ score reliably: how often you load your muscles, how much real recovery you get, and how your day is fuelled. Everything else is either a consequence of those three or a small percentage on top of them. That is a short list on purpose — a plan you can hold for ninety days beats a better plan you abandon in twelve.',
        'The mistake most people make at this point is scale. They take a score they do not like and respond with a programme built for someone who already scores well. Two weeks later the plan collapses, and the collapse gets read as a personal failing rather than a dosing error. Your first month should feel almost too easy.',
      ],
      bullets: [
        'Consistency beats intensity for the first thirty days. No exceptions.',
        'One number tracked daily beats four tracked occasionally.',
        'A recovery day is part of the plan, not a break from it.',
        'If a week collapses, restart at the same size — not a smaller or a bigger one.',
      ],
    },
    {
      heading: 'Your first two weeks',
      paragraphs: [
        `Your dashboard turns this into daily actions, weighted toward ${weakLabel.toLowerCase()}, and it runs on a ninety-day arc in three phases. The first thirty days make the basics automatic. The next thirty add load and precision. The last thirty hold the standard without you thinking about it.`,
        'For the next fourteen days, the target is not improvement. It is evidence — evidence that the small version of this plan survives a normal week, including the bad days. Once you have that, adding to it is straightforward. Without it, adding to it is how people end up back where they started.',
      ],
      bullets: [
        'Two strength-style sessions and two walks a week, at a size you would still do while tired.',
        'One number logged at the same time each day.',
        'One fixed wake time, weekend included.',
      ],
    },
    {
      heading: 'What to watch for',
      paragraphs: [
        'Two things tend to derail people from here. The first is judging the plan on how it feels rather than on whether it happened; early on, adherence is the only metric that means anything. The second is treating a re-test too soon as a verdict. Re-take Body IQ after thirty days, not after five.',
        disclaimer('reportLong', 'body'),
      ],
    },
  ];

  return {
    headline: BAND_HEADLINE[r.band],
    subhead: `Body IQ ${r.score}. Strongest area: ${strongLabel.toLowerCase()}. The one holding you back: ${weakLabel.toLowerCase()}.`,
    sections,
  };
}
