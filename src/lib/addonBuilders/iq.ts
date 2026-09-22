import { baseDoc, type AddonDoc, type AddonPayload, type AddonSection } from './types';
import {
  analyseIqItems, accuracyByCategory, categoryLabel, typeLabel, secondsLabel,
} from './iqItems';


type Cat = 'logic' | 'pattern' | 'spatial' | 'speed' | 'self';

const CAT_LABEL: Record<Cat, string> = {
  logic: 'Logical Reasoning',
  pattern: 'Pattern Recognition',
  spatial: 'Spatial Intelligence',
  speed: 'Processing Speed',
  self: 'Self-Awareness',
};

const CAT_MEANING: Record<Cat, string> = {
  logic: 'how cleanly you move from premises to a conclusion without leaking assumptions along the way',
  pattern: 'how quickly you notice the rule underneath a sequence instead of guessing at the next item',
  spatial: 'how well you hold and rotate an object in your head while keeping its parts consistent',
  speed: 'how fast you can decide once the information in front of you is sufficient',
  self: 'how accurately you judge whether your own answer is right before you find out',
};

const CAT_DAILY: Record<Cat, string> = {
  logic: 'It shows up when a plan sounds convincing but one step quietly does not follow from the one before it.',
  pattern: 'It shows up when a problem repeats in a new costume and you either recognise it instantly or start over.',
  spatial: 'It shows up when you read a diagram, pack a space, or picture how two moving things will meet.',
  speed: 'It shows up under time pressure, where the cost of hesitating is higher than the cost of a small error.',
  self: 'It shows up when you decide how much to trust your own first answer — over-trust and under-trust both cost you.',
};

const CAT_FIX: Record<Cat, string[]> = {
  logic: [
    'Write the conclusion first, then list every step it depends on. Delete any step you cannot defend out loud.',
    'Practise spotting the one invalid link in short arguments rather than judging the whole argument at once.',
    'When stuck, argue the opposite position for sixty seconds — weak logic collapses fastest under contradiction.',
  ],
  pattern: [
    'On every sequence, name the rule in words before choosing an answer. No word, no answer.',
    'Look for changes in two directions (across and down) before committing to one.',
    'When two rules fit, pick the simpler one — real patterns are rarely elaborate.',
  ],
  spatial: [
    'Rotate one feature at a time and track it, instead of trying to spin the whole shape at once.',
    'Sketch the transformation rather than holding it in memory. Externalising frees working memory.',
    'Practise mirror-versus-rotation discrimination, which is where most spatial errors actually come from.',
  ],
  speed: [
    'Give yourself a hard cap per item. Answer and move on — accuracy on abandoned items is worth zero.',
    'Read the answer options before deep-processing the problem. It often narrows the work by half.',
    'Train in short timed blocks, not long untimed sessions. Speed only improves under time pressure.',
  ],
  self: [
    'Before revealing an answer, rate your confidence. Compare ratings to outcomes weekly.',
    'Keep a short list of the problem types where you are usually wrong while feeling right.',
    'Slow down specifically on high-confidence answers — that is where unexamined errors hide.',
  ],
};

interface IqAnswer {
  questionId: number;
  selectedOption: number;
  timeSpent: number;
  isCorrect: boolean | null;
}

interface IqData {
  score: number;
  scores: Record<string, number>;
  percentiles: Record<string, number>;
  answers: IqAnswer[];
}

function read(payload: AddonPayload): IqData {
  const scores = (payload.scores as Record<string, number>) ?? {};
  return {
    score: Math.round(Number(payload.score ?? 0)),
    scores,
    percentiles: (payload.percentiles as Record<string, number>) ?? {},
    answers: Array.isArray(payload.answers) ? (payload.answers as IqAnswer[]) : [],
  };
}

function ranked(scores: Record<string, number>): { cat: Cat; score: number }[] {
  const cats: Cat[] = ['logic', 'pattern', 'spatial', 'speed', 'self'];
  return cats
    .map((cat) => ({ cat, score: Math.round(Number(scores[cat] ?? 0)) }))
    .sort((a, b) => b.score - a.score);
}

function seconds(ms: number): string {
  return `${Math.max(0, Math.round(ms / 1000))}s`;
}

