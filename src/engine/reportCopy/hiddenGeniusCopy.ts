/**
 * Extended authored copy for the Hidden Genius report.
 *
 * The scoring engine (hiddenGeniusScoring.ts) owns the math and the short
 * headline copy. This module owns the *depth* — the paragraphs that make each
 * section read like a written report rather than a set of labels.
 *
 * Everything here is deterministic and authored. No AI at render time.
 */

import type { ArchetypeId } from '@/engine/hiddenGeniusScoring';
import { ARCHETYPES } from '@/engine/hiddenGeniusScoring';
import type { HgTraitKey } from '@/data/hiddenGeniusQuiz';

export interface ArchetypeDepth {
  /** Where the strength came from — the origin of the pattern. */
  origin: string;
  /** What running this pattern costs you. Named plainly, not softened. */
  cost: string;
  /** How other people most commonly misread this archetype. */
  misreadAs: string;
  /** One consequence line per `showsUp` bullet, same order. */
  showsUpDetail: [string, string, string];
  /** The situation in which this archetype takes the wheel. */
  takesOverWhen: string;
  /** Blind spot, unpacked: trigger and the first correction. */
  blindSpot: { trigger: string; correction: string };
  /** What the pattern looks like at its best — used in the growth arc. */
  atItsBest: string;
}

