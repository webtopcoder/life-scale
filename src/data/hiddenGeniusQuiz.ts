// Isolated Hidden Genius quiz data. Do NOT share types with /onboarding or /iq-start.
//
// SCORING CONTRACT (read before editing weights):
//  - Likert + frequency items are the PRIMARY signal (self-report). See HG_SOURCE_WEIGHTS
//    in src/engine/hiddenGeniusScoring.ts — they carry ~70% of every trait score.
//  - Option-based items (inkblot / identity-choice / scenario / forced-choice) are the
//    PROJECTIVE layer. They tint and break ties; they carry ~30%.
//  - Every option in an option-based item must carry weights for the SAME trait set, and
//    for each trait the weights across that item's options must sum to ~0. Choosing one
//    option is then automatically evidence AGAINST the traits the other options express.
//    Without this, a trait pins to the ceiling (see the 96-saturation bug).

export type HgTraitKey =
  | 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism'
  | 'structurePreference' | 'autonomyNeed' | 'riskTolerance' | 'peopleOrientation'
  | 'systemsOrientation' | 'creativityOrientation' | 'detailOrientation'
  | 'leadershipDrive' | 'persuasionComfort' | 'learningVelocity';

export interface HgResponse {
  questionId: string;
  module: 'quiz';
  value: number;
}

interface TraitMap { trait: HgTraitKey; weight: number; invert?: boolean }

export interface HgLikert {
  id: string; module: 'quiz'; type: 'scale'; text: string;
  traitMappings: TraitMap[];
}
export interface HgFrequency {
  id: string; module: 'quiz'; type: 'frequency'; text: string;
  traitMappings: TraitMap[];
}
interface HgOption {
  label: string;
  value: number;
  traitMappings: TraitMap[];
  /**
   * What choosing THIS option says about the person, in report voice.
   * The report never echoes a choice back bare — it always renders this
   * interpretation alongside it. Every option of every option-based item
   * must have one; see the assertion in scripts/verify-hg.ts.
   */
  reading?: string;
}
export interface HgInkblot {
  id: string; module: 'quiz'; type: 'inkblot'; text: string;
  image: string; options: HgOption[];
}
export interface HgIdentityChoice {
  id: string; module: 'quiz'; type: 'identity-choice'; text: string; options: HgOption[];
}
export interface HgScenario {
  id: string; module: 'quiz'; type: 'scenario'; text: string; options: HgOption[];
}
export interface HgForcedChoice {
  id: string; module: 'quiz'; type: 'forced-choice'; text: string; options: HgOption[];
}

export type HgQuizItem =
  | HgLikert | HgFrequency | HgInkblot | HgIdentityChoice | HgScenario | HgForcedChoice;

/** Item types that count as self-report (primary signal). */
export const HG_SELF_REPORT_TYPES = ['scale', 'frequency'] as const;

/* ------------------------------------------------------------------ */
/* Inkblots — directional projective reads                             */
/*                                                                     */
/* Each option is interpreted along three lenses:                      */
/*   content class  — human / animal / object / abstract               */
/*   valence        — threatening / benign / idealised                 */
/*   abstraction    — literal object vs. relation vs. system           */
/* Weights per trait sum to ~0 across each item's options.             */
/* ------------------------------------------------------------------ */

