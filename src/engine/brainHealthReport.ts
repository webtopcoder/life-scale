import { QUIZ_STEPS, type Domain, type QuizQuestion } from '@/data/brainHealthQuiz';
import type { Answers } from '@/engine/brainHealthScoring';

export type OverallBand = 'Strong' | 'Solid' | 'Building';

export function overallBand(riskIndex: number): OverallBand {
  if (riskIndex <= 45) return 'Strong';
  if (riskIndex <= 65) return 'Solid';
  return 'Building';
}

export const DOMAIN_HEADLINE: Record<Domain, string> = {
  cognitive: 'Memory & thinking',
  vascular: 'Heart & body',
  sleep: 'Sleep',
  movement: 'Movement',
  sensory: 'Hearing & vision',
  mood: 'Mood',
  reserve: 'Mental challenge',
};

/**
 * Simple word-band per domain, replacing numeric scores in the UI.
 * `score` is 0..1 where higher = more risk / more room to grow.
 */
export type DomainBand = 'Steady' | 'Building' | 'Priority';
export function bandForDomain(score: number): DomainBand {
  if (score <= 0.33) return 'Steady';
  if (score <= 0.66) return 'Building';
  return 'Priority';
}

type Level = 'high' | 'mid' | 'low';
/**
 * Maps a domain score (0..1, higher = worse) to a copy level.
 * "high" here means "the domain is strong" (low risk). Kept for backwards
 * compatibility with existing narrative keys.
 */
export function levelFor(score: number): Level {
  if (score <= 0.33) return 'high';
  if (score <= 0.66) return 'mid';
  return 'low';
}

/* ---------- rich, teaching-length copy ---------- */

export const DOMAIN_NARRATIVE: Record<Domain, Record<Level, string>> = {
  cognitive: {
    high: "Memory and thinking are landing where you'd want them. The job now is protection, not repair.",
    mid: "Mostly steady thinking with a few foggier days. That drift tracks back to sleep, stress or variety — not memory itself.",
    low: "More slips and heavier days. Thinking sits on top of sleep, mood and blood flow, so it rebounds once those are protected.",
  },
  vascular: {
    high: "Blood flow, pressure and sugar are steady — that's what delivers oxygen to your thinking.",
    mid: "Some slack in the physical scaffolding. The same arteries feed heart and brain, so creep here eventually shows up as fog.",
    low: "Your heart-and-body signals want attention. Brain tissue depends on healthy vessels, and this is the most fixable side of brain health.",
  },
  sleep: {
    high: "You sleep well and it shows — deep sleep files learning and clears waste. Protect it like a routine.",
    mid: "Sleep mostly works, but the edges are ragged. Quality shows up in memory and mood before it shows up as tiredness.",
    low: "Sleep is likely your biggest quick win. Broken nights drag on memory, mood and decisions at once. Stable timing beats extra hours.",
  },
  movement: {
    high: "You move enough that your brain benefits — better blood flow, better mood. It compounds over decades.",
    mid: "You move sometimes, but it isn't an anchor. Twenty steady minutes most days beats a punishing weekend session.",
    low: "Movement is a lever waiting to be pulled. Long sitting drops attention the same afternoon. Start with a walk you don't skip.",
  },
  sensory: {
    high: "Vision and hearing support your brain rather than compete with it. Clean input means less straining.",
    mid: "Small hearing or vision drop-offs make the brain work harder all day — you feel it as evening tiredness.",
    low: "Getting hearing and vision corrected is one of the highest-value moves available. Untreated loss is a major modifiable risk.",
  },
  mood: {
    high: "Your emotional baseline is steady, and attention and memory run better for it.",
    mid: "Some low-grade stress in the mix. Chronic stress reshapes attention and memory before it feels like a problem.",
    low: "Mood is weighing on the system: narrowed attention, weaker memory, harder habits. Support pays off fastest here.",
  },
  reserve: {
    high: "You keep learning and stretching. That's reserve — a mind still being asked to grow.",
    mid: "Some challenge in your week, but not enough to force growth. One recurring learning or social habit shifts it.",
    low: "Your brain isn't being stretched much, which thins the buffer over decades. The fix is exposure, not intelligence.",
  },
};