/** True when we have no usable category scores to write a score-based report from. */
function noScores(payload: AddonPayload): boolean {
  const { score, scores } = read(payload);
  const vals = ['logic', 'pattern', 'spatial', 'speed', 'self']
    .map((k) => Number(scores[k] ?? 0))
    .filter((n) => n > 0);
  return score <= 0 || vals.length < 2;
}

function missingResultDoc(title: string, subtitle: string): AddonDoc {
  return baseDoc(title, subtitle, [
    {
      heading: 'Your result is not attached yet',
      paragraphs: [
        'This report is written from your own IQ test result, and that result is not attached to your account yet — so writing it now would mean inventing numbers, which we will not do.',
        'Take (or re-take) the IQ test and this report rebuilds itself automatically from your real answers, at no extra charge. It is already paid for and stays in your dashboard.',
      ],
    },
  ]);
}


/* ------------------------- 1. Weakness Report ------------------------- */

export function buildIqWeaknessReport(payload: AddonPayload): AddonDoc {
  if (noScores(payload)) return missingResultDoc('Your Weakness Report', 'Your two lowest categories');
  const { score, scores } = read(payload);
  const order = ranked(scores);
  const weakest = order.slice(-2).reverse();
  const strongest = order[0];

  const sections = [
    {
      heading: 'What this report is',
      paragraphs: [
        `Your overall score of ${score} is an average, and averages hide the two areas that are actually holding it down. This report takes your two lowest categories and explains them properly: what each one measures, how it behaves in ordinary life, and what changes it.`,
        'Nothing here is a verdict. Every category below responds to deliberate practice, and the lowest one almost always responds fastest because it has the most room to move.',
      ],
    },
    ...weakest.map((w, i) => ({
      heading: `${i === 0 ? 'Priority area' : 'Second priority'}: ${CAT_LABEL[w.cat]} (${w.score}/100)`,
      paragraphs: [
        `${CAT_LABEL[w.cat]} measures ${CAT_MEANING[w.cat]}. At ${w.score} out of 100, you are not failing at it — you are relying on other strengths to carry work that this category should be doing.`,
        CAT_DAILY[w.cat],
        `Compared against your strongest area, ${CAT_LABEL[strongest.cat]} at ${strongest.score}, the gap is ${Math.max(0, strongest.score - w.score)} points. Gaps that wide usually mean you have built a habit of routing problems away from the weaker skill instead of training it.`,
      ],
      bullets: CAT_FIX[w.cat],
    })),
    {
      heading: 'The compounding effect',
      paragraphs: [
        `Raising ${CAT_LABEL[weakest[0].cat]} does not only lift that one number. Because your overall score is built from all five categories, the lowest one drags hardest — and the same work usually improves ${CAT_LABEL[weakest[1].cat]} as a side effect, since both suffer from the same rushed-first-answer habit.`,
      ],
      callout: {
        label: 'Where to start',
        text: `Spend the next two weeks on ${CAT_LABEL[weakest[0].cat]} only. One area at a time beats five areas at once, every time.`,
      },
    },
  ];

  return baseDoc(
    'Your Weakness Report',
    `The two categories holding your ${score} down — and what moves them`,
    sections,
  );
}

/* --------------------- 2. Answer-by-Answer Breakdown --------------------- */