const inkblots: HgInkblot[] = [
  {
    id: 'ib1', module: 'quiz', type: 'inkblot', text: 'What do you see first?',
    image: 'knife-demon-carrot-flower',
    options: [
      // Weapon: concrete threat, low warmth, high action bias.
      { label: 'A knife', value: 1,
        reading: 'You went straight for the object that can do damage. That is a concrete, alert read — you notice what could go wrong before you notice what is pretty.', traitMappings: [
        { trait: 'riskTolerance', weight: 0.6 }, { trait: 'agreeableness', weight: -0.5 }, { trait: 'openness', weight: -0.2 } ] },
      // Fantastical threat: imaginative but darkly valenced.
      { label: 'A demon', value: 2,
        reading: 'You reached past the literal shape for something mythic. Dark, but inventive: you fill in what isn\'t actually on the page.', traitMappings: [
        { trait: 'riskTolerance', weight: 0.2 }, { trait: 'agreeableness', weight: -0.3 }, { trait: 'openness', weight: 0.6 } ] },
      // Mundane literal object: safe, concrete, unimaginative read.
      { label: 'A carrot', value: 3,
        reading: 'The most harmless read available. You take an ambiguous shape at face value instead of dressing it up into a story.', traitMappings: [
        { trait: 'riskTolerance', weight: -0.4 }, { trait: 'agreeableness', weight: 0.3 }, { trait: 'openness', weight: -0.5 } ] },
      // Benign, idealised natural form: warm and safety-seeking.
      { label: 'A flower', value: 4,
        reading: 'You resolved something shapeless into something alive and benign. Your default first guess about the unknown is that it is safe.', traitMappings: [
        { trait: 'riskTolerance', weight: -0.4 }, { trait: 'agreeableness', weight: 0.5 }, { trait: 'openness', weight: 0.1 } ] },
    ],
  },
  {
    id: 'ib2', module: 'quiz', type: 'inkblot', text: 'What do you see first?',
    image: 'butterfly-bat-flower-vulva',
    options: [
      { label: 'A butterfly', value: 1,
        reading: 'Movement, lightness, transformation. You read the ambiguity as something in the middle of becoming rather than something fixed.', traitMappings: [
        { trait: 'openness', weight: 0.3 }, { trait: 'neuroticism', weight: -0.3 }, { trait: 'peopleOrientation', weight: 0.2 } ] },
      { label: 'A bat', value: 2,
        reading: 'The same shape, read at night. You register the unsettling version of a thing first — useful vigilance, tiring if it never switches off.', traitMappings: [
        { trait: 'openness', weight: -0.2 }, { trait: 'neuroticism', weight: 0.6 }, { trait: 'peopleOrientation', weight: -0.3 } ] },
      { label: 'A flower', value: 3,
        reading: 'Still, symmetrical, safe. You anchored on the most conventional read on offer, which is a preference for the known over the strange.', traitMappings: [
        { trait: 'openness', weight: -0.6 }, { trait: 'neuroticism', weight: -0.2 }, { trait: 'peopleOrientation', weight: 0.5 } ] },
      { label: 'Something else', value: 4,
        reading: 'You declined all four names you were handed. Refusing the supplied categories is itself the answer — you would rather build your own.', traitMappings: [
        { trait: 'openness', weight: 0.5 }, { trait: 'neuroticism', weight: -0.1 }, { trait: 'peopleOrientation', weight: -0.4 } ] },
    ],
  },
  {
    id: 'ib3', module: 'quiz', type: 'inkblot', text: 'What do you see first?',
    image: 'alien-heart-strawberry-leaf',
    options: [
      { label: 'An alien', value: 1,
        reading: 'You named the least likely thing in the set. Your mind goes to the unfamiliar before it goes to the obvious.', traitMappings: [
        { trait: 'creativityOrientation', weight: 0.6 }, { trait: 'peopleOrientation', weight: -0.3 }, { trait: 'detailOrientation', weight: -0.3 } ] },
      { label: 'A heart', value: 2,
        reading: 'Out of every possible read you chose the one about connection. Relationships are the lens you reach for by default.', traitMappings: [
        { trait: 'creativityOrientation', weight: -0.1 }, { trait: 'peopleOrientation', weight: 0.6 }, { trait: 'detailOrientation', weight: -0.2 } ] },
      { label: 'A strawberry', value: 3,
        reading: 'A specific object rather than a category — not \'fruit\' but a particular fruit. You resolve ambiguity by getting more precise, not more abstract.', traitMappings: [
        { trait: 'creativityOrientation', weight: -0.2 }, { trait: 'peopleOrientation', weight: -0.1 }, { trait: 'detailOrientation', weight: 0.5 } ] },
      { label: 'A leaf', value: 4,
        reading: 'Plain, ordinary and correct. You went with the low-drama read and did not strain for something cleverer.', traitMappings: [
        { trait: 'creativityOrientation', weight: -0.3 }, { trait: 'peopleOrientation', weight: -0.2 }, { trait: 'detailOrientation', weight: 0.0 } ] },
    ],
  },
  {
    id: 'ib4', module: 'quiz', type: 'inkblot', text: 'What do you see first?',
    image: 'angel-demon-bull-face',
    options: [
      { label: 'An angel', value: 1,
        reading: 'You picked the most idealised figure available. You lean toward reading intent as good before you read it as hostile.', traitMappings: [
        { trait: 'agreeableness', weight: 0.6 }, { trait: 'leadershipDrive', weight: -0.3 }, { trait: 'peopleOrientation', weight: 0.2 } ] },
      { label: 'A demon', value: 2,
        reading: 'You picked the adversary. You are quick to spot the thing in a situation that is not on your side.', traitMappings: [
        { trait: 'agreeableness', weight: -0.5 }, { trait: 'leadershipDrive', weight: 0.2 }, { trait: 'peopleOrientation', weight: -0.3 } ] },
      { label: 'A bull', value: 3,
        reading: 'Not good or evil — force. You read ambiguous situations in terms of power and who is holding it.', traitMappings: [
        { trait: 'agreeableness', weight: -0.3 }, { trait: 'leadershipDrive', weight: 0.6 }, { trait: 'peopleOrientation', weight: -0.3 } ] },
      { label: 'A face', value: 4,
        reading: 'You saw a person looking back. Faces are what you scan for; you orient to people before objects.', traitMappings: [
        { trait: 'agreeableness', weight: 0.2 }, { trait: 'leadershipDrive', weight: -0.5 }, { trait: 'peopleOrientation', weight: 0.4 } ] },
    ],
  },
  {
    id: 'ib6', module: 'quiz', type: 'inkblot', text: 'What do you see first?',
    image: 'fox-fern-rabbit-blade',
    options: [
      { label: 'A fox', value: 1,
        reading: 'Cunning rather than strength. You read the scene socially — who is outmanoeuvring whom.', traitMappings: [
        { trait: 'persuasionComfort', weight: 0.6 }, { trait: 'agreeableness', weight: -0.3 }, { trait: 'riskTolerance', weight: 0.3 } ] },
      { label: 'A fern', value: 2,
        reading: 'Something quiet and growing. You gravitate to the calm, non-competitive read.', traitMappings: [
        { trait: 'persuasionComfort', weight: -0.3 }, { trait: 'agreeableness', weight: 0.3 }, { trait: 'riskTolerance', weight: -0.3 } ] },
      { label: 'A rabbit', value: 3,
        reading: 'The prey animal, not the predator. You are attuned to what is vulnerable in a situation.', traitMappings: [
        { trait: 'persuasionComfort', weight: -0.2 }, { trait: 'agreeableness', weight: 0.4 }, { trait: 'riskTolerance', weight: -0.4 } ] },
      { label: 'A blade', value: 4,
        reading: 'An object made for one purpose, and a sharp one. You read for edge and consequence rather than warmth.', traitMappings: [
        { trait: 'persuasionComfort', weight: -0.1 }, { trait: 'agreeableness', weight: -0.4 }, { trait: 'riskTolerance', weight: 0.4 } ] },
    ],
  },
  {
    id: 'ib7', module: 'quiz', type: 'inkblot', text: 'What do you see first?',
    image: 'tiger-wolf-pine-splash',
    options: [
      { label: 'A tiger', value: 1,
        reading: 'Solitary apex, out in the open. You read the shape as dominance.', traitMappings: [
        { trait: 'leadershipDrive', weight: 0.6 }, { trait: 'autonomyNeed', weight: 0.0 }, { trait: 'creativityOrientation', weight: -0.2 } ] },
      { label: 'A wolf', value: 2,
        reading: 'The animal that ranges alone but still belongs to a pack. Independence with a line back to other people.', traitMappings: [
        { trait: 'leadershipDrive', weight: 0.0 }, { trait: 'autonomyNeed', weight: 0.6 }, { trait: 'creativityOrientation', weight: -0.2 } ] },
      { label: 'A pine tree', value: 3,
        reading: 'Rooted, unchanging, weather-proof. You picked endurance over drama.', traitMappings: [
        { trait: 'leadershipDrive', weight: -0.3 }, { trait: 'autonomyNeed', weight: -0.2 }, { trait: 'creativityOrientation', weight: -0.3 } ] },
      { label: 'A splash', value: 4,
        reading: 'Not an object at all — an event. You saw motion where most people name a thing, which is an unusually abstract read.', traitMappings: [
        { trait: 'leadershipDrive', weight: -0.3 }, { trait: 'autonomyNeed', weight: -0.4 }, { trait: 'creativityOrientation', weight: 0.7 } ] },
    ],
  },
  {
    id: 'ib8', module: 'quiz', type: 'inkblot', text: 'What do you see first?',
    image: 'cactus-caterpillar-centipede-algae',
    options: [
      { label: 'A cactus', value: 1,
        reading: 'Something that survives alone and defends its perimeter. Self-sufficiency read straight off an inkblot.', traitMappings: [
        { trait: 'autonomyNeed', weight: 0.6 }, { trait: 'learningVelocity', weight: -0.2 }, { trait: 'detailOrientation', weight: -0.2 }, { trait: 'creativityOrientation', weight: -0.2 } ] },
      { label: 'A caterpillar', value: 2,
        reading: 'The stage before the transformation. You see things in terms of what they are about to become.', traitMappings: [
        { trait: 'autonomyNeed', weight: -0.2 }, { trait: 'learningVelocity', weight: 0.6 }, { trait: 'detailOrientation', weight: -0.2 }, { trait: 'creativityOrientation', weight: -0.1 } ] },
      { label: 'A centipede', value: 3,
        reading: 'You went to the option defined by its many repeating parts. Your eye counts and segments before it summarises.', traitMappings: [
        { trait: 'autonomyNeed', weight: -0.2 }, { trait: 'learningVelocity', weight: -0.2 }, { trait: 'detailOrientation', weight: 0.6 }, { trait: 'creativityOrientation', weight: -0.3 } ] },
      { label: 'Algae', value: 4,
        reading: 'Formless, spreading, no single outline. You are comfortable naming something that has no clean shape.', traitMappings: [
        { trait: 'autonomyNeed', weight: -0.2 }, { trait: 'learningVelocity', weight: -0.2 }, { trait: 'detailOrientation', weight: -0.2 }, { trait: 'creativityOrientation', weight: 0.6 } ] },
    ],
  },
  {
    id: 'ib11', module: 'quiz', type: 'inkblot', text: 'What do you see first?',
    image: 'dragon-flower-cactus-lightning-2',
    options: [
      { label: 'A dragon', value: 1,
        reading: 'The largest and most commanding thing available. You read scale and authority into ambiguity.', traitMappings: [
        { trait: 'leadershipDrive', weight: 0.6 }, { trait: 'agreeableness', weight: -0.3 }, { trait: 'riskTolerance', weight: 0.3 }, { trait: 'autonomyNeed', weight: -0.2 } ] },
      { label: 'A flower', value: 2,
        reading: 'Out of a dragon, a cactus and lightning, you chose the gentlest option. That is a real preference, not an accident.', traitMappings: [
        { trait: 'leadershipDrive', weight: -0.3 }, { trait: 'agreeableness', weight: 0.6 }, { trait: 'riskTolerance', weight: -0.3 }, { trait: 'autonomyNeed', weight: -0.3 } ] },
      { label: 'A cactus', value: 3,
        reading: 'Guarded, self-contained, thriving where little else does. You read the shape as something that does not need help.', traitMappings: [
        { trait: 'leadershipDrive', weight: -0.1 }, { trait: 'agreeableness', weight: -0.2 }, { trait: 'riskTolerance', weight: -0.2 }, { trait: 'autonomyNeed', weight: 0.6 } ] },
      { label: 'Lightning', value: 4,
        reading: 'Energy with no body. You picked the option that is over in an instant — you read for intensity rather than permanence.', traitMappings: [
        { trait: 'leadershipDrive', weight: -0.2 }, { trait: 'agreeableness', weight: -0.1 }, { trait: 'riskTolerance', weight: 0.2 }, { trait: 'autonomyNeed', weight: -0.1 } ] },
    ],
  },
  {
    id: 'ib12', module: 'quiz', type: 'inkblot', text: 'What do you see first?',
    image: 'panda-mask-skull-ants-2',
    options: [
      { label: 'A panda', value: 1,
        reading: 'A creature that is almost entirely a face. You found the warmest, most companionable read in a fairly bleak set.', traitMappings: [
        { trait: 'peopleOrientation', weight: 0.6 }, { trait: 'persuasionComfort', weight: -0.2 }, { trait: 'neuroticism', weight: -0.2 }, { trait: 'detailOrientation', weight: -0.2 } ] },
      { label: 'A mask', value: 2,
        reading: 'You saw a surface that hides a face. You are alert to presentation — what people put in front of themselves.', traitMappings: [
        { trait: 'peopleOrientation', weight: -0.1 }, { trait: 'persuasionComfort', weight: 0.6 }, { trait: 'neuroticism', weight: 0.1 }, { trait: 'detailOrientation', weight: -0.2 } ] },
      { label: 'A skull', value: 3,
        reading: 'The one option in the set that means death. You read the darkest available interpretation first.', traitMappings: [
        { trait: 'peopleOrientation', weight: -0.2 }, { trait: 'persuasionComfort', weight: -0.2 }, { trait: 'neuroticism', weight: 0.5 }, { trait: 'detailOrientation', weight: -0.2 } ] },
      { label: 'Ants', value: 4,
        reading: 'Not one creature but a system of them. You look at a shape and see organised collective activity.', traitMappings: [
        { trait: 'peopleOrientation', weight: -0.3 }, { trait: 'persuasionComfort', weight: -0.2 }, { trait: 'neuroticism', weight: -0.4 }, { trait: 'detailOrientation', weight: 0.6 } ] },
    ],
  },
  {
    id: 'ib13', module: 'quiz', type: 'inkblot', text: 'What do you see first?',
    image: 'spider-heart-palm-octopus-2',
    options: [
      { label: 'A spider', value: 1,
        reading: 'Legs, symmetry, precision — and a little threat. You read fine structure before you read feeling.', traitMappings: [
        { trait: 'detailOrientation', weight: 0.6 }, { trait: 'peopleOrientation', weight: -0.3 }, { trait: 'creativityOrientation', weight: -0.2 }, { trait: 'conscientiousness', weight: -0.1 } ] },
      { label: 'A heart', value: 2,
        reading: 'The only pure symbol in the set, and you took it. You translate shapes into emotional meaning.', traitMappings: [
        { trait: 'detailOrientation', weight: -0.2 }, { trait: 'peopleOrientation', weight: 0.6 }, { trait: 'creativityOrientation', weight: -0.2 }, { trait: 'conscientiousness', weight: -0.2 } ] },
      { label: 'A palm tree', value: 3,
        reading: 'Steady, singular, upright. You went with the calm and orderly read.', traitMappings: [
        { trait: 'detailOrientation', weight: -0.2 }, { trait: 'peopleOrientation', weight: -0.1 }, { trait: 'creativityOrientation', weight: -0.2 }, { trait: 'conscientiousness', weight: 0.5 } ] },
      { label: 'An octopus', value: 4,
        reading: 'Eight limbs, no fixed shape, notoriously clever. You picked the most fluid intelligence on offer.', traitMappings: [
        { trait: 'detailOrientation', weight: -0.2 }, { trait: 'peopleOrientation', weight: -0.2 }, { trait: 'creativityOrientation', weight: 0.6 }, { trait: 'conscientiousness', weight: -0.2 } ] },
    ],
  },
  {
    id: 'ib14', module: 'quiz', type: 'inkblot', text: 'What do you see first?',
    image: 'tree-explosion-bear-mask-2',
    options: [
      { label: 'A tree', value: 1,
        reading: 'Slow growth and structure. You read stability into an ambiguous form.', traitMappings: [
        { trait: 'conscientiousness', weight: 0.6 }, { trait: 'riskTolerance', weight: -0.3 }, { trait: 'leadershipDrive', weight: -0.2 }, { trait: 'persuasionComfort', weight: -0.2 } ] },
      { label: 'An explosion', value: 2,
        reading: 'Pure release. You saw the moment things stop being contained.', traitMappings: [
        { trait: 'conscientiousness', weight: -0.3 }, { trait: 'riskTolerance', weight: 0.6 }, { trait: 'leadershipDrive', weight: -0.1 }, { trait: 'persuasionComfort', weight: -0.2 } ] },
      { label: 'A bear', value: 3,
        reading: 'Big, capable and not to be crossed. You read presence and standing.', traitMappings: [
        { trait: 'conscientiousness', weight: -0.1 }, { trait: 'riskTolerance', weight: 0.1 }, { trait: 'leadershipDrive', weight: 0.5 }, { trait: 'persuasionComfort', weight: -0.2 } ] },
      { label: 'A mask', value: 4,
        reading: 'You saw performance. That is a read about how people manage the impression they give.', traitMappings: [
        { trait: 'conscientiousness', weight: -0.2 }, { trait: 'riskTolerance', weight: -0.4 }, { trait: 'leadershipDrive', weight: -0.2 }, { trait: 'persuasionComfort', weight: 0.6 } ] },
    ],
  },
  {
    id: 'ib15', module: 'quiz', type: 'inkblot', text: 'What do you see first?',
    image: 'skull-garden-volcano-flower-2',
    options: [
      { label: 'A skull', value: 1,
        reading: 'The end-state read. You go to the worst-case meaning before the harmless ones.', traitMappings: [
        { trait: 'neuroticism', weight: 0.6 }, { trait: 'agreeableness', weight: -0.3 }, { trait: 'riskTolerance', weight: 0.0 } ] },
      { label: 'A garden', value: 2,
        reading: 'Not one plant but a tended space. You saw something someone has been caring for.', traitMappings: [
        { trait: 'neuroticism', weight: -0.3 }, { trait: 'agreeableness', weight: 0.5 }, { trait: 'riskTolerance', weight: -0.3 } ] },
      { label: 'A volcano', value: 3,
        reading: 'Something calm on the surface with pressure underneath. That is a read about held-back force.', traitMappings: [
        { trait: 'neuroticism', weight: 0.1 }, { trait: 'agreeableness', weight: -0.3 }, { trait: 'riskTolerance', weight: 0.6 } ] },
      { label: 'A flower', value: 4,
        reading: 'Simple and unthreatening. You did not reach for the dramatic interpretation that was clearly available.', traitMappings: [
        { trait: 'neuroticism', weight: -0.4 }, { trait: 'agreeableness', weight: 0.1 }, { trait: 'riskTolerance', weight: -0.3 } ] },
    ],
  },
  {
    id: 'ib17', module: 'quiz', type: 'inkblot', text: 'What do you see first?',
    image: 'moose-feet-hands-other',
    options: [
      { label: 'A moose', value: 1,
        reading: 'A whole animal, big and unmistakable. You take in the entire silhouette before any of the parts.', traitMappings: [
        { trait: 'extraversion', weight: 0.6 }, { trait: 'detailOrientation', weight: -0.2 }, { trait: 'systemsOrientation', weight: -0.2 }, { trait: 'creativityOrientation', weight: -0.1 } ] },
      { label: 'Feet', value: 2,
        reading: 'You named the part of the body that carries the weight and gets none of the glory. That is an eye for the specific, load-bearing detail rather than the headline.', traitMappings: [
        { trait: 'extraversion', weight: -0.2 }, { trait: 'detailOrientation', weight: 0.6 }, { trait: 'systemsOrientation', weight: -0.2 }, { trait: 'creativityOrientation', weight: -0.2 } ] },
      { label: 'Hands', value: 3,
        reading: 'The part of the body that does the work. You read shapes in terms of what they operate and manipulate.', traitMappings: [
        { trait: 'extraversion', weight: -0.2 }, { trait: 'detailOrientation', weight: -0.1 }, { trait: 'systemsOrientation', weight: 0.6 }, { trait: 'creativityOrientation', weight: -0.2 } ] },
      { label: 'Something else', value: 4,
        reading: 'You turned down all three supplied names. You would rather generate your own read than accept a menu.', traitMappings: [
        { trait: 'extraversion', weight: -0.2 }, { trait: 'detailOrientation', weight: -0.3 }, { trait: 'systemsOrientation', weight: -0.2 }, { trait: 'creativityOrientation', weight: 0.5 } ] },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Likert self-report — the primary identity signal                    */
/* Every trait has at least two items behind it.                       */
/* ------------------------------------------------------------------ */

const likerts: HgLikert[] = [
  { id: 'uq1', module: 'quiz', text: 'I love coming up with new ideas and creative solutions', type: 'scale', traitMappings: [{ trait: 'creativityOrientation', weight: 0.8 }, { trait: 'openness', weight: 0.4 }] },
  { id: 'uq2', module: 'quiz', text: 'I feel energized when helping people with their problems', type: 'scale', traitMappings: [{ trait: 'peopleOrientation', weight: 0.8 }, { trait: 'agreeableness', weight: 0.4 }] },
  { id: 'uq3', module: 'quiz', text: 'I enjoy leading group projects and taking charge', type: 'scale', traitMappings: [{ trait: 'leadershipDrive', weight: 0.8 }, { trait: 'extraversion', weight: 0.3 }] },
  { id: 'uq4', module: 'quiz', text: 'I work best when I can set my own schedule', type: 'scale', traitMappings: [{ trait: 'autonomyNeed', weight: 0.8 }, { trait: 'structurePreference', weight: -0.3 }] },
  { id: 'uq5', module: 'quiz', text: 'I prefer being with others over being alone', type: 'scale', traitMappings: [{ trait: 'extraversion', weight: 0.7 }, { trait: 'peopleOrientation', weight: 0.5 }] },
  { id: 'uq6', module: 'quiz', text: 'I dig into how something works until the whole system makes sense', type: 'scale', traitMappings: [{ trait: 'systemsOrientation', weight: 0.8 }, { trait: 'learningVelocity', weight: 0.3 }] },
  { id: 'uq7', module: 'quiz', text: 'I like having clear rules and processes to follow', type: 'scale', traitMappings: [{ trait: 'structurePreference', weight: 0.8 }, { trait: 'conscientiousness', weight: 0.4 }] },
  { id: 'uq8', module: 'quiz', text: "I'm comfortable making big decisions with incomplete information", type: 'scale', traitMappings: [{ trait: 'riskTolerance', weight: 0.7 }, { trait: 'neuroticism', weight: -0.4 }] },
  { id: 'uq9', module: 'quiz', text: 'I enjoy convincing others to see my point of view', type: 'scale', traitMappings: [{ trait: 'persuasionComfort', weight: 0.8 }, { trait: 'extraversion', weight: 0.3 }] },
  { id: 'uq10', module: 'quiz', text: 'I can focus deeply on one thing for hours', type: 'scale', traitMappings: [{ trait: 'detailOrientation', weight: 0.6 }, { trait: 'conscientiousness', weight: 0.5 }] },
  { id: 'uq11', module: 'quiz', text: 'I enjoy learning new things, even outside my comfort zone', type: 'scale', traitMappings: [{ trait: 'learningVelocity', weight: 0.7 }, { trait: 'openness', weight: 0.5 }] },
  { id: 'uq12', module: 'quiz', text: 'I catch small mistakes that other people read straight past', type: 'scale', traitMappings: [{ trait: 'detailOrientation', weight: 0.8 }, { trait: 'conscientiousness', weight: 0.3 }] },
  { id: 'uq13', module: 'quiz', text: 'I enjoy solving complex puzzles and brainteasers', type: 'scale', traitMappings: [{ trait: 'systemsOrientation', weight: 0.7 }, { trait: 'openness', weight: 0.3 }] },
  { id: 'uq14', module: 'quiz', text: 'I resist being told exactly how to do my work', type: 'scale', traitMappings: [{ trait: 'autonomyNeed', weight: 0.8 }, { trait: 'agreeableness', weight: -0.3 }] },
  { id: 'uq15', module: 'quiz', text: 'Feeling secure and stable is important to me', type: 'scale', traitMappings: [{ trait: 'riskTolerance', weight: -0.7 }, { trait: 'neuroticism', weight: 0.3 }] },
  { id: 'uq16', module: 'quiz', text: 'I pick up new skills faster than most people around me', type: 'scale', traitMappings: [{ trait: 'learningVelocity', weight: 0.8 }, { trait: 'openness', weight: 0.3 }] },
  { id: 'uq17', module: 'quiz', text: 'I find it easy to bring people around to my side of an argument', type: 'scale', traitMappings: [{ trait: 'persuasionComfort', weight: 0.8 }, { trait: 'leadershipDrive', weight: 0.3 }] },
  { id: 'uq18', module: 'quiz', text: 'I map out second-order consequences before I commit to something', type: 'scale', traitMappings: [{ trait: 'systemsOrientation', weight: 0.7 }, { trait: 'conscientiousness', weight: 0.4 }] },
  { id: 'uq19', module: 'quiz', text: "When there's a disagreement, I address it head-on", type: 'scale', traitMappings: [{ trait: 'leadershipDrive', weight: 0.5 }, { trait: 'extraversion', weight: 0.4 }] },
  { id: 'uq20', module: 'quiz', text: 'I prefer direct, honest feedback even if it stings', type: 'scale', traitMappings: [{ trait: 'riskTolerance', weight: 0.3 }, { trait: 'neuroticism', weight: -0.4 }] },
  { id: 'uq21', module: 'quiz', text: 'I stay calm under pressure and tight deadlines', type: 'scale', traitMappings: [{ trait: 'neuroticism', weight: -0.7 }, { trait: 'riskTolerance', weight: 0.3 }] },
  { id: 'uq22', module: 'quiz', text: 'I go out of my way to make sure everyone feels included', type: 'scale', traitMappings: [{ trait: 'agreeableness', weight: 0.7 }, { trait: 'peopleOrientation', weight: 0.5 }] },
  { id: 'uq23', module: 'quiz', text: 'I finish what I start, even when the novelty wears off', type: 'scale', traitMappings: [{ trait: 'conscientiousness', weight: 0.8 }, { trait: 'structurePreference', weight: 0.3 }] },
  { id: 'uq24', module: 'quiz', text: 'I get excited about building things from scratch', type: 'scale', traitMappings: [{ trait: 'creativityOrientation', weight: 0.7 }, { trait: 'riskTolerance', weight: 0.3 }] },
  { id: 'uq25', module: 'quiz', text: 'I would rather improve an existing method than invent a new one', type: 'scale', traitMappings: [{ trait: 'creativityOrientation', weight: -0.6 }, { trait: 'structurePreference', weight: 0.4 }] },
  { id: 'uq26', module: 'quiz', text: 'I thrive in fast-paced, changing environments', type: 'scale', traitMappings: [{ trait: 'openness', weight: 0.5 }, { trait: 'riskTolerance', weight: 0.5 }] },
];

const identityChoices: HgIdentityChoice[] = [
  { id: 'ic1', module: 'quiz', type: 'identity-choice', text: 'When I meet someone new, I tend to...', options: [
    { label: 'Ask questions about them', value: 1,
        reading: 'Your opening move is to make the other person the subject. That is attention pointed outward.', traitMappings: [
      { trait: 'agreeableness', weight: 0.5 }, { trait: 'extraversion', weight: -0.1 }, { trait: 'detailOrientation', weight: 0.1 }, { trait: 'persuasionComfort', weight: -0.2 } ] },
    { label: 'Share something about myself', value: 2,
        reading: 'You open by putting something on the table. It gets past small talk faster, and it costs you some exposure.', traitMappings: [
      { trait: 'agreeableness', weight: -0.1 }, { trait: 'extraversion', weight: 0.5 }, { trait: 'detailOrientation', weight: -0.2 }, { trait: 'persuasionComfort', weight: 0.2 } ] },
    { label: 'Observe quietly first', value: 3,
        reading: 'You gather before you engage. You would rather read the situation correctly than fill the silence.', traitMappings: [
      { trait: 'agreeableness', weight: -0.1 }, { trait: 'extraversion', weight: -0.6 }, { trait: 'detailOrientation', weight: 0.5 }, { trait: 'persuasionComfort', weight: -0.3 } ] },
    { label: 'Crack a joke to break the ice', value: 4,
        reading: 'Humour as an entry tool. It lowers the stakes for both of you and buys you room to manoeuvre.', traitMappings: [
      { trait: 'agreeableness', weight: -0.1 }, { trait: 'extraversion', weight: 0.4 }, { trait: 'detailOrientation', weight: -0.2 }, { trait: 'persuasionComfort', weight: 0.1 } ] },
    { label: 'Find common ground fast', value: 5,
        reading: 'You look for the overlap immediately. That is a bridge-building instinct with an eye on where the conversation needs to go.', traitMappings: [
      { trait: 'agreeableness', weight: -0.2 }, { trait: 'extraversion', weight: -0.2 }, { trait: 'detailOrientation', weight: -0.2 }, { trait: 'persuasionComfort', weight: 0.2 } ] },
  ] },
  { id: 'ic2', module: 'quiz', type: 'identity-choice', text: "On a free weekend, I'm most likely to...", options: [
    { label: 'Try something brand new', value: 1,
        reading: 'Free time goes to unfamiliar territory. Novelty reads as reward to you rather than as risk.', traitMappings: [
      { trait: 'riskTolerance', weight: 0.6 }, { trait: 'peopleOrientation', weight: -0.1 }, { trait: 'autonomyNeed', weight: 0.1 }, { trait: 'extraversion', weight: 0.0 } ] },
    { label: 'Catch up with close friends', value: 2,
        reading: 'You spend discretionary time on existing relationships rather than on new inputs.', traitMappings: [
      { trait: 'riskTolerance', weight: -0.2 }, { trait: 'peopleOrientation', weight: 0.5 }, { trait: 'autonomyNeed', weight: -0.2 }, { trait: 'extraversion', weight: 0.1 } ] },
    { label: 'Work on a personal project', value: 3,
        reading: 'Unsupervised time goes into something of your own. Nobody assigned it, and that is exactly the point.', traitMappings: [
      { trait: 'riskTolerance', weight: -0.1 }, { trait: 'peopleOrientation', weight: -0.2 }, { trait: 'autonomyNeed', weight: 0.6 }, { trait: 'extraversion', weight: -0.2 } ] },
    { label: 'Recharge alone at home', value: 4,
        reading: 'You treat solitude as the thing that restores you, not as a gap that needs filling.', traitMappings: [
      { trait: 'riskTolerance', weight: -0.2 }, { trait: 'peopleOrientation', weight: -0.2 }, { trait: 'autonomyNeed', weight: 0.1 }, { trait: 'extraversion', weight: -0.5 } ] },
    { label: 'Plan something with a group', value: 5,
        reading: 'You do not just want people around, you want to organise them. That is a coordinating instinct.', traitMappings: [
      { trait: 'riskTolerance', weight: -0.1 }, { trait: 'peopleOrientation', weight: 0.0 }, { trait: 'autonomyNeed', weight: -0.6 }, { trait: 'extraversion', weight: 0.6 } ] },
  ] },
];

const scenarios: HgScenario[] = [
  { id: 'sc1', module: 'quiz', type: 'scenario', text: 'A coworker snaps at you in a meeting. You...', options: [
    { label: 'Stay calm, check in later', value: 1,
        reading: 'You did not take the bait, and you did not drop it either. Delay is a deliberate tactic for you.', traitMappings: [{ trait: 'neuroticism', weight: -0.6 }, { trait: 'agreeableness', weight: 0.4 }, { trait: 'peopleOrientation', weight: 0.3 }] },
    { label: 'Address it privately after', value: 2,
        reading: 'You protect the other person\'s face and still have the conversation. That is conflict handled rather than avoided.', traitMappings: [{ trait: 'agreeableness', weight: 0.4 }, { trait: 'persuasionComfort', weight: 0.4 }, { trait: 'neuroticism', weight: -0.3 }] },
    { label: "Let it go — they're stressed", value: 3,
        reading: 'You supplied a generous explanation for the behaviour before you supplied a grievance.', traitMappings: [{ trait: 'agreeableness', weight: 0.5 }, { trait: 'openness', weight: 0.3 }, { trait: 'neuroticism', weight: -0.3 }] },
    { label: 'Push back in the moment', value: 4,
        reading: 'You would rather have it out live than carry it. It costs you some goodwill and saves you the rumination.', traitMappings: [{ trait: 'extraversion', weight: 0.5 }, { trait: 'riskTolerance', weight: 0.3 }, { trait: 'neuroticism', weight: 0.3 }] },
    { label: "Ask what's going on right then", value: 5,
        reading: 'Your first instinct under attack is curiosity about the other person. That is rare, and it defuses a great deal.', traitMappings: [{ trait: 'peopleOrientation', weight: 0.5 }, { trait: 'extraversion', weight: 0.4 }, { trait: 'agreeableness', weight: 0.3 }] },
  ] },
  { id: 'sc2', module: 'quiz', type: 'scenario', text: 'A close friend cancels plans last-minute again. You feel...', options: [
    { label: "Worried something's wrong", value: 1,
        reading: 'Your first thought was about them, not about you. You read a cancelled plan as a signal about their life.', traitMappings: [{ trait: 'agreeableness', weight: 0.6 }, { trait: 'peopleOrientation', weight: 0.5 }] },
    { label: 'A bit hurt, but understanding', value: 2,
        reading: 'You let both things be true at once — the sting and the excuse. That is an unusually honest read of your own feelings.', traitMappings: [{ trait: 'openness', weight: 0.4 }, { trait: 'agreeableness', weight: 0.4 }, { trait: 'neuroticism', weight: 0.2 }] },
    { label: 'Annoyed enough to speak up', value: 3,
        reading: 'You register the pattern and you are willing to name it. You would rather have friction than a quiet resentment.', traitMappings: [{ trait: 'persuasionComfort', weight: 0.4 }, { trait: 'agreeableness', weight: -0.4 }, { trait: 'extraversion', weight: 0.3 }] },
    { label: 'Relieved — you wanted downtime', value: 4,
        reading: 'The cancellation gave you something back. Your baseline need for space is higher than the plan allowed for.', traitMappings: [{ trait: 'extraversion', weight: -0.5 }, { trait: 'autonomyNeed', weight: 0.4 }] },
    { label: 'Curious why it keeps happening', value: 5,
        reading: 'You skipped past the feeling and went to the pattern. You treat repeated behaviour as data.', traitMappings: [{ trait: 'detailOrientation', weight: 0.4 }, { trait: 'peopleOrientation', weight: 0.4 }, { trait: 'systemsOrientation', weight: 0.3 }] },
  ] },
  { id: 'sc3', module: 'quiz', type: 'scenario', text: 'Someone shares hard news with you. Your first instinct is to...', options: [
    { label: 'Listen without fixing it', value: 1,
        reading: 'You resist the urge to solve. That is the harder instinct and usually the more useful one.', traitMappings: [{ trait: 'peopleOrientation', weight: 0.6 }, { trait: 'agreeableness', weight: 0.5 }] },
    { label: 'Offer a solution or next step', value: 2,
        reading: 'Your care shows up as usefulness. You want to move the situation, not just sit inside it.', traitMappings: [{ trait: 'systemsOrientation', weight: 0.5 }, { trait: 'leadershipDrive', weight: 0.3 }, { trait: 'peopleOrientation', weight: -0.2 }] },
    { label: 'Share a similar story', value: 3,
        reading: 'You reach for \'me too\' as a way in. It builds closeness quickly, and occasionally it borrows the spotlight.', traitMappings: [{ trait: 'extraversion', weight: 0.5 }, { trait: 'openness', weight: 0.3 }, { trait: 'peopleOrientation', weight: 0.3 }] },
    { label: 'Sit quietly with them', value: 4,
        reading: 'You are willing to be present without performing support. Not many people can stay in a silence.', traitMappings: [{ trait: 'agreeableness', weight: 0.5 }, { trait: 'neuroticism', weight: -0.4 }, { trait: 'peopleOrientation', weight: 0.3 }] },
    { label: 'Ask what they need', value: 5,
        reading: 'You do not assume which kind of support is wanted — you check. That is care with an operator\'s precision.', traitMappings: [{ trait: 'peopleOrientation', weight: 0.6 }, { trait: 'conscientiousness', weight: 0.3 }, { trait: 'agreeableness', weight: 0.3 }] },
  ] },
];

const forcedChoices: HgForcedChoice[] = [
  { id: 'fc1', module: 'quiz', type: 'forced-choice', text: 'Which is most like you?', options: [
    { label: 'I read the room before I speak', value: 1,
        reading: 'You treat the social context as information to be gathered before you commit any words to it.', traitMappings: [{ trait: 'peopleOrientation', weight: 0.6 }, { trait: 'agreeableness', weight: 0.3 }, { trait: 'neuroticism', weight: -0.2 }] },
    { label: 'I share, then adjust later', value: 2,
        reading: 'You would rather put something out and correct course than wait around for certainty.', traitMappings: [{ trait: 'extraversion', weight: 0.6 }, { trait: 'persuasionComfort', weight: 0.3 }, { trait: 'openness', weight: 0.2 }] },
    { label: 'I reflect, then respond', value: 3,
        reading: 'You buy yourself a beat. The response that actually lands is worth the pause it cost.', traitMappings: [{ trait: 'conscientiousness', weight: 0.4 }, { trait: 'peopleOrientation', weight: 0.4 }, { trait: 'neuroticism', weight: -0.3 }] },
    { label: 'I jump in and figure it out', value: 4,
        reading: 'You would rather learn from being inside it than plan your way to the edge of it.', traitMappings: [{ trait: 'riskTolerance', weight: 0.5 }, { trait: 'extraversion', weight: 0.3 }, { trait: 'conscientiousness', weight: -0.3 }] },
    { label: 'I wait to be asked', value: 5,
        reading: 'You hold back until you are invited. It keeps you out of things you should not be in, and out of some you should.', traitMappings: [{ trait: 'extraversion', weight: -0.5 }, { trait: 'leadershipDrive', weight: -0.4 }, { trait: 'agreeableness', weight: 0.3 }] },
  ] },
  { id: 'fc2', module: 'quiz', type: 'forced-choice', text: 'When a decision gets hard...', options: [
    { label: 'I focus on feelings first', value: 1,
        reading: 'Your first filter on a hard call is who it lands on.', traitMappings: [{ trait: 'peopleOrientation', weight: 0.6 }, { trait: 'agreeableness', weight: 0.4 }] },
    { label: 'I focus on the task first', value: 2,
        reading: 'You stabilise the work before you handle the emotions around it.', traitMappings: [{ trait: 'conscientiousness', weight: 0.5 }, { trait: 'leadershipDrive', weight: 0.4 }, { trait: 'agreeableness', weight: -0.2 }] },
    { label: 'Feelings first, then a plan', value: 3,
        reading: 'You sequence it deliberately: acknowledge, then act. Both halves actually get done.', traitMappings: [{ trait: 'peopleOrientation', weight: 0.4 }, { trait: 'conscientiousness', weight: 0.3 }, { trait: 'agreeableness', weight: 0.3 }] },
    { label: 'I follow my gut in the moment', value: 4,
        reading: 'You trust accumulated instinct over explicit analysis, and you move while other people are still weighing.', traitMappings: [{ trait: 'riskTolerance', weight: 0.5 }, { trait: 'openness', weight: 0.3 }, { trait: 'neuroticism', weight: -0.3 }] },
    { label: 'I weigh long-term impact', value: 5,
        reading: 'You extend the timeline before you decide. You are solving for the version of this six months out.', traitMappings: [{ trait: 'systemsOrientation', weight: 0.5 }, { trait: 'conscientiousness', weight: 0.4 }, { trait: 'detailOrientation', weight: 0.3 }] },
  ] },
];

const frequencies: HgFrequency[] = [
  { id: 'fq1', module: 'quiz', type: 'frequency', text: "How often do you notice someone's mood shift before they say anything?", traitMappings: [{ trait: 'peopleOrientation', weight: 0.7 }, { trait: 'agreeableness', weight: 0.3 }] },
  { id: 'fq2', module: 'quiz', type: 'frequency', text: 'How often do you pause to manage your reaction before responding?', traitMappings: [{ trait: 'neuroticism', weight: -0.7 }, { trait: 'conscientiousness', weight: 0.3 }] },
];

const ALL_ITEMS: HgQuizItem[] = [
  ...inkblots, ...likerts, ...identityChoices, ...scenarios, ...forcedChoices, ...frequencies,
];

const byId = (id: string): HgQuizItem => {
  const found = ALL_ITEMS.find(i => i.id === id);
  if (!found) throw new Error(`Hidden Genius quiz: unknown item id "${id}"`);
  return found;
};

/**
 * Live quiz order — 37 items.
 * Reinforcement interstitials fire after index 12 (Q13), 24 (Q25) and 34 (Q35).
 * Self-report (scale/frequency) outnumbers projective items; see the scoring contract above.
 */
export const hiddenGeniusQuiz: HgQuizItem[] = [
  // Block 1
  byId('ib2'),
  byId('fc1'),
  byId('uq2'),
  byId('ib1'),
  byId('uq3'),
  byId('sc1'),
  // Block 2
  byId('uq5'),
  byId('ib3'),
  byId('sc2'),
  byId('ib4'),
  byId('uq7'),
  byId('uq12'),
  // Block 3
  byId('ib6'),   // ← reinforcement after this (Q13)
  byId('uq8'),
  byId('ib7'),
  byId('sc3'),
  byId('ib8'),
  byId('fq1'),
  // Block 4
  byId('uq6'),
  byId('uq16'),
  byId('fq2'),
  byId('ib11'),
  byId('ib12'),
  byId('uq14'),
  // Block 5
  byId('uq13'),  // ← reinforcement after this (Q25)
  byId('ib13'),
  byId('uq15'),
  byId('ib14'),
  byId('ib15'),
  byId('uq17'),
  // Block 6
  byId('uq18'),
  byId('uq22'),
  byId('ib17'),
  byId('uq23'),
  byId('fc2'),   // ← reinforcement after this (Q35)
  byId('uq25'),
  byId('ic1'),
  byId('ic2'),
];
