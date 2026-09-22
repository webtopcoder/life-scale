import { Question, Category } from '@/types/funnel';

export interface AdaptiveState {
  ability: number; // 1.0 - 3.0
  answeredIds: number[];
  categoryCount: Record<Category, number>;
  questionNumber: number; // 1-indexed, how many questions answered so far
}

// Likert questions appear at these 1-indexed positions
const LIKERT_POSITIONS = [1, 4, 9, 10, 36];

const TOTAL_QUESTIONS = 38;

/** Ability adjustment when user answers a scored question correctly. */
const ABILITY_STEP_CORRECT = 0.3;
/** Ability adjustment when user answers a scored question incorrectly. */
const ABILITY_STEP_INCORRECT = -0.4;
/** Minimum ability value (1.0). */
const ABILITY_MIN = 1;
/** Maximum ability value (3.0). */
const ABILITY_MAX = 3;
/** Trajectory threshold: ability change from start (2) to count as improving/declining. */
const TRAJECTORY_THRESHOLD = 0.3;

export function createAdaptiveState(): AdaptiveState {
  return {
    ability: 2,
    answeredIds: [],
    categoryCount: { logic: 0, pattern: 0, spatial: 0, speed: 0, self: 0 },
    questionNumber: 1,
  };
}

export function getTotalAdaptiveQuestions(): number {
  return TOTAL_QUESTIONS;
}

export function selectNextQuestion(pool: Question[], state: AdaptiveState): Question | null {
  const available = pool.filter(q => !state.answeredIds.includes(q.id));
  if (available.length === 0) return null;

  const pos = state.questionNumber;

  // Likert questions at fixed positions
  if (LIKERT_POSITIONS.includes(pos)) {
    const likertAvailable = available.filter(q => q.type === 'likert');
    return likertAvailable[0] || null;
  }

  // Scored questions: pick closest difficulty to ability, then balance categories
  const scored = available.filter(q => q.type !== 'likert');
  if (scored.length === 0) return null;

  const target = state.ability;

  // Find least-covered category among scored categories
  const scoredCategories: Category[] = ['logic', 'pattern', 'spatial', 'speed'];

  scored.sort((a, b) => {
    const diffA = Math.abs(a.difficulty - target);
    const diffB = Math.abs(b.difficulty - target);
    if (Math.abs(diffA - diffB) > 0.1) return diffA - diffB;

    // Tie-break by least-covered category
    const catCountA = state.categoryCount[a.category] || 0;
    const catCountB = state.categoryCount[b.category] || 0;
    return catCountA - catCountB;
  });

  return scored[0];
}

export function updateAbility(state: AdaptiveState, question: Question, selectedOption: number, isCorrect?: boolean | null): AdaptiveState {
  const newState = {
    ...state,
    answeredIds: [...state.answeredIds, question.id],
    categoryCount: { ...state.categoryCount },
    questionNumber: state.questionNumber + 1,
  };

  newState.categoryCount[question.category] = (newState.categoryCount[question.category] || 0) + 1;

  // Only adjust ability for scored questions
  const isLikert = question.type === 'likert';
  if (!isLikert && isCorrect !== null && isCorrect !== undefined) {
    let newAbility = state.ability + (isCorrect ? ABILITY_STEP_CORRECT : ABILITY_STEP_INCORRECT);
    newAbility = Math.max(ABILITY_MIN, Math.min(ABILITY_MAX, newAbility));
    newState.ability = newAbility;
  } else {
    newState.ability = state.ability;
  }

  return newState;
}

export function getTrajectory(state: AdaptiveState): 'improving' | 'stable' | 'declining' {
  // Compare ability changes in first half vs second half
  const mid = Math.floor(state.answeredIds.length / 2);
  if (mid < 2) return 'stable';
  
  // Use the current ability vs starting ability as a simple heuristic
  const diff = state.ability - 2; // 2 is starting ability
  if (diff > TRAJECTORY_THRESHOLD) return 'improving';
  if (diff < -TRAJECTORY_THRESHOLD) return 'declining';
  return 'stable';
}

export function getStrongestAdaptiveCategory(counts: Record<Category, number>): Category {
  const scored: Category[] = ['logic', 'pattern', 'spatial', 'speed'];
  return scored.sort((a, b) => (counts[b] || 0) - (counts[a] || 0))[0];
}

export function getSecondaryAdaptiveCategory(counts: Record<Category, number>): Category {
  const scored: Category[] = ['logic', 'pattern', 'spatial', 'speed'];
  return scored.sort((a, b) => (counts[b] || 0) - (counts[a] || 0))[1];
}
