// Hidden Athlete — the Body category's hidden-strengths profiler. No score.
// Answers push three signed axes; the sign combination selects one of eight
// archetypes. Every option is directional: none is neutral, none is "better".
//
//   endurance : + endurance / aerobic          - power / speed
//   volume    : + steady accumulation          - short hard bursts
//   structure : + plan-driven                  - feel-driven

import { Q, C, type ScaleStep } from '@/data/scaleQuiz';

export type AthleteAxis = 'endurance' | 'volume' | 'structure';

export const ATHLETE_AXIS_LABEL: Record<AthleteAxis, [string, string]> = {
  endurance: ['Power', 'Endurance'],
  volume: ['Intensity', 'Volume'],
  structure: ['Instinct', 'Structure'],
};

const v = (
  label: string,
  vector: Partial<Record<AthleteAxis, number>>,
  reading: string,
) => ({ label, vector: vector as Record<string, number>, reading });

export const ATHLETE_QUIZ_STEPS: ScaleStep[] = [
  Q({ kind: 'q', id: 1, section: 'About you', domain: null,
      prompt: 'What is your age range?',
      options: [
        { label: 'Under 30' }, { label: '30–39' }, { label: '40–49' },
        { label: '50–59' }, { label: '60+' },
      ] }),
  Q({ kind: 'q', id: 2, section: 'About you', domain: null,
      prompt: 'Where are you right now with training?',
      options: [
        { label: 'Starting from scratch' }, { label: 'Coming back after a break' },
        { label: 'Training regularly' }, { label: 'Training hard and want an edge' },
      ] }),

  C({ kind: 'card', id: 'card-1', title: 'There is no wrong answer here',
      body: 'This is not a fitness test. It reads how your body prefers to work — long or short, steady or spiky, planned or improvised — and hands you a way of training that fits instead of one you have to force.' }),

  Q({ kind: 'q', id: 3, section: 'How you move', domain: 'axis',
      prompt: 'Which effort feels more like you?',
      options: [
        v('A long, unbroken stretch at a pace I can hold', { endurance: 2, volume: 1 }, 'Aerobic bias, accumulation tolerant.'),
        v('A short, maximal effort with a full rest after', { endurance: -2, volume: -1 }, 'Neuromuscular bias, spiky output.'),
        v('Repeats — hard, rest, hard, rest', { endurance: -1, volume: -1, structure: 1 }, 'Interval preference, needs structure.'),
        v('Moderate effort I can extend as long as I want', { endurance: 1, volume: 2, structure: -1 }, 'Volume tolerant, self-paced.'),
      ] }),
  Q({ kind: 'q', id: 4, section: 'How you move', domain: 'axis',
      prompt: 'You have 30 free minutes and no plan. What happens?',
      options: [
        v('I go out and keep going until the time is up', { endurance: 2, volume: 1, structure: -1 }, 'Open-ended aerobic default.'),
        v('I do something short and brutal and finish early', { endurance: -2, volume: -1 }, 'Intensity default.'),
        v('I follow whatever session is next in my plan', { structure: 2, volume: 1 }, 'Plan adherence dominant.'),
        v('I pick by feel and change halfway through', { structure: -2 }, 'Improvisational.'),
      ] }),
  Q({ kind: 'q', id: 5, section: 'How you move', domain: 'axis',
      prompt: 'Which sounds better as a hard day?',
      options: [
        v('Two hours of steady work', { endurance: 2, volume: 2 }, 'High volume aerobic.'),
        v('Twenty minutes that leaves me on the floor', { endurance: -2, volume: -2 }, 'Low volume, max intensity.'),
        v('An hour of mixed pieces', { volume: 1, structure: 1 }, 'Mixed-modal, structured.'),
        v('Heavy lifting with long rests', { endurance: -2, volume: -1, structure: 1 }, 'Strength bias, planned.'),
      ] }),
  Q({ kind: 'q', id: 6, section: 'How you move', domain: 'axis',
      prompt: 'When something gets hard, what carries you?',
      options: [
        v('Settling in and grinding it out', { endurance: 2, volume: 2 }, 'Tolerance-led.'),
        v('A burst of aggression', { endurance: -2, volume: -1 }, 'Arousal-led.'),
        v('Knowing exactly how much is left', { structure: 2 }, 'Structure-led coping.'),
        v('Changing what I am doing', { structure: -2, volume: -1 }, 'Novelty-led coping.'),
      ] }),

  Q({ kind: 'q', id: 7, section: 'Rhythm', domain: 'axis',
      prompt: 'Which pattern keeps you going for months?',
      options: [
        v('Something almost every day, nothing extreme', { volume: 2, endurance: 1 }, 'Frequency-driven consistency.'),
        v('Three big sessions a week', { volume: -2, structure: 1 }, 'Concentrated load.'),
        v('Whatever fits the week', { structure: -2 }, 'Opportunistic.'),
        v('A block with a clear end date', { structure: 2, volume: 1 }, 'Periodisation-friendly.'),
      ] }),
  Q({ kind: 'q', id: 8, section: 'Rhythm', domain: 'axis',
      prompt: 'How do you feel about repeating the same session weekly?',
      options: [
        v('I like it — I can see progress', { structure: 2, volume: 1 }, 'Reward from measurable repetition.'),
        v('Fine for a while, then I need change', { structure: -1 }, 'Moderate novelty need.'),
        v('I get bored fast', { structure: -2, endurance: -1 }, 'High novelty need.'),
        v('I never repeat anything on purpose', { structure: -2, volume: -1 }, 'Fully improvisational.'),
      ] }),
  Q({ kind: 'q', id: 9, section: 'Rhythm', domain: 'axis',
      prompt: 'Missing two planned days does what to you?',
      options: [
        v('Nothing, I pick it back up', { structure: -1, volume: 1 }, 'Low plan attachment, resilient.'),
        v('Annoys me, I make them up', { structure: 2 }, 'High plan attachment.'),
        v('Breaks the run and I struggle to restart', { structure: 1, volume: -1 }, 'Streak-dependent.'),
        v('I barely notice which days I planned', { structure: -2 }, 'Plan-agnostic.'),
      ] }),

  C({ kind: 'card', id: 'card-2', title: 'Halfway',
      body: 'The next questions are about recovery and how you respond to effort. They matter more than the training questions — most people fail on recovery, not on will.' }),

  Q({ kind: 'q', id: 10, section: 'Recovery', domain: 'axis',
      prompt: 'The day after a genuinely hard effort, you are usually…',
      options: [
        v('Fine, ready again', { endurance: 1, volume: 2 }, 'High work capacity.'),
        v('Sore but functional', { volume: 1 }, 'Normal recovery.'),
        v('Wrecked for a day', { volume: -2, endurance: -1 }, 'Low recovery from intensity.'),
        v('Wrecked for two or three', { volume: -2, endurance: -2 }, 'Very low frequency tolerance.'),
      ] }),
  Q({ kind: 'q', id: 11, section: 'Recovery', domain: 'axis',
      prompt: 'What actually restores you?',
      options: [
        v('Easy movement — a walk, a slow ride', { endurance: 2, volume: 1 }, 'Active recovery responder.'),
        v('Complete rest', { endurance: -1, volume: -2 }, 'Passive recovery responder.'),
        v('Sleep above all', { volume: -1, structure: 1 }, 'Sleep-dependent.'),
        v('Food and a proper meal', { volume: 1, structure: -1 }, 'Fuel-dependent.'),
      ] }),
  Q({ kind: 'q', id: 12, section: 'Recovery', domain: 'axis',
      prompt: 'How well do you read your own warning signs?',
      options: [
        v('Very well, I back off early', { structure: 1, volume: 1 }, 'Good interoception.'),
        v('I notice but push anyway', { structure: -1, volume: -1 }, 'Override tendency.'),
        v('I only notice once I am hurt', { structure: -2, volume: -2 }, 'Poor early signal reading.'),
        v('I track numbers instead of feel', { structure: 2 }, 'Data-mediated.'),
      ] }),

  Q({ kind: 'q', id: 13, section: 'Under pressure', domain: 'axis',
      prompt: 'In a competitive moment, you tend to…',
      options: [
        v('Hold pace while others fade', { endurance: 2, volume: 1 }, 'Attrition strategy.'),
        v('Go early and hard', { endurance: -2, volume: -1 }, 'Front-load strategy.'),
        v('Save everything for the end', { endurance: -1, structure: 1 }, 'Kick strategy.'),
        v('React to whatever is happening', { structure: -2 }, 'Reactive strategy.'),
      ] }),
  Q({ kind: 'q', id: 14, section: 'Under pressure', domain: 'axis',
      prompt: 'Which failure is more familiar?',
      options: [
        v('I ran out of top end', { endurance: 2 }, 'Aerobic-dominant profile.'),
        v('I ran out of staying power', { endurance: -2 }, 'Power-dominant profile.'),
        v('I did too much and broke down', { volume: 2, structure: -2 }, 'Overreach pattern.'),
        v('I did too little and stalled', { volume: -2, structure: -1 }, 'Underload pattern.'),
      ] }),
  Q({ kind: 'q', id: 15, section: 'Under pressure', domain: 'axis',
      prompt: 'How do you like effort measured?',
      options: [
        v('Time and distance', { endurance: 2, volume: 1 }, 'Volume metrics.'),
        v('Weight and reps', { endurance: -2, volume: -1 }, 'Load metrics.'),
        v('Numbers on a screen', { structure: 2 }, 'Data-led.'),
        v('How it felt', { structure: -2 }, 'Feel-led.'),
      ] }),

  Q({ kind: 'q', id: 16, section: 'Motivation', domain: 'axis',
      prompt: 'What gets you out of the door on a bad day?',
      options: [
        v('Not breaking the habit', { volume: 2, structure: 1 }, 'Habit-driven.'),
        v('Wanting to beat something', { endurance: -1, volume: -1 }, 'Competition-driven.'),
        v('It is on the plan', { structure: 2 }, 'Compliance-driven.'),
        v('It usually makes me feel better', { endurance: 1, structure: -2 }, 'Mood-driven.'),
      ] }),
  Q({ kind: 'q', id: 17, section: 'Motivation', domain: 'axis',
      prompt: 'Training alone or with others?',
      options: [
        v('Alone, in my own head', { endurance: 2, structure: 1 }, 'Solitary tolerance.'),
        v('With one other person', { volume: 1 }, 'Pair accountability.'),
        v('In a group with energy', { endurance: -2, volume: -1, structure: -1 }, 'Group arousal.'),
        v('Depends entirely on the day', { structure: -2 }, 'Context-dependent.'),
      ] }),
  Q({ kind: 'q', id: 18, section: 'Motivation', domain: 'axis',
      prompt: 'Six weeks in with no visible change. You…',
      options: [
        v('Keep going, it takes longer than that', { volume: 2, endurance: 1 }, 'Long horizon.'),
        v('Change the plan', { structure: -1, volume: -1 }, 'Short horizon.'),
        v('Look for the variable I got wrong', { structure: 2 }, 'Analytical.'),
        v('Push harder', { endurance: -1, volume: -2 }, 'Intensity escalation.'),
      ] }),

  Q({ kind: 'q', id: 19, section: 'Your body', domain: 'axis',
      prompt: 'Which has always come more naturally?',
      options: [
        v('Going far', { endurance: 2, volume: 2 }, 'Aerobic natural.'),
        v('Going fast', { endurance: -2, volume: -1 }, 'Speed natural.'),
        v('Being strong', { endurance: -2, volume: -1, structure: 1 }, 'Strength natural.'),
        v('Being agile and coordinated', { endurance: -1, structure: -2 }, 'Skill natural.'),
      ] }),
  Q({ kind: 'q', id: 20, section: 'Your body', domain: 'axis',
      prompt: 'How does your body respond to a completely new activity?',
      options: [
        v('Awkward, then it clicks', { structure: 1, volume: 1 }, 'Learns by repetition.'),
        v('It clicks almost immediately', { structure: -2, endurance: -1 }, 'High motor learning.'),
        v('Slowly, but it sticks', { endurance: 2, volume: 2 }, 'Slow durable adaptation.'),
        v('I need it broken into steps', { structure: 2, volume: -1 }, 'Needs scaffolding.'),
      ] }),
  Q({ kind: 'q', id: 21, section: 'Your body', domain: 'axis',
      prompt: 'What limits you first in a hard session?',
      options: [
        v('Breathing', { endurance: -2 }, 'Aerobic ceiling.'),
        v('Legs or arms giving out', { endurance: 1, volume: -1 }, 'Local muscular ceiling.'),
        v('Willingness to keep hurting', { volume: -2, structure: -1 }, 'Tolerance ceiling.'),
        v('Nothing — I stop because time is up', { endurance: 2, volume: 2 }, 'Untapped capacity.'),
      ] }),
  Q({ kind: 'q', id: 22, section: 'Your body', domain: 'axis',
      prompt: 'If you could only keep one for a year, which?',
      options: [
        v('The ability to go all day', { endurance: 2, volume: 2 }, 'Values durability.'),
        v('The ability to be explosive', { endurance: -2, volume: -2 }, 'Values output.'),
        v('The discipline to never miss', { structure: 2, volume: 1 }, 'Values consistency.'),
        v('The freedom to train however I feel', { structure: -2 }, 'Values autonomy.'),
      ] }),
];