export const DOMAIN_WHY: Record<Domain, string> = {
  cognitive:
    "Memory and focus are the visible layer of a much deeper system. Almost every other area on this check-in influences how sharp today's thinking feels — which is why isolated 'brain training' rarely moves it, and boring things like sleep and blood pressure do.",
  vascular:
    "Your brain uses about a fifth of your body's energy and gets all of it through blood vessels. Whatever helps or hurts those vessels — blood pressure, cholesterol, sugar, weight — shows up in thinking eventually. This is the most-studied, most-controllable lever for long-term brain health.",
  sleep:
    "Sleep is when the brain consolidates learning and physically flushes the day's waste products. Miss it or fragment it and everything else — attention, memory, mood, appetite — gets harder to run. It's the single input that touches every other area.",
  movement:
    "Movement grows the small blood vessels that feed the brain, releases growth factors that keep neurons flexible, and directly lifts mood the same day. It's the closest thing brain science has to a first-line prescription.",
  sensory:
    "The brain spends a huge amount of energy compensating when hearing or vision are dulled. Fixing the input frees mental horsepower and, in the case of hearing loss especially, is now recognised as one of the biggest modifiable risks for cognitive decline over decades.",
  mood:
    "How you feel emotionally is how your brain performs. Persistent stress and low mood narrow attention, disrupt sleep, and interfere with the very memory circuits people worry about. Steady mood is the platform everything else stands on.",
  reserve:
    "Reserve is the buffer that keeps you sharp over decades even as the brain naturally changes. It's built by novelty, learning and social connection — and unlike genes, it's fully in your hands.",
};

/** A common myth per domain, corrected in plain language. Used in Focus cards. */
export const DOMAIN_MYTH: Record<Domain, { myth: string; truth: string }> = {
  cognitive: {
    myth: "Forgetting names or losing focus means my memory is going.",
    truth: "The vast majority of small memory slips are downstream of sleep, stress, or attention — not the memory system itself. That's why fixing those areas moves memory much more than 'memory training' ever does.",
  },
  vascular: {
    myth: "Blood pressure and cholesterol are heart problems, not brain problems.",
    truth: "They're the same problem. The arteries that feed your heart also feed your brain, and untreated pressure or lipid issues in mid-life are among the biggest known contributors to late-life cognitive decline.",
  },
  sleep: {
    myth: "I can catch up on sleep at the weekend.",
    truth: "You can catch up on tiredness, but not on the memory and mood consequences. Consistency of timing does more for the brain than banked hours ever will.",
  },
  movement: {
    myth: "Movement is only useful if it's real exercise.",
    truth: "Short walks and standing breaks change brain outcomes measurably. The daily consistency matters much more than the intensity — a 20-minute walk beats a punishing weekend session almost every time.",
  },
  sensory: {
    myth: "Hearing aids are for old age, not brain health.",
    truth: "Treating hearing loss is one of the strongest modifiable protections against cognitive decline that current research has found. Waiting for it to feel bad enough is exactly the wrong strategy.",
  },
  mood: {
    myth: "Getting help for mood is only for when things are really bad.",
    truth: "Talking to a professional about persistent low mood or high stress is maintenance, not crisis. Left alone, chronic mood strain quietly costs memory and attention for years.",
  },
  reserve: {
    myth: "You either have a sharp brain or you don't.",
    truth: "Cognitive reserve is built, not born. Novelty, difficulty and social connection all measurably add to it — and the earlier you start, the more it compounds.",
  },
};

