import { Sparkles, Trophy, Activity } from 'lucide-react';

interface Props {
  branchLabel: string;         // e.g. "IQ", "Brain Health", "Hidden Genius"
  weekNumber: number;
  weeksTotal: number;
  weekPct: number;
  weekTasksDone: number;
  weekTasksTotal: number;
  cycleNumber: number;
  cycleDay: number;
  cycleDaysTotal: number;
  cyclePct: number;
  phase: string;
  brainPoints: number;
  level: number;
  streak: number;
}

function Ring({ pct }: { pct: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  return (
    <div className="relative h-[112px] w-[112px] shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} className="fill-none stroke-secondary" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r}
          className="fill-none stroke-primary transition-[stroke-dashoffset] duration-700"
          strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[24px] font-bold leading-none text-foreground">{pct}%</span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">this week</span>
      </div>
    </div>
  );
}

function StatChip({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[12px]">
      <Icon className="h-3.5 w-3.5 text-primary" />
      <span className="font-semibold text-foreground">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

export default function WeeklyChallengeHeader(p: Props) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start gap-5">
        <Ring pct={p.weekPct} />
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <span>Your 90-Day Plan</span>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-primary font-semibold">
              {p.branchLabel}
            </span>
          </div>
          <h2 className="text-[18px] sm:text-[22px] font-bold leading-tight mt-1">
            Week {p.weekNumber} of {p.weeksTotal}
          </h2>
          <div className="mt-1 text-[13px] text-muted-foreground">
            Phase: <span className="text-foreground font-semibold">{p.phase}</span>
            <span className="mx-2 opacity-40">·</span>
            {p.weekTasksDone} / {p.weekTasksTotal} this week
          </div>
          <div className="mt-2 text-[12px] text-muted-foreground">
            Cycle {p.cycleNumber} · Day {p.cycleDay} of {p.cycleDaysTotal} · {p.cyclePct}% overall
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatChip icon={Sparkles} label="Brain Points" value={String(p.brainPoints)} />
            <StatChip icon={Trophy} label="Level" value={String(p.level)} />
            <StatChip icon={Activity} label="Streak" value={`${p.streak}d`} />
          </div>
        </div>
      </div>
    </section>
  );
}
