import type { TaskType } from '@/lib/iqChallenge';
import type { BhTaskType } from '@/lib/bhChallenge';
import type { HgTaskType } from '@/lib/hgChallenge';

export interface TaskGuidance {
  goal: string;
  why: string;
  action: string;
  time: string;
  prompt?: string;
}

const phaseTone = {
  Foundations: 'Build the base before you chase harder problems.',
  Build: 'Increase the pressure while the pattern is still fresh.',
  Mastery: 'Practice transferring the skill when the answer is not obvious.',
};

export function iqTaskGuidance(type: TaskType, day: number, phase: string): TaskGuidance {
  switch (type) {
    case 'brain_teaser':
      return {
        goal: 'Solve one reasoning problem without rushing the first read.',
        why: 'Most missed points start before the answer choices — in the way the problem is parsed.',
        action: 'Read once for meaning, once for constraints, then answer.',
        time: phase === 'Mastery' ? '6–8 min' : '4–6 min',
      };
    case 'maze':
      return {
        goal: 'Train visual planning and backtracking control.',
        why: 'Maze work strengthens the same pause-and-map habit that protects you on spatial items.',
        action: 'Plan two turns ahead before each move.',
        time: '5 min',
      };
    case 'timed_maze':
      return {
        goal: 'Practice speed without letting accuracy collapse.',
        why: 'The point is not to go fast — it is to notice when speed starts making you careless.',
        action: 'Run one timed maze, then note where you hesitated.',
        time: '3–5 min',
      };
    case 'lesson':
      return {
        goal: 'Add one reusable strategy to your test-taking toolbox.',
        why: phaseTone[phase as keyof typeof phaseTone] ?? phaseTone.Foundations,
        action: 'Finish the lesson and quiz before doing another puzzle.',
        time: '7–10 min',
      };
    case 'reflection':
      return {
        goal: 'Turn today’s practice into a rule you can reuse.',
        why: 'A short reflection prevents practice from becoming random activity.',
        action: 'Write the rule in your own words before marking it done.',
        time: '2 min',
        prompt: `Day ${day}: What mistake pattern showed up today, and what will you do first next time?`,
      };
  }
}

export function bhTaskGuidance(type: BhTaskType, focusLabel: string): TaskGuidance {
  switch (type) {
    case 'habit_stack':
      return {
        goal: 'Attach one tiny brain-health action to a routine that already happens.',
        why: 'Habits stick when they borrow an existing cue instead of relying on motivation.',
        action: 'Open your habit tracker and check today only after the habit is done.',
        time: '2–4 min',
      };
    case 'metric_logger':
      return {
        goal: 'Log the signals that explain tomorrow’s focus.',
        why: 'Sleep, mood, hydration, and movement become useful only when you can see the trend.',
        action: 'Open Daily Check and save today’s entry.',
        time: '30 sec',
      };
    case 'movement_snack':
      return {
        goal: 'Interrupt sitting before your attention gets heavy.',
        why: 'Small movement breaks support circulation without requiring a workout.',
        action: 'Walk, stretch, or climb stairs long enough to feel warmer.',
        time: '3–10 min',
      };
    case 'cognitive_drill':
      return {
        goal: 'Give your attention system one clean rep.',
        why: `This supports your current focus: ${focusLabel}.`,
        action: 'Complete one short drill and stop before fatigue makes it sloppy.',
        time: '4–6 min',
      };
    case 'focus_practice':
      return {
        goal: 'Prove you can protect one uninterrupted block.',
        why: 'Your brain gets clearer when task-switching is reduced, not when willpower is higher.',
        action: 'Put the phone away and do one thing until the timer ends.',
        time: '5 min',
      };
    case 'lesson':
      return {
        goal: 'Learn one practical lever behind brain wellbeing.',
        why: 'The dashboard works better when each habit has a reason attached to it.',
        action: 'Finish a lesson and keep one sentence you can act on today.',
        time: '7–10 min',
      };
    case 'reflection':
      return {
        goal: 'Connect today’s body signals to tomorrow’s plan.',
        why: 'Two honest sentences are enough to reveal patterns your memory smooths over.',
        action: 'Name what helped and what made focus harder.',
        time: '2 min',
        prompt: 'What gave you the clearest thinking today, and what made it harder?',
      };
    case 'doctor_prompt':
      return {
        goal: 'Capture one useful question for a future appointment.',
        why: 'A clear note now is better than trying to remember vague symptoms later.',
        action: 'Write one question tied to sleep, mood, focus, movement, or sensory changes.',
        time: '2 min',
      };
  }
}

export function hgTaskGuidance(type: HgTaskType, archetypeName?: string): TaskGuidance {
  const signature = archetypeName ?? 'your signature';
  switch (type) {
    case 'pattern_puzzle':
      return {
        goal: 'Find structure before trying moves at random.',
        why: `This trains ${signature} to turn instinct into a visible method.`,
        action: 'Pause, name the pattern you think is present, then solve.',
        time: '5 min',
      };
    case 'analogy_drill':
      return {
        goal: 'Practice seeing relationships, not just matching words.',
        why: 'Analogy work strengthens the bridge between quick intuition and precise explanation.',
        action: 'Say the relationship out loud before choosing an answer.',
        time: '4–6 min',
      };
    case 'divergent_prompt':
      return {
        goal: 'Generate past the obvious first answers.',
        why: 'Your most original ideas usually appear after the easy list is exhausted.',
        action: 'List ideas for 60 seconds, then circle the strangest usable one.',
        time: '2 min',
        prompt: 'Common object: a paperclip. List as many non-obvious uses as you can.',
      };
    case 'lesson':
      return {
        goal: 'Learn one way to use your signature deliberately.',
        why: 'Talent becomes useful when you can repeat it on purpose.',
        action: 'Finish the lesson and take one practice rule into tomorrow.',
        time: '7–10 min',
      };
    case 'reflection':
      return {
        goal: 'Spot where your default helped or hurt today.',
        why: `The goal is not to label ${signature}; it is to learn when to trust it.`,
        action: 'Name one moment your signature showed up and one adjustment for tomorrow.',
        time: '2 min',
        prompt: `Where did ${signature} help today, and where did it need a counterweight?`,
      };
  }
}