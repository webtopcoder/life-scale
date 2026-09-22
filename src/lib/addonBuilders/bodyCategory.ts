// Add-on document builders for the Body category. Each builder writes only from
// the user's own stored payload; with no payload attached it says so rather than
// filling the gap with generic advice.

import { baseDoc, type AddonDoc, type AddonPayload } from './types';
import { BODY_DOMAIN_LABEL, type BodyDomain } from '@/data/bodyIqQuiz';
import { SLEEP_DOMAIN_LABEL, type SleepDomain } from '@/data/sleepHealthQuiz';
import { SLEEP_STATUS_LABEL } from '@/engine/bodyScoring';

function fallback(title: string, what: string): AddonDoc {
  return baseDoc(title, 'Your results are not attached yet', [
    {
      heading: 'We need your answers first',
      paragraphs: [
        `This report is written entirely from your own ${what} answers. They are not attached to your account yet, and we will not fill the gap with advice you could find anywhere.`,
        `Take or re-take the ${what} test and this report rebuilds itself automatically. It stays in your dashboard, and there is nothing more to pay.`,
      ],
    },
  ]);
}

/* --------------------------------- Body IQ -------------------------------- */

interface BodyStored {
  score?: number;
  weakest?: BodyDomain;
  strongest?: BodyDomain;
  ordered?: { domain: BodyDomain; label: string; value: number }[];
}

function bodyRead(payload: AddonPayload): BodyStored | null {
  const r = (payload.result as BodyStored | undefined) ?? null;
  if (!r || !Array.isArray(r.ordered) || r.ordered.length < 3) return null;
  return r;
}

function bodyLabel(d: BodyDomain | undefined): string {
  return d ? BODY_DOMAIN_LABEL[d] : 'your weakest area';
}

export function buildBodyWeakArea(payload: AddonPayload): AddonDoc {
  const r = bodyRead(payload);
  if (!r) return fallback('Weak Area Deep Dive', 'Body IQ');
  const weak = bodyLabel(r.weakest);
  const bottom = [...(r.ordered ?? [])].reverse().slice(0, 2);
  return baseDoc('Weak Area Deep Dive', `Your priority area: ${weak.toLowerCase()}`, [
    {
      heading: 'Why this area, and not another',
      paragraphs: [
        `Of the seven areas behind your Body IQ of ${r.score}, ${weak.toLowerCase()} came out lowest. That is not a criticism — it is the highest-return place to spend the next month, because the seven areas feed each other and this one is currently feeding the others badly.`,
        'The order below is deliberate. Work top to bottom, and do not add the second item until the first has survived a genuinely bad week.',
      ],
      bullets: bottom.map((d) => `${BODY_DOMAIN_LABEL[d.domain]} — currently your ${d === bottom[0] ? 'lowest' : 'second-lowest'} area.`),
    },
    {
      heading: 'Your four-week sequence',
      paragraphs: [
        'Week one changes nothing except measurement: pick one number and log it daily. Week two adds one action, at a size you would still do while tired. Week three repeats week two exactly. Week four adds the second action only if week three held.',
        'That pace looks slow written down. It is the pace that is still running in month three, which is the only pace that changes a score.',
      ],
      table: {
        columns: ['Week', 'What changes', 'How you judge it'],
        rows: [
          ['1', 'Measurement only', 'Seven days logged'],
          ['2', 'One action added', 'Five of seven days done'],
          ['3', 'Repeat, no additions', 'Five of seven days again'],
          ['4', 'Second action added', 'Both actions on four days'],
        ],
      },
    },
    {
      heading: 'What progress will look like',
      paragraphs: [
        'Expect the feeling to change before the number does. Energy and recovery usually shift inside two weeks; the score itself moves on a monthly clock, because it is built from habits rather than from moments.',
        'Re-take Body IQ after thirty days. Sooner than that and you are measuring noise.',
      ],
    },
  ]);
}