export const ARCHETYPE_DEPTH: Record<ArchetypeId, ArchetypeDepth> = {
  'pattern-seer': {
    origin:
      'This pattern forms in people who watched before they were asked to participate. Your brain got good at modelling how things behave, because prediction was more useful than reaction — and it now runs before you have consciously decided anything.',
    cost:
      'The bill comes due in ambiguity. Your confidence is downstream of pattern clarity, so situations with no pattern yet leave you stalled. People read that pause as caution. It is a system waiting for signal.',
    misreadAs:
      'You get read as detached, or as holding back an opinion. You are still resolving the picture — and rooms often move on before your best contribution has loaded.',
    showsUpDetail: [
      'Your first instinct is worth more than you credit it for: it is a compressed conclusion, not a hunch.',
      'That restlessness is diagnostic. When you feel it, something genuinely does not add up yet.',
      'Your value is highest where two fields touch, which is why you are hard to place professionally.',
    ],
    takesOverWhen:
      'when the situation stops making sense and someone needs to work out what is actually going on',
    blindSpot: {
      trigger:
        'It fires under time pressure with incomplete information — where your pattern engine has least to work with and everyone expects a call.',
      correction:
        'Name your confidence out loud rather than waiting to be sure. "I am about seventy per cent on this" moves the room forward and costs you nothing.',
    },
    atItsBest:
      'At its best this pattern calls the turn a quarter before anyone else, and explains it clearly enough that others can act on it.',
  },
  'analytical-architect': {
    origin:
      'This pattern develops in people who learned that being organised was the reliable route to being right. Decomposition stopped being effortful and became the default shape of your thinking.',
    cost:
      'Structure has a speed limit. You pay for reliability with latency, which reads as hesitation. And a well-built structure is expensive to abandon, so you sometimes defend one past its usefulness.',
    misreadAs:
      'You get read as rigid. In reality you are the reason things do not have to be redone — but prevented failures are invisible and visible speed is not.',
    showsUpDetail: [
      'The reorganising you do in meetings is your most valuable contribution, and it is almost never credited.',
      'You are right more often, but you buy that with time nobody explicitly gave you. Make the trade visible.',
      'Most people escalate under breakage; you narrow. That is leadership without the title.',
    ],
    takesOverWhen:
      'when things are ambiguous enough to be dangerous and somebody has to impose an order that holds',
    blindSpot: {
      trigger:
        'It fires when the problem is genuinely underspecified and the honest answer is to try something and see.',
      correction:
        'Give yourself an explicit structure budget: decide how long you will spend organising, then act at that mark even if the structure is unfinished.',
    },
    atItsBest:
      'At its best this pattern produces work that does not need revisiting — decisions that hold and systems that scale.',
  },
  'creative-synthesist': {
    origin:
      'This pattern forms in minds that never filed knowledge by subject. You file by resemblance, so unrelated things end up stored next to each other and collide. Your ideas arrive as combinations, not inventions.',
    cost:
      'Generation is cheap for you and selection is expensive. The failure mode is not a lack of ideas but a graveyard of good ones abandoned at forty per cent.',
    misreadAs:
      'You get read as scattered. The truth is closer to the opposite — you are very interested in the work, up to the point where the interesting question has been answered.',
    showsUpDetail: [
      'You often cannot explain where an idea came from: the connection precedes the reasoning.',
      'You need collaborators who finish. Pairing with a completer is structural, not a workaround.',
      'Your best ideas arrive at the wrong moment, so capture infrastructure matters more for you than most.',
    ],
    takesOverWhen:
      'when the obvious answers are exhausted and the situation needs something that was not on the list',
    blindSpot: {
      trigger:
        'It fires at the transition from interesting to tedious — the moment the idea is proven and only the building remains.',
      correction:
        'Pick one thing and ship it badly, on a date you told someone. You need one completed cycle to prove that finishing is survivable.',
    },
    atItsBest:
      'At its best this pattern produces the thing nobody asked for and everybody then uses.',
  },
  'strategic-operator': {
    origin:
      'This pattern belongs to people who learned that outcomes, not intentions, get counted. You developed an instinct for leverage — the one move that makes the next five easier.',
    cost:
      'Leverage-seeking makes you selectively blind. Work with no strategic payoff still has to happen, and you compress reasoning into a conclusion, so support you assumed you had turns out thinner than you thought.',
    misreadAs:
      'You get read as ruthless. Usually you are operating on a longer horizon than the conversation is, consistent with a plan nobody has been shown.',
    showsUpDetail: [
      'You are rarely surprised by an outcome, but often surprised by how people felt about it.',
      'You cut losses where most people escalate. That saves time and occasionally reads as disloyalty.',
      'When you engage, the pace around you rises. When you disengage, people feel it before you say anything.',
    ],
    takesOverWhen:
      'when a decision has real stakes and everyone else is still gathering context',
    blindSpot: {
      trigger:
        'It fires when the right answer is obvious to you and consensus has not caught up, so you move without it.',
      correction:
        'Show the path, not just the conclusion. Two sentences of reasoning buys execution support that otherwise takes weeks to recover.',
    },
    atItsBest:
      'At its best this pattern puts effort where it compounds and leaves organisations measurably better positioned.',
  },
  'people-reader': {
    origin:
      'This pattern develops where the emotional temperature of a room was important information. Reading the gap between what is said and what is meant now happens automatically, whether you want it to or not.',
    cost:
      'Constant reception is tiring. You absorb the state of every room, including states that have nothing to do with you — and because you can see what everyone needs, you carry more of it than is reasonable.',
    misreadAs:
      'You get read as agreeable, or as someone without strong positions. You usually have a clear view and are choosing your moment, but the choosing looks like absence.',
    showsUpDetail: [
      'You know things about a group nobody told you, which makes your read hard to defend even when correct.',
      'Conflicts get routed through you whether or not you volunteered. That cost accumulates quietly.',
      'Your accuracy drops when you are depleted — exactly when people lean on you most.',
    ],
    takesOverWhen:
      'when the technical answer is settled and the real problem is that people are not aligned behind it',
    blindSpot: {
      trigger:
        'It fires when someone else is uncomfortable. Stating your own position would increase it, so you soften or withhold.',
      correction:
        'Say the difficult thing first, before the room settles. Once you have absorbed the group state your own view is much harder to locate.',
    },
    atItsBest:
      'At its best this pattern is why good decisions survive contact with an organisation — you see the human failure mode early enough to design around it.',
  },
  'independent-explorer': {
    origin:
      'This pattern belongs to people who discovered early that the standard route was not written with them in mind. You stepped outside systems to test whether the constraints were real. Most were not — until autonomy became a requirement rather than a preference.',
    cost:
      'You pay for independence in leverage. Stepping outside systems means you rebuild things other people inherited, and you spend credibility explaining why you did it your way.',
    misreadAs:
      'You get read as difficult. The accurate reading is that you follow process you understand and resist process you have only been handed.',
    showsUpDetail: [
      'Your best work happens with the door closed. Visibility of process, not oversight of outcomes, degrades your output.',
      'You find routes that were genuinely not on the map, which unsettles places that measure adherence.',
      'You are unusually resistant to sunk cost — you drop your own approach as readily as anyone else\'s.',
    ],
    takesOverWhen:
      'when the standard approach has failed and someone has to try something the plan did not include',
    blindSpot: {
      trigger:
        'It fires the moment a constraint is imposed rather than explained. The reflex to route around it arrives before you have evaluated it.',
      correction:
        'Ask what the constraint is protecting before you go around it. About a third of the time there is a real reason.',
    },
    atItsBest:
      'At its best this pattern produces the route nobody was using and everybody adopts afterwards.',
  },
  'verbal-craftsman': {
    origin:
      'This pattern grows in people who worked out that naming something accurately is most of the work of solving it. You feel the gap between a rough description and a precise one physically.',
    cost:
      'Precision has a speed cost and a social cost. You slow conversations to fix definitions, and you risk winning on formulation while losing on substance.',
    misreadAs:
      'You get read as pedantic. The distinction you are making is that the words are the problem — a group that has not agreed on terms has not agreed on anything.',
    showsUpDetail: [
      'People quote you. Your formulations outlive the meetings they were made in.',
      'You spot that two people agreeing are describing different things, before it gets expensive.',
      'Written channels are where you win; anything purely verbal and fast erases your advantage.',
    ],
    takesOverWhen:
      'when a discussion has been circling because nobody has defined what is being decided',
    blindSpot: {
      trigger:
        'It fires when a formulation is nearly right. The last ten per cent feels urgent to you and invisible to everyone else.',
      correction:
        'Separate the two passes: get the substance agreed with rough words, then sharpen.',
    },
    atItsBest:
      'At its best this pattern turns a fog into a decision — one sentence that names the real question.',
  },
  'adaptive-generalist': {
    origin:
      'This pattern belongs to people whose circumstances rewarded range over depth. You developed unusually low switching costs and a base broad enough to be functional in almost any room within a week.',
    cost:
      'Range is invisible on a CV and hard to price. And because everything is learnable for you at a moderate level, you have rarely had to sit through the plateau where depth gets built.',
    misreadAs:
      'You get read as unfocused. Adaptability is your specialisation, but there is no standard job title for it, so it keeps being described as an absence.',
    showsUpDetail: [
      'You are who organisations reach for when something unfamiliar lands, and rarely who gets credited.',
      'You translate between specialists who cannot hear each other — worth far more than it looks.',
      'Your risk is a career of useful contributions with nothing anyone can point to.',
    ],
    takesOverWhen:
      'when the situation changes shape mid-flight and needs a different kind of thinking than it started with',
    blindSpot: {
      trigger:
        'It fires at the plateau, where progress requires grinding and your range always offers a fresher domain.',
      correction:
        'Commit to one area past the point where it stops being interesting. You need one demonstration that you can go deep.',
    },
    atItsBest:
      'At its best this pattern holds a chaotic situation together because you speak every dialect in the room.',
  },
};


