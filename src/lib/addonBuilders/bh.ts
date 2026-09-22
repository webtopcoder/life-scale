import { baseDoc, type AddonDoc, type AddonPayload } from './types';

type Domain = 'cognitive' | 'vascular' | 'sleep' | 'movement' | 'sensory' | 'mood' | 'reserve';
type Status = 'Strong' | 'Stable' | 'Needs Attention' | 'Priority Area';

interface DomainResult { domain: Domain; score: number; status: Status }

const LABEL: Record<Domain, string> = {
  cognitive: 'Thinking & Memory',
  vascular: 'Heart & Circulation',
  sleep: 'Sleep & Recovery',
  movement: 'Movement',
  sensory: 'Hearing & Vision',
  mood: 'Mood & Stress',
  reserve: 'Mental Reserve',
};

/** Plain-language band, no numbers (house rule for Brain Health). */
function band(status: Status): 'Steady' | 'Building' | 'Priority' {
  if (status === 'Strong') return 'Steady';
  if (status === 'Stable') return 'Building';
  return 'Priority';
}

interface BhData {
  domains: DomainResult[];
  top3: DomainResult[];
  focusLabel: string;
  flaggedCount: number;
}

function read(payload: AddonPayload): BhData {
  const result = (payload.result as { domains?: DomainResult[] } | undefined) ?? {};
  const domains = Array.isArray(result.domains) ? result.domains : [];
  const top3 = Array.isArray(payload.top3) ? (payload.top3 as DomainResult[]) : domains.slice(0, 3);
  return {
    domains,
    top3,
    focusLabel: String(payload.focus_label ?? 'your chosen focus'),
    flaggedCount: Number(payload.flagged_count ?? 0),
  };
}

function find(domains: DomainResult[], d: Domain): DomainResult {
  return domains.find((x) => x.domain === d) ?? { domain: d, score: 0.4, status: 'Stable' };
}

function bandCopy(b: string, area: string): string {
  if (b === 'Steady') return `${area} is currently one of your steadier areas. Your job here is protection, not repair — keep what already works and do not let it drift while you fix something else.`;
  if (b === 'Building') return `${area} is in the middle. Nothing is alarming, but nothing is protected either. Small consistent changes move this band faster than any other.`;
  return `${area} came through as a priority. That does not mean damage — it means this is where your daily habits are working against you, and where the same effort buys the most back.`;
}


/** No domain results = nothing honest to say. */
function bhMissing(payload: AddonPayload): boolean {
  const result = (payload.result as { domains?: unknown[] } | undefined) ?? {};
  return !Array.isArray(result.domains) || result.domains.length < 3;
}

function bhFallback(title: string): AddonDoc {
  return baseDoc(title, 'Your Brain Health check-in is not attached yet', [
    {
      heading: 'We need your check-in answers first',
      paragraphs: [
        'This report is written entirely from your own Brain Health answers. They are not attached to your account yet, and we will not fill the gap with generic advice you could find anywhere.',
        'Take or re-take the Brain Health check-in and this report rebuilds itself automatically from your real answers. It stays in your dashboard and there is nothing more to pay.',
      ],
    },
  ]);
}

/* ------------------- 1. Sleep & Recovery Report ($1) ------------------- */