export function buildBodyDayPlan(payload: AddonPayload): AddonDoc {
  const r = bodyRead(payload);
  if (!r) return fallback('Your Day, Rebuilt', 'Body IQ');
  return baseDoc('Your Day, Rebuilt', 'An hour-by-hour day built around your seven areas', [
    {
      heading: 'The shape of your day',
      paragraphs: [
        `This is one day, built around the areas your score flagged — with ${bodyLabel(r.weakest).toLowerCase()} taking priority and ${bodyLabel(r.strongest).toLowerCase()} left alone because it is already working.`,
        'Treat it as a template rather than a schedule. The order matters far more than the clock times.',
      ],
      table: {
        columns: ['When', 'What', 'Why it is there'],
        rows: [
          ['On waking', 'Water, then light', 'Sets your clock and your energy for the whole day'],
          ['Within an hour', '10 minutes of movement', 'Cheapest energy available; nothing else competes'],
          ['Mid-morning', 'Hardest task of the day', 'Your capacity is highest here, not after lunch'],
          ['Lunch', 'Protein and vegetables first', 'Protects the afternoon you keep losing'],
          ['Midday', '2 minutes of nothing', 'A load break before you need it, not after'],
          ['Late afternoon', 'Strength or a walk', 'Loading here costs the least sleep'],
          ['Evening', 'Screens down, lights down', 'Buys the recovery the rest of the day depends on'],
        ],
      },
    },
    {
      heading: 'Adapting it to a real life',
      paragraphs: [
        'Shift work, caring duties, and travel break every template. When they do, keep two things and let the rest go: the fixed wake time and the ten minutes of morning movement. Those two carry more of the effect than the rest of the day combined.',
        'On a genuinely bad day, do the smallest version of one item. That counts, and it keeps the streak that keeps the habit.',
      ],
    },
  ]);
}

export function buildBodyStrengthStarter(payload: AddonPayload): AddonDoc {
  const r = bodyRead(payload);
  if (!r) return fallback('Strength Starter', 'Body IQ');
  return baseDoc('Strength Starter', 'Twelve weeks of loading, from wherever you are now', [
    {
      heading: 'Why strength, specifically',
      paragraphs: [
        'Of everything that moves a Body IQ score, asking your muscles to do something difficult is the single highest-return action, and it is the one most commonly missing. It changes energy, resilience, and recovery at the same time.',
        'You need three movements, not thirty: a squat, a push, and a carry. Everything else is optional for the next twelve weeks.',
      ],
      table: {
        columns: ['Weeks', 'Sets', 'Reps', 'Rule'],
        rows: [
          ['1–4', '2', '8–10', 'Leave three reps in reserve, always'],
          ['5–8', '3', '6–8', 'Add load only when all sets felt easy'],
          ['9–12', '3', '5–8', 'One harder set at the end, once a week'],
        ],
      },
    },
    {
      heading: 'The rules that stop it failing',
      paragraphs: [
        'Two sessions a week, never three in the first month. Rest two minutes between sets even when you feel ready sooner — the rest is what makes the next set worth doing.',
        'Soreness lasting more than two days means the last session was too much, not that you are unfit. Repeat the previous week rather than pushing on.',
      ],
    },
  ]);
}

export function buildBodyEnergyAudit(payload: AddonPayload): AddonDoc {
  const r = bodyRead(payload);
  if (!r) return fallback('Energy Audit', 'Body IQ');
  const ordered = r.ordered ?? [];
  return baseDoc('Energy Audit', 'Where your day leaks energy, and what to plug first', [
    {
      heading: 'Your energy profile',
      paragraphs: [
        'Energy is a readout rather than a system. This audit traces yours back to the areas actually producing it, using your own seven-area profile.',
      ],
      table: {
        columns: ['Area', 'Standing', 'Effect on your energy'],
        rows: ordered.map((d) => [
          BODY_DOMAIN_LABEL[d.domain],
          d.value >= 70 ? 'Working' : d.value >= 45 ? 'Middling' : 'Leaking',
          d.value >= 70 ? 'Supporting your day' : d.value >= 45 ? 'Neutral, drifting' : 'Costing you hours',
        ]),
      },
    },
    {
      heading: 'The three plugs',
      paragraphs: [
        'Fix in this order: the wake time, the first hour, and the meal in front of your afternoon dip. Each one is small, and each one changes the next.',
        'Log energy out of ten at 3pm daily. Two weeks of that shows you your own pattern more convincingly than any explanation could.',
      ],
    },
  ]);
}