/** Second sentence onward of the blend paragraph, expanded per pair. */
export function secondaryInteraction(primary: ArchetypeId, secondary: ArchetypeId): string {
  const p = ARCHETYPES[primary];
  const s = ARCHETYPES[secondary];
  const pd = ARCHETYPE_DEPTH[primary];
  const sd = ARCHETYPE_DEPTH[secondary];
  return (
    `Your ${p.name.replace(/^The\s+/, '')} mode is the default — it engages ${pd.takesOverWhen}. Your ` +
    `${s.name.replace(/^The\s+/, '')} layer comes online ${sd.takesOverWhen}.`
  );
}

export function secondaryWhenToTrust(primary: ArchetypeId, secondary: ArchetypeId): string {
  const p = ARCHETYPES[primary].name.replace(/^The\s+/, '');
  const s = ARCHETYPES[secondary].name.replace(/^The\s+/, '');
  return (
    `The question is not which is stronger but which you are running. When your ${p} instinct has been going ` +
    `without traction, hand over to ${s} deliberately.`
  );
}


/** Blind-spot framing that names the weakest trait without restating its score. */
export function blindSpotFraming(primary: ArchetypeId, weakestLabel: string): string {
  const d = ARCHETYPE_DEPTH[primary];
  return (
    `${d.blindSpot.trigger} ` +
    `${weakestLabel} is the lever underneath it.`
  );
}