export function buildIqAnswerBreakdown(payload: AddonPayload): AddonDoc {
  const { score } = read(payload);
  const a = analyseIqItems(payload as Record<string, unknown>);

  if (!a.hasItemData) {
    return baseDoc(
      'Answer-by-Answer Breakdown',
      'Your item-level log',
      [
        {
          heading: 'Your item log is not available yet',
          paragraphs: [
            'This report is built from the individual answers recorded during your test, and that detail is not attached to your completion. Re-take the IQ test and this report will rebuild itself automatically with the full log.',
            `Everything else from your result still stands: your overall score of ${score} and your category breakdown are unaffected.`,
          ],
        },
      ],
    );
  }

  const scoredItems = a.items.filter((i) => i.kind === 'scored');
  const answeredScored = scoredItems.filter((i) => i.answered);
  const missedItems = answeredScored.filter((i) => i.isCorrect === false);
  const fastMisses = missedItems.filter((i) => i.timeMs > 0 && i.timeMs < a.avgScoredMs);
  const slowMisses = missedItems.length - fastMisses.length;
  const selfItems = a.items.filter((i) => i.kind === 'self-report');

  const showPrompt = a.hasQuestionMeta && a.items.some((i) => i.prompt);
  const columns = showPrompt
    ? ['#', 'Item', 'Type', 'Result', 'Your answer', 'Time']
    : ['#', 'Type', 'Result', 'Your answer', 'Time'];

  const resultOf = (i: (typeof a.items)[number]) => {
    if (!i.answered) return 'Skipped';
    if (i.kind === 'self-report') return 'Self-report';
    return i.isCorrect ? 'Correct' : 'Missed';
  };

  const rows = a.items
    .filter((i) => i.kind === 'scored')
    .map((i) => {
      const base = [
        String(i.position),
        typeLabel(i.type),
        resultOf(i),
        i.answered ? i.answerLabel : '—',
        i.answered ? secondsLabel(i.timeMs) : '—',
      ];
      return showPrompt ? [String(i.position), i.prompt || categoryLabel(i.category), ...base.slice(1)] : base;
    });

  const catRows = accuracyByCategory(a).map((c) => [
    c.label,
    `${c.correct} of ${c.total}`,
    `${c.pct}%`,
  ]);

  const sections: AddonSection[] = [
    {
      heading: 'Summary',
      intro: 'Only graded items count towards accuracy. Self-report items have no right answer and are reported separately.',
      pairs: [
        { label: 'Overall score', value: String(score) },
        { label: 'Questions in your test', value: String(a.total) },
        { label: 'Graded items', value: String(a.scoredTotal) },
        { label: 'Self-report items', value: String(a.selfReportTotal) },
        { label: 'Graded items answered', value: `${a.scoredAnswered} of ${a.scoredTotal}` },
        { label: 'Correct', value: `${a.correct} of ${a.scoredAnswered} answered (${a.accuracyPct}%)` },
        ...(a.skippedTotal > 0
          ? [{ label: 'Skipped', value: `${a.skippedTotal} item${a.skippedTotal === 1 ? '' : 's'}` }]
          : []),
        { label: 'Average time per graded item', value: secondsLabel(a.avgScoredMs) },
      ],
      paragraphs: [
        `Your test contained ${a.total} questions: ${a.scoredTotal} graded and ${a.selfReportTotal} self-report. Accuracy below is calculated across the ${a.scoredAnswered} graded items you answered — the self-report items are excluded entirely, because agreeing or disagreeing with a statement about yourself cannot be right or wrong.`,
        missedItems.length
          ? `Of the ${missedItems.length} graded items you missed, ${fastMisses.length} were answered faster than your own average and ${slowMisses} were answered slower. Fast misses are almost always recognition slips — you saw something familiar and stopped looking. Slow misses are genuine gaps in the underlying rule.`
          : 'You did not miss a single graded item you answered, which is rare. The useful signal for you is pacing rather than accuracy — see how long each item took below.',
        a.skippedTotal > 0
          ? `${a.skippedTotal} item${a.skippedTotal === 1 ? ' was' : 's were'} left unanswered. Skipped items are listed below as "Skipped" and are never counted as wrong, but they are the cheapest points available to you on a re-test.`
          : 'You answered every item presented to you, so nothing was left on the table.',
      ],
    },
  ];

  if (catRows.length > 1) {
    sections.push({
      heading: 'Accuracy by category',
      intro: 'Derived from the category each graded item belongs to in your test.',
      table: { columns: ['Category', 'Correct', 'Accuracy'], rows: catRows },
    });
  }

  sections.push({
    heading: 'Graded item log',
    intro: `All ${a.scoredTotal} graded items, in the order you saw them.`,
    table: { columns, rows },
  });

  if (selfItems.length) {
    sections.push({
      heading: 'Your self-report answers',
      intro: 'These items measure how you see yourself. There is no correct answer, so they are scored as self-awareness rather than accuracy.',
      table: {
        columns: showPrompt ? ['#', 'Statement', 'Your answer'] : ['#', 'Type', 'Your answer'],
        rows: selfItems.map((i) =>
          showPrompt
            ? [String(i.position), i.prompt || 'Self-report item', i.answered ? i.answerLabel : 'Not answered']
            : [String(i.position), typeLabel(i.type), i.answered ? i.answerLabel : 'Not answered'],
        ),
      },
      paragraphs: [
        'Read these as a set rather than one at a time. Where your self-report is more confident than your graded accuracy, you are over-trusting your first answer; where it is less confident, you are leaving correct answers behind because they did not feel certain enough.',
      ],
    });
  }

  sections.push({
    heading: 'How to use this',
    bullets: [
      'Re-attempt only your fast misses first. They are the cheapest points you own.',
      'For slow misses, do not re-attempt — learn the rule type first, then re-attempt.',
      'Any graded item under five seconds is a guess, whether it landed or not. Treat those as unanswered.',
      ...(a.skippedTotal > 0 ? ['Work through your skipped items untimed before you re-test.'] : []),
    ],
  });

  return baseDoc(
    'Answer-by-Answer Breakdown',
    `All ${a.total} questions from your test, item by item`,
    sections,
  );
}

