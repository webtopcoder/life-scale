import {
  ARCHETYPES, TRAIT_LABEL, TRAIT_META, computeStyleAxes,
  type HgResult,
} from '@/engine/hiddenGeniusScoring';
import type { HgTraitKey } from '@/data/hiddenGeniusQuiz';
import { baseDoc, type AddonDoc, type AddonPayload } from './types';

function read(payload: AddonPayload): HgResult | null {
  const r = payload.result as HgResult | undefined;
  if (!r || !r.traitScores || !r.primary) return null;
  return r;
}

function fallback(title: string): AddonDoc {
  return baseDoc(title, 'Complete the Hidden Genius test to generate this report', [
    {
      heading: 'Not enough data yet',
      paragraphs: ['This report is built from your Hidden Genius answers. Take or re-take the test and it will generate automatically.'],
    },
  ]);
}

function sortedTraits(scores: Record<HgTraitKey, number>): { key: HgTraitKey; score: number }[] {
  const order = Object.keys(scores) as HgTraitKey[];
  // Deterministic tie-break: ties fall back to declaration order so the same
  // profile always names the same "top strength" and "blind spot".
  return order
    .map((key) => ({ key, score: Math.round(scores[key]) }))
    .sort((a, b) => (b.score - a.score) || (order.indexOf(a.key) - order.indexOf(b.key)));
}


/* ---------------- 1. Archetype Deep Dive ($1) ---------------- */

export function buildHgArchetypeDeepDive(payload: AddonPayload): AddonDoc {
  const r = read(payload);
  if (!r) return fallback('Archetype Deep Dive');
  const a = ARCHETYPES[r.primary];
  const b = ARCHETYPES[r.secondary];
  const weakest = TRAIT_META[r.weakestTrait];

  return baseDoc(
    `Archetype Deep Dive: ${a.name}`,
    `Your primary archetype, at full length — with ${b.name} underneath it`,
    [
      {
        heading: 'The thesis',
        paragraphs: [
          a.thesis,
          a.superpower,
          `Your secondary archetype is ${b.name}, and that combination is what makes your profile specific rather than generic. ${b.thesis} When your primary mode stalls, this is the mode you fall back into — usually without noticing you switched.`,
        ],
      },
      {
        heading: 'How it shows up in real life',
        bullets: a.showsUp,
      },
      {
        heading: 'Where you genuinely outperform',
        pairs: [
          { label: 'Solving problems', value: a.shines.problemSolving },
          { label: 'Learning', value: a.shines.learning },
          { label: 'Deciding', value: a.shines.decisions },
        ],
      },
      {
        heading: 'The cost of the same wiring',
        paragraphs: [
          a.blindSpotCopy(r.weakestTrait),
          `Your lowest trait is ${TRAIT_LABEL[r.weakestTrait]}. ${weakest.oneLiner} At your level it reads as: ${weakest.lowBehavior}`,
        ],
        callout: { label: 'One drill', text: weakest.microDrill },
      },
      {
        heading: 'Practices that develop this archetype',
        bullets: a.growthPractices,
      },
      {
        heading: 'How your two archetypes interact',
        paragraphs: [
          `${a.name} is your default and ${b.name} is your fallback, and most of your best work comes from the handover between them rather than from either one alone. The handover is usually invisible: you switch when the first mode stops producing, and because you did not choose to switch, you rarely get the benefit of doing it deliberately.`,
          `Used deliberately, the pair covers more ground than either mode does alone — you can open a problem in one mode and close it in the other. Used accidentally, you switch too late, having already spent the time that made the second mode necessary.`,
          `The practical version: when you notice a problem stopped moving, name which mode you are in and try the other one on purpose. Ten minutes in the second mode almost always beats another hour in the first.`,
        ],
      },
      {
        heading: 'What this archetype is often mistaken for',
        bullets: [
          `People frequently read ${a.name} as certainty when it is actually speed of pattern-matching. You are not more sure than everyone else; you arrived sooner and the reasoning is still in your head rather than on the table.`,
          'Because the reasoning stays internal, agreement looks like obedience and disagreement looks like conflict. Showing one step of the working changes both.',
          `The fallback into ${b.name} reads to others as a change of mind. Saying "I am approaching this differently now" costs you one sentence and buys you the benefit of the doubt.`,
          'Being fast is what gets you asked; being legible is what gets you trusted. They are separate skills and only the second one is optional by default.',
        ],
      },
      {
        heading: 'Minds with the same signature',
        pairs: a.minds.map((m) => ({ label: m.name, value: m.note })),
      },
    ],
  );
}