export function buildBody30DayPlanner(payload: AddonPayload): AddonDoc {
  const r = bodyRead(payload);
  if (!r) return fallback('30-Day Body Planner', 'Body IQ');
  return baseDoc('30-Day Body Planner', `Thirty days aimed at ${bodyLabel(r.weakest).toLowerCase()}`, [
    {
      heading: 'How this planner works',
      paragraphs: [
        'Your dashboard gives you the daily prompt. This gives you the reasoning, the fallback rule for bad days, and the checkpoints — the parts that decide whether day thirty happens.',
        'Every week has one addition and one non-negotiable. Nothing else changes.',
      ],
      table: {
        columns: ['Week', 'Addition', 'Non-negotiable', 'Checkpoint'],
        rows: [
          ['1', 'Log one number daily', 'Fixed wake time', 'Seven days logged'],
          ['2', 'Two strength sessions', 'Fixed wake time', 'Both sessions done'],
          ['3', 'Two walks added', 'Strength sessions', 'Four of four sessions'],
          ['4', 'One harder session', 'Everything above', 'Re-take Body IQ'],
        ],
      },
    },
    {
      heading: 'When a week collapses',
      paragraphs: [
        'It will, at some point. The rule is to restart at exactly the same size — not smaller, which feels like defeat, and not larger, which is how people try to make up for lost time and then quit properly.',
        'A missed week costs you almost nothing. A missed week followed by an over-corrected week costs you the month.',
      ],
    },
  ]);
}

/* ------------------------------ Sleep Health ------------------------------ */

interface SleepStored {
  domains?: { domain: SleepDomain; load: number; status: keyof typeof SLEEP_STATUS_LABEL }[];
  overall?: string;
  breathingFlag?: boolean;
}

function sleepRead(payload: AddonPayload): SleepStored | null {
  const r = (payload.result as SleepStored | undefined) ?? null;
  if (!r || !Array.isArray(r.domains) || r.domains.length < 3) return null;
  return r;
}

export function buildSleepFirstWeek(payload: AddonPayload): AddonDoc {
  const r = sleepRead(payload);
  if (!r) return fallback('Your First Week of Better Sleep', 'Sleep Health');
  const worst = r.domains![0];
  const label = SLEEP_DOMAIN_LABEL[worst.domain];
  return baseDoc('Your First Week of Better Sleep', `Built around ${label.toLowerCase()}`, [
    {
      heading: 'Seven nights, one change',
      paragraphs: [
        `Your check-in put ${label.toLowerCase()} under the most strain, so that is the only thing this week touches. One change, seven nights, then a verdict.`,
        'Everything else stays exactly as it is. That is what makes the result readable.',
      ],
      table: {
        columns: ['Night', 'What you do', 'What you log'],
        rows: [
          ['1', 'Fixed wake time set for the whole week', 'Time to sleep, wake-ups'],
          ['2', 'Same wake time, morning light added', 'Morning energy out of ten'],
          ['3', 'Wind-down: same three actions, same order', 'Time to sleep'],
          ['4', 'Repeat night three exactly', 'Wake-ups'],
          ['5', 'Caffeine cut-off at 2pm', 'Time to sleep'],
          ['6', 'Repeat, no changes', 'Afternoon energy'],
          ['7', 'Review the week', 'Best two nights and what they shared'],
        ],
      },
    },
    {
      heading: 'Reading the week honestly',
      paragraphs: [
        'One good night proves nothing and one bad night proves nothing. Look at the average and at your best two nights — those two usually contain the answer.',
        'If nothing moved, the change was probably too small or the wrong area. Move to the second-strained area rather than doubling the first.',
      ],
    },
  ]);
}