export function buildBhSleepReport(payload: AddonPayload): AddonDoc {
  if (bhMissing(payload)) return bhFallback('Sleep & Recovery Report');
  const { domains } = read(payload);
  const sleep = find(domains, 'sleep');
  const mood = find(domains, 'mood');
  const b = band(sleep.status);

  return baseDoc(
    'Sleep & Recovery Report',
    `Your sleep picture: ${b}`,
    [
      {
        heading: 'Where you stand',
        paragraphs: [
          bandCopy(b, 'Sleep and recovery'),
          'Sleep is the one area that changes everything else on your check-in. Thinking, mood, appetite, and movement all get easier when nights get better, and all get harder when they do not. That is why this is worth treating first even if it is not the loudest problem you have.',
          `Your mood and stress readings came through as ${band(mood.status).toLowerCase()}, which matters here: sleep and stress feed each other in both directions. Fixing the night usually softens the day.`,
        ],
      },
      {
        heading: 'The four levers that actually work',
        bullets: [
          'A fixed wake time, seven days a week. Wake time anchors the whole rhythm — bedtime follows it, not the other way round.',
          'Light in the first hour after waking. Outdoors if possible, even on a grey day. This is the strongest signal your body clock receives.',
          'A hard stop on caffeine eight hours before bed. Most people underestimate how long it lingers.',
          'A wind-down that starts before you feel tired. Dim the room, drop the screens, keep it boring and repeatable.',
        ],
      },
      {
        heading: 'Your first week',
        table: {
          columns: ['Day', 'One thing to do'],
          rows: [
            ['1', 'Pick your wake time. Write it down. It does not change again this week.'],
            ['2', 'Get outside within an hour of waking for ten minutes.'],
            ['3', 'Set your caffeine cut-off and stick to it.'],
            ['4', 'Move your last screen 30 minutes earlier than usual.'],
            ['5', 'Repeat days 1 to 4. Change nothing new.'],
            ['6', 'Note how hard falling asleep felt, in one sentence.'],
            ['7', 'Review the week. Keep the two changes that felt easiest.'],
          ],
        },
      },
      {
        heading: 'What is probably going wrong at night',
        intro: 'These are the four most common patterns. Yours is usually one of them, not all four.',
        bullets: [
          'Falling asleep is fine, but you wake at 3am and think. This is usually an unfinished-day problem rather than a sleep problem — the written brain-dump before bed does more than any sleep aid.',
          'Falling asleep takes an hour. Usually a wind-down that starts too late, or a bedroom that is too warm or too bright.',
          'You sleep eight hours and wake unrefreshed. Look at alcohol, late meals, and a wake time that moves around by more than an hour.',
          'You are fine on weekdays and wrecked at weekends. That is a rhythm problem: a two-hour lie-in on Saturday costs you Monday and Tuesday.',
        ],
        paragraphs: [
          'Pick the line that sounds most like you and fix only that. Sleep advice fails when people apply all of it at once and cannot tell what helped.',
        ],
      },
      {
        heading: 'Recovery is more than sleep',
        paragraphs: [
          'Recovery also happens in the day, and daytime recovery is what decides how easily you fall asleep at night. Long stretches of unbroken demand keep your system switched on, and a body that has been switched on for fourteen hours does not switch off in ten minutes because you got into bed.',
          'Two or three deliberate gaps in the day — genuinely doing nothing, not switching screens — will do more for your nights in week one than any change to your bedroom.',
        ],
        bullets: [
          'One gap mid-morning, one after lunch, one before the day ends.',
          'Two minutes each is enough. The point is the interruption, not the length.',
          'No phone in the gap. Scrolling is a different activity, not a rest.',
        ],
      },
      {
        heading: 'What to expect',
        paragraphs: [
          'The first three nights often feel worse, not better, because you are shifting a rhythm that has settled. That is normal and passes. Judge this after ten days, not after two.',
        ],
        callout: {
          label: 'Track it in your dashboard',
          text: 'Log your wake time daily in the Brain Health dashboard. The plan works because it is recorded, not because it is remembered.',
        },
      },
    ],
  );
}

/* -------------------- 2. Stress Load Report ($1) -------------------- */