/* ---------------- 2. Strengths & Blind Spots ($1) ---------------- */

export function buildHgStrengthsBlindSpots(payload: AddonPayload): AddonDoc {
  const r = read(payload);
  if (!r) return fallback('Strengths & Blind Spots Report');
  const order = sortedTraits(r.traitScores);
  const top = order.slice(0, 4);
  const bottom = order.slice(-3).reverse();

  return baseDoc(
    'Strengths & Blind Spots Report',
    'Your four strongest traits and three weakest, with what each one costs you',
    [
      {
        heading: 'Read this first',
        paragraphs: [
          'Every strength on this list has a matching cost. That is not a caveat — it is the mechanism. The trait that makes you good at one thing is the same trait that makes you bad at its opposite, which is why "just be more balanced" never works as advice.',
          `Your profile is ${ARCHETYPES[r.primary].name}, so the pattern below should feel familiar rather than surprising. The useful part is the second half: the three traits you are working without.`,
        ],
      },
      {
        heading: 'Your four strengths',
        table: {
          columns: ['Trait', 'Score', 'What it does for you', 'What it costs'],
          rows: top.map((t) => [
            TRAIT_LABEL[t.key],
            String(t.score),
            TRAIT_META[t.key].highBehavior,
            TRAIT_META[t.key].lowBehavior
              ? `Overused, this crowds out ${TRAIT_LABEL[order[order.length - 1].key]}.`
              : '—',
          ]),
        },
      },
      {
        heading: 'Your three blind spots',
        intro: 'Low here does not mean broken. It means you have not been rewarded for using it, so it never developed.',
        table: {
          columns: ['Trait', 'Score', 'How it shows up', 'The drill'],
          rows: bottom.map((t) => [
            TRAIT_LABEL[t.key],
            String(t.score),
            TRAIT_META[t.key].lowBehavior,
            TRAIT_META[t.key].microDrill,
          ]),
        },
      },
      {
        heading: 'How strengths turn into problems',
        paragraphs: [
          `Nothing on your strengths list becomes a problem by being high. It becomes a problem by being used where a different trait was needed, and because your strong traits are fast and effortless, they get applied first — before you have checked whether they fit.`,
          `Your top trait is ${TRAIT_LABEL[top[0].key]} at ${top[0].score}. ${TRAIT_META[top[0].key].highBehavior} In the situations where that is right, you look excellent. In the situations where ${TRAIT_LABEL[bottom[0].key]} was the requirement, the same move looks like a misread — and it will keep looking that way, because your instinct will keep reaching for the strong trait.`,
          'This is why blind-spot work pays more than strength work at your level. You do not need to be better at what you are already good at; you need a second option available when the first one does not fit.',
        ],
        bullets: [
          `Watch for situations where ${TRAIT_LABEL[top[0].key]} is your answer to a question that was not asked.`,
          `Before acting, ask which of your bottom three traits the situation is actually calling for.`,
          'Keep a short list of the moments you were confident and wrong. That list is the map of the overuse.',
        ],
      },
      {
        heading: 'The one to work on',
        paragraphs: [
          `Of the three, start with ${TRAIT_LABEL[bottom[0].key]}. ${TRAIT_META[bottom[0].key].oneLiner} It sits lowest and it is the one your archetype leans on least, which means every point you gain shows up immediately in work you already do.`,
        ],
        callout: { label: 'This week', text: TRAIT_META[bottom[0].key].microDrill },
      },
    ],
  );
}

/* ---------------- 3. Collaboration Report ($1) ---------------- */