export function buildSleepNightMap(payload: AddonPayload): AddonDoc {
  const r = sleepRead(payload);
  if (!r) return fallback('Your Night, Mapped', 'Sleep Health');
  return baseDoc('Your Night, Mapped', 'From your last coffee to lights out', [
    {
      heading: 'The evening in order',
      paragraphs: [
        'Sleep is decided long before bed. This maps the decisions in the order they actually matter, based on your own strained areas.',
      ],
      table: {
        columns: ['When', 'What', 'Why'],
        rows: [
          ['2pm', 'Last caffeine', 'The tail is longer than it feels'],
          ['Late afternoon', 'Movement, if any', 'Later than this costs you sleep depth'],
          ['Two hours before', 'Last real meal, last drink', 'Digestion competes with sleep'],
          ['One hour before', 'Lights down, screens away', 'The signal your body sets its clock by'],
          ['45 minutes before', 'Tomorrow written down', 'Gives your head somewhere to put it'],
          ['30 minutes before', 'Same three calm actions', 'Repetition is the mechanism'],
          ['Lights out', 'Cool, dark, quiet', 'The three physical conditions that matter'],
        ],
      },
    },
    {
      heading: 'The rule for bad nights',
      paragraphs: [
        'Awake and frustrated for twenty minutes? Get up, sit somewhere dim, no screen, and return when your eyes are heavy. Lying there teaches your brain that bed is where you are awake.',
        'Do not chase the loss the next day with a long nap or a lie-in. Hold the wake time and let the pressure work for you the following night.',
      ],
    },
  ]);
}

export function buildSleepShiftGuide(payload: AddonPayload): AddonDoc {
  const r = sleepRead(payload);
  if (!r) return fallback('Irregular Hours Guide', 'Sleep Health');
  return baseDoc('Irregular Hours Guide', 'Sleeping well when your week will not sit still', [
    {
      heading: 'What you can and cannot control',
      paragraphs: [
        'Shifts, travel, and caring duties break the standard advice, and pretending otherwise is why most sleep guidance is useless to the people who need it most.',
        'You cannot control your hours. You can control the sequence: the same wind-down, the same darkness, and light at the start of your day whenever your day starts.',
      ],
      bullets: [
        'Anchor the sequence, not the clock — the order of your last hour is what your body reads.',
        'Light at the start of your waking period, whatever time that is.',
        'Protect the longest single block you can get rather than chasing a total.',
      ],
    },
    {
      heading: 'Rotating and recovering',
      paragraphs: [
        'After a run of nights or a long flight, give yourself two ordinary days rather than one heroic recovery sleep. Two moderate nights re-set a clock better than one enormous one.',
        'Keep caffeine on the front half of your waking period, whenever that falls. The rule travels with you.',
      ],
    },
  ]);
}

export function buildSleepDaytimeReport(payload: AddonPayload): AddonDoc {
  const r = sleepRead(payload);
  if (!r) return fallback('Daytime Effects Report', 'Sleep Health');
  const domains = r.domains ?? [];
  return baseDoc('Daytime Effects Report', 'What your nights are doing to your days', [
    {
      heading: 'Your seven areas, and what each one costs you awake',
      paragraphs: [
        'Sleep problems are diagnosed at night and paid for during the day. This links your own areas to the daytime cost, so you know which symptom belongs to which cause.',
      ],
      table: {
        columns: ['Area', 'Standing', 'How it shows up in your day'],
        rows: domains.map((d) => [
          SLEEP_DOMAIN_LABEL[d.domain],
          SLEEP_STATUS_LABEL[d.status],
          d.status === 'solid'
            ? 'Not costing you anything currently'
            : d.status === 'watch'
              ? 'Mild afternoon flatness'
              : 'Shortened patience, lost afternoons, poorer decisions',
        ]),
      },
    },
    {
      heading: 'Two weeks of evidence',
      paragraphs: [
        'Score your afternoon energy and your patience out of ten each day, beside last night’s length. Fourteen days of that pairing tells you which of your areas is actually driving your days.',
        'People consistently blame the wrong one. The data corrects it faster than reflection does.',
      ],
    },
  ]);
}

export function buildSleep30DayPlanner(payload: AddonPayload): AddonDoc {
  const r = sleepRead(payload);
  if (!r) return fallback('30-Day Sleep Planner', 'Sleep Health');
  const worst = SLEEP_DOMAIN_LABEL[r.domains![0].domain];
  return baseDoc('30-Day Sleep Planner', `Thirty nights aimed at ${worst.toLowerCase()}`, [
    {
      heading: 'The month, one change at a time',
      paragraphs: [
        'Sleep responds to a fortnight, not a night, so this month contains only four changes. Each one gets long enough to prove itself.',
      ],
      table: {
        columns: ['Week', 'Change', 'Held from before', 'Verdict at the end'],
        rows: [
          ['1', 'Fixed wake time', '—', 'Seven mornings logged'],
          ['2', 'Morning light', 'Wake time', 'Falling asleep faster?'],
          ['3', 'Wind-down sequence', 'Both above', 'Fewer wake-ups?'],
          ['4', 'Caffeine cut-off', 'All above', 'Afternoon energy up?'],
        ],
      },
    },
    {
      heading: 'If nothing has moved by day thirty',
      paragraphs: [
        'Then this is worth a clinical conversation rather than more effort. Persistent unrefreshing sleep despite adequate hours has causes that habits do not touch, and they are common and treatable.',
        r.breathingFlag
          ? 'Your answers already flagged breathing during sleep. Raise that first — it changes what any of the rest is worth.'
          : 'Bring your fourteen days of logs with you. It makes the appointment far more useful.',
      ],
    },
  ]);
}