export function blindSpotCorrection(primary: ArchetypeId): string {
  return ARCHETYPE_DEPTH[primary].blindSpot.correction;
}

/** Used by the fingerprint section to add narrative around the trait list. */
export function fingerprintFraming(topLabels: string[], primary: ArchetypeId): string {
  const [a, b] = topLabels;
  return (
    `Traits are not virtues — each is a setting that makes some situations easier and others harder. Your top ` +
    `two, ${a} and ${b}, set your default speed, what you notice first, and what you avoid.`
  );
}

/** Trait-neutral evidence framing, used above the answer citations. */
export const EVIDENCE_FRAMING =
  'Everything here is derived, not asserted: each reading pairs something you chose with what that choice indicates.';

export const TRAIT_NEUTRALITY_NOTE =
  'The lower traits are not deficits — they are simply not load-bearing for the way you operate.';

/** Environment framing paragraphs. */
export function environmentFraming(primary: ArchetypeId): string {
  const d = ARCHETYPE_DEPTH[primary];
  return (
    `Fit is the largest multiplier on the output of a mind like yours. ${d.cost}`
  );
}

export function shinesFraming(primary: ArchetypeId): string {
  return (
    `These are the places where the way your mind already works matches what the task rewards. ` +
    `${ARCHETYPE_DEPTH[primary].atItsBest}`
  );
}

export function tensionsFraming(): string {
  return (
    'A tension is two traits most people do not hold together at strength. When they co-occur they stop ' +
    'cancelling and start compounding.'
  );
}

export function mindFraming(primary: ArchetypeId, topTraitLabel: string): string {
  return (
    `Below the archetype label sits the machinery that produces it. ${topTraitLabel} is the strongest signal in ` +
    `your profile. Each trait below is paired with the answer that moved it.`
  );
}

/** Superpower section: two paragraphs of origin and cost. */
export function superpowerBody(primary: ArchetypeId): { origin: string; cost: string; misreadAs: string } {
  const d = ARCHETYPE_DEPTH[primary];
  return { origin: d.origin, cost: d.cost, misreadAs: d.misreadAs };
}

export function showsUpDetail(primary: ArchetypeId, index: number): string | undefined {
  return ARCHETYPE_DEPTH[primary].showsUpDetail[index];
}

/** Growth-arc framing that references the weakest lever by name. */
export function growthFraming(primary: ArchetypeId, weakestLabel: string): string {
  return (
    `Ninety days is the shortest window in which a change of working habit stops requiring deliberate attention. ` +
    `The arc below targets one lever — ${weakestLabel} — because moving several at once is why these plans fail.`
  );
}



/* ------------------------------------------------------------------ */
/* Composite identity synthesis                                        */
/*                                                                     */
/* Hard rule for everything below: never name a quiz option, never say */
/* "you chose", never quote a prompt. The projective layer enters only */
/* as direction and conclusion. Literal echoes belong to the evidence  */
/* cards in the Fingerprint and Mind sections, nowhere else.           */
/* ------------------------------------------------------------------ */

export const SYNTHESIS_INTRO =
  'One kind of question asked you to describe yourself. The other recorded what you made of something shapeless.';