export function buildBhStressReport(payload: AddonPayload): AddonDoc {
  if (bhMissing(payload)) return bhFallback('Stress & Mood Report');
  const { domains } = read(payload);
  const mood = find(domains, 'mood');
  const cognitive = find(domains, 'cognitive');
  const b = band(mood.status);

  return baseDoc(
    'Stress Load Report',
    `Your stress load: ${b}`,
    [
      {
        heading: 'What your answers showed',
        paragraphs: [
          bandCopy(b, 'Mood and stress'),
          `Your thinking and memory answers landed in the ${band(cognitive.status).toLowerCase()} band. Sustained stress is one of the most common reasons thinking feels foggy without anything actually being wrong with memory — attention is being spent elsewhere, so less gets encoded in the first place.`,
          'Stress is not something you eliminate. It is a load you manage, and the two things that decide whether it harms you are how long it stays switched on and whether you recover between episodes.',
        ],
      },
      {
        heading: 'Where load usually hides',
        bullets: [
          'Unfinished decisions. An open loop costs more than a hard task.',
          'Contact without recovery — back-to-back demands with no gap between them.',
          'Sleep debt, which lowers your tolerance for everything else on this list.',
          'Low control situations. Predictable difficulty is far cheaper than unpredictable ease.',
        ],
      },
      {
        heading: 'Three recovery tools',
        table: {
          columns: ['Tool', 'How long', 'When to use it'],
          rows: [
            ['Slow breathing — longer out than in', '2 minutes', 'Immediately after a spike, not hours later'],
            ['A walk with no phone', '10-15 minutes', 'Between demands, to close one before opening the next'],
            ['A written brain-dump of open loops', '5 minutes', 'End of the working day, every day'],
          ],
        },
      },
      {
        heading: 'This week',
        bullets: [
          'Pick one recovery tool. One. Use it daily rather than three tools occasionally.',
          'Insert a five-minute gap between your two heaviest commitments.',
          'Write down open loops before you stop working, so your evening is not doing that job for you.',
          'Notice which day of the week is worst. Protect that day first.',
        ],
      },
      {
        heading: 'Your two-week load audit',
        intro: 'You cannot manage a load you have not measured. Two weeks is enough to see the shape of it.',
        table: {
          columns: ['What to note', 'When', 'What you are looking for'],
          rows: [
            ['Load out of 5', 'End of each day', 'Which days repeat as your heaviest'],
            ['The trigger, in one line', 'When it happens', 'Whether it is people, deadlines, or uncertainty'],
            ['Did you recover?', 'End of each day', 'Whether recovery happened at all, not whether it worked'],
            ['Hours of sleep', 'Each morning', 'How closely load tracks the night before'],
          ],
        },
        paragraphs: [
          'After fourteen days you will have something more useful than any score: a list of the two or three situations that account for most of your load. Almost everyone finds that the same handful of triggers repeat, which means the fix is narrower than it feels.',
        ],
      },
      {
        heading: 'What stress does to thinking',
        paragraphs: [
          'Under sustained load, working memory shrinks first. That is why you re-read the same paragraph, lose the thread mid-sentence, or forget why you walked into a room — the information was never encoded, because attention was spent guarding something else.',
          'This is worth knowing because it changes the fix. The answer to foggy thinking under load is not to try harder to concentrate; it is to lower the load or to externalise the memory. Lists, notes, and single-tasking are not productivity tricks here, they are compensation for a real and temporary reduction in capacity.',
        ],
        bullets: [
          'Write things down rather than holding them. Externalising is cheaper than remembering.',
          'One task at a time, deliberately. Switching costs more when load is high.',
          'Do the thinking-heavy work in your best block, not whenever a gap appears.',
        ],
      },
      {
        heading: 'When to get help',
        paragraphs: [
          'If low mood, loss of interest, or persistent worry has lasted more than two weeks and is affecting how you function, speak to a clinician. This report is for everyday load management and is not a diagnosis.',
        ],
      },
    ],
  );
}

/* ------------- 3. Nutrition & Movement Report ($1) ------------- */

