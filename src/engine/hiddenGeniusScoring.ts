import { hiddenGeniusQuiz, type HgQuizItem, type HgResponse, type HgTraitKey } from '@/data/hiddenGeniusQuiz';

const TRAITS: HgTraitKey[] = [
  'openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism',
  'structurePreference', 'autonomyNeed', 'riskTolerance', 'peopleOrientation',
  'systemsOrientation', 'creativityOrientation', 'detailOrientation',
  'leadershipDrive', 'persuasionComfort', 'learningVelocity',
];

export type ArchetypeId =
  | 'pattern-seer' | 'analytical-architect' | 'creative-synthesist'
  | 'strategic-operator' | 'people-reader' | 'independent-explorer'
  | 'verbal-craftsman' | 'adaptive-generalist';

export interface Archetype {
  id: ArchetypeId;
  name: string;
  thesis: string;
  superpower: string;
  showsUp: string[];
  shines: { problemSolving: string; learning: string; decisions: string };
  blindSpotCopy: (weakest: HgTraitKey) => string;
  growthPractices: string[];
  minds: { name: string; note: string }[];
  traits: HgTraitKey[]; // signature traits
}

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  'pattern-seer': {
    id: 'pattern-seer',
    name: 'The Pattern Seer',
    thesis: 'You see the shape of things — the hidden rules other people miss.',
    superpower: 'You spot the invisible structure. Where others see noise, you see the pattern that predicts what happens next.',
    showsUp: [
      'You often "just know" how something will play out — because your brain is already running the pattern in the background.',
      'You get restless in chaotic situations until you can find the underlying order.',
      'You connect dots between fields other people treat as unrelated.',
    ],
    shines: {
      problemSolving: 'Problems that look messy to others feel like puzzles to you — once you spot the pattern, the answer follows.',
      learning: 'You learn faster than most because you build mental models, not memorize facts. New info snaps onto old structure.',
      decisions: 'Your gut is usually right — but only after your brain has quietly done the pattern-matching. Trust it, but leave time.',
    },
    blindSpotCopy: () =>
      'When the pattern is unclear, you can freeze. Learning to act on incomplete data — before all the dots connect — is your biggest unlock.',
    growthPractices: [
      'Once a week, force a decision before you feel "ready." Track how many were fine.',
      'Teach your patterns out loud. Explaining sharpens them.',
      'Read one book far outside your current field per quarter — new patterns feed the engine.',
    ],
    minds: [
      { name: 'Charles Darwin', note: 'Saw one pattern across millions of species.' },
      { name: 'Marie Curie', note: 'Followed a faint pattern in the data all the way to two Nobel prizes.' },
      { name: 'Ada Lovelace', note: 'Recognised the pattern underneath computation before anyone else did.' },
    ],
    traits: ['systemsOrientation', 'detailOrientation', 'openness'],
  },
  'analytical-architect': {
    id: 'analytical-architect',
    name: 'The Analytical Architect',
    thesis: 'You build clean thinking out of messy problems.',
    superpower: 'You break big questions into small, ordered pieces — and then solve them one at a time until the whole thing stands up.',
    showsUp: [
      'You quietly reorganise conversations so everyone knows what\'s actually being decided.',
      'You would rather be right than fast — and you\'re usually both.',
      'When something breaks, you don\'t panic. You start eliminating causes.',
    ],
    shines: {
      problemSolving: 'You outperform smarter people because you\'re more disciplined. Structure beats raw speed.',
      learning: 'You learn best when you can build the outline first. Give yourself scaffolding and you absorb quickly.',
      decisions: 'Your decisions hold up under scrutiny. People trust them because you can always show your work.',
    },
    blindSpotCopy: () =>
      'You can over-plan. Sometimes the honest answer is "we don\'t know yet, let\'s try it." Give yourself permission to move on limited info.',
    growthPractices: [
      'Set a time-box on any analysis. Decide when you\'ll stop thinking and start doing.',
      'Practice one "72-hour experiment" a month — a small bet you commit to without full data.',
      'Ask someone intuitive to sanity-check your logic. Their gut often catches what your model missed.',
    ],
    minds: [
      { name: 'John von Neumann', note: 'Turned chaos into equations.' },
      { name: 'Katherine Johnson', note: 'Built the math that got Apollo home.' },
      { name: 'Alan Turing', note: 'Made a machine out of pure structured thought.' },
    ],
    traits: ['conscientiousness', 'systemsOrientation', 'structurePreference', 'detailOrientation'],
  },
  'creative-synthesist': {
    id: 'creative-synthesist',
    name: 'The Creative Synthesist',
    thesis: 'You combine things nobody else thought belonged together — and it works.',
    superpower: 'You mash up ideas across worlds. Your best thinking comes when two unrelated things collide and something new falls out.',
    showsUp: [
      'You collect random inputs — songs, articles, conversations — and something stitches them together in the background.',
      'You get bored inside one lane. You need at least two.',
      'People come to you when they\'re stuck. You reframe the question and suddenly it\'s solvable.',
    ],
    shines: {
      problemSolving: 'You reframe. Where others push harder on the same door, you notice the wall has a window.',
      learning: 'You learn best when you\'re allowed to wander. Structured curriculums slow you down.',
      decisions: 'Your instincts are wide-angle. Add one analytical friend and you\'re unstoppable.',
    },
    blindSpotCopy: () =>
      'You can start more than you finish. Follow-through — not more ideas — is what turns your creativity into leverage.',
    growthPractices: [
      'Pick one idea a month and give it 30 days of finished attention.',
      'Keep a running "collision journal" — one weird pairing a day.',
      'Ship rough. Perfect is the enemy of your best trait.',
    ],
    minds: [
      { name: 'Steve Jobs', note: 'Fused typography, engineering and design.' },
      { name: 'Hedy Lamarr', note: 'Actor by day, invented frequency-hopping by night.' },
      { name: 'Leonardo da Vinci', note: 'Refused to pick a lane, invented most of them.' },
    ],
    traits: ['creativityOrientation', 'openness', 'learningVelocity'],
  },
  'strategic-operator': {
    id: 'strategic-operator',
    name: 'The Strategic Operator',
    thesis: 'You see the board, and you move the pieces.',
    superpower: 'You hold the long game in your head while everyone else is reacting to what just happened.',
    showsUp: [
      'You\'re calm in crises because you\'re already three moves ahead.',
      'You are quick to prune — meetings, tasks, people — that don\'t move the goal forward.',
      'You give clear directions. Not because you\'re bossy — because you\'ve already thought it through.',
    ],
    shines: {
      problemSolving: 'You solve problems by making the right ones matter and the rest go away.',
      learning: 'You learn what you need, on demand. Just-in-time beats just-in-case.',
      decisions: 'Your decisions are decisive. You\'d rather be 80% right and moving than 100% right and stuck.',
    },
    blindSpotCopy: () =>
      'You can miss the human cost. The best strategists still stop to check on the people carrying the plan.',
    growthPractices: [
      'Ask one "how is this landing on you?" question every day.',
      'Slow down for the first five minutes of any decision — you\'re fast enough to afford it.',
      'Delegate one thing per week you would normally hold onto.',
    ],
    minds: [
      { name: 'Angela Merkel', note: 'Never in a hurry, always three moves ahead.' },
      { name: 'Warren Buffett', note: 'Plays a decades-long game with almost no noise.' },
      { name: 'Sun Tzu', note: 'Wrote the book on winning before the fight starts.' },
    ],
    traits: ['leadershipDrive', 'conscientiousness', 'systemsOrientation'],
  },
  'people-reader': {
    id: 'people-reader',
    name: 'The People Reader',
    thesis: 'You understand people faster than they understand themselves.',
    superpower: 'You process social information at high resolution. Micro-expressions, tone, unsaid things — you pick them up like data.',
    showsUp: [
      'You notice when someone\'s "fine" isn\'t fine.',
      'You can walk into a room and read the temperature in seconds.',
      'You defuse conflicts before they become conflicts.',
    ],
    shines: {
      problemSolving: 'Most hard problems are people problems. That\'s your home turf.',
      learning: 'You learn beautifully by conversation. One good discussion beats an hour of reading.',
      decisions: 'Your decisions weigh the human variables everyone else forgets to include.',
    },
    blindSpotCopy: () =>
      'You can absorb other people\'s emotions and lose your own signal. Getting quiet time to hear yourself is not optional.',
    growthPractices: [
      'Book one hour a week where nobody has your attention.',
      'Journal after tough conversations — separate what was theirs from what\'s yours.',
      'Practice saying "let me think" before agreeing.',
    ],
    minds: [
      { name: 'Fred Rogers', note: 'Understood children as full humans decades before it was normal.' },
      { name: 'Maya Angelou', note: 'Read a room in a sentence.' },
      { name: 'Carl Rogers', note: 'Built entire therapies out of actually listening.' },
    ],
    traits: ['peopleOrientation', 'agreeableness', 'extraversion'],
  },
  'independent-explorer': {
    id: 'independent-explorer',
    name: 'The Independent Explorer',
    thesis: 'You do your best thinking off the map.',
    superpower: 'You are wired to look where nobody\'s told you to look. That\'s how original answers get found.',
    showsUp: [
      'You need space. Micromanagement is corrosive to you.',
      'You\'re drawn to problems everyone else has walked past.',
      'You\'d rather build your own thing than fit someone else\'s.',
    ],
    shines: {
      problemSolving: 'You solve original problems — the kind nobody has a template for.',
      learning: 'You learn by doing, breaking, and trying again. Textbooks second, hands first.',
      decisions: 'You make brave calls. Just make sure you\'re listening to the people who see what you can\'t.',
    },
    blindSpotCopy: () =>
      'Working alone too long makes your ideas weirder — sometimes brilliantly, sometimes just weirder. Build a small circle you show your work to.',
    growthPractices: [
      'Recruit one trusted critic. Share early drafts with them, not the finished thing.',
      'Set weekly "public checkpoints" — a note, a post, a demo. Air keeps the work honest.',
      'Say yes to one collaboration a quarter, even if it feels slow.',
    ],
    minds: [
      { name: 'Nikola Tesla', note: 'Would rather starve than share a lab.' },
      { name: 'Jane Goodall', note: 'Went to the jungle and let the animals teach her.' },
      { name: 'Georgia O\'Keeffe', note: 'Moved to the desert to see her own way of seeing.' },
    ],
    traits: ['autonomyNeed', 'openness', 'riskTolerance'],
  },
  'verbal-craftsman': {
    id: 'verbal-craftsman',
    name: 'The Verbal Craftsman',
    thesis: 'You turn thoughts into language other people can actually use.',
    superpower: 'You think in words with unusual precision. What you say sticks. What you write moves people.',
    showsUp: [
      'You reword other people\'s ideas back to them cleaner than they said it.',
      'You collect phrases the way other people collect coins.',
      'You persuade without pushing — because you say the thing they were already almost thinking.',
    ],
    shines: {
      problemSolving: 'You solve problems by naming them precisely. Half of every problem is that nobody defined it yet.',
      learning: 'You learn best by writing it down. Your notes are half the work.',
      decisions: 'When you write out a decision, the right answer usually appears in paragraph three.',
    },
    blindSpotCopy: () =>
      'You can talk your way past a real feeling. Every so often let the sentence stay unfinished and see what shows up.',
    growthPractices: [
      'Write 300 words a day for anyone. Muscle first, audience later.',
      'Read one paragraph out loud before sending — the ear catches what the eye misses.',
      'Once a week, sit with a hard feeling before you narrate it.',
    ],
    minds: [
      { name: 'Toni Morrison', note: 'Made language do things nobody else knew it could.' },
      { name: 'Winston Churchill', note: 'Rewrote a nation\'s morale with sentences.' },
      { name: 'James Baldwin', note: 'Said the thing everyone was afraid to name.' },
    ],
    traits: ['persuasionComfort', 'creativityOrientation', 'agreeableness'],
  },
  'adaptive-generalist': {
    id: 'adaptive-generalist',
    name: 'The Adaptive Generalist',
    thesis: 'You don\'t peak in one place — you flex.',
    superpower: 'You\'re unusually balanced. That means you can move between modes: analytical, creative, social, decisive — as the moment needs.',
    showsUp: [
      'People describe you differently depending on the context — because you actually are different in different contexts.',
      'You bridge groups other people can\'t talk to each other.',
      'You get bored specialising.',
    ],
    shines: {
      problemSolving: 'You solve problems by pulling the right mode off the shelf, not the loudest one.',
      learning: 'You learn broadly and fast. Depth comes when you decide to slow down.',
      decisions: 'You weigh many angles quickly. Beware of averaging into a mush — sometimes pick a side.',
    },
    blindSpotCopy: () =>
      'Being good at everything makes it easy to commit to nothing. Choose one narrow specialty for the next 12 months.',
    growthPractices: [
      'Name your specialty out loud, in one sentence, and revisit it monthly.',
      'When you feel bored, ask "am I done, or am I avoiding the hard part?"',
      'Build one signature skill deep enough that people ask you first.',
    ],
    minds: [
      { name: 'Benjamin Franklin', note: 'Diplomat, scientist, writer, inventor — same brain.' },
      { name: 'Mae Jemison', note: 'Doctor, engineer, astronaut, dancer.' },
      { name: 'Elon Musk', note: 'For better or worse, refuses to pick a lane.' },
    ],
    traits: ['learningVelocity', 'openness', 'extraversion'],
  },
};