/** Micro-actions paired with a one-line 'why this' teaching note. */
export const DOMAIN_HABITS: Record<Domain, { action: string; why: string }[]> = {
  cognitive: [
    { action: "Take one 20-minute deep-focus block a day, no phone in reach.", why: "Uninterrupted focus is how memory gets built and retrieved." },
    { action: "Learn one small thing every day — a word, a route, a fact.", why: "Daily novelty keeps thinking flexible; size barely matters." },
    { action: "Explain what you learned to someone.", why: "Teaching forces re-encoding, which is what locks it in." },
  ],
  vascular: [
    { action: "Walk 10 minutes after your two biggest meals.", why: "Post-meal walking blunts blood-sugar spikes." },
    { action: "Trade one ultra-processed staple a day for something whole.", why: "Ultra-processed food drives most of the drift in pressure and sugar." },
    { action: "Get your blood pressure checked once a season.", why: "You cannot manage a number you do not know." },
  ],
  sleep: [
    { action: "Same wake time seven days a week — even weekends.", why: "A fixed wake time anchors your rhythm; early bedtimes don't." },
    { action: "Dim room and screens 60 minutes before bed.", why: "Evening light suppresses the hormone that makes real sleep possible." },
    { action: "No caffeine after lunch, even on days it feels harmless.", why: "Caffeine's half-life is 5–6 hours; the afternoon cup is still working." },
  ],
  movement: [
    { action: "20-minute walk daily. Non-negotiable.", why: "The most-validated, lowest-friction brain habit there is." },
    { action: "Two short strength sessions a week — bodyweight is fine.", why: "Strength work protects balance and glucose handling." },
    { action: "Every hour of sitting, stand and move for two minutes.", why: "Long sedentary blocks drop attention that same afternoon." },
  ],
  sensory: [
    { action: "Book a hearing check if it's been over two years.", why: "Untreated hearing loss is a leading modifiable risk." },
    { action: "Book an eye exam if it's been over two years.", why: "Uncorrected vision drains attention all day." },
    { action: "Turn TV and podcast volume down one notch.", why: "Small daily protection compounds enormously." },
  ],
  mood: [
    { action: "Ten minutes of morning sunlight before screens.", why: "Morning light steadies mood and sets the sleep clock." },
    { action: "One honest conversation a week — call, text, or in person.", why: "Real contact buffers stress and protects memory." },
    { action: "If low mood is sticky, talk to a professional.", why: "Early support is maintenance, not weakness." },
  ],
  reserve: [
    { action: "Pick one new skill this month, even a small one.", why: "Novelty and slight difficulty are what build reserve." },
    { action: "Keep one recurring social plan on the calendar.", why: "Predictable connection buffers more than occasional events." },
    { action: "Do one thing weekly that is slightly harder than you know.", why: "Reserve grows just outside your comfort zone." },
  ],
};

/** How the Brain dashboard supports each area — used to embed the sell. */
export const DOMAIN_DASHBOARD_HOOK: Record<Domain, string> = {
  cognitive: "Daily drills and focus practice on your dashboard are built for exactly this.",
  vascular: "Your habit tracker keeps the movement and food shifts visible day by day.",
  sleep: "Your dashboard tracks bedtime and wake time so you see the pattern instead of guessing.",
  movement: "Your dashboard turns 'walk daily' into a streak and prompts standing breaks.",
  sensory: "Your dashboard notes when to book your next checks and prompts the daily protections.",
  mood: "The daily check-in surfaces mood patterns you'd miss, and nudges action early.",
  reserve: "Dashboard lessons and challenges supply the novelty this area needs.",
};

/* ---------- answer-aware helpers ---------- */

export interface AnswerHighlight {
  qid: number;
  prompt: string;
  chosen: string;
  weight: number;
  maxWeight: number;
  contributionPct: number;
}

/**
 * Threshold that separates "healthy" answers from "concern-level" answers.
 * A weight below this fraction of max is considered fine and should not be
 * cited as evidence a domain is flagged.
 */
const CONCERN_THRESHOLD = 0.5;

function collectDomainAnswers(domain: Domain, answers: Answers): AnswerHighlight[] {
  const out: AnswerHighlight[] = [];
  for (const step of QUIZ_STEPS) {
    if (step.kind !== 'q') continue;
    const q = step as QuizQuestion;
    if (q.domain !== domain || !q.weights) continue;
    const idx = answers[q.id];
    if (idx == null) continue;
    const w = q.weights[idx] ?? 0;
    const max = Math.max(...q.weights);
    if (max === 0) continue;
    out.push({
      qid: q.id,
      prompt: q.prompt,
      chosen: q.options[idx] ?? '',
      weight: w,
      maxWeight: max,
      contributionPct: Math.round((w / max) * 100),
    });
  }
  return out;
}