/* --------------------- 3. Speed vs Accuracy Report --------------------- */

export function buildIqSpeedAccuracy(payload: AddonPayload): AddonDoc {
  const { scores, score } = read(payload);
  const a = analyseIqItems(payload as Record<string, unknown>);
  const speedScore = Math.round(Number(scores.speed ?? 0));

  // Graded, answered items only — self-report items carry no accuracy.
  const graded = a.items.filter((i) => i.kind === 'scored' && i.answered && i.timeMs > 0);
  const avg = a.avgScoredMs;
  const fast = graded.filter((i) => i.timeMs <= avg);
  const slow = graded.filter((i) => i.timeMs > avg);
  const acc = (list: typeof graded) =>
    list.length ? Math.round((list.filter((i) => i.isCorrect).length / list.length) * 100) : 0;
  const fastAcc = acc(fast);
  const slowAcc = acc(slow);

  if (graded.length < 4) {
    return baseDoc(
      'Speed vs Accuracy Report',
      'Your pacing profile',
      [
        {
          heading: 'Not enough timed items to profile your pacing',
          paragraphs: [
            'A pacing profile needs the time you spent on each graded item, and your completion does not carry enough of that detail to say anything honest about it. Re-take the IQ test and this report will rebuild automatically.',
            `Your headline result is unaffected: overall score ${score}, with Processing Speed at ${speedScore} out of 100.`,
          ],
        },
      ],
    );
  }

  const profile =
    fastAcc >= slowAcc + 8
      ? 'Instinct-led'
      : slowAcc >= fastAcc + 8
        ? 'Deliberation-led'
        : 'Even-paced';

  const profileCopy: Record<string, string[]> = {
    'Instinct-led': [
      'You are more accurate when you move quickly than when you slow down. That is more common than people expect, and it usually means your first read of a problem is good and your second read talks you out of it.',
      'The risk is not speed. The risk is revisiting: you change a correct answer into an incorrect one while trying to be careful.',
    ],
    'Deliberation-led': [
      'Your accuracy climbs clearly when you give an item more time. Your first read is a draft, not an answer, and the extra seconds are doing real work rather than adding doubt.',
      'The risk is running out of time on later items, which costs more than any single careful answer gains.',
    ],
    'Even-paced': [
      'Your accuracy holds steady whether you answer quickly or slowly. That means time is not your limiting factor — the underlying rule knowledge is.',
      'Extra seconds will not buy you many more points. Learning more problem types will.',
    ],
  };

  const prescription: Record<string, string[]> = {
    'Instinct-led': [
      'Answer, then move on. Do not revisit unless you can name a concrete reason.',
      'Cap each item at roughly your current average and stop there.',
      'Reserve any spare time for items you skipped, never for items you already answered.',
    ],
    'Deliberation-led': [
      'Take two clean passes: answer everything you can quickly, then return to the rest with the time left.',
      'Set a hard ceiling per item so no single problem eats the pass.',
      'Practise untimed first to build the rule, then timed to compress it.',
    ],
    'Even-paced': [
      'Stop optimising pacing. Spend your practice time on problem types instead.',
      'Work by category, not by mixed set, until each category feels routine.',
      'Re-test pacing only after your weakest category has moved.',
    ],
  };

  const byType = new Map<string, { total: number; correct: number; ms: number }>();
  for (const i of graded) {
    const key = typeLabel(i.type);
    const b = byType.get(key) ?? { total: 0, correct: 0, ms: 0 };
    b.total += 1;
    b.ms += i.timeMs;
    if (i.isCorrect) b.correct += 1;
    byType.set(key, b);
  }

  const sections: AddonSection[] = [
    {
      heading: 'The numbers',
      intro: `Calculated across the ${graded.length} graded items you answered. Your ${a.selfReportTotal} self-report items are excluded — they have no correct answer to be fast or slow about.`,
      pairs: [
        { label: 'Average time per graded item', value: secondsLabel(avg) },
        { label: 'Accuracy on faster-than-average items', value: `${fastAcc}% (${fast.length} items)` },
        { label: 'Accuracy on slower-than-average items', value: `${slowAcc}% (${slow.length} items)` },
        { label: 'Overall graded accuracy', value: `${a.accuracyPct}%` },
        { label: 'Processing Speed category', value: `${speedScore}/100` },
      ],
    },
    {
      heading: `What "${profile}" means`,
      paragraphs: profileCopy[profile],
    },
  ];

  if (byType.size > 1) {
    sections.push({
      heading: 'Pace by item type',
      intro: 'Item types come from your test itself, so this table reflects exactly the mix you were given.',
      table: {
        columns: ['Item type', 'Answered', 'Accuracy', 'Average time'],
        rows: [...byType.entries()]
          .sort((x, y) => y[1].total - x[1].total)
          .map(([label, b]) => [
            label,
            String(b.total),
            `${Math.round((b.correct / b.total) * 100)}%`,
            secondsLabel(Math.round(b.ms / b.total)),
          ]),
      },
    });
  }

  const catRows = accuracyByCategory(a).map((c) => {
    const list = graded.filter((i) => (i.category || 'other') === c.category);
    const ms = list.length ? Math.round(list.reduce((t, i) => t + i.timeMs, 0) / list.length) : 0;
    return [c.label, `${c.correct} of ${c.total}`, `${c.pct}%`, secondsLabel(ms)];
  });
  if (catRows.length > 1) {
    sections.push({
      heading: 'Where your time actually went',
      intro: 'Time and accuracy side by side, per category. This is the table that tells you where slowing down pays and where it does not.',
      table: { columns: ['Category', 'Correct', 'Accuracy', 'Average time'], rows: catRows },
      paragraphs: [
        'Read each row as a trade. A category with high accuracy and high time is costing you points elsewhere — you are buying certainty you already had. A category with low accuracy and low time is the opposite: you are not giving it enough thought to have a chance.',
        'The category worth changing first is the one where you spent the most time for the least accuracy. That is where your effort is being converted into nothing.',
      ],
    });
  }

  sections.push({
    heading: 'The three ways people lose points on time',
    intro: 'Every timing loss falls into one of these. Yours is listed first.',
    bullets: [
      profile === 'Instinct-led'
        ? 'Over-revision (yours): you answer correctly, then talk yourself into a different answer. The fix is a rule, not more care — once answered, move on.'
        : 'Over-revision: answering correctly, then changing it. Costly and invisible, because the first answer is never recorded.',
      profile === 'Deliberation-led'
        ? 'Front-loading (yours): early items absorb time that later, easier items needed. The fix is two passes, never one.'
        : 'Front-loading: spending early time so freely that later items get rushed regardless of difficulty.',
      profile === 'Even-paced'
        ? 'Uniform pacing (yours): giving every item the same time regardless of difficulty, which underserves hard items and overserves easy ones.'
        : 'Uniform pacing: treating a 5-second item and a 45-second item as though they deserve the same budget.',
    ],
    paragraphs: [
      `Across your ${graded.length} timed graded items, your fastest quarter averaged ${secondsLabel(
        Math.round(
          [...graded].sort((x, y) => x.timeMs - y.timeMs)
            .slice(0, Math.max(1, Math.floor(graded.length / 4)))
            .reduce((t, i) => t + i.timeMs, 0) / Math.max(1, Math.floor(graded.length / 4)),
        ),
      )} and your slowest quarter averaged ${secondsLabel(
        Math.round(
          [...graded].sort((x, y) => y.timeMs - x.timeMs)
            .slice(0, Math.max(1, Math.floor(graded.length / 4)))
            .reduce((t, i) => t + i.timeMs, 0) / Math.max(1, Math.floor(graded.length / 4)),
        ),
      )}. The gap between those two numbers is your real pacing range, and it is the number to compress or widen depending on the profile above.`,
    ],
  });

  sections.push({
    heading: 'Your pacing prescription',
    bullets: prescription[profile],
    callout: {
      label: 'One rule to keep',
      text:
        profile === 'Deliberation-led'
          ? 'Never let one item take more than twice your average. Park it and come back.'
          : 'Your first instinct is your best instinct. Answer it and leave it alone.',
    },
  });

  return baseDoc('Speed vs Accuracy Report', `Your pacing profile: ${profile}`, sections);
}