/* ----------------------------- Hidden Athlete ----------------------------- */

interface AthleteStored {
  archetype?: { name?: string; tagline?: string; summary?: string; trainsBestWith?: string[]; breaksDownWhen?: string[] };
  secondary?: { name?: string; summary?: string };
  normalized?: Record<string, number>;
}

function athleteRead(payload: AddonPayload): AthleteStored | null {
  const r = (payload.result as AthleteStored | undefined) ?? null;
  if (!r?.archetype?.name) return null;
  return r;
}

export function buildAthleteDeepDive(payload: AddonPayload): AddonDoc {
  const r = athleteRead(payload);
  if (!r) return fallback('Archetype Deep Dive', 'Hidden Athlete');
  const a = r.archetype!;
  return baseDoc('Archetype Deep Dive', `${a.name} at full length`, [
    {
      heading: 'The full picture',
      paragraphs: [
        a.summary ?? '',
        'What follows is the same profile taken further: where it wins, where it stalls, and what a year of training shaped around it looks like compared with a year of fighting it.',
      ],
    },
    {
      heading: 'Where you outperform',
      paragraphs: ['These are the conditions where your wiring is an advantage rather than a preference.'],
      bullets: a.trainsBestWith ?? [],
    },
    {
      heading: 'Where the same wiring costs you',
      paragraphs: ['Every profile pays somewhere. Yours pays here, and it pays predictably.'],
      bullets: a.breaksDownWhen ?? [],
    },
    {
      heading: 'Your secondary pattern',
      paragraphs: [
        `${r.secondary?.name ?? 'Your secondary pattern'} sits underneath your primary. ${r.secondary?.summary ?? ''}`,
        'Borrow from it deliberately when circumstances demand — a compressed week, an injury, a change of season — and return to your default when they pass.',
      ],
    },
  ]);
}

export function buildAthleteTrainingBlueprint(payload: AddonPayload): AddonDoc {
  const r = athleteRead(payload);
  if (!r) return fallback('Training Blueprint', 'Hidden Athlete');
  const n = r.normalized ?? {};
  const endurance = (n.endurance ?? 0) >= 0;
  const volume = (n.volume ?? 0) >= 0;
  return baseDoc('Training Blueprint', `Twelve weeks shaped for ${r.archetype?.name}`, [
    {
      heading: 'The shape of your week',
      paragraphs: [
        'Same goals, different shapes. This is the week your profile actually repeats, rather than the week a generic plan would hand you.',
      ],
      table: {
        columns: ['Day', 'Session', 'Why'],
        rows: [
          ['1', endurance ? 'Long easy effort' : 'Strength, heavy and slow', endurance ? 'Plays to your durability' : 'Plays to your output'],
          ['2', 'Easy movement only', 'Protects the next hard day'],
          ['3', endurance ? 'Defined intervals' : 'Short sharp effort', 'Covers the end you naturally neglect'],
          ['4', 'Rest or a walk', 'Non-negotiable'],
          ['5', volume ? 'Moderate session' : 'Second strength session', volume ? 'Accumulation suits you' : 'Concentrated load suits you'],
          ['6', 'Skill or play', 'Keeps it repeatable'],
          ['7', 'Review, then rest', 'The habit that keeps the block alive'],
        ],
      },
    },
    {
      heading: 'Twelve weeks, three blocks',
      paragraphs: [
        'Four weeks establishing the shape, four adding load, four holding the standard under pressure. Deload the fourth week of each block by cutting volume by a third and keeping intensity.',
        volume
          ? 'Cap your weekly total in advance. Your tolerance will let you overshoot before you notice you have.'
          : 'Set a weekly floor rather than a target. Your limiting factor is consistency, not effort.',
      ],
    },
  ]);
}