export function buildBhNutritionMovement(payload: AddonPayload): AddonDoc {
  if (bhMissing(payload)) return bhFallback('Nutrition & Movement Report');
  const { domains } = read(payload);
  const movement = find(domains, 'movement');
  const vascular = find(domains, 'vascular');
  const mb = band(movement.status);
  const vb = band(vascular.status);

  return baseDoc(
    'Nutrition & Movement Report',
    `Movement: ${mb} · Heart and circulation: ${vb}`,
    [
      {
        heading: 'Why these two sit together',
        paragraphs: [
          'Your brain does not have its own fuel store. It depends entirely on what your circulation delivers, minute by minute, which is why movement and what you eat show up in cognitive answers so reliably.',
          bandCopy(mb, 'Movement'),
          bandCopy(vb, 'Heart and circulation'),
        ],
      },
      {
        heading: 'Movement that counts',
        intro: 'Volume beats intensity at this stage. The goal is a week you can repeat, not a week you can survive.',
        bullets: [
          'Aim for a brisk 20 to 30 minutes most days — brisk means you can talk but would rather not sing.',
          'Break up sitting every hour with two minutes on your feet. This affects circulation independently of exercise.',
          'Add two short sessions a week of anything that loads your muscles: stairs, bags, bodyweight, resistance bands.',
          'Choose something you would still do in bad weather. Weather-dependent plans fail in week three.',
        ],
      },
      {
        heading: 'Eating for a steady brain',
        bullets: [
          'Protein at breakfast steadies the whole day — it flattens the late-morning dip more than caffeine does.',
          'Oily fish, olive oil, nuts, and leafy greens are the pattern with the strongest support behind it. Pattern, not single foods.',
          'Watch liquid sugar first. It is the easiest thing on this list to remove and the fastest to notice.',
          'Hydrate before you feel thirsty; mild dehydration reads as tiredness and irritability.',
        ],
      },
      {
        heading: 'What usually stops this working',
        bullets: [
          'Starting at four sessions a week. Two that happen beat four that do not.',
          'Making it weather-dependent, location-dependent, or mood-dependent.',
          'Treating food as all-or-nothing, so one bad meal ends the week.',
          'Measuring the wrong thing. Days completed is the metric, not weight or pace.',
        ],
        paragraphs: [
          'Both of these areas respond to consistency far more than intensity, and consistency is a design problem rather than a willpower problem. If a plan needs you to be motivated, it is the wrong plan.',
        ],
      },
      {
        heading: 'A repeatable week',
        table: {
          columns: ['Day', 'Movement', 'Food focus'],
          rows: [
            ['Mon', '25-minute brisk walk', 'Protein at breakfast'],
            ['Tue', 'Short strength session', 'Swap one snack for nuts or fruit'],
            ['Wed', '25-minute brisk walk', 'Add a green vegetable to dinner'],
            ['Thu', 'Hourly stand-up breaks only', 'No liquid sugar today'],
            ['Fri', 'Short strength session', 'Oily fish or a plant-protein equivalent'],
            ['Sat', 'Longer walk, 40 minutes', 'Cook one meal from scratch'],
            ['Sun', 'Rest and plan the week', 'Set up Monday breakfast tonight'],
          ],
        },
        callout: {
          label: 'Log it',
          text: 'Use the habit tracker in your Brain Health dashboard. Two weeks of logged days will tell you more than any single reading.',
        },
      },
    ],
  );
}

/* --------- 4. Focus & Energy Day Map ($3) --------- */

export function buildBhDayMap(payload: AddonPayload): AddonDoc {
  if (bhMissing(payload)) return bhFallback('Your Brain-Healthy Day Map');
  const { domains, focusLabel } = read(payload);
  const sleep = find(domains, 'sleep');
  const mood = find(domains, 'mood');
  const cognitive = find(domains, 'cognitive');

  const sleepB = band(sleep.status);
  const anchor = sleepB === 'Priority' ? 'a protected wake time' : 'your strongest morning block';

  return baseDoc(
    'Focus & Energy Day Map',
    `An hour-by-hour day built around ${focusLabel.toLowerCase()}`,
    [
      {
        heading: 'How this map was built',
        paragraphs: [
          `You told us your focus is ${focusLabel.toLowerCase()}, so the day below is organised around ${anchor} rather than around a generic productivity template.`,
          `Your sleep answers sit in the ${sleepB.toLowerCase()} band, your mood and stress in the ${band(mood.status).toLowerCase()} band, and your thinking and memory in the ${band(cognitive.status).toLowerCase()} band. Those three decide where your good hours are and how quickly you lose them.`,
          'Treat this as a shape, not a schedule. Shift every row by an hour if your day starts later — the order matters far more than the clock time.',
        ],
      },
      {
        heading: 'Your day map',
        table: {
          columns: ['Time', 'What the day should be doing', 'Why'],
          rows: [
            ['On waking', 'Same wake time, light, water, no phone for 15 minutes', 'Anchors the rhythm every other block depends on'],
            ['First hour', 'Movement or outdoor light, then breakfast with protein', 'Sets alertness and flattens the late-morning dip'],
            ['Mid-morning', 'Your hardest thinking task, one thing only', 'This is your sharpest block; do not spend it on admin'],
            ['Late morning', 'Second focused block, shorter', 'Still strong, but tolerance for interruption is lower'],
            ['Lunch', 'Eat away from your desk, then walk 10 minutes', 'The walk is what prevents the afternoon slump'],
            ['Early afternoon', 'Meetings, calls, low-stakes admin', 'Naturally your dip; put people-facing work here'],
            ['Mid-afternoon', 'Stand up every hour, short task batches', 'Circulation breaks restore attention cheaply'],
            ['Late afternoon', 'One clean-up block, then a written open-loop dump', 'Stops the evening doing your worrying for you'],
            ['Evening', 'Caffeine already stopped, dim light, boring wind-down', 'Protects tomorrow morning, which is the real goal'],
          ],
        },
      },
      {
        heading: 'Non-negotiables',
        bullets: [
          'One hard task per day in the mid-morning block. Two hard tasks means neither gets your best hour.',
          'The post-lunch walk is not optional in this plan. It is the highest-return ten minutes in the day.',
          'No new inputs in the last hour before bed — inputs are what keep the wind-down from working.',
        ],
      },
      {
        heading: 'Your energy curve, and why it is not a flaw',
        paragraphs: [
          'Almost everyone has one strong block in the morning, a genuine dip in the early afternoon, and a smaller second rise later on. The dip is not a discipline failure and it is not caused by lunch — it is part of your daily rhythm and it happens whether you eat or not.',
          'The practical consequence is that the work you schedule matters more than the effort you apply. Hard thinking in the dip costs roughly twice the time for the same output, and the hours you spend fighting it are hours taken from the block where the same task would have been easy.',
          'So the map does not try to remove the dip. It puts people, calls, and low-stakes work into it, and protects the two blocks either side.',
        ],
      },
      {
        heading: 'Three ways to protect the mid-morning block',
        bullets: [
          'Decide the task the night before. Deciding at the time consumes the block you are trying to protect.',
          'Start before you open messages. Once you have read them, the block belongs to other people.',
          'Give it a visible end. A block with no end drifts into the dip and loses both.',
          'Defend it once a week out loud. Blocks that are never defended stop existing within a month.',
        ],
      },
      {
        heading: 'What to do on a broken day',
        paragraphs: [
          'Some days the map will be impossible: a bad night, an early start, a family morning, a shift that lands wrong. On those days do not attempt a compressed version of the whole thing, because compressing it is what makes people abandon it.',
          'Keep two rows and drop the rest: the wake time and the post-lunch walk. Those two carry most of the value, they survive almost any disruption, and keeping them means tomorrow starts from the map rather than from scratch.',
        ],
        bullets: [
          'Bad night: keep the wake time anyway, and move the hard task to late morning.',
          'No control over the morning: treat your first quiet hour as mid-morning, whenever it lands.',
          'Fully lost day: do the walk, log it, and start again tomorrow. One row still counts.',
        ],
      },
      {
        heading: 'Adapting the map',
        paragraphs: [
          'Shift workers: keep the order and treat your wake time as morning, whenever it falls. Parents and carers: protect the mid-morning block on the days you can and accept the days you cannot — consistency across a week beats perfection on a day.',
        ],
        callout: {
          label: 'Next step',
          text: 'Run this map for seven days and log each day in your dashboard. Then adjust one row, not five.',
        },
      },
    ],
  );
}

