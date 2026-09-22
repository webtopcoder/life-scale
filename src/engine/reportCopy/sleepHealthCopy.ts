// Sleep Health report copy. ~1,470 words, status-based, no score, no ranking.

import type { ReportSection } from '@/components/scale/ScaleReportShell';
import { SLEEP_DOMAIN_LABEL, type SleepDomain } from '@/data/sleepHealthQuiz';
import { SLEEP_STATUS_LABEL, type SleepHealthResult } from '@/engine/bodyScoring';
import { disclaimer } from '@/content/legalCopy';

const OVERALL_HEADLINE: Record<SleepHealthResult['overall'], string> = {
  settled: 'Your nights are broadly doing their job.',
  mixed: 'Parts of your night work. Parts of it are working against you.',
  disrupted: 'Your nights are under real strain, and your days are paying for it.',
};

const OVERALL_OPENING: Record<SleepHealthResult['overall'], string> = {
  settled:
    'This is the least common result, and it is worth saying plainly: most of what you do around sleep is working. That does not mean there is nothing here. Sleep is the first thing to go when life gets busier, and the areas that look fine now are exactly the ones that slip without announcing themselves.',
  mixed:
    'This is the most common pattern by a wide margin. Some parts of your night are solid and one or two are quietly undermining the rest — which is why sleeping the right number of hours can still leave you flat. The useful thing about a mixed picture is that it points at something specific rather than at everything.',
  disrupted:
    'Several areas came through under strain at once, and they are reinforcing each other: short nights make the wind-down harder, a broken wind-down makes falling asleep harder, and a hard morning makes the next evening worse. That loop is genuinely difficult to break by willpower, which is why the plan starts smaller than you would probably choose.',
};

const DIAGNOSIS: Record<SleepDomain, string> = {
  duration:
    'How long you sleep is the area under most strain. Duration is the bluntest lever there is, and also the one people negotiate with most. The hour you lose is almost never a decision — it is the accumulated cost of everything that had to happen after the day officially ended. That is why fixing duration usually means moving the start of the evening, not the end of it.',
  latency:
    'Falling asleep is the area under most strain. A long gap between lights out and sleep is rarely a sleep problem — it is a wind-down problem arriving late. A body that is still processing the day cannot switch off on command, and lying in the dark waiting for it teaches your brain that bed is a place where you are awake and frustrated.',
  continuity:
    'Staying asleep is the area under most strain. Broken nights are more costly than short ones, because the repair work sleep does depends on getting long uninterrupted stretches. Waking is normal; the question is what happens next, and how long you spend awake once it has happened.',
  rhythm:
    'Timing and rhythm are the area under most strain. Your body runs on an internal clock that it sets from light and from consistency, and it does not care whether the inconsistency was your choice. Shifting your hours around across the week produces a version of the same fatigue as jet lag, without the flight.',
  environment:
    'Your room and your wind-down are the area under most strain. This is the most fixable finding in the whole check-in, and the one people are most reluctant to act on, because the fixes are unglamorous: darkness, quiet, temperature, and an hour that does not contain your inbox.',
  stimulants:
    'Caffeine, alcohol, and screens are the area under most strain. All three feel like they help and all three take something back later in the night. Caffeine has a much longer tail than most people believe. Alcohol sedates you early and fragments you at three in the morning. Screens do less harm through light than through the fact that they keep you engaged.',
  daytime:
    'How your days feel is the area under most strain. This matters because daytime signals are the only honest verdict on a night. Fighting sleepiness, a shortened fuse, and nodding off unintentionally all say the same thing: whatever is happening at night is not delivering, whatever the clock says about it.',
};

const LEVERS: Record<SleepDomain, string[]> = {
  duration: [
    'Move the start of your evening earlier by twenty minutes rather than trying to sleep longer in the morning.',
    'Pick the fixed wake time first and count backwards to a realistic bedtime.',
    'Stop treating weekend catch-up as a plan — it resets your clock and costs you Monday.',
  ],
  latency: [
    'Give the last hour the same three actions, in the same order, every night.',
    'Write tomorrow down before the wind-down starts, so your head has somewhere to put it.',
    'Awake for twenty minutes? Get up, sit somewhere dim, and come back when your eyes are heavy.',
  ],
  continuity: [
    'Cut alcohol on two consecutive nights and compare your wake-ups honestly.',
    'Keep the room cool — most three-a.m. waking is temperature or alcohol.',
    'No clock-watching. Turn the display away from the bed entirely.',
  ],
  rhythm: [
    'One wake time, seven days a week, within fifteen minutes.',
    'Ten minutes of outdoor light within an hour of waking, no sunglasses.',
    'Keep the last hour of the night the same even when the rest of the day was not.',
  ],
  environment: [
    'Fix darkness first: it is the cheapest change with the largest effect.',
    'Get the room genuinely cool rather than comfortable when you get in.',
    'Remove the one thing that keeps pulling you back into the day — usually a screen within reach.',
  ],
  stimulants: [
    'Hard caffeine cut-off at 2pm, for two weeks, before you judge it.',
    'If you drink in the evening, make it earlier and smaller rather than absent — then compare.',
    'Put the phone across the room. Distance beats discipline.',
  ],
  daytime: [
    'Score your afternoon energy out of ten each day next to last night’s length.',
    'Nap before 3pm and cap it at twenty minutes, or not at all.',
    'Treat two weeks of daytime scores as your real result, not any single night.',
  ],
};