export const TRAIT_LABEL: Record<HgTraitKey, string> = {
  openness: 'Openness',
  conscientiousness: 'Discipline',
  extraversion: 'Extraversion',
  agreeableness: 'Warmth',
  neuroticism: 'Sensitivity',
  structurePreference: 'Structure',
  autonomyNeed: 'Independence',
  riskTolerance: 'Risk Appetite',
  peopleOrientation: 'People Focus',
  systemsOrientation: 'Systems Thinking',
  creativityOrientation: 'Creativity',
  detailOrientation: 'Detail Focus',
  leadershipDrive: 'Leadership Drive',
  persuasionComfort: 'Verbal Force',
  learningVelocity: 'Learning Speed',
};

export interface HgResult {
  traitScores: Record<HgTraitKey, number>; // 0..100
  primary: ArchetypeId;
  secondary: ArchetypeId;
  weakestTrait: HgTraitKey;
  topTraits: HgTraitKey[]; // top 6 for radar
}

/**
 * Source weighting: self-report (Likert + frequency) is the primary identity signal;
 * the projective layer (inkblots, scenarios, forced/identity choices) tints it.
 */
export const HG_SOURCE_WEIGHTS = { selfReport: 0.7, projective: 0.3 } as const;

/** Gain on the tanh curve. Tuned so realistic profiles span ~20-90 rather than pinning. */
const HG_TANH_GAIN = 1.1;