export function synthesisConvergence(
  labels: string[],
  primary: ArchetypeId,
  hasProjective: boolean,
): string {
  const arch = ARCHETYPES[primary].name.replace(/^The\s+/, '');
  if (!hasProjective || labels.length === 0) {
    return (
      `Your self-description is internally consistent — it does not contradict itself anywhere significant. ` +
      `That is why the ${arch} reading is stated as plainly as it is.`
    );
  }
  const list =
    labels.length === 1 ? labels[0]
    : labels.length === 2 ? `${labels[0]} and ${labels[1]}`
    : `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
  return (
    `Both sources agree on ${list}. A trait that also shows up uncurated is one you actually run on — the ${arch} pattern rests on this overlap.`
  );

}

export function synthesisDivergence(
  divergences: { label: string; selfHigher: boolean }[],
  agreementScore: number,
): string {
  if (divergences.length === 0) {
    return (
      `Barely anywhere. Most profiles contain at least one place where the person is quietly performing a ` +
      `version of themselves their instincts do not support. Yours does not.`
    );
  }

  const first = divergences[0];
  const lead = first.selfHigher
    ? `You describe yourself as stronger on ${first.label} than your unguarded responses bear out — usually a ` +
      `trait you decided to be rather than one that arrives on its own, so running it costs energy.`
    : `Your instinct reads higher on ${first.label} than your self-description does. You are underclaiming a ` +
      `trait that was never rewarded around you.`;

  const second = divergences[1]
    ? ` A smaller gap sits on ${divergences[1].label}, in the ${divergences[1].selfHigher ? 'same' : 'opposite'} direction.`
    : '';

  const band =
    agreementScore >= 70
      ? ` Overall your sources are well aligned: one seam in a coherent picture.`
      : agreementScore >= 45
        ? ` Overall your alignment is mixed — wide enough to take seriously.`
        : ` Overall your sources diverge substantially — likely an environment that rewards a mode other than your natural one.`;

  return `${lead}${second}${band}`;
}


export function synthesisInstinct(
  lenses: { valence: number; abstraction: number; contentClass: number },
  hasProjective: boolean,
): string {
  if (!hasProjective) {
    return (
      `There was not enough unprompted material for a separate instinct profile, so the reading above leans on ` +
      `your self-description. Still solid — simply single-sourced.`
    );
  }
  const valence =
    lenses.valence > 0.12
      ? 'Your first pass at something undefined is to assume it is benign — steady, occasionally late to spot a real problem.'
      : lenses.valence < -0.12
        ? 'Your first pass at something undefined is to check it for threat — early-warning attention that, unmanaged, tires you.'
        : 'Your first pass at something undefined is neutral, which keeps your initial read clean.';

  const abstraction =
    lenses.abstraction > 0.12
      ? 'You reach past the literal for what it relates to; meaning arrives before description.'
      : lenses.abstraction < -0.12
        ? 'You stay with the literal rather than dressing it into a story, so the interpretive leap is deliberate.'
        : 'You move between literal and interpretive without a strong default.';

  const content =
    lenses.contentClass > 0.12
      ? 'And your attention lands on people first, before structure.'
      : lenses.contentClass < -0.12
        ? 'And your attention lands on structure first, before people.'
        : 'And your attention divides evenly between people and structure.';

  return `${valence} ${abstraction} ${content}`;
}

export function synthesisConclusion(
  primary: ArchetypeId,
  secondary: ArchetypeId,
  agreementScore: number,
  hasDivergence: boolean,
): string {
  const p = ARCHETYPES[primary].name.replace(/^The\s+/, '');
  const sec = ARCHETYPES[secondary].name.replace(/^The\s+/, '');
  const closing = hasDivergence
    ? `The seam between what you claim and what you demonstrate shows which part is automatic and which you hold up by hand. The automatic part scales.`
    : `Because your two sources agree, you can build on this profile without hedging.`;

  return (
    `Put together, the ${p} reading describes how you handle the unknown, with ${sec} as your fallback. ${closing}`
  );

}


export type { HgTraitKey };