/**
 * ONLY the user's above-threshold answers on this domain, ordered by how
 * strongly they contributed. Empty when nothing on this domain actually
 * flagged — safe to gate UI on `.length > 0` for "you told us" citations.
 */
export function concernHighlightsFor(domain: Domain, answers: Answers, limit = 3): AnswerHighlight[] {
  return collectDomainAnswers(domain, answers)
    .filter(h => h.weight / h.maxWeight >= CONCERN_THRESHOLD)
    .sort((a, b) => b.contributionPct - a.contributionPct)
    .slice(0, limit);
}

/**
 * Kept for backwards compatibility — this one is NOT threshold-filtered and
 * can return healthy answers. Prefer `concernHighlightsFor` for anything
 * framed as "reason this area needs attention."
 */
export function answerHighlightsFor(domain: Domain, answers: Answers, limit = 3): AnswerHighlight[] {
  return collectDomainAnswers(domain, answers)
    .sort((a, b) => b.contributionPct - a.contributionPct)
    .slice(0, limit);
}

/** Strongest low-weight (healthy) answers proving a domain is working. */
export function strengthHighlightsFor(domain: Domain, answers: Answers, limit = 2): AnswerHighlight[] {
  return collectDomainAnswers(domain, answers)
    .map(h => ({ ...h, contributionPct: Math.round((1 - h.weight / h.maxWeight) * 100) }))
    .sort((a, b) => b.contributionPct - a.contributionPct)
    .slice(0, limit);
}

/** The single strongest concern answer across ALL domains, or null. */
export function topConcernAcrossDomains(answers: Answers): (AnswerHighlight & { domain: Domain }) | null {
  const domains: Domain[] = ['cognitive', 'vascular', 'sleep', 'movement', 'sensory', 'mood', 'reserve'];
  let best: (AnswerHighlight & { domain: Domain }) | null = null;
  for (const d of domains) {
    for (const h of concernHighlightsFor(d, answers, 3)) {
      if (!best || h.contributionPct > best.contributionPct) best = { ...h, domain: d };
    }
  }
  return best;
}

/* ---------- cognitive signature (three axes) ---------- */

export interface SignatureAxis {
  key: 'steadiness' | 'resilience' | 'reserve';
  label: string;
  band: DomainBand;
  interpretation: string;
  teaches: string;
}

function bandFromRaw(raw: number): DomainBand {
  // raw is 0..1, higher = stronger
  if (raw >= 0.67) return 'Steady';
  if (raw >= 0.34) return 'Building';
  return 'Priority';
}

export function signatureAxes(domainMap: Record<Domain, number>): SignatureAxis[] {
  const steadRaw = 1 - (domainMap.cognitive + domainMap.mood) / 2;
  const resilRaw = 1 - (domainMap.vascular + domainMap.movement + domainMap.sleep) / 3;
  const resvRaw  = 1 - (domainMap.reserve + domainMap.sensory) / 2;
  const steadBand = bandFromRaw(steadRaw);
  const resilBand = bandFromRaw(resilRaw);
  const resvBand  = bandFromRaw(resvRaw);
  return [
    {
      key: 'steadiness', label: 'Steadiness',
      band: steadBand,
      interpretation: steadBand === 'Steady'
        ? "Your day-to-day baseline is calm and clear — focus and mood are backing each other up."
        : steadBand === 'Building'
        ? "Your baseline works, but focus or mood wants protection. Steadying one usually lifts the other."
        : "Your baseline is being pulled on hard. That's a load problem, not a memory problem.",
      teaches: "Steadiness is what memory sits on top of. When either mood or attention drops, memory takes the blame — usually unfairly.",
    },
    {
      key: 'resilience', label: 'Resilience',
      band: resilBand,
      interpretation: resilBand === 'Steady'
        ? "Movement, sleep and heart signals point the same way — the scaffolding that lets everything else run."
        : resilBand === 'Building'
        ? "The physical scaffolding is partly there. Sleep or movement is usually the loose thread."
        : "Your physical scaffolding is thin — often the highest-leverage place to start.",
      teaches: "Resilience is what your brain draws on when the day gets hard, and it's built by the boring physical basics.",
    },
    {
      key: 'reserve', label: 'Reserve',
      band: resvBand,
      interpretation: resvBand === 'Steady'
        ? "You're building the buffer that keeps you sharp for decades. Keep the mix going."
        : resvBand === 'Building'
        ? "Some buffer is being built, but not consistently. One recurring learning or social habit shifts it."
        : "Long-term buffer isn't being built right now — and it's built by exposure, not intelligence.",
      teaches: "Reserve is why two people the same age can look completely different cognitively. Novelty, difficulty, connection.",
    },
  ];

}