export function buildSleepReport(r: SleepHealthResult): {
  headline: string;
  subhead: string;
  sections: ReportSection[];
} {
  const worst = r.domains[0];
  const best = r.domains[r.domains.length - 1];
  const worstLabel = SLEEP_DOMAIN_LABEL[worst.domain as SleepDomain];
  const bestLabel = SLEEP_DOMAIN_LABEL[best.domain as SleepDomain];
  const middle = r.domains.slice(1, -1);

  const sections: ReportSection[] = [
    {
      heading: 'What this check-in is telling you',
      paragraphs: [
        'There is no score here, and that is deliberate. Sleep does not reduce to a single number without hiding the thing you need to see. Two people can spend the same seven hours in bed and get completely different nights, so this check-in separates length from quality, timing, environment, and what your days are reporting back.',
        OVERALL_OPENING[r.overall],
      ],
      addonKey: 'addon_sleep_first_week',
      addonTeaser: 'A night-by-night first week built around the area under the most strain.',
    },
    {
      heading: `Where the strain is: ${worstLabel.toLowerCase()}`,
      paragraphs: [
        DIAGNOSIS[worst.domain as SleepDomain],
        'This area is also where your effort buys the most, because the seven areas are not independent. Improving the one under most strain tends to lift two others without you touching them directly, while working on a comfortable area feels productive and changes almost nothing.',
      ],
      bullets: LEVERS[worst.domain as SleepDomain],
      callout: {
        label: 'Start here',
        text: LEVERS[worst.domain as SleepDomain][0],
      },
    },
    {
      heading: `What is already working: ${bestLabel.toLowerCase()}`,
      paragraphs: [
        `${bestLabel} came through as your steadiest area — ${SLEEP_STATUS_LABEL[best.status].toLowerCase()}. Leave it alone. There is a strong pull toward optimising the part of your night that already behaves, partly because progress there is easy to see, and it is almost always the wrong place to spend attention.`,
        'The one thing worth doing here is protection. Note what makes this area work for you, and treat it as non-negotiable during the weeks when everything else gets harder — travel, deadlines, illness, a bad stretch with the children.',
      ],
    },
    {
      heading: 'The rest of your picture',
      paragraphs: [
        'Between your steadiest and most strained areas, the middle of your profile tells you what is coming next. These are the ones to watch rather than to work on today.',
      ],
      bullets: middle.map((d) => {
        const label = SLEEP_DOMAIN_LABEL[d.domain as SleepDomain];
        if (d.status === 'solid') return `${label} is working — keep it as it is.`;
        if (d.status === 'watch') return `${label} is fine for now, and is the kind of area that drifts without warning.`;
        if (d.status === 'strained') return `${label} is under strain and will be your second priority.`;
        return `${label} needs attention soon — it is close to being the loudest thing in your night.`;
      }),
      addonKey: 'addon_sleep_your_night_mapped',
      addonTeaser: 'Your evening mapped hour by hour, from the last coffee to lights out.',
    },
    {
      heading: 'How sleep change actually works',
      paragraphs: [
        'Sleep improves on a two-week clock, not a one-night clock. Any single night is noise: an unusually good one proves nothing and a bad one proves nothing either. What matters is the average over a fortnight, and the only way to see that is to write something down each morning while it is still fresh.',
        'The second thing worth knowing is that sleep responds badly to being tried at. Effort is useful in the evening — building the wind-down, moving the caffeine, fixing the room — and actively harmful in bed, where trying to sleep is the reliable way to stay awake. Put your energy in the hours before, and let the night take care of itself.',
      ],
      bullets: [
        'Judge changes over fourteen nights, never over one.',
        'One change at a time, or you will not know which one worked.',
        'Fixed wake time before anything else. It is the anchor everything else hangs from.',
        'If you are awake and frustrated, get up. Bed should mean sleep.',
      ],
    },
    {
      heading: 'Your first two weeks',
      paragraphs: [
        `Your dashboard turns this into a small number of nightly actions, weighted toward ${worstLabel.toLowerCase()}, across a ninety-day arc. The first phase makes the basics automatic — a fixed wake time, morning light, a repeatable last hour. The second adds the harder levers. The third holds the standard through weeks that would previously have wrecked it.`,
        'For the next fourteen nights, do not aim to sleep better. Aim to make the same three things happen at the same time each night, and log your mornings. That is the whole task. Better sleep is the result of that consistency, not something you can pursue directly.',
      ],
    },
    {
      heading: 'When to involve a doctor',
      paragraphs: [
        r.breathingFlag
          ? 'One of your answers deserves a proper conversation. Heavy snoring with pauses in breathing is not a habit problem and no wind-down routine addresses it — it has a specific, common, and very treatable cause, and it is worth raising with a doctor rather than working around. Nothing in this report substitutes for that.'
          : `Nothing in your answers points to a condition that needs urgent attention, though this check-in cannot see one either. ${disclaimer('reportLong', 'body')}`,
        'More generally: persistent unrefreshing sleep despite adequate hours, falling asleep unintentionally during the day, or a change in your sleep that arrived suddenly are all worth a clinical conversation. Bring this report with you — a written picture of seven areas is more useful to a doctor than trying to summarise it from memory in ten minutes.',
      ],
    },
  ];

  return {
    headline: OVERALL_HEADLINE[r.overall],
    subhead: `Steadiest: ${bestLabel.toLowerCase()}. Under most strain: ${worstLabel.toLowerCase()}. ${r.flags.length} area${r.flags.length === 1 ? '' : 's'} flagged for attention.`,
    sections,
  };
}