export function buildHgCollaborationReport(payload: AddonPayload): AddonDoc {
  const r = read(payload);
  if (!r) return fallback('Collaboration Report');
  const s = r.traitScores;
  const axes = computeStyleAxes(s);
  const a = ARCHETYPES[r.primary];

  const high = (k: HgTraitKey) => s[k] >= 60;
  const low = (k: HgTraitKey) => s[k] <= 40;

  const worksBest: string[] = [];
  if (high('autonomyNeed')) worksBest.push('Given the goal and left alone. Check-ins should be scheduled, not spontaneous.');
  else worksBest.push('With regular contact and a visible sense of how the group is doing.');
  if (high('structurePreference')) worksBest.push('With a defined process, owner, and deadline before work starts.');
  else worksBest.push('With room to reshape the approach as the work reveals itself.');
  if (high('peopleOrientation')) worksBest.push('In small groups where the discussion is part of the thinking.');
  else worksBest.push('With solo blocks first, then a short group review of what you produced.');
  if (high('leadershipDrive')) worksBest.push('With explicit authority. Ambiguous ownership makes you take it anyway.');
  else worksBest.push('Supporting a clear owner, with a well-defined slice of your own.');

  const friction: string[] = [];
  if (low('agreeableness')) friction.push('Your directness reads as coldness to people who need warmth before content. Add one sentence of context before the critique.');
  if (high('detailOrientation')) friction.push('You catch errors others miss and can be experienced as nitpicking. Say which errors matter and which do not.');
  if (low('conscientiousness')) friction.push('You start more than you finish, which lands on whoever inherits the loose ends. Close one thing before opening the next.');
  if (high('riskTolerance')) friction.push('Your comfort with risk feels reckless to more cautious colleagues. Name the downside out loud before proposing the upside.');
  if (low('extraversion')) friction.push('Your silence in meetings gets read as agreement. Say the disagreement in the room, not afterwards.');
  if (high('neuroticism')) friction.push('You register problems early and can transmit urgency faster than the situation warrants. Separate the signal from the alarm.');
  if (friction.length === 0) friction.push('Your trait spread is even, so friction tends to come from unclear roles rather than personality. Get ownership defined early.');

  return baseDoc(
    'Collaboration Report',
    `How ${a.name} works with other people`,
    [
      {
        heading: 'Your working style in one paragraph',
        paragraphs: [
          `${a.thesis} In a team, that means people get your conclusions faster than they get your reasoning, and the reasoning is usually what they needed.`,
          ...axes.map((ax) => ax.interpretation),
        ],
      },
      {
        heading: 'Conditions where you do your best work',
        bullets: worksBest,
      },
      {
        heading: 'Where friction usually starts',
        bullets: friction,
      },
      {
        heading: 'What to tell a new manager or team',
        intro: 'Say these out loud in week one. It removes months of guessing.',
        bullets: [
          `"I work best ${high('autonomyNeed') ? 'with the goal and space, and I will over-communicate progress' : 'with regular contact and quick feedback'}."`,
          `"I ${high('structurePreference') ? 'need the process defined before I start' : 'need room to change the approach as we learn'}."`,
          `"When I ${low('agreeableness') ? 'sound blunt, it is about the work, not you' : 'go quiet, I am thinking, not disengaging'}."`,
          `"The thing I am worst at is ${TRAIT_LABEL[r.weakestTrait].toLowerCase()} — tell me early if that is costing us."`,
        ],
      },
      {
        heading: 'How to give and take feedback with this profile',
        bullets: [
          low('agreeableness')
            ? 'Giving: lead with what the work is trying to do before you say what is wrong with it. Your critique is accurate and lands badly without that sentence.'
            : 'Giving: say the hard part plainly. Your instinct to soften it means people leave the conversation not knowing there was a problem.',
          high('detailOrientation')
            ? 'Giving: separate "this is wrong" from "this could be better". You bundle them and the important one gets lost.'
            : 'Giving: check the details before you comment on them, or your feedback gets discounted for the one thing you missed.',
          low('extraversion')
            ? 'Taking: you process afterwards, so ask for feedback in writing where you can. Reacting in the room is not where your best thinking happens.'
            : 'Taking: you respond immediately, which can read as defending. Say "let me think about that" and mean it.',
          high('neuroticism')
            ? 'Taking: your first reading of feedback is harsher than what was said. Re-read it the next day before acting on it.'
            : 'Taking: your first reading is lighter than what was meant. Ask what the consequence is if nothing changes.',
        ],
        paragraphs: [
          'Feedback is where working styles collide most visibly, and almost all of the damage comes from a mismatch in delivery rather than a disagreement about the work. Knowing your own default here is worth more than any technique.',
        ],
      },
      {
        heading: 'Meetings, specifically',
        bullets: [
          high('leadershipDrive') ? 'You will take the room if ownership is vague. Ask who owns it in the first two minutes instead.' : 'You will defer if ownership is vague. Say your position before the room converges.',
          high('structurePreference') ? 'Ask for the agenda in advance. Without one, you spend the meeting building it internally.' : 'Resist reshaping the agenda live; note it and raise it at the end.',
          'Say the disagreement in the meeting. A disagreement raised afterwards costs the team twice.',
          'Write your one conclusion down before you speak. It halves the time you need to say it.',
        ],
      },
      {
        heading: 'Who to pair with',
        paragraphs: [
          `Pair yourself with someone strong in ${TRAIT_LABEL[r.weakestTrait]}. You do not need to become good at it if the partnership covers it, and the pairing produces better work than either of you managing alone. Avoid pairing with a near-copy of your own profile — the blind spots stack instead of cancelling out.`,
        ],
      },
    ],
  );
}