/* ------------------- 4. Study & Work Fit Report ($3) ------------------- */

export function buildIqWorkFit(payload: AddonPayload): AddonDoc {
  if (noScores(payload)) return missingResultDoc('Study & Work Fit Report', 'Where your profile fits');
  const { score, scores } = read(payload);
  const order = ranked(scores);
  const [first, second] = order;
  const weakest = order[order.length - 1];

  const ENV: Record<Cat, { environments: string[]; roles: string[]; learning: string[] }> = {
    logic: {
      environments: ['Work with clear rules and traceable decisions', 'Roles where being wrong is expensive and reviewable', 'Teams that argue about reasoning, not volume'],
      roles: ['Analysis, auditing, research', 'Engineering and systems design', 'Law, policy, and technical writing'],
      learning: ['Learn from worked examples with every step shown', 'Explain the material back before moving on', 'Prefer first principles over memorised procedure'],
    },
    pattern: {
      environments: ['Messy data that has structure hidden in it', 'Problems that recur in slightly different forms', 'Work with fast feedback on whether a rule held'],
      roles: ['Data and forecasting work', 'Diagnostics and troubleshooting', 'Strategy and market reading'],
      learning: ['Learn by volume and variation, not depth on one example', 'Space repetition out over days', 'Always state the rule in words'],
    },
    spatial: {
      environments: ['Visual, physical, or diagram-heavy work', 'Anything you can build a model of', 'Whiteboard-first teams'],
      roles: ['Design, architecture, and manufacturing', 'Surgery, dentistry, and skilled trades', 'Data visualisation and mapping'],
      learning: ['Draw it before you read about it', 'Use physical or 3D models where possible', 'Convert text into a diagram as your first step'],
    },
    speed: {
      environments: ['Real-time, high-throughput environments', 'Work where good-and-now beats perfect-and-late', 'Roles with rapid, repeated decisions'],
      roles: ['Operations and incident response', 'Trading and live logistics', 'Emergency and front-line work'],
      learning: ['Short intense blocks with a timer', 'Drill to automaticity, then add complexity', 'Avoid long unbounded study sessions'],
    },
    self: {
      environments: ['Work requiring judgement about your own certainty', 'Roles where escalating early is valued', 'Cultures that reward saying "I do not know"'],
      roles: ['Advisory and consulting work', 'Teaching, coaching, and mentoring', 'Quality and risk functions'],
      learning: ['Predict your score before you check it', 'Keep an error log with reasons, not just answers', 'Review confidently-wrong items first'],
    },
  };

  return baseDoc(
    'Study & Work Fit Report',
    `Built from your strongest pair: ${CAT_LABEL[first.cat]} and ${CAT_LABEL[second.cat]}`,
    [
      {
        heading: 'Your working profile',
        paragraphs: [
          `Your profile leads with ${CAT_LABEL[first.cat]} (${first.score}) supported by ${CAT_LABEL[second.cat]} (${second.score}), against an overall score of ${score}. That pairing matters more than the headline number: it describes the kind of problem you solve without effort, which is the kind of problem you should be paid to solve.`,
          `${CAT_LABEL[first.cat]} is ${CAT_MEANING[first.cat]}. Combined with ${CAT_MEANING[second.cat]}, you do best where a problem has structure to find and consequences for getting the structure wrong.`,
          `Your lowest area, ${CAT_LABEL[weakest.cat]} (${weakest.score}), is not a disqualifier — but roles built entirely on it will feel like constant uphill effort, and you will underperform people who find it easy.`,
        ],
      },
      {
        heading: 'Environments that suit you',
        bullets: [...ENV[first.cat].environments, ...ENV[second.cat].environments.slice(0, 2)],
      },
      {
        heading: 'Role families worth exploring',
        bullets: [...ENV[first.cat].roles, ...ENV[second.cat].roles.slice(0, 2)],
        intro: 'These are families, not job titles. Match the shape of the work, not the label.',
      },
      {
        heading: 'How you should learn',
        bullets: [...ENV[first.cat].learning, ...ENV[weakest.cat].learning.slice(0, 1)],
      },
      {
        heading: 'Environments to avoid or adapt',
        paragraphs: [
          `Be careful with work that runs mostly on ${CAT_LABEL[weakest.cat]}. If you cannot avoid it, build a scaffold around it: templates, checklists, or a second pair of eyes on exactly that step. Scaffolding a weak category is faster than raising it.`,
        ],
      },
      {
        heading: 'How to talk about this profile',
        intro: 'Interviews, applications, and internal conversations. Say the shape of the work, not the score.',
        bullets: [
          `Lead with a story where ${CAT_LABEL[first.cat]} was the deciding factor and the outcome was measurable.`,
          `Name ${CAT_LABEL[second.cat]} as the thing that keeps your first instinct honest — it reads as judgement, not modesty.`,
          `When asked about weaknesses, describe your ${CAT_LABEL[weakest.cat]} scaffold rather than the weakness itself. "I use a checklist for X" is a strength answer.`,
          'Ask what the first ninety days actually involve, hour by hour. Job titles hide the category mix; daily work does not.',
        ],
      },
      {
        heading: 'Your first ninety days in a new role',
        paragraphs: [
          `Whatever the role, the same sequence works for your profile. Spend the first month collecting the recurring problems rather than solving them, because ${CAT_LABEL[first.cat]} is only an advantage once you know which problems repeat.`,
          `In month two, take ownership of the one recurring problem that maps onto ${CAT_LABEL[first.cat]} and ${CAT_LABEL[second.cat]}. Being visibly reliable at one thing beats being adequate at five.`,
          `In month three, build the scaffold for ${CAT_LABEL[weakest.cat]} before anyone notices you need one. Templates and checklists introduced early look like professionalism; introduced late they look like remediation.`,
        ],
      },
      {
        heading: 'Signals a role is wrong for you',
        bullets: [
          `Most of the day is spent on ${CAT_LABEL[weakest.cat]} with no tools, templates, or support around it.`,
          `${CAT_LABEL[first.cat]} is described as valued but never appears in how performance is measured.`,
          'Decisions are made on volume of opinion rather than quality of reasoning, and reversing a bad one is treated as disloyalty.',
          'Feedback arrives quarterly or not at all, so you never learn whether your read of a problem was right.',
          'Every problem is genuinely new. Novelty without repetition removes the advantage your profile depends on.',
        ],
      },
      {
        heading: 'Self-audit',
        intro: 'Answer honestly. Anything you score low, act on this month.',
        bullets: [
          `Does my current work use ${CAT_LABEL[first.cat]} daily, or only occasionally?`,
          `In the last month, how often did I have to lean on ${CAT_LABEL[weakest.cat]} with no scaffold?`,
          'Which part of my week produces the most output for the least strain? Can I get more of it?',
          'Which recurring task do I dread? Which category does it actually demand?',
          'If I had to remove one responsibility, would it raise or lower my use of my strongest category?',
        ],
      },
    ],
  );
}