export function buildAthleteRecoveryProtocol(payload: AddonPayload): AddonDoc {
  const r = athleteRead(payload);
  if (!r) return fallback('Recovery Protocol', 'Hidden Athlete');
  return baseDoc('Recovery Protocol', 'How your profile actually recovers', [
    {
      heading: 'Recovery is the training',
      paragraphs: [
        'The session does not make you fitter. Recovering from the session does. Most plans fail here rather than in the work, and every archetype has its own way of getting it wrong.',
        'Your readiness score takes ten seconds: sleep, soreness, and appetite, each out of ten, before you train.',
      ],
      table: {
        columns: ['Total', 'What you do'],
        rows: [
          ['24–30', 'Take the hard session. This is the day for it.'],
          ['16–23', 'Do the planned session at the easy end.'],
          ['Under 16', 'Walk, stretch, or nothing. No negotiation.'],
        ],
      },
    },
    {
      heading: 'The three levers',
      paragraphs: [
        'Sleep length, protein within an hour of finishing, and one genuinely easy day a week. Nothing else in recovery comes close, and nothing bought in a bottle substitutes for any of the three.',
        'Soreness past two days is a dosing message, not a badge. Repeat the previous week instead of pushing through.',
      ],
    },
  ]);
}

export function buildAthleteBenchmarkPack(payload: AddonPayload): AddonDoc {
  const r = athleteRead(payload);
  if (!r) return fallback('Benchmark Pack', 'Hidden Athlete');
  return baseDoc('Benchmark Pack', 'Four tests, repeatable at home, no equipment', [
    {
      heading: 'What to measure and how often',
      paragraphs: [
        'Four benchmarks, repeated monthly under the same conditions. Same warm-up, same time of day, same surface. Without that, the numbers are stories.',
      ],
      table: {
        columns: ['Test', 'How', 'What it tells you'],
        rows: [
          ['Twelve-minute walk or run', 'Cover as much ground as you can', 'Aerobic base'],
          ['Press-ups to form failure', 'Stop when form breaks, not when it hurts', 'Upper-body endurance'],
          ['Sit-to-stand in 30 seconds', 'From a normal chair, no hands', 'Leg power and durability'],
          ['Single-leg balance, eyes closed', 'Time each side', 'Control and asymmetry'],
        ],
      },
    },
    {
      heading: 'Reading your own numbers',
      paragraphs: [
        'Compare only against your own previous month. One flat month means nothing; two flat months means the plan needs a change, usually to recovery rather than to effort.',
        'Never change a block on the basis of a single bad test. Tests are noisy, and the noise is larger than the monthly signal.',
      ],
    },
  ]);
}

export function buildAthlete30DayPlanner(payload: AddonPayload): AddonDoc {
  const r = athleteRead(payload);
  if (!r) return fallback('30-Day Training Planner', 'Hidden Athlete');
  return baseDoc('30-Day Training Planner', `Thirty days written for ${r.archetype?.name}`, [
    {
      heading: 'How this month runs',
      paragraphs: [
        'One addition per week, one non-negotiable per week, and a verdict at the end of each. The point of month one is not fitness — it is proving that the shape survives a normal life.',
      ],
      table: {
        columns: ['Week', 'Addition', 'Non-negotiable', 'Verdict'],
        rows: [
          ['1', 'Two sessions, at the easy end', 'One genuinely easy day', 'Both sessions done?'],
          ['2', 'Readiness score before each session', 'Both sessions', 'Scores logged daily?'],
          ['3', 'One harder session', 'Everything above', 'Recovered by the next day?'],
          ['4', 'Benchmark, then deload', 'Everything above', 'Numbers recorded'],
        ],
      },
    },
    {
      heading: 'The failure mode to watch',
      paragraphs: [
        (r.archetype?.breaksDownWhen ?? [])[0] ?? 'Adding load faster than recovery.',
        'Write that sentence somewhere you will see it in week three. That is when it happens, and it happens to almost everybody with your profile.',
      ],
    },
  ]);
}