type Pool = Record<HgTraitKey, { sum: number; weight: number }>;
const emptyPool = (): Pool =>
  TRAITS.reduce((acc, t) => { acc[t] = { sum: 0, weight: 0 }; return acc; }, {} as Pool);

/**
 * For an option-based item, the denominator for a trait is the largest absolute weight
 * that item OFFERS for that trait across all of its options — not the weight of the
 * option the user happened to pick. Picking the strongest expression scores near ±1;
 * picking an option that pushes the other way scores negative; picking a neutral one
 * scores near zero. This is what stops every trait collapsing onto the ±1 ceiling.
 */
function maxOfferedWeights(options: { traitMappings: { trait: HgTraitKey; weight: number }[] }[]) {
  const max = new Map<HgTraitKey, number>();
  for (const o of options) {
    for (const m of o.traitMappings) {
      max.set(m.trait, Math.max(max.get(m.trait) ?? 0, Math.abs(m.weight)));
    }
  }
  return max;
}

/**
 * Split the responses into the two evidence pools the whole engine runs on:
 * what the person said about themselves, and what their unprompted reads imply.
 * Shared by computeHgResult and composeIdentitySynthesis so the two can never drift.
 */
function buildPools(responses: HgResponse[]): { selfReport: Pool; projective: Pool } {
  const selfReport = emptyPool();
  const projective = emptyPool();

  const responseMap = new Map(responses.map(r => [r.questionId, r.value]));

  for (const item of hiddenGeniusQuiz as HgQuizItem[]) {
    const val = responseMap.get(item.id);
    if (val == null) continue;

    if (item.type === 'scale' || item.type === 'frequency') {
      // 1..5 -> offset -1..+1
      const offset = (val - 3) / 2;
      for (const m of item.traitMappings) {
        selfReport[m.trait].sum += offset * m.weight;
        selfReport[m.trait].weight += Math.abs(m.weight);
      }
    } else {
      const opt = item.options.find(o => o.value === val);
      if (!opt) continue;
      const offered = maxOfferedWeights(item.options);
      const chosen = new Map(opt.traitMappings.map(m => [m.trait, m.weight]));
      // Iterate every trait the ITEM can speak to, not just the chosen option's traits.
      for (const [trait, maxWeight] of offered) {
        if (maxWeight <= 0) continue;
        projective[trait].sum += (chosen.get(trait) ?? 0);
        projective[trait].weight += maxWeight;
      }
    }
  }

  return { selfReport, projective };
}

/** Aggregate all responses into a trait vector and pick a primary/secondary archetype. */
export function computeHgResult(responses: HgResponse[]): HgResult {
  const { selfReport, projective } = buildPools(responses);

  // Blend the two sources, then convert to 0..100 via tanh centered at 50.
  const traitScores = TRAITS.reduce((acc, t) => {
    const sr = selfReport[t];
    const pj = projective[t];
    const srAvg = sr.weight > 0 ? sr.sum / sr.weight : null;
    const pjAvg = pj.weight > 0 ? pj.sum / pj.weight : null;

    let avg: number;
    if (srAvg !== null && pjAvg !== null) {
      avg = HG_SOURCE_WEIGHTS.selfReport * srAvg + HG_SOURCE_WEIGHTS.projective * pjAvg;
    } else {
      avg = srAvg ?? pjAvg ?? 0;
    }

    acc[t] = 50 + 50 * Math.tanh(avg * HG_TANH_GAIN);
    return acc;
  }, {} as Record<HgTraitKey, number>);

  // Keep the un-rounded values for deterministic tie-breaking, expose rounded ones.
  const precise = { ...traitScores };
  for (const t of TRAITS) traitScores[t] = Math.round(traitScores[t]);

  // Archetype scoring: avg the signature traits (on precise values, so ties are real ties).
  const archetypeScores = (Object.values(ARCHETYPES) as Archetype[]).map(a => {
    const s = a.traits.reduce((sum, t) => sum + precise[t], 0) / a.traits.length;
    return { id: a.id, score: s };
  });
  archetypeScores.sort((a, b) => b.score - a.score);

  // If everything is tightly clustered (low spread), fall back to the generalist.
  const top = archetypeScores[0];
  const spread = top.score - archetypeScores[archetypeScores.length - 1].score;
  const primary: ArchetypeId = spread < 5 ? 'adaptive-generalist' : top.id;
  const secondary: ArchetypeId =
    archetypeScores.find(a => a.id !== primary)?.id ?? 'adaptive-generalist';

  // Deterministic ordering: precise score desc, then declaration order.
  const byScore = (a: HgTraitKey, b: HgTraitKey) =>
    (precise[b] - precise[a]) || (TRAITS.indexOf(a) - TRAITS.indexOf(b));

  const ranked = [...TRAITS].filter(t => t !== 'neuroticism').sort(byScore);

  const weakestTrait = ranked[ranked.length - 1];
  const topTraits = ranked.slice(0, 6);

  return { traitScores, primary, secondary, weakestTrait, topTraits };
}


const RESULT_KEY = 'iqscale.hgResult';
const RESPONSES_KEY = 'iqscale.hgResponses';

export function saveHgResultSnapshot(result: HgResult) {
  try { localStorage.setItem(RESULT_KEY, JSON.stringify(result)); } catch { /* noop */ }
}

