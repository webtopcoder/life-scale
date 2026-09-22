import { Star } from 'lucide-react';
import { DAYS_PER_WEEK, weekOfCycleDay } from '@/lib/challengeCycle';

interface AnyPlan {
  day: number;
  isRest: boolean;
  isMilestone: boolean;
  tasks: unknown[];
}

interface Props {
  plans: AnyPlan[];
  perDayCompleted: number[];
  currentDay: number;   // cycle day 1..90
  currentWeek: number;  // 1..13
}

export default function CycleTrack({ plans, perDayCompleted, currentDay, currentWeek }: Props) {
  const rows: AnyPlan[][] = [];
  for (const p of plans) {
    const w = weekOfCycleDay(p.day);
    if (!rows[w - 1]) rows[w - 1] = [];
    rows[w - 1].push(p);
  }

  return (
    <div className="space-y-1.5">
      {rows.map((row, i) => {
        const wk = i + 1;
        const isCurrent = wk === currentWeek;
        return (
          <div key={wk} className="flex items-center gap-2">
            <div className={[
              'w-10 shrink-0 text-[10px] font-semibold uppercase tracking-wide',
              isCurrent ? 'text-primary' : 'text-muted-foreground',
            ].join(' ')}>
              W{wk}
            </div>
            <div className="grid grid-cols-7 gap-1.5 flex-1">
              {row.map(p => {
                const done = perDayCompleted[p.day - 1] ?? 0;
                const target = p.tasks.length;
                const isPast = p.day < currentDay;
                const isToday = p.day === currentDay;
                const fullyDone = !p.isRest && target > 0 && done >= target;
                const missed = isPast && !p.isRest && done < target;

                let bg = 'bg-secondary text-muted-foreground';
                if (fullyDone) bg = 'bg-primary text-primary-foreground';
                else if (p.isRest && isPast) bg = 'bg-muted text-muted-foreground';
                else if (missed) bg = 'bg-warning/50 text-foreground';
                const ring = isToday ? 'ring-2 ring-primary ring-offset-1 ring-offset-card' : '';

                return (
                  <div
                    key={p.day}
                    title={
                      p.isRest
                        ? `Day ${p.day}: Rest`
                        : `Day ${p.day}${p.isMilestone ? ' (Milestone)' : ''}: ${done}/${target}`
                    }
                    className={['aspect-square rounded-md flex items-center justify-center text-[10px] font-semibold relative', bg, ring].join(' ')}
                  >
                    {p.isMilestone ? <Star className="h-3 w-3" /> : p.isRest ? <span className="opacity-60">·</span> : p.day}
                  </div>
                );
              })}
              {/* pad short last row */}
              {Array.from({ length: DAYS_PER_WEEK - row.length }).map((_, idx) => (
                <div key={`pad-${idx}`} className="aspect-square" />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
