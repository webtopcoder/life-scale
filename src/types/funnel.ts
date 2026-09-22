import type { CheckoutPlanId } from '@/services/breezeConfig';

export type FunnelStage =
  | 'landing'
  | 'intro'
  | 'assessment'
  | 'reinforcement'
  | 'social-proof'
  | 'calculating'
  | 'email'
  | 'checkout'
  | 'checkout-plans'
  | 'checkout-plans-pay'
  | 'upsell-weakness'
  | 'upsell-blueprint'
  | 'upsell-coach'
  | 'report'
  | 'social-proof-2'
  | 'calculating-2'
  | 'email-2'
  | 'checkout-2';

export type QuestionType =
  | 'likert'
  | 'multipleChoice'
  | 'sequence'
  | 'analogy'
  | 'visualPuzzle'
  | 'spatial'
  | 'pattern'
  | 'personal'
  | 'imageMultipleChoice'
  | 'memorySequence'
  | 'reactionTap'
  | 'oddOneOut';

export type Category = 'logic' | 'pattern' | 'spatial' | 'speed' | 'self';

export interface Question {
  id: number;
  type: QuestionType;
  prompt: string;
  subtitle?: string;
  image?: string;
  options: string[];
  correctAnswer?: number | null; // not sent from backend; null for likert/self questions
  category: Category;
  difficulty: number; // 1-5
  hasReinforcement?: boolean;
  subskill?: string;
  // Optional fields used by short-iq question types
  sequence?: string[];
  displayMs?: number;
  targetPosition?: number;
  sequenceVariant?: 'digit' | 'letter' | 'color' | 'mixed';
  targetDelayMs?: [number, number];
  timeLimitMs?: number;
}

export interface CategoryScores {
  logic: number;
  pattern: number;
  spatial: number;
  speed: number;
  self: number;
}

export interface Answer {
  questionId: number;
  selectedOption: number;
  timeSpent: number; // ms
  isCorrect: boolean | null; // null for likert/self questions
}

export interface AdaptiveProfile {
  strongest: Category;
  secondary: Category;
  trajectory: 'improving' | 'stable' | 'declining';
}

export interface FunnelState {
  funnelStage: FunnelStage;
  questionIndex: number;
  answers: Answer[];
  scores: CategoryScores;
  percentiles: CategoryScores;
  timer: {
    startTime: number | null;
    elapsedTime: number;
    completionTime: number | null;
  };
  email: string;
  finalScore: number | null;
  gender: string;
  reinforcementCount: number;
  adaptiveAbility: number | null;
  adaptiveProfile: AdaptiveProfile | null;
  isV2: boolean;
  flowId: string;
  selectedPlanId: CheckoutPlanId | null;
}

/** @deprecated Use hasReinforcement property on each Question instead */
export const REINFORCEMENT_AFTER = [8, 18, 23] as const;

export const STAGE_ROUTES: Record<FunnelStage, string> = {
  landing: '/',
  intro: '/onboarding',
  assessment: '/onboarding',
  reinforcement: '/onboarding',
  'social-proof': '/onboarding',
  calculating: '/onboarding',
  email: '/onboarding',
  checkout: '/onboarding',
  'checkout-plans': '/onboarding-plans',
  'checkout-plans-pay': '/onboarding-plans/pay',
  'upsell-weakness': '/upsell/weakness-report',
  'upsell-blueprint': '/upsell/genius-blueprint',
  'upsell-coach': '/upsell/brain-coach',
  report: '/report',
  'social-proof-2': '/social-proof2',
  'calculating-2': '/calculating2',
  'email-2': '/email2',
  'checkout-2': '/checkout2',
};

export const ROUTE_TO_STAGE: Record<string, FunnelStage> = {
  '/': 'landing',
  '/onboarding': 'intro',
  '/onboarding-home': 'intro',
  '/onboarding-boa': 'intro',
  '/onboarding-rvr': 'intro',
  '/onboarding-dev': 'intro',
  '/onboarding-plans': 'intro',
  '/onboarding-plans/pay': 'checkout-plans-pay',
  '/upsell/weakness-report': 'upsell-weakness',
  '/upsell/genius-blueprint': 'upsell-blueprint',
  '/upsell/brain-coach': 'upsell-coach',
  '/report': 'report',
  '/social-proof2': 'social-proof-2',
  '/calculating2': 'calculating-2',
  '/email2': 'email-2',
  '/checkout2': 'checkout-2',
};

export const CATEGORY_WEIGHTS: Record<Category, number> = {
  logic: 0.30,
  pattern: 0.30,
  spatial: 0.20,
  speed: 0.05,
  self: 0.15,
};