/* ---------------- 4. Creative Style Guide ($3) ---------------- */

export function buildHgCreativeStyleGuide(payload: AddonPayload): AddonDoc {
  const r = read(payload);
  if (!r) return fallback('Creative Style Guide');
  const s = r.traitScores;
  const axes = computeStyleAxes(s);
  const a = ARCHETYPES[r.primary];
  const order = sortedTraits(s);

  const ideaMode = s.creativityOrientation >= s.systemsOrientation ? 'divergent-first' : 'structure-first';

  const rituals = ideaMode === 'divergent-first'
    ? [
      'Generate twenty options before judging any of them. Your instinct is to refine option one — refuse it.',
      'Keep a capture note. Your best ideas arrive away from the desk and are lost within the hour.',
      'Set a hard cut-off for exploring. Without a deadline you will keep opening doors.',
    ]
    : [
      'Define the constraints in writing before generating anything. Constraint is what unlocks you, not blank space.',
      'Build the frame first, fill it second. Your ideas improve once the structure exists.',
      'Deliberately break one rule per project. You default to the legal move.',
    ];

  return baseDoc(
    'Creative Style Guide',
    `How ${a.name} generates, develops, and finishes work`,
    [
      {
        heading: 'Your creative signature',
        paragraphs: [
          `You are ${ideaMode === 'divergent-first' ? 'divergent-first: ideas come easily and the hard part is choosing' : 'structure-first: ideas come once the frame exists and the hard part is starting from nothing'}. ${a.superpower}`,
          ...axes.map((ax) => ax.interpretation),
          `Your top three traits — ${order.slice(0, 3).map((t) => TRAIT_LABEL[t.key]).join(', ')} — describe the raw material. Everything below is about arranging your process to suit it instead of fighting it.`,
        ],
      },
      {
        heading: 'The four stages, your way',
        table: {
          columns: ['Stage', 'What to do', 'What to avoid'],
          rows: [
            ['Input', s.openness >= 55 ? 'Feed on unfamiliar material — new fields, not more of the same' : 'Go deep on one source rather than sampling widely', s.openness >= 55 ? 'Endless collecting with no output' : 'Assuming you already have enough input'],
            ['Generate', ideaMode === 'divergent-first' ? 'Volume first, quality later. Twenty rough beats two polished' : 'Set constraints, then generate inside them', ideaMode === 'divergent-first' ? 'Polishing the first idea' : 'Staring at a blank page'],
            ['Develop', s.detailOrientation >= 55 ? 'Your detail focus is an asset here — use it now, not earlier' : 'Get a second pair of eyes on the details', s.detailOrientation >= 55 ? 'Detailing before the direction is settled' : 'Shipping with avoidable errors'],
            ['Finish', s.conscientiousness >= 55 ? 'Trust your process and close it out' : 'Set an external deadline and tell someone about it', s.conscientiousness >= 55 ? 'Over-refining past the point of value' : 'Drifting onto the next project'],
          ],
        },
      },
      {
        heading: 'Rituals that fit you',
        bullets: rituals,
      },
      {
        heading: 'Your specific creative block',
        paragraphs: [
          `${TRAIT_META[r.weakestTrait].lowBehavior} That is where your work stalls — not in the ideas, in that gap. ${a.blindSpotCopy(r.weakestTrait)}`,
        ],
        callout: { label: 'The unblock', text: TRAIT_META[r.weakestTrait].microDrill },
      },
      {
        heading: 'Borrowing from the other mode',
        paragraphs: [
          `Your sequence is ${ideaMode === 'divergent-first' ? 'divergent-first, so the mode you almost never borrow from is the structured one' : 'structure-first, so the mode you almost never borrow from is the loose one'}. Borrowing it for a single stage — not adopting it — is the cheapest upgrade available to your process, because it repairs the exact stage your default skips.`,
          `${ideaMode === 'divergent-first' ? 'Borrow structure at the choosing stage only. Write the criteria down before you look at your options, and pick against the criteria rather than by feel. Feel is what generated the list; it is the wrong instrument for cutting it.' : 'Borrow looseness at the generating stage only. Give yourself one session with no criteria at all, then bring the results back inside the frame. The frame stays; it just stops being the thing that produces the ideas.'}`,
          'Do it for one stage of one project before deciding whether it helped. Changing the whole process at once tells you nothing about which part was worth changing.',
        ],
      },
      {
        heading: 'Where your projects actually die',
        paragraphs: [
          `Almost no project fails in the idea stage, and yours are no exception. ${ideaMode === 'divergent-first' ? 'Your projects die between generating and choosing: you keep the option set open past the point where any of the options can be built, because closing it feels like losing the good ones.' : 'Your projects die between framing and generating: the structure gets refined repeatedly because refining a frame feels productive and is far safer than making something inside it.'}`,
          `The second death happens at the finish. ${s.conscientiousness >= 55 ? 'You will finish, but you will over-refine, and the last twenty per cent of polish is usually invisible to everyone except you.' : 'You will move to the next thing before the current one is closed, which converts a body of work into a collection of drafts.'}`,
          'Both deaths are cheap to prevent and impossible to fix retrospectively, which is why they are worth designing around before the next project rather than during it.',
        ],
        bullets: [
          ideaMode === 'divergent-first'
            ? 'Set the choosing deadline at the same time as the generating deadline. Both go in the calendar, not just the first.'
            : 'Cap framing at one session. If the frame is not done, generate anyway and fix the frame afterwards.',
          s.conscientiousness >= 55
            ? 'Define "done" in one written sentence before you start. Polish stops when the sentence is true.'
            : 'Tell one person the finish date. External commitment is the only thing that reliably closes your projects.',
          'Keep exactly one project in the foreground. Two foreground projects means two unfinished ones.',
        ],
      },
      {
        heading: 'A four-week project rhythm',
        intro: 'Built for your sequence, not a generic creative process.',
        table: {
          columns: ['Week', 'Focus', 'Deliverable at the end of it'],
          rows: [
            ['1', ideaMode === 'divergent-first' ? 'Generate wide, judge nothing' : 'Set constraints, then generate inside them', ideaMode === 'divergent-first' ? 'A long list you have not filtered' : 'A written frame and five options'],
            ['2', 'Choose and commit', 'One option chosen in writing, the rest archived'],
            ['3', s.detailOrientation >= 55 ? 'Develop, and let your detail focus loose' : 'Develop, then get a second pair of eyes', 'A rough whole rather than a polished part'],
            ['4', 'Finish and ship', 'Shipped, with a note of what you would change'],
          ],
        },
        paragraphs: [
          'The order matters more than the four-week length. Compress it to a week or stretch it to a quarter, but do not reorder it — the choosing step is what your default sequence skips, and it is the step everything after it depends on.',
        ],
      },
      {
        heading: 'Environment checklist',
        bullets: [
          `${s.autonomyNeed >= 55 ? 'Protect solo blocks — interruption costs you more than most.' : 'Work near other people; ambient company keeps you moving.'}`,
          `${s.structurePreference >= 55 ? 'Same place, same time. Ritual does real work for you.' : 'Change location deliberately when stuck; novelty resets you.'}`,
          `${s.persuasionComfort >= 55 ? 'Talk your idea out early — you sharpen it by speaking it.' : 'Write it before you say it; speaking too early flattens the idea.'}`,
          'One project in the foreground at a time. Two foreground projects is how both slip.',
        ],
      },
    ],
  );
}