export function loadHgResultSnapshot(): HgResult | null {
  try {
    const raw = localStorage.getItem(RESULT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as HgResult;
  } catch { return null; }
}

export function saveHgResponses(responses: HgResponse[]) {
  try { localStorage.setItem(RESPONSES_KEY, JSON.stringify(responses)); } catch { /* noop */ }
}

export function loadHgResponses(): HgResponse[] | null {
  try {
    const raw = localStorage.getItem(RESPONSES_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed as HgResponse[] : null;
  } catch { return null; }
}

/**
 * Single source of truth for every Hidden Genius surface (report, dashboard,
 * Archetype Lab, add-ons). Recomputes from raw responses whenever they are
 * available — and refreshes the snapshot — so no two surfaces can disagree
 * after a scoring change. Falls back to the stored snapshot only when there
 * are no responses to recompute from.
 */
export function resolveHgResult(...candidates: (HgResponse[] | null | undefined)[]): HgResult | null {
  const responses = candidates.find(c => Array.isArray(c) && c.length > 0) ?? loadHgResponses();
  if (responses && responses.length > 0) {
    const result = computeHgResult(responses);
    saveHgResultSnapshot(result);
    return result;
  }
  return loadHgResultSnapshot();
}


/* ------------------------------------------------------------------ */
/* Extended content: trait meta, pair blends, style axes, rarity band */
/* ------------------------------------------------------------------ */

export interface TraitMeta {
  label: string;
  oneLiner: string;
  highBehavior: string;
  lowBehavior: string;
  microDrill: string;
}

export const TRAIT_META: Record<HgTraitKey, TraitMeta> = {
  openness: {
    label: 'Openness',
    oneLiner: 'How drawn you are to new ideas, aesthetics, and unfamiliar experiences.',
    highBehavior: 'You chase novelty. Books, people, projects — you keep sampling and rarely go stale.',
    lowBehavior: 'You default to what you already know. New inputs feel like risk more than reward.',
    microDrill: 'This week, spend 20 minutes on a topic you would normally skip. Take one note.',
  },
  conscientiousness: {
    label: 'Discipline',
    oneLiner: 'How reliably you finish what you start and hold your own standards.',
    highBehavior: 'You show up, ship, and clean up. Systems form around you automatically.',
    lowBehavior: 'You start hot and drift. Finishing takes more willpower than starting.',
    microDrill: 'Pick one open loop. Set a 45-minute timer and close it before you open anything new.',
  },
  extraversion: {
    label: 'Extraversion',
    oneLiner: 'How much energy you draw from being around other people.',
    highBehavior: 'You think out loud, network naturally, and get sharper in a room.',
    lowBehavior: 'You process privately. Groups drain you before they inform you.',
    microDrill: 'Have one un-scheduled conversation this week where you have no agenda.',
  },
  agreeableness: {
    label: 'Warmth',
    oneLiner: 'How instinctively you cooperate, trust, and put others at ease.',
    highBehavior: 'People soften around you. Conflict de-escalates when you walk in.',
    lowBehavior: 'You default to skepticism. Trust is earned slowly and never fully.',
    microDrill: 'Give one piece of unsolicited, specific credit this week. In writing.',
  },
  neuroticism: {
    label: 'Sensitivity',
    oneLiner: 'How strongly your emotions register and how long they linger.',
    highBehavior: 'You feel things at high resolution — including things other people miss.',
    lowBehavior: 'You stay level. Small setbacks bounce off you.',
    microDrill: 'Once a day, name the emotion in one word before doing anything about it.',
  },
  structurePreference: {
    label: 'Structure',
    oneLiner: 'How much you rely on plans, routines, and defined edges to think clearly.',
    highBehavior: 'You build the frame first. Chaos costs you real cognitive energy.',
    lowBehavior: 'You improvise. Rigid plans feel like a cage more than a runway.',
    microDrill: 'Write tomorrow\'s three-item plan tonight. Do not adjust it in the morning.',
  },
  autonomyNeed: {
    label: 'Independence',
    oneLiner: 'How much you need to run your own show to do your best work.',
    highBehavior: 'You own it end-to-end or the quality drops. You resist being managed.',
    lowBehavior: 'You work well inside a defined lane. Direction is a relief, not a leash.',
    microDrill: 'Take one small decision back this week that you\'ve been letting someone else make.',
  },
  riskTolerance: {
    label: 'Risk Appetite',
    oneLiner: 'How comfortable you are acting before all the information is in.',
    highBehavior: 'You move. You would rather take the shot and correct than wait and lose the window.',
    lowBehavior: 'You wait for certainty. Missed opportunities feel safer than a bad bet.',
    microDrill: 'Make one low-stakes decision this week with 70% info instead of 100%.',
  },
  peopleOrientation: {
    label: 'People Focus',
    oneLiner: 'How naturally your attention lands on other humans versus systems or ideas.',
    highBehavior: 'You read rooms fast. Motivations, moods, subtext — you catch them without trying.',
    lowBehavior: 'You focus on the work, not the room. Interpersonal dynamics feel like extra load.',
    microDrill: 'Before your next meeting, guess in one line how each person is feeling. Check after.',
  },
  systemsOrientation: {
    label: 'Systems Thinking',
    oneLiner: 'How naturally you see the machine behind the moment — the loops, causes, and structure.',
    highBehavior: 'You zoom out on instinct. You keep asking "what\'s producing this?" until you find it.',
    lowBehavior: 'You handle what\'s in front of you. Second-order effects rarely occur to you.',
    microDrill: 'Pick one recurring problem this week. Draw the loop that keeps producing it.',
  },
  creativityOrientation: {
    label: 'Creativity',
    oneLiner: 'How readily you generate new combinations instead of applying known ones.',
    highBehavior: 'You reframe. Your first move on a problem is usually to change the question.',
    lowBehavior: 'You execute known plays cleanly. Novelty is fun to consume, not to produce.',
    microDrill: 'Solve one problem this week using the "how would a totally different field handle this?" prompt.',
  },
  detailOrientation: {
    label: 'Detail Focus',
    oneLiner: 'How much your quality comes from noticing the small things.',
    highBehavior: 'You catch what everyone else scans past. Your work holds up on the second look.',
    lowBehavior: 'You are a big-picture person. Small errors slip through and you learn about them later.',
    microDrill: 'Before hitting send on your next important piece of work, do one dedicated proofread pass.',
  },
  leadershipDrive: {
    label: 'Leadership Drive',
    oneLiner: 'How readily you step forward, make the call, and carry the weight.',
    highBehavior: 'You end the meeting with a decision. People look at you when it\'s unclear who moves.',
    lowBehavior: 'You wait to see who takes it. You\'ll follow a good plan cheerfully — you don\'t need to run it.',
    microDrill: 'This week, be the person who says "here\'s what we\'re doing" once — even if you\'re not sure.',
  },
  persuasionComfort: {
    label: 'Verbal Force',
    oneLiner: 'How comfortably you can move a room with words alone.',
    highBehavior: 'You frame, name, and land the point. People walk away quoting you.',
    lowBehavior: 'You know what you mean but the words come out flatter than the thought.',
    microDrill: 'Write one 3-sentence pitch this week for a real idea. Read it aloud before you deliver it.',
  },
  learningVelocity: {
    label: 'Learning Speed',
    oneLiner: 'How fast you get functional in something you\'ve never done before.',
    highBehavior: 'You get from zero to useful faster than most. You\'re allergic to slow onboarding.',
    lowBehavior: 'You need time and reps. You go deep, but the ramp is slower than you\'d like.',
    microDrill: 'Pick one skill and time-box a two-hour "get to functional" sprint this week.',
  },
};

/** Short verb phrase per archetype, used by the pair-blend fallback. */
export const ARCHETYPE_VERB: Record<ArchetypeId, string> = {
  'pattern-seer': 'reads the shape underneath the noise',
  'analytical-architect': 'breaks it down and rebuilds it clean',
  'creative-synthesist': 'collides unrelated ideas until something new falls out',
  'strategic-operator': 'looks three moves ahead and picks the leverage point',
  'people-reader': 'reads the humans in the room and adjusts the plan',
  'independent-explorer': 'wanders off the map and finds a route nobody was using',
  'verbal-craftsman': 'names the thing precisely so it becomes solvable',
  'adaptive-generalist': 'switches modes on demand and picks the tool the moment needs',
};

/** Hand-written blends for common combos. Fallback covers the rest. */
export const PAIR_BLEND: Partial<Record<string, string>> = {
  'pattern-seer|analytical-architect':
    'You see the hidden shape, then your architect layer builds a clean structure on top of it. That combination — vision + rigor — is why your thinking holds up under pressure.',
  'pattern-seer|strategic-operator':
    'You spot the pattern, then move on it before anyone else has decided what\'s happening. Foresight paired with execution is a rare and slightly unnerving mix.',
  'analytical-architect|pattern-seer':
    'You build the structure, but your pattern-seer layer keeps whispering "there\'s something bigger here." That tension is what keeps your work from being merely correct.',
  'analytical-architect|strategic-operator':
    'You bring order first, then your operator layer decides which order actually wins. You don\'t just organize the problem — you organize the win.',
  'creative-synthesist|analytical-architect':
    'You throw wild combinations against the wall, then your architect layer catches the two that will actually stand up. Chaos in, discipline out.',
  'creative-synthesist|verbal-craftsman':
    'You generate the strange combinations, then your verbal-craftsman layer names them so other people can finally see what you\'re seeing.',
  'strategic-operator|people-reader':
    'You play the long game, but your people-reader layer keeps you honest about the humans carrying the plan. Strategists like you don\'t burn their teams.',
  'strategic-operator|analytical-architect':
    'You make the call fast, then your architect layer builds the scaffolding that makes the call executable. Speed with structure underneath it.',
  'people-reader|verbal-craftsman':
    'You feel the room, then find the exact words for what everyone else was almost thinking. That is genuinely dangerous in a good way.',
  'people-reader|strategic-operator':
    'You understand the humans, and your operator layer decides which move actually serves them. Empathy plus decisiveness is uncommon.',
  'independent-explorer|creative-synthesist':
    'You go where nobody sent you, then combine what you find there in ways only somebody who went would have thought of. Originality with receipts.',
  'verbal-craftsman|people-reader':
    'You choose your words precisely, and your people-reader layer picks the right ones for the room. Not just clear — landed.',
  'adaptive-generalist|strategic-operator':
    'You flex between modes, then your operator layer picks which mode actually wins in the moment. Range with a decision-maker on top of it.',
};

/**
 * Blend copy: uses the hand-written line if present, otherwise a verb-driven fallback.
 */
export function blendCopy(primary: ArchetypeId, secondary: ArchetypeId): string {
  const key = `${primary}|${secondary}`;
  const hand = PAIR_BLEND[key];
  if (hand) return hand;
  const p = ARCHETYPES[primary];
  const s = ARCHETYPES[secondary];
  return `Your ${p.name} instinct leads: it ${ARCHETYPE_VERB[primary]}. When that hits its limit, your ${s.name} layer steps in and ${ARCHETYPE_VERB[secondary]}. Running both is uncommon — most people only get one.`;
}

/* ---------------- Style axes: three signature dimensions ---------------- */

export interface StyleAxis {
  key: 'analytical-intuitive' | 'structured-flexible' | 'individual-social';
  leftLabel: string;
  rightLabel: string;
  /** −100..+100. Negative = left, positive = right. */
  value: number;
  /** One-sentence interpretation, personalized by direction and magnitude. */
  interpretation: string;
}

function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }

export function computeStyleAxes(traitScores: Record<HgTraitKey, number>): StyleAxis[] {
  // Denominators are calibrated against the observed spread of the scoring engine
  // (simulated p5/p95 of each raw expression), not against a theoretical ±200 range.
  const a1 = ((traitScores.systemsOrientation + traitScores.detailOrientation) -
              (traitScores.openness + traitScores.creativityOrientation));
  const a2 = ((traitScores.structurePreference + traitScores.conscientiousness) -
              (traitScores.openness + traitScores.riskTolerance));
  // Three traits minus two autonomy terms carries a +50 baseline; remove it first.
  const a3 = ((traitScores.peopleOrientation + traitScores.extraversion + traitScores.persuasionComfort) -
              (traitScores.autonomyNeed * 2)) - 50;

  const scale = (raw: number, denom: number) => Math.round(clamp(raw / denom * 100, -100, 100));

  const v1 = scale(a1, 90);
  const v2 = scale(a2, 90);
  const v3 = scale(a3, 110);


  const interpret = (left: string, right: string, v: number) => {
    const mag = Math.abs(v);
    const side = v < 0 ? left : right;
    const other = v < 0 ? right : left;
    if (mag < 15) {
      return `Almost centered — you can run ${left} or ${other}, but the choice has to be made consciously.`;
    }
    if (mag < 40) {
      return `You lean ${side} without being locked into it; your ${other} mode is available but effortful.`;
    }
    if (mag < 70) {
      return `You run clearly ${side}. Working ${other} is possible but costs real energy.`;
    }
    return `You are strongly ${side} — a defining feature. Situations needing ${other} are best structured around.`;
  };



  return [
    { key: 'analytical-intuitive', leftLabel: 'Analytical', rightLabel: 'Intuitive',
      value: -v1, interpretation: interpret('analytical', 'intuitive', -v1) },
    { key: 'structured-flexible', leftLabel: 'Structured', rightLabel: 'Flexible',
      value: -v2, interpretation: interpret('structured', 'flexible', -v2) },
    { key: 'individual-social', leftLabel: 'Individual', rightLabel: 'Social',
      value: v3,  interpretation: interpret('individual', 'social', v3) },
  ];
}

/* ---------------- Rarity band ---------------- */

/**
 * Rough "roughly X in 10 people think this way" based on how sharply the
 * primary archetype dominates the trait profile. Whole numbers only.
 */
export function rarityBand(primary: ArchetypeId, traitScores: Record<HgTraitKey, number>): {
  inTen: number;
  headline: string;
  body: string;
} {
  const arch = ARCHETYPES[primary];
  const signatureAvg = arch.traits.reduce((s, t) => s + traitScores[t], 0) / arch.traits.length;
  // Bands are calibrated against the simulated distribution of signature averages
  // (median ~66, p90 ~76, p95 ~78), so "1 in 10" really is roughly the top decile.
  let inTen = 4;
  if (signatureAvg >= 76) inTen = 1;
  else if (signatureAvg >= 71) inTen = 2;
  else if (signatureAvg >= 66) inTen = 3;
  else if (signatureAvg >= 58) inTen = 4;
  else inTen = 5;
  return {
    inTen,
    headline: `Roughly ${inTen} in 10 people share this cognitive pattern.`,
    body: primary === 'adaptive-generalist'
      ? 'Your profile is balanced enough that you can move between modes. That flexibility is itself the rare thing.'
      : `Your signature traits sit well above the midpoint — high enough that this pattern shows up clearly in how you think.`,
  };
}


/* ---------------- Answer highlights per trait ---------------- */

/**
 * For each of the top traits, find the 1–2 quiz responses that most influenced
 * that trait score — and, critically, what those responses MEAN.
 *
 * The report must never echo a choice back bare ("You said: Feet"). Every
 * highlight therefore carries an interpretation (`reading`), the trait it moved
 * and in which direction (`direction`), and — where the item's weights allow it
 * — the sibling option that would have read the opposite way (`contrast`).
 */
export interface AnswerHighlight {
  questionId: string;
  /** The question as it was asked. */
  prompt: string;
  /** What they picked: an option label, or the derived Likert/frequency label. */
  choice: string;
  /** What picking that says about them, in report voice. */
  reading: string;
  /** e.g. "This is what pushed Detail Focus up." */
  direction: string;
  /** e.g. 'Had you picked "A moose", this would have read the other way.' */
  contrast: string | null;
  /** True for inkblots — lets the report label it "What you saw". */
  projective: boolean;
  weight: number;
}

const LIKERT_LABELS: Record<number, string> = {
  1: 'Strongly disagree', 2: 'Disagree', 3: 'Neutral', 4: 'Agree', 5: 'Strongly agree',
};
const FREQUENCY_LABELS: Record<number, string> = {
  1: 'Almost never', 2: 'Rarely', 3: 'Sometimes', 4: 'Often', 5: 'Almost always',
};

/** "pushed X up" / "held X down", from the sign of the contribution. */
function directionLine(trait: HgTraitKey, contrib: number): string {
  const label = TRAIT_LABEL[trait];
  return contrib >= 0
    ? `This is one of the answers that pushed ${label} up.`
    : `This is one of the answers that held ${label} down.`;
}

/**
 * Because every option-based item carries weights for the same trait set, and
 * those weights sum to ~0 across the item, there is always a real "opposite"
 * option to point at. This is a fact about the instrument, not a guess about
 * the population — we never claim what percentage of people saw what.
 */
function contrastLine(
  options: { label: string; traitMappings: { trait: HgTraitKey; weight: number }[] }[],
  chosenLabel: string,
  trait: HgTraitKey,
  chosenWeight: number,
): string | null {
  let best: { label: string; weight: number } | null = null;
  for (const o of options) {
    if (o.label === chosenLabel) continue;
    const w = o.traitMappings.find(m => m.trait === trait)?.weight;
    if (w == null) continue;
    // We want the option furthest in the OPPOSITE direction to the one taken.
    if (best === null || (chosenWeight >= 0 ? w < best.weight : w > best.weight)) {
      best = { label: o.label, weight: w };
    }
  }
  if (!best) return null;
  // Only worth showing if it genuinely points the other way.
  if (chosenWeight >= 0 ? best.weight >= 0 : best.weight <= 0) return null;
  return `Had you picked “${best.label}”, this would have read the other way.`;
}

/** Self-report items have no image to interpret, so the reading is built from the trait itself. */
function selfReportReading(trait: HgTraitKey, agreed: boolean, strong: boolean): string {
  const label = TRAIT_LABEL[trait];
  const meta = TRAIT_META[trait];
  const stance = strong
    ? (agreed ? 'You did not hedge on this one' : 'You rejected this one outright')
    : (agreed ? 'You leaned toward this' : 'You leaned away from this');
  const consequence = agreed ? meta.highBehavior : meta.lowBehavior;
  return `${stance}, and it is one of the clearer ${label} signals in the set. ${consequence}`;
}

export function answerHighlightsByTrait(
  responses: HgResponse[],
): Record<HgTraitKey, AnswerHighlight[]> {
  const responseMap = new Map(responses.map(r => [r.questionId, r.value]));
  const out: Record<HgTraitKey, AnswerHighlight[]> = TRAITS.reduce((acc, t) => {
    acc[t] = []; return acc;
  }, {} as Record<HgTraitKey, AnswerHighlight[]>);

  for (const item of hiddenGeniusQuiz as HgQuizItem[]) {
    const val = responseMap.get(item.id);
    if (val == null) continue;

    if (item.type === 'scale' || item.type === 'frequency') {
      // For likert/frequency: only count as evidence if the answer isn't neutral (3).
      const strength = Math.abs(val - 3) / 2; // 0..1
      if (strength < 0.4) continue;
      const label = item.type === 'scale' ? LIKERT_LABELS[val] : FREQUENCY_LABELS[val];
      for (const m of item.traitMappings) {
        // If weight is positive and user agrees → contributes.
        // If weight is negative and user disagrees → contributes.
        const contrib = (val - 3) / 2 * m.weight;
        if (Math.abs(contrib) < 0.15) continue;
        out[m.trait].push({
          questionId: item.id,
          prompt: item.text,
          choice: label,
          reading: selfReportReading(m.trait, contrib >= 0, strength >= 0.9),
          direction: directionLine(m.trait, contrib),
          contrast: null,
          projective: false,
          weight: Math.abs(contrib),
        });
      }
    } else {
      const opt = item.options.find(o => o.value === val);
      if (!opt) continue;
      for (const m of opt.traitMappings) {
        if (Math.abs(m.weight) < 0.3) continue;
        out[m.trait].push({
          questionId: item.id,
          prompt: item.text,
          choice: opt.label,
          reading: opt.reading ?? '',
          direction: directionLine(m.trait, m.weight),
          contrast: contrastLine(item.options, opt.label, m.trait, m.weight),
          projective: item.type === 'inkblot',
          weight: Math.abs(m.weight),
        });
      }
    }
  }

  // Sort each trait's highlights by weight, keep top 2. Prefer highlights that
  // actually carry a reading so the report never renders a bare echo.
  for (const t of TRAITS) {
    out[t] = out[t]
      .sort((a, b) => (Number(!!b.reading) - Number(!!a.reading)) || (b.weight - a.weight))
      .slice(0, 2);
  }
  return out;
}


/* ---------------- Productive tensions ---------------- */

export interface TensionPair {
  a: HgTraitKey;
  b: HgTraitKey;
  title: string;
  body: string;
  scoreA: number;
  scoreB: number;
}

const TENSION_DEFS: { a: HgTraitKey; b: HgTraitKey; title: string; body: string }[] = [
  { a: 'creativityOrientation', b: 'detailOrientation',
    title: 'Wild ideas, tight finishing',
    body: 'You generate broadly, then narrow down carefully. That combination is what turns creativity into work that actually ships.' },
  { a: 'creativityOrientation', b: 'conscientiousness',
    title: 'Vision + follow-through',
    body: 'Most people who imagine well drop the ball on execution. You do both. Your ideas outlast the initial burst because the discipline is right there behind them.' },
  { a: 'systemsOrientation', b: 'peopleOrientation',
    title: 'Systems + humans',
    body: 'You see the structure and the humans inside it at the same time. That is unusual — most systems thinkers optimize processes and forget who is running them.' },
  { a: 'leadershipDrive', b: 'agreeableness',
    title: 'Warm authority',
    body: 'You can lead without hardening. People follow because they feel respected, not just directed. That is a rare combination in high-drive people.' },
  { a: 'openness', b: 'structurePreference',
    title: 'Curious, but grounded',
    body: 'You collect new ideas eagerly, then hang them on a stable frame. Novelty is fuel, not chaos, for you.' },
  { a: 'riskTolerance', b: 'systemsOrientation',
    title: 'Bold, but calculated',
    body: 'You are willing to move on incomplete information — but you have modeled the second-order effects. That is the profile of good founders and general officers.' },
  { a: 'autonomyNeed', b: 'peopleOrientation',
    title: 'Independent, still tuned in',
    body: 'You want to run your own show, but not at the cost of the people around you. You notice them even when you\'re working alone.' },
  { a: 'persuasionComfort', b: 'agreeableness',
    title: 'Persuasion without pressure',
    body: 'You can move a room without steamrolling it. That is why people say "you have a point" instead of "you\'re pushy."' },
  { a: 'learningVelocity', b: 'detailOrientation',
    title: 'Fast to learn, careful to check',
    body: 'You get functional quickly, then close the gaps. Most fast learners skip the second step.' },
];

export function tensionPairs(
  traitScores: Record<HgTraitKey, number>,
): TensionPair[] {
  const scored = TENSION_DEFS.map(t => {
    const scoreA = traitScores[t.a];
    const scoreB = traitScores[t.b];
    // Both traits must be reasonably high AND close together to count as a tension.
    const both = Math.min(scoreA, scoreB);
    const closeness = 100 - Math.abs(scoreA - scoreB);
    return { ...t, scoreA, scoreB, rank: both * 0.7 + closeness * 0.3 };
  });
  return scored
    .filter(t => Math.min(t.scoreA, t.scoreB) >= 62)
    .sort((a, b) => b.rank - a.rank)
    .slice(0, 2)
    .map(({ rank, ...rest }) => rest);
}

/* ---------------- Archetype confidence ---------------- */

export interface ArchetypeConfidence {
  band: 'clear' | 'hybrid' | 'balanced';
  gap: number;              // primary-secondary composite score gap
  headline: string;
  body: string;
}

export function archetypeConfidence(
  primary: ArchetypeId,
  secondary: ArchetypeId,
  traitScores: Record<HgTraitKey, number>,
): ArchetypeConfidence {
  const primAvg = ARCHETYPES[primary].traits
    .reduce((s, t) => s + traitScores[t], 0) / ARCHETYPES[primary].traits.length;
  const secAvg = ARCHETYPES[secondary].traits
    .reduce((s, t) => s + traitScores[t], 0) / ARCHETYPES[secondary].traits.length;
  const gap = Math.round(primAvg - secAvg);

  if (primary === 'adaptive-generalist') {
    return {
      band: 'balanced', gap,
      headline: 'Balanced profile',
      body: 'No single archetype dominates you — that flexibility is itself the pattern. You can pick the mode the moment needs.',
    };
  }
  if (gap >= 8) {
    return {
      band: 'clear', gap,
      headline: 'Clear primary archetype',
      body: `Your primary mode is unusually dominant (${gap} points ahead of your secondary). This is how you show up under pressure, without thinking about it.`,
    };
  }
  return {
    band: 'hybrid', gap,
    headline: 'Hybrid mind',
    body: `Your primary and secondary archetypes sit within ${Math.max(1, gap)} points of each other. You genuinely operate as a blend — different situations pull different modes forward.`,
  };
}

/* ---------------- Environment fit ---------------- */

export interface EnvironmentFit {
  amplifiers: { title: string; body: string }[];
  drainers: { title: string; body: string }[];
}

export function environmentFit(
  primary: ArchetypeId,
  traitScores: Record<HgTraitKey, number>,
): EnvironmentFit {
  const highAutonomy = traitScores.autonomyNeed >= 60;
  const highStructure = traitScores.structurePreference >= 60;
  const highPeople = traitScores.peopleOrientation >= 60;
  const highExtra = traitScores.extraversion >= 60;
  const highRisk = traitScores.riskTolerance >= 60;
  const highCreative = traitScores.creativityOrientation >= 60;
  const highDetail = traitScores.detailOrientation >= 60;

  const amp: { title: string; body: string }[] = [];
  const drain: { title: string; body: string }[] = [];

  if (highAutonomy) amp.push({
    title: 'Ownership over your work',
    body: 'You do your best thinking when the scope is yours to shape. Give yourself the end-to-end.',
  });
  else amp.push({
    title: 'A defined lane with a clear brief',
    body: 'You do your best work inside a well-scoped problem. Ambiguous, "figure it out" briefs cost you energy.',
  });

  if (highPeople || highExtra) amp.push({
    title: 'A close working group of 3–6',
    body: 'You are sharper in a small, high-trust team than either alone or in a large room. That is the natural unit for your mind.',
  });
  else amp.push({
    title: 'Deep-work blocks, minimal meetings',
    body: 'Uninterrupted 90-minute stretches are worth more to you than another sync. Protect the calendar.',
  });

  if (highCreative || highRisk) amp.push({
    title: 'Room to try things that might not work',
    body: 'You need permission to be wrong sometimes. Environments that only reward "safe correct" flatten your best moves.',
  });
  else if (highStructure) amp.push({
    title: 'Stable systems and clear standards',
    body: 'You thrive where the rules are legible and the standards are known. Chaos costs you disproportionately.',
  });
  else amp.push({
    title: 'Feedback loops you can see quickly',
    body: 'You lift when you can measure whether the last move worked before making the next one. Long feedback cycles drain your motivation.',
  });

  if (highAutonomy) drain.push({
    title: 'Heavy oversight and status-checks',
    body: 'Being managed at high resolution isn\'t just annoying — it degrades your quality. Trust deficit is your worst working condition.',
  });
  if (highExtra) drain.push({
    title: 'Isolation without a team',
    body: 'You process out loud. Long solo stretches without anyone to think with take you off-line faster than most.',
  });
  if (highDetail && !highStructure) drain.push({
    title: 'Sloppy handoffs and moving targets',
    body: 'You notice every loose end. In an environment that keeps shifting the goal, that becomes a source of daily friction.',
  });
  if (drain.length < 2) drain.push({
    title: 'Politics-as-work',
    body: 'Environments where the real currency is positioning, not output, will drain you faster than the hard work itself.',
  });

  return { amplifiers: amp.slice(0, 3), drainers: drain.slice(0, 2) };
}

/* ---------------- 90-day growth arc ---------------- */

export interface GrowthPhase {
  phase: 1 | 2 | 3;
  window: string;
  focus: string;
  practice: string;
}

export function growthArc(
  weakestTrait: HgTraitKey,
  primary: ArchetypeId,
): GrowthPhase[] {
  const meta = TRAIT_META[weakestTrait];
  const arch = ARCHETYPES[primary];
  return [
    { phase: 1, window: 'Weeks 1–3', focus: 'Awareness',
      practice: `Name the moments your ${meta.label.toLowerCase()} is undercutting you. Every night, write one line: "Where did this cost me today?" No fixing yet — just spot it.` },
    { phase: 2, window: 'Weeks 4–8', focus: 'Stretch',
      practice: `Run the weekly drill: ${meta.microDrill.replace(/\.$/, '')}. Once a week is the floor.` },
    { phase: 3, window: 'Weeks 9–13', focus: 'Integration',
      practice: `Pair it with your ${arch.name.replace(/^The\s+/, '')} strengths. Close one real project using both your primary mode and your weakest lever.` },
  ];
}



/* ------------------------------------------------------------------ */
/* Composite identity synthesis                                        */
/*                                                                     */
/* The rest of the report shows the two evidence streams side by side: */
/* what you said about yourself, and what you saw in the ambiguous     */
/* images. This fuses them. Convergence is confirmation; divergence is */
/* the interesting part — it is where self-image and instinct disagree.*/
/* Nothing here ever names a literal choice; the projective layer      */
/* enters only as direction.                                           */
/* ------------------------------------------------------------------ */

export interface TraitDivergence {
  trait: HgTraitKey;
  /** True when the person rates themselves higher than their instinct reads. */
  selfHigher: boolean;
  /** Absolute gap between the two normalised sources, 0..2. */
  gap: number;
}

export interface InstinctLenses {
  /** Negative = threat-first reads, positive = benign/idealised reads. */
  valence: number;
  /** Negative = literal objects, positive = relations and systems. */
  abstraction: number;
  /** Negative = system/object focus, positive = human focus. */
  contentClass: number;
}

export interface CompositeSynthesis {
  /** Traits where both sources point the same way, strongest first. */
  convergent: HgTraitKey[];
  /** Traits where the two sources disagree most, largest gap first. */
  divergent: TraitDivergence[];
  lenses: InstinctLenses;
  /** 0..100. High = self-image and instinct tell the same story. */
  agreementScore: number;
  /** False when the projective layer is too sparse to read. */
  hasProjective: boolean;
}

const CONVERGENCE_MAX_GAP = 0.35;
const DIVERGENCE_MIN_GAP = 0.5;

export function composeIdentitySynthesis(responses: HgResponse[]): CompositeSynthesis {
  const { selfReport, projective } = buildPools(responses);

  type Row = { trait: HgTraitKey; sr: number; pj: number; gap: number };
  const rows: Row[] = [];

  for (const t of TRAITS) {
    const sr = selfReport[t];
    const pj = projective[t];
    if (sr.weight <= 0 || pj.weight <= 0) continue;
    const srAvg = sr.sum / sr.weight;
    const pjAvg = pj.sum / pj.weight;
    rows.push({ trait: t, sr: srAvg, pj: pjAvg, gap: Math.abs(srAvg - pjAvg) });
  }

  const hasProjective = rows.length >= 3;

  // Convergent: both sources agree AND the trait is actually saying something
  // (a shared "meh" is not a finding). Rank by combined magnitude.
  const convergent = rows
    .filter(r => r.gap <= CONVERGENCE_MAX_GAP && Math.abs(r.sr) >= 0.15 && r.sr * r.pj >= 0)
    .sort((a, b) =>
      (Math.abs(b.sr) + Math.abs(b.pj)) - (Math.abs(a.sr) + Math.abs(a.pj)) ||
      TRAITS.indexOf(a.trait) - TRAITS.indexOf(b.trait))
    .slice(0, 3)
    .map(r => r.trait);

  const divergent: TraitDivergence[] = rows
    .filter(r => r.gap >= DIVERGENCE_MIN_GAP)
    .sort((a, b) => b.gap - a.gap || TRAITS.indexOf(a.trait) - TRAITS.indexOf(b.trait))
    .slice(0, 2)
    .map(r => ({ trait: r.trait, selfHigher: r.sr > r.pj, gap: r.gap }));

  // Lens proxies. The quiz does not tag options with lenses directly, so each
  // lens is read off the projective trait vector it was authored to move.
  const pjAvg = (t: HgTraitKey) => {
    const p = projective[t];
    return p.weight > 0 ? p.sum / p.weight : 0;
  };
  const lenses: InstinctLenses = {
    valence: (pjAvg('agreeableness') - pjAvg('neuroticism') - pjAvg('riskTolerance') * 0.5) / 2,
    abstraction: (pjAvg('openness') + pjAvg('systemsOrientation') + pjAvg('creativityOrientation')) / 3,
    contentClass: (pjAvg('peopleOrientation') + pjAvg('extraversion') - pjAvg('systemsOrientation')) / 2,
  };

  const meanGap = rows.length > 0
    ? rows.reduce((sum, r) => sum + r.gap, 0) / rows.length
    : 0;
  // A mean gap of ~1.0 across normalised (-1..1) sources is total disagreement.
  const agreementScore = Math.round(100 * Math.max(0, 1 - meanGap));

  return { convergent, divergent, lenses, agreementScore, hasProjective };
}