/* ------------------ 5. 30-Day Sharpening Planner ($5) ------------------ */

export function buildIq30DayPlanner(payload: AddonPayload): AddonDoc {
  if (noScores(payload)) return missingResultDoc('Your 30-Day Sharpening Planner', 'A plan built from your result');
  const { score, scores } = read(payload);
  const order = ranked(scores);
  const primary = order[order.length - 1];
  const secondary = order[order.length - 2];

  const start = new Date();
  const dayLabel = (offset: number) => {
    const d = new Date(start.getTime() + offset * 86400000);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const focusFor = (day: number): Cat =>
    day % 7 === 0 ? 'self' : day % 3 === 0 ? secondary.cat : primary.cat;

  const taskFor = (day: number, cat: Cat): string => {
    const tasks = CAT_FIX[cat];
    if (day % 7 === 0) return 'Review week: log every confidently-wrong answer and name the pattern.';
    return tasks[(day - 1) % tasks.length];
  };

  const rows = Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    const cat = focusFor(day);
    return [String(day), dayLabel(i), CAT_LABEL[cat], taskFor(day, cat)];
  });

  return baseDoc(
    '30-Day Sharpening Planner',
    `Built around your two weakest categories, starting ${dayLabel(0)}`,
    [
      {
        heading: 'How this plan was built',
        paragraphs: [
          `Your overall score is ${score}. The two categories dragging it hardest are ${CAT_LABEL[primary.cat]} (${primary.score}) and ${CAT_LABEL[secondary.cat]} (${secondary.score}), so the plan spends roughly two thirds of its days on the first and one third on the second.`,
          'Every seventh day is a review day. Reviews are not optional — they are where the previous six days become permanent. Fifteen to twenty focused minutes per day is enough; longer sessions do not improve results at this stage.',
        ],
      },
      {
        heading: 'Weekly checkpoints',
        table: {
          columns: ['Week', 'Goal', 'Checkpoint'],
          rows: [
            ['1', `Build the ${CAT_LABEL[primary.cat]} habit`, 'Six sessions completed, no session longer than 20 minutes'],
            ['2', 'Add difficulty', 'You can name the rule before answering on most items'],
            ['3', `Bring ${CAT_LABEL[secondary.cat]} up`, 'Confidently-wrong answers down versus week 1'],
            ['4', 'Consolidate under time pressure', 'Same accuracy at a faster pace than week 1'],
          ],
        },
      },
      {
        heading: 'Your 30 days',
        table: {
          columns: ['Day', 'Date', 'Focus', 'Task'],
          rows,
        },
      },
      {
        heading: 'What each session looks like',
        intro: 'Fifteen to twenty minutes, in this order, every day.',
        bullets: [
          'Two minutes: re-read yesterday\'s confidently-wrong log. No practice, just re-reading.',
          `Ten minutes: the day's task from the table below, on ${CAT_LABEL[primary.cat]} or ${CAT_LABEL[secondary.cat]} as listed.`,
          'Three minutes: for every item you missed, write the rule you should have used in one sentence.',
          'One minute: rate your confidence in today\'s session from 1 to 5 and note it. The trend matters more than any single day.',
        ],
        paragraphs: [
          'The order is deliberate. Reviewing before practising means you practise against your own errors rather than repeating them, which is the single largest difference between thirty days that move a score and thirty days that do not.',
        ],
      },
      {
        heading: 'How to measure progress without re-testing',
        paragraphs: [
          `Re-testing on day 5 tells you nothing, because test-to-test variation is larger than five days of progress. Use these three signals instead: how many items you can name a rule for before answering, how many confidently-wrong entries you log per week, and how long a ${CAT_LABEL[primary.cat]} item takes you compared with week 1.`,
          `Expect the second signal to get worse before it gets better. Logging more confidently-wrong answers in week 2 than week 1 usually means you are noticing them, not making more of them.`,
        ],
        table: {
          columns: ['Signal', 'Week 1 baseline', 'Day 30 target'],
          rows: [
            ['Items where you can name the rule first', 'Note it on day 1', 'Roughly double'],
            ['Confidently-wrong entries per week', 'Note it on day 7', 'Down by a third'],
            [`Average time on a ${CAT_LABEL[primary.cat]} item`, 'Note it on day 1', 'Down, at equal accuracy'],
          ],
        },
      },
      {
        heading: 'If you fall behind',
        bullets: [
          'One missed day: skip it entirely and continue on the correct calendar day.',
          'Three or more missed days: restart the current week, not the whole month.',
          'A week that felt pointless: repeat it once. Repeating a week is normal; abandoning the plan is not.',
          'A week that felt easy: do not skip ahead. Add difficulty inside the same task instead.',
        ],
      },
      {
        heading: 'Rules for the month',
        bullets: [
          'Miss a day, skip it — never double up. Doubling up is how plans die.',
          'Log every answer you were confident about and got wrong. That log is the real product of this month.',
          'Do not re-test before day 30. Testing is not training.',
        ],
      },
    ],
  );
}