/* ---------------- 5. 30-Day Practice Planner ($5) ---------------- */

export function buildHg30DayPlanner(payload: AddonPayload): AddonDoc {
  const r = read(payload);
  if (!r) return fallback('30-Day Practice Planner');
  const a = ARCHETYPES[r.primary];
  const order = sortedTraits(r.traitScores);
  const weakest: HgTraitKey[] = [r.weakestTrait, ...order.slice(-3).map((t) => t.key).filter((k) => k !== r.weakestTrait)];
  const strongest = order[0].key;

  const start = new Date();
  const dayLabel = (offset: number) =>
    new Date(start.getTime() + offset * 86400000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const practiceFor = (day: number): [string, string] => {
    if (day % 7 === 0) return ['Review', 'Write three lines: what you avoided, what surprised you, what to repeat.'];
    if (day % 5 === 0) return [TRAIT_LABEL[strongest], `Use your strongest trait deliberately: ${TRAIT_META[strongest].highBehavior}`];
    const target = weakest[day % weakest.length];
    const practices = a.growthPractices;
    const alt = practices[(day - 1) % practices.length];
    return day % 2 === 0
      ? [TRAIT_LABEL[target], TRAIT_META[target].microDrill]
      : [`${a.name} practice`, alt];
  };

  const rows = Array.from({ length: 30 }, (_, i) => {
    const [focus, task] = practiceFor(i + 1);
    return [String(i + 1), dayLabel(i), focus, task];
  });

  return baseDoc(
    '30-Day Practice Planner',
    `Thirty days of deliberate practice for ${a.name}`,
    [
      {
        heading: 'How this plan was built',
        paragraphs: [
          `The plan alternates between three things: developing your archetype's native strength, drilling your weakest traits (${weakest.map((k) => TRAIT_LABEL[k]).join(', ')}), and reviewing. Roughly every fifth day pushes ${TRAIT_LABEL[strongest]} harder, because your strongest trait is also the one most likely to be used passively rather than deliberately.`,
          'Ten to fifteen minutes a day. The point is not volume — it is that you are practising the specific things your profile avoids by default.',
        ],
      },
      {
        heading: 'Weekly arc',
        table: {
          columns: ['Week', 'Theme', 'Checkpoint'],
          rows: [
            ['1', 'Notice the default', 'You can name your automatic move in three situations'],
            ['2', `Drill ${TRAIT_LABEL[weakest[0]]}`, 'You did the uncomfortable version at least four times'],
            ['3', 'Apply it to real work', 'One real decision made in the non-default way'],
            ['4', 'Make it yours', 'You used the new move without planning to'],
          ],
        },
      },
      {
        heading: 'Your 30 days',
        table: {
          columns: ['Day', 'Date', 'Focus', 'Practice'],
          rows,
        },
      },
      {
        heading: 'What deliberate practice means here',
        paragraphs: [
          'Practice is only deliberate if it is slightly uncomfortable and specifically targeted. Doing more of what you are already good at is rehearsal, not practice, and it produces the pleasant feeling of progress with none of the change.',
          `For your profile the target is narrow: the moment your default move fires. ${a.name} has a fast automatic response, and the practice is not to suppress it — it is to notice it, then choose whether it fits. Noticing comes first and takes most of the month.`,
          `Each drill below is built around ${TRAIT_LABEL[weakest[0]]} and the traits nearest it, because that is where your defaults have the least competition.`,
        ],
        bullets: [
          'Ten to fifteen minutes. Longer sessions add fatigue, not learning.',
          'One target per day. Two targets means neither gets noticed.',
          'Write one line afterwards. Unrecorded practice is indistinguishable from not practising by week three.',
        ],
      },
      {
        heading: 'How to tell it is working',
        table: {
          columns: ['Signal', 'What it looks like', 'When to expect it'],
          rows: [
            ['Noticing', 'You catch the default move as it happens rather than afterwards', 'Week 1 to 2'],
            ['Pausing', 'You can hold the default for a few seconds before acting', 'Week 2 to 3'],
            ['Choosing', 'You use the non-default move on something that matters', 'Week 3'],
            ['Owning', 'Someone else notices the change before you mention it', 'Week 4 or later'],
          ],
        },
        paragraphs: [
          'If you are on week three and still only noticing, that is not failure and it is not a reason to change plan. Noticing is the expensive part; everything after it is comparatively fast.',
        ],
      },
      {
        heading: 'Rules',
        bullets: [
          'Discomfort is the signal you are in the right place. If a day feels easy, you did the default version.',
          'Never double up on a missed day. Continue where the date lands.',
          'Keep a three-line log per week. Without the log, month two looks exactly like month zero.',
        ],
        callout: {
          label: 'Pair it with your dashboard',
          text: 'Your Hidden Genius dashboard already runs a 90-day challenge. Use this planner as the first thirty days of deliberate practice alongside it.',
        },
      },
    ],
  );
}