/* ---------- risk & protective factors ---------- */

export interface Factor {
  key: string;
  label: string;
  value: string;
  tone: 'protective' | 'watch' | 'flag';
  detail: string;
}

const AGE_LABELS = ['Under 40', '40–49', '50–59', '60–69', '70+'];
const FAMILY_LABELS = ['No', 'Parent', 'Grandparent', 'Multiple relatives', 'Unsure'];

export function riskFactors(answers: Answers): Factor[] {
  const f: Factor[] = [];
  const age = answers[1];
  if (age != null) {
    f.push({
      key: 'age',
      label: 'Age band',
      value: AGE_LABELS[age] ?? '—',
      tone: age <= 1 ? 'protective' : age <= 2 ? 'watch' : 'flag',
      detail: age <= 1
        ? "Decades of compounding available — habits built now flatten the curve later."
        : age <= 2
        ? "The window where brain-health habits pay back most per unit of effort."
        : "The window where consistent, unglamorous habits protect years of clarity.",
    });
  }
  const fam = answers[2];
  if (fam != null) {
    f.push({
      key: 'family',
      label: 'Family history',
      value: FAMILY_LABELS[fam] ?? '—',
      tone: fam === 0 ? 'protective' : fam === 4 ? 'watch' : 'flag',
      detail: fam === 0
        ? "Modestly lower baseline risk. Habits still matter far more than genes."
        : fam === 4
        ? "Unclear history — worth asking older relatives. The same habits apply either way."
        : "One signal, not a verdict. Day-to-day habits dominate the long-term picture.",
    });
  }
  const snoring = answers[16];
  if (snoring != null) {
    f.push({
      key: 'snoring',
      label: 'Nighttime breathing',
      value: ['Clear', 'Some snoring', 'Loud snoring', 'Breathing pauses noticed', 'Unsure'][snoring] ?? '—',
      tone: snoring <= 1 ? 'protective' : 'flag',
      detail: snoring >= 3
        ? "Breathing pauses are underdiagnosed and very treatable — worth a proper sleep evaluation."
        : snoring === 2
        ? "Loud snoring is worth mentioning to a doctor; sleep-disordered breathing quietly drags on memory."
        : "Quiet, unbroken breathing is a strong protective signal.",
    });
  }
  const hearing = answers[23];
  if (hearing != null) {
    f.push({
      key: 'hearing_check',
      label: 'Last hearing check',
      value: ['<2 years', '2–5 years', '5+ years', 'Never / unsure'][hearing] ?? '—',
      tone: hearing === 0 ? 'protective' : hearing === 1 ? 'watch' : 'flag',
      detail: hearing >= 2
        ? "Untreated hearing loss taxes the brain all day — one of the cheapest, highest-value checks available."
        : "Recent checks keep a whole class of quiet cognitive drag from creeping in.",
    });
  }
  const social = answers[27];
  if (social != null) {
    f.push({
      key: 'social',
      label: 'Meaningful conversation',
      value: ['Daily', 'A few times a week', 'Rarely', 'Almost never'][social] ?? '—',
      tone: social <= 1 ? 'protective' : 'flag',
      detail: social <= 1
        ? "Regular real conversation is one of the strongest known buffers. Frequency beats numbers."
        : "Low contact is a genuine risk factor. One standing plan a week often changes the picture.",
    });
  }
  const learn = answers[28];
  if (learn != null) {
    f.push({
      key: 'learning',
      label: 'Learning frequency',
      value: ['Daily', 'A few times a week', 'Rarely', 'Almost never'][learn] ?? '—',
      tone: learn <= 1 ? 'protective' : 'flag',
      detail: learn <= 1
        ? "Frequent learning is the clearest path to reserve. What you learn matters less than that you do."
        : "Not being asked to learn shrinks reserve fastest. Pick one small, slightly hard thing.",
    });
  }
  return f;
}


