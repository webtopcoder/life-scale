import BranchLibraryLayout from '@/components/dashboard/BranchLibraryLayout';
import { Button } from '@/components/ui/button';
import { ARCHETYPES, TRAIT_LABEL, blendCopy, resolveHgResult } from '@/engine/hiddenGeniusScoring';
import { buildHgPlan, hgTaskLabel, hgTaskPath, type HgDayPlan, type HgTaskType } from '@/lib/hgChallenge';
import { useAuth } from '@/context/AuthContext';
import { ArrowRight, BookOpen, CheckCircle2, Compass, Layers3, Sparkles, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

const TASK_PURPOSE: Record<HgTaskType, string> = {
  pattern_puzzle: 'Train yourself to spot the hidden rule instead of forcing a familiar answer.',
  analogy_drill: 'Build faster bridges between ideas, language, and logic.',
  divergent_prompt: 'Increase idea range so your first thought stops being your only thought.',
  lesson: 'Add a simple mental model you can use in work, study, or decisions.',
  reflection: 'Turn your signature into a repeatable behavior you can notice and adjust.',
};

const PHASE_COPY: Record<HgDayPlan['phase'], { goal: string; why: string; outcome: string }> = {
  Foundations: {
    goal: 'Notice your default genius pattern before trying to improve it.',
    why: 'Most people waste effort copying someone else’s style. This phase makes your own style visible.',
    outcome: 'You know which tasks make you sharper, which ones drain you, and where your best ideas usually start.',
  },
  Build: {
    goal: 'Use your signature on harder prompts with less hesitation.',
    why: 'Talent becomes useful when you can call it on demand, not only when inspiration shows up.',
    outcome: 'You start seeing repeatable ways to create ideas, explain them, and turn them into finished work.',
  },
  Mastery: {
    goal: 'Apply your signature to real decisions, collaboration, and personal standards.',
    why: 'The point is not more labels. The point is becoming hard to ignore in the rooms you care about.',
    outcome: 'You leave with a working operating system for how you think, create, learn, and lead.',
  },
};

function countTasks(plans: HgDayPlan[], phase: HgDayPlan['phase']) {
  return plans
    .filter((plan) => plan.phase === phase)
    .reduce((sum, plan) => sum + plan.tasks.length, 0);
}

function phaseMilestones(plans: HgDayPlan[], phase: HgDayPlan['phase']) {
  return plans.filter((plan) => plan.phase === phase && plan.isMilestone).length;
}

function taskMix(plans: HgDayPlan[], phase: HgDayPlan['phase']) {
  const counts = new Map<HgTaskType, number>();
  for (const plan of plans.filter((item) => item.phase === phase)) {
    for (const task of plan.tasks) counts.set(task, (counts.get(task) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
}

export default function HgArchetypeLabPage() {
  const { user } = useAuth();
  const result = resolveHgResult();
  const arch = result ? ARCHETYPES[result.primary] : null;
  const secondary = result ? ARCHETYPES[result.secondary] : null;
  const plans = user?.id ? buildHgPlan(user.id) : [];
  const todaysFocus = plans.find((plan) => !plan.isRest) ?? null;
  const phases: HgDayPlan['phase'][] = ['Foundations', 'Build', 'Mastery'];

  return (
    <BranchLibraryLayout branch="hg">
      <div className="space-y-7">
        <div>
          <h1 className="text-2xl font-bold mb-1">Archetype Lab</h1>
          <p className="text-muted-foreground text-sm">
            A guided 90-day practice system for turning your genius signature into daily behavior.
          </p>
        </div>

        {arch && result && (
          <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <div className="text-[11px] uppercase tracking-wider text-primary font-bold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Your signature
                </div>
                <h2 className="text-xl sm:text-2xl font-bold mt-2">{arch.name}</h2>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{arch.superpower}</p>
                {secondary && (
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{blendCopy(result.primary, result.secondary)}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:min-w-64">
                {result.topTraits.slice(0, 4).map((trait) => (
                  <div key={trait} className="rounded-lg border border-border bg-background px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Signal</div>
                    <div className="text-xs font-semibold mt-1">{TRAIT_LABEL[trait]}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {todaysFocus && (
          <section className="rounded-lg border border-primary/25 bg-card p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Target className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold">Next focused practice</h2>
                <p className="mt-1 text-sm text-muted-foreground">Start with a small rep that makes your thinking style more deliberate today.</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {todaysFocus.tasks.slice(0, 4).map((task, index) => {
                    const path = hgTaskPath(task);
                    return (
                      <div key={`${task}-${index}`} className="rounded-lg border border-border bg-background p-4">
                        <div className="text-sm font-bold">{hgTaskLabel(task)}</div>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{TASK_PURPOSE[task]}</p>
                        {path && (
                          <Button asChild size="sm" variant="secondary" className="mt-3 h-8">
                            <Link to={path}>Open task <ArrowRight className="h-3.5 w-3.5" /></Link>
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {arch && (
          <section className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-sm font-bold"><Compass className="h-4 w-4 text-primary" /> How it shows up</div>
              <div className="mt-4 space-y-3">
                {arch.showsUp.map((line) => (
                  <div key={line} className="flex gap-2 text-sm text-muted-foreground leading-relaxed">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-sm font-bold"><Layers3 className="h-4 w-4 text-primary" /> Where it shines</div>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p><span className="font-semibold text-foreground">Problem solving:</span> {arch.shines.problemSolving}</p>
                <p><span className="font-semibold text-foreground">Learning:</span> {arch.shines.learning}</p>
                <p><span className="font-semibold text-foreground">Decisions:</span> {arch.shines.decisions}</p>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-sm font-bold"><BookOpen className="h-4 w-4 text-primary" /> Growth edge</div>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{arch.blindSpotCopy(result?.weakestTrait ?? arch.traits[0])}</p>
              <div className="mt-4 space-y-2">
                {arch.growthPractices.map((practice) => (
                  <p key={practice} className="text-xs text-muted-foreground leading-relaxed">• {practice}</p>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold">90-day practice arc</h2>
            <p className="mt-1 text-sm text-muted-foreground">Each phase changes the job of the daily tasks so the plan feels like development, not a checklist.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {phases.map((phase, index) => {
              const copy = PHASE_COPY[phase];
              const firstDay = index * 30 + 1;
              const lastDay = firstDay + 29;
              return (
                <article key={phase} className="rounded-lg border border-border bg-card p-5">
                  <div className="text-[11px] uppercase tracking-wider text-primary font-bold">Days {firstDay}-{lastDay}</div>
                  <h3 className="mt-2 text-lg font-bold">{phase}</h3>
                  <p className="mt-3 text-sm font-semibold leading-relaxed">{copy.goal}</p>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{copy.why}</p>
                  <div className="mt-4 rounded-lg bg-background p-3 text-xs text-muted-foreground leading-relaxed">
                    <span className="font-semibold text-foreground">Outcome:</span> {copy.outcome}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border border-border bg-background px-3 py-2">
                      <div className="text-muted-foreground">Practice reps</div>
                      <div className="mt-1 font-bold">{countTasks(plans, phase)}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-background px-3 py-2">
                      <div className="text-muted-foreground">Checkpoints</div>
                      <div className="mt-1 font-bold">{phaseMilestones(plans, phase)}</div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {taskMix(plans, phase).map(([task]) => (
                      <div key={task} className="text-xs text-muted-foreground">• {hgTaskLabel(task)} — {TASK_PURPOSE[task]}</div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </BranchLibraryLayout>
  );
}