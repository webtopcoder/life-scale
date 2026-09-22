import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/integrations/api/client';
import BranchLibraryLayout from '@/components/dashboard/BranchLibraryLayout';
import { CheckCircle2 } from 'lucide-react';

interface DailyLog {
  id: string;
  log_date: string;
  sleep_hours: number | null;
  mood: number | null;
  focus: number | null;
  hydration: boolean | null;
  movement_minutes: number | null;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function BhDailyCheckPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [sleep, setSleep] = useState<string>('');
  const [mood, setMood] = useState<number | null>(null);
  const [focus, setFocus] = useState<number | null>(null);
  const [hydration, setHydration] = useState<boolean | null>(null);
  const [movement, setMovement] = useState<string>('');

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    (async () => {
      const data = await api.get<any[]>('/dashboard/bh-logs');
      const rows = (data || []).map(r => ({
        id: r.id,
        log_date: r.logDate ?? r.log_date,
        sleep_hours: r.sleepHours ?? r.sleep_hours,
        mood: r.mood,
        focus: r.focus,
        hydration: r.hydration,
        movement_minutes: r.movementMinutes ?? r.movement_minutes,
      })) as DailyLog[];
      setLogs(rows);
      const t = rows.find(r => r.log_date === today());
      if (t) {
        setSleep(t.sleep_hours?.toString() ?? '');
        setMood(t.mood);
        setFocus(t.focus);
        setHydration(t.hydration);
        setMovement(t.movement_minutes?.toString() ?? '');
      }
      setLoading(false);
    })();
  }, [user?.id]);

  const save = async () => {
    if (!user?.id) return;
    setSaving(true);
    const row = {
      user_id: user.id,
      log_date: today(),
      sleep_hours: sleep ? Number(sleep) : null,
      mood,
      focus,
      hydration,
      movementMinutes: movement ? Number(movement) : null,
    };
    await api.put('/dashboard/bh-logs', row);
    setSaved(true);
    setSaving(false);
    // refresh
    const data = await api.get<any[]>('/dashboard/bh-logs');
    const rows = (data || []).map(r => ({
      id: r.id,
      log_date: r.logDate ?? r.log_date,
      sleep_hours: r.sleepHours ?? r.sleep_hours,
      mood: r.mood,
      focus: r.focus,
      hydration: r.hydration,
      movement_minutes: r.movementMinutes ?? r.movement_minutes,
    })) as DailyLog[];
    setLogs(rows);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <BranchLibraryLayout branch="bh">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Daily brain check</h1>
          <p className="text-muted-foreground text-sm">30 seconds. Log today so tomorrow you can see the trend.</p>
        </div>

        {loading ? (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        ) : (
          <>
            <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5">
              <Field label="Sleep last night (hours)">
                <input type="number" step="0.25" min={0} max={16} value={sleep}
                  onChange={e => setSleep(e.target.value)}
                  className="w-24 rounded-md border border-border bg-background px-3 py-2 text-sm" />
              </Field>
              <ScaleRow label="Mood (1–5)" value={mood} onChange={setMood} />
              <ScaleRow label="Focus (1–5)" value={focus} onChange={setFocus} />
              <YesNoRow label="Hydration goal met?" value={hydration} onChange={setHydration} />
              <Field label="Movement (minutes)">
                <input type="number" min={0} max={480} value={movement}
                  onChange={e => setMovement(e.target.value)}
                  className="w-24 rounded-md border border-border bg-background px-3 py-2 text-sm" />
              </Field>
              <div className="pt-2">
                <button type="button" disabled={saving} onClick={save}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                  {saved ? (<><CheckCircle2 className="h-4 w-4" /> Saved</>) : (saving ? 'Saving…' : 'Save today')}
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <h2 className="text-[15px] font-bold mb-3">Last 30 days</h2>
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No entries yet — save today and this fills in.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-[12.5px]">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="py-1 pr-3">Date</th>
                        <th className="py-1 pr-3">Sleep</th>
                        <th className="py-1 pr-3">Mood</th>
                        <th className="py-1 pr-3">Focus</th>
                        <th className="py-1 pr-3">Hydration</th>
                        <th className="py-1 pr-3">Move</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(l => (
                        <tr key={l.id} className="border-t border-border">
                          <td className="py-1.5 pr-3 font-medium">{l.log_date}</td>
                          <td className="py-1.5 pr-3">{l.sleep_hours ?? '—'}</td>
                          <td className="py-1.5 pr-3">{l.mood ?? '—'}</td>
                          <td className="py-1.5 pr-3">{l.focus ?? '—'}</td>
                          <td className="py-1.5 pr-3">{l.hydration == null ? '—' : (l.hydration ? '✓' : '✗')}</td>
                          <td className="py-1.5 pr-3">{l.movement_minutes ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </BranchLibraryLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-[13px] font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

function ScaleRow({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number) => void }) {
  return (
    <Field label={label}>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className={[
              'h-9 w-9 rounded-md border text-[13px] font-semibold transition-colors',
              value === n ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-foreground hover:bg-secondary',
            ].join(' ')}>{n}</button>
        ))}
      </div>
    </Field>
  );
}

function YesNoRow({ label, value, onChange }: { label: string; value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <Field label={label}>
      <div className="flex gap-1.5">
        {[
          { v: true, label: 'Yes' },
          { v: false, label: 'No' },
        ].map(o => (
          <button key={String(o.v)} type="button" onClick={() => onChange(o.v)}
            className={[
              'h-9 px-4 rounded-md border text-[13px] font-semibold transition-colors',
              value === o.v ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-foreground hover:bg-secondary',
            ].join(' ')}>{o.label}</button>
        ))}
      </div>
    </Field>
  );
}
