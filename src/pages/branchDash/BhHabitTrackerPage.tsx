import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useBrainHealth } from '@/context/BrainHealthContext';
import BranchLibraryLayout from '@/components/dashboard/BranchLibraryLayout';
import { scoreQuiz } from '@/engine/brainHealthScoring';
import { CheckCircle2, Circle } from 'lucide-react';

const HABIT_TEMPLATES: Record<string, { habit: string; cue: string; why: string }[]> = {
  cognitive: [
    { habit: 'Read 15 minutes of something new', cue: 'After morning coffee', why: 'Novelty builds cognitive reserve.' },
    { habit: 'Do one working-memory drill', cue: 'Right after lunch', why: 'Focused reps grow attention.' },
  ],
  vascular: [
    { habit: '20-minute walk', cue: 'After the workday ends', why: 'Aerobic work moves BDNF.' },
    { habit: 'Check blood-pressure or heart-rate at rest', cue: 'Sunday mornings', why: 'Trend matters more than any one reading.' },
  ],
  sleep: [
    { habit: 'Screens off 60 minutes before bed', cue: '30 min before target bedtime', why: 'Melatonin gets a chance to work.' },
    { habit: 'Same wake time every day', cue: 'Same alarm 7 days a week', why: 'Circadian anchoring is the biggest lever.' },
  ],
  movement: [
    { habit: '2 minutes of movement every hour', cue: 'Every hourly calendar mark', why: 'NEAT beats gym time on most days.' },
    { habit: 'Resistance work twice a week', cue: 'Tuesday and Saturday', why: 'Strength protects cognition.' },
  ],
  sensory: [
    { habit: '20-20-20 rule for screens', cue: 'Every 20 minutes of near work', why: 'Prevents accommodative fatigue.' },
    { habit: 'Wear ear protection in loud places', cue: 'When ambient noise > conversation level', why: 'Hearing loss is a major dementia risk.' },
  ],
  mood: [
    { habit: 'One weak-tie hello', cue: 'On every commute or errand', why: 'Weak ties = biggest opportunity signal.' },
    { habit: '2-minute physiological sigh', cue: 'Right before a stressful call', why: 'Fastest way to drop arousal.' },
  ],
  reserve: [
    { habit: '10 minutes of language practice', cue: 'Before or after breakfast', why: 'Bilingualism delays decline by years.' },
    { habit: 'One complex hobby session', cue: 'Same time each week', why: 'Complexity is the ingredient, not the topic.' },
  ],
};

const DOMAIN_LABEL: Record<string, string> = {
  cognitive: 'Memory & focus', vascular: 'Heart', sleep: 'Sleep', movement: 'Movement',
  sensory: 'Hearing & vision', mood: 'Stress & connection', reserve: 'Learning',
};

interface WeekLog {
  domain: string;
  habit_index: number;
  checked_days: number[]; // 0..6
}

function weekStart() {
  const d = new Date();
  const day = d.getDay() || 7; // Mon=1..Sun=7
  d.setDate(d.getDate() - (day - 1));
  return d.toISOString().slice(0, 10);
}

const STORE_KEY = (uid: string, wk: string) => `bh_habits_${uid}_${wk}`;

export default function BhHabitTrackerPage() {
  const { user } = useAuth();
  const { state } = useBrainHealth();
  const [logs, setLogs] = useState<WeekLog[]>([]);
  const wk = weekStart();

  const topDomains = useMemo(() => {
    try {
      const scored = scoreQuiz(state.answers);
      return scored.top3.map(d => d.domain).slice(0, 2);
    } catch {
      return ['sleep', 'movement'];
    }
  }, [state.answers]);

  useEffect(() => {
    if (!user?.id) return;
    const raw = localStorage.getItem(STORE_KEY(user.id, wk));
    if (raw) { try { setLogs(JSON.parse(raw)); } catch { /* noop */ } }
  }, [user?.id, wk]);

  const persist = (next: WeekLog[]) => {
    setLogs(next);
    if (user?.id) localStorage.setItem(STORE_KEY(user.id, wk), JSON.stringify(next));
  };

  const toggle = (domain: string, habitIndex: number, day: number) => {
    const idx = logs.findIndex(l => l.domain === domain && l.habit_index === habitIndex);
    if (idx === -1) {
      persist([...logs, { domain, habit_index: habitIndex, checked_days: [day] }]);
    } else {
      const l = logs[idx];
      const has = l.checked_days.includes(day);
      const next = [...logs];
      next[idx] = {
        ...l,
        checked_days: has ? l.checked_days.filter(d => d !== day) : [...l.checked_days, day],
      };
      persist(next);
    }
  };

  const isChecked = (domain: string, habitIndex: number, day: number) => {
    const l = logs.find(x => x.domain === domain && x.habit_index === habitIndex);
    return !!l?.checked_days.includes(day);
  };

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <BranchLibraryLayout branch="bh">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Habit tracker</h1>
          <p className="text-muted-foreground text-sm">Two habits per focus area, one week at a time. Check the day when you do it.</p>
        </div>
        {topDomains.map(domain => {
          const habits = HABIT_TEMPLATES[domain] || HABIT_TEMPLATES.sleep;
          return (
            <section key={domain} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <h2 className="text-[15px] font-bold mb-3">{DOMAIN_LABEL[domain] || domain}</h2>
              <div className="space-y-4">
                {habits.map((h, hi) => (
                  <div key={hi} className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-semibold">{h.habit}</div>
                        <div className="text-[11.5px] text-muted-foreground">Cue: {h.cue} · Why: {h.why}</div>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {dayLabels.map((lbl, i) => {
                        const on = isChecked(domain, hi, i);
                        return (
                          <button key={i} type="button" onClick={() => toggle(domain, hi, i)}
                            className={[
                              'flex-1 h-10 rounded-md border text-[11px] font-semibold inline-flex items-center justify-center gap-1',
                              on ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-secondary',
                            ].join(' ')}>
                            {on ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                            {lbl}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </BranchLibraryLayout>
  );
}