/* ---------- doctor prompts ---------- */

export interface DoctorPrompt {
  key: string;
  ask: string;
  because: string;
}

export function doctorPrompts(answers: Answers): DoctorPrompt[] {
  const p: DoctorPrompt[] = [];
  const bp = answers[10];
  if (bp === 3) p.push({ key: 'bp_wip', ask: 'What is the next step for getting my blood pressure to a steady range?', because: 'You noted your blood pressure is still a work in progress.' });
  else if (bp === 1) p.push({ key: 'bp_borderline', ask: 'Since my blood pressure was borderline, when should I retest?', because: 'A borderline reading deserves a plan, not a shrug.' });
  const bpSelf = answers[9];
  if (bpSelf === 3) p.push({ key: 'bp_baseline', ask: 'Can we set a simple 7-day home blood-pressure baseline?', because: 'You said you do not currently track blood pressure.' });

  const chol = answers[11];
  if (chol === 1 || chol === 2) p.push({ key: 'chol', ask: 'Is my cholesterol pattern something we should treat, or watch?', because: 'You noted cholesterol on the higher side.' });
  if (chol === 3) p.push({ key: 'chol_check', ask: 'Can I get a lipid panel this visit?', because: 'It has been a while since your last check.' });

  const sugar = answers[12];
  if (sugar === 1 || sugar === 3) p.push({ key: 'a1c', ask: 'Can we run A1C and fasting glucose?', because: 'You noted blood sugar as elevated or still being worked on.' });

  const snoring = answers[16];
  if (snoring === 2) p.push({ key: 'snore', ask: 'Is my snoring worth investigating for sleep apnoea?', because: 'You noted loud snoring at night.' });
  if (snoring === 3) p.push({ key: 'apnoea', ask: 'Can I get referred for a sleep study?', because: 'You noted breathing pauses at night — this is worth checking.' });

  const sleepH = answers[14];
  if (sleepH === 2) p.push({ key: 'short_sleep', ask: 'What could be behind me sleeping under 5 hours most nights?', because: 'Chronic short sleep affects almost every other area.' });

  const hearingCheck = answers[23];
  if (hearingCheck === 2 || hearingCheck === 3) p.push({ key: 'hearing', ask: 'Can I get a baseline hearing test?', because: 'It has been 5+ years (or unclear) since your last check.' });
  const hearingIssue = answers[21];
  if (hearingIssue === 2 || hearingIssue === 3) p.push({ key: 'hearing_noisy', ask: 'Is my trouble following conversations in noise a hearing issue?', because: 'You noted it happens often.' });

  const vision = answers[24];
  if (vision === 2 || vision === 3) p.push({ key: 'eyes', ask: 'Can I book an eye exam?', because: 'You noted vision either gets in the way or has not been checked recently.' });

  const mood = answers[25];
  if (mood === 2 || mood === 3) p.push({ key: 'mood', ask: 'Can we talk about persistent low mood?', because: 'You noted feeling low more than half the days recently.' });

  return p;
}

/* ---------- projected trajectory (shape only, no numbers surfaced) ---------- */

export function projectedTrajectory(
  domainMap: Record<Domain, number>,
  top3: Domain[],
): { day: number; wellbeing: number }[] {
  const domains = Object.keys(domainMap) as Domain[];
  const focusSet = new Set(top3);
  const steps = [0, 30, 60, 90];
  return steps.map((day) => {
    const factor = day === 0 ? 0 : day === 30 ? 0.10 : day === 60 ? 0.20 : 0.30;
    const projected: Record<Domain, number> = { ...domainMap };
    for (const d of domains) {
      if (focusSet.has(d)) projected[d] = domainMap[d] * (1 - factor);
    }
    const avg = domains.reduce((acc, d) => acc + projected[d], 0) / domains.length;
    const wellbeing = Math.round(100 - Math.min(100, Math.max(0, (27 + 73 * Math.pow(avg, 0.75)) - 27) * (100 / 73)));
    return { day, wellbeing };
  });
}