/* --------- 5. 30-Day Habit Planner ($5) --------- */

export function buildBh30DayPlanner(payload: AddonPayload): AddonDoc {
  if (bhMissing(payload)) return bhFallback('Your 30-Day Brain Health Planner');
  const { top3, focusLabel } = read(payload);
  const priority = top3[0] ?? { domain: 'sleep' as Domain, score: 0.5, status: 'Stable' as Status };
  const second = top3[1] ?? { domain: 'movement' as Domain, score: 0.5, status: 'Stable' as Status };

  const HABIT: Record<Domain, string[]> = {
    sleep: ['Same wake time', '10 minutes of morning light', 'Caffeine cut-off held', 'Screens down 30 minutes earlier'],
    movement: ['20-minute brisk walk', 'Hourly stand-up breaks', 'Short strength session', 'Stairs instead of the lift'],
    vascular: ['20-minute brisk walk', 'No liquid sugar today', 'Added a vegetable to two meals', 'Checked in on your numbers with your clinician'],
    cognitive: ['One focused block, no phone', 'Learned something new for 15 minutes', 'One dashboard drill', 'Wrote down what you learned'],
    mood: ['Two minutes of slow breathing', '10-minute walk with no phone', 'Wrote down open loops', 'One real conversation'],
    sensory: ['Lowered headphone volume', 'Screen break every hour', 'Booked or confirmed a hearing or vision check', 'Better light where you read'],
    reserve: ['15 minutes of learning', 'Contacted one person', 'Did something slightly unfamiliar', 'Read for pleasure'],
  };

  const start = new Date();
  const dayLabel = (offset: number) =>
    new Date(start.getTime() + offset * 86400000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const rows = Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    if (day % 7 === 0) {
      return [String(day), dayLabel(i), 'Review', 'Score the week honestly, keep what held, drop what did not'];
    }
    const useSecond = day % 3 === 0;
    const dom = useSecond ? second.domain : priority.domain;
    const list = HABIT[dom];
    return [String(day), dayLabel(i), LABEL[dom], list[(day - 1) % list.length]];
  });

  return baseDoc(
    '30-Day Habit Planner',
    `Built around ${LABEL[priority.domain]}, with ${LABEL[second.domain]} in support`,
    [
      {
        heading: 'How this plan was built',
        paragraphs: [
          `Your check-in put ${LABEL[priority.domain]} first and ${LABEL[second.domain]} second, and your stated focus is ${focusLabel.toLowerCase()}. The plan spends most days on the first area because changing one thing properly beats changing four things badly.`,
          'Each day carries one action. If it takes more than fifteen minutes, you have made it too big — shrink it rather than skip it.',
        ],
      },
      {
        heading: 'Weekly checkpoints',
        table: {
          columns: ['Week', 'What you are building', 'How you will know it worked'],
          rows: [
            ['1', 'The habit exists at all', 'You did it on at least five days'],
            ['2', 'The habit survives a bad day', 'You did it on a day you did not want to'],
            ['3', `${LABEL[second.domain]} joins in`, 'Both areas have logged days'],
            ['4', 'It stops feeling like a plan', 'You did it without checking the planner'],
          ],
        },
      },
      {
        heading: 'Your 30 days',
        table: {
          columns: ['Day', 'Date', 'Area', 'Action'],
          rows,
        },
      },
      {
        heading: 'How to make a daily action stick',
        intro: 'The action matters less than the structure around it. All four of these are worth more than motivation.',
        bullets: [
          'Attach it to something you already do without thinking — after coffee, after brushing your teeth, on the way back from the school run.',
          'Shrink it until it is almost embarrassing. A five-minute version done daily beats a twenty-minute version done twice.',
          'Decide in advance what the bad-day version looks like, so a bad day has a plan rather than a gap.',
          'Log it where you will see the log. A streak you cannot see is not a streak.',
        ],
        paragraphs: [
          'Most habit attempts fail in the second week, and almost never because the action was too hard. They fail because nothing in the day reliably triggered them and there was no smaller version available when time ran out.',
        ],
      },
      {
        heading: 'What you should notice, and when',
        table: {
          columns: ['Timeframe', 'What tends to change', 'What will not change yet'],
          rows: [
            ['Days 1-7', 'The action starts to feel automatic in its slot', 'How you feel — do not judge the plan on this week'],
            ['Days 8-14', 'Energy is steadier in the afternoon', 'Sleep quality, if that is your priority area'],
            ['Days 15-21', 'Fewer bad days in a row, even if bad days remain', 'Anything you have not been logging'],
            ['Days 22-30', 'The habit survives disruption', 'Your check-in bands, which move slower than habits'],
          ],
        },
        paragraphs: [
          'Progress in this area is unglamorous and slightly boring, which is exactly why it works. The bands on your check-in move last, well after the habits do, so use the log as your evidence for the first month rather than the result.',
        ],
      },
      {
        heading: 'After day 30',
        paragraphs: [
          'The plan ends at thirty days but the point of it does not. One habit held for a month is worth more than four attempted for a week, so the correct move on day thirty-one is almost never to add three new things — it is to keep the one that survived and add exactly one more.',
          'Re-take your check-in at the end of the month. The bands will have moved less than the habits did, and that gap is normal: the check-in reflects a rolling picture of the last several weeks, so a month of change shows up as a partial move rather than a jump.',
          'If nothing moved at all, look at the log rather than the plan. Almost every flat month turns out to be a month with fewer completed days than remembered, and that is a scheduling problem with a straightforward fix.',
        ],
        bullets: [
          'Keep the habit that survived. Do not renegotiate it.',
          'Add one new action, in a different part of the day.',
          'Re-take the check-in and compare bands, not feelings.',
          'Use your Brain Health dashboard to carry the streak into the next cycle.',
        ],
      },
      {
        heading: 'Rules that keep this alive',
        bullets: [
          'Never double up after a missed day. Skip it and continue.',
          'Log the day even when you failed it — the log is the habit.',
          'Do not re-take the check-in before day 30. Give the changes time to show.',
        ],
        callout: {
          label: 'Keep it in one place',
          text: 'Mirror this plan in your Brain Health dashboard habit tracker so your streak lives with the rest of your progress.',
        },
      },
    ],
  );
}
