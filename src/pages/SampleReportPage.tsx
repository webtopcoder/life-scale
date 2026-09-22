import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Info, Eye, Lock, Clock } from 'lucide-react';
import BranchOrb from '@/components/marketing/BranchOrb';
import {
  CATEGORIES,
  scalesInCategory,
  type CategoryKey,
  type ScaleDef,
  type ScaleKey,
} from '@/config/scales';
import { getSample, type SampleSample } from '@/data/sampleReports';
import DisclaimerNote from '@/components/legal/DisclaimerNote';

/* ─── Shared pieces ─── */

function FlatCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="border border-border/70 shadow-none rounded-2xl bg-white">
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  );
}

function PreviewNote({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 mt-5 pt-4 border-t border-border/60">
      <Info className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
      <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
    </div>
  );
}

function ScoreRing({ value, max, caption, color }: { value: number; max: number; caption: string; color: string }) {
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div className="relative flex-shrink-0">
      <svg className="w-24 h-24" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--iq-border))" strokeWidth="6" />
        <circle
          cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={264} strokeDashoffset={264 - 264 * pct}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground leading-none tabular-nums">{value}</span>
        <span className="text-[9px] text-muted-foreground mt-1">{caption}</span>
      </div>
    </div>
  );
}

/* ─── One scale's sample ─── */

function ScaleSample({ scale, sample }: { scale: ScaleDef; sample: SampleSample }) {
  const color = `hsl(${scale.accent})`;
  const bg = `hsl(${scale.accent} / 0.09)`;

  return (
    <div className="space-y-6">
      {/* Header + headline result */}
      <FlatCard>
        <div className="mb-5 flex items-start gap-3">
          <BranchOrb branch={scale.key} size={44} className="shrink-0" />
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-1" style={{ color }}>
              Sample report
            </div>
            <h2 className="text-xl font-semibold text-foreground">{scale.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">{scale.tagline}</p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          {sample.score !== null ? (
            <ScoreRing
              value={sample.score}
              max={sample.scoreMax ?? 160}
              caption={sample.scoreCaption ?? ''}
              color={color}
            />
          ) : (
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: bg }}
            >
              <BranchOrb branch={scale.key} size={56} />
            </div>
          )}
          <div className="min-w-0">
            <div
              className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={{ background: bg, color }}
            >
              {sample.band}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mt-2">{sample.summary}</p>
            <p className="text-[11px] text-muted-foreground/80 mt-2">
              Example results for {sample.person}.
            </p>
          </div>
        </div>

        {sample.archetype && (
          <div className="rounded-xl p-4 mt-5" style={{ background: bg }}>
            <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>Archetype</div>
            <div className="text-lg font-semibold text-foreground leading-tight mt-0.5">{sample.archetype.name}</div>
            <p className="text-sm text-muted-foreground leading-relaxed mt-2">{sample.archetype.read}</p>
          </div>
        )}
      </FlatCard>

      {/* Area breakdown */}
      <FlatCard>
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-4" style={{ color }}>
          {sample.score !== null ? 'Your areas' : 'What stood out'}
        </div>
        <div className="space-y-2.5">
          {sample.bars.map((b) => (
            <div key={b.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-foreground">
                  {b.label}
                  {b.note && (
                    <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {b.note}
                    </span>
                  )}
                </span>
                <span className="text-muted-foreground tabular-nums">{b.value}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full" style={{ background: color, width: `${b.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </FlatCard>

      {/* Written read */}
      <FlatCard>
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-4" style={{ color }}>
          What it means
        </div>
        <div className="space-y-3.5">
          {sample.paragraphs.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed text-foreground/90">{p}</p>
          ))}
        </div>
        <PreviewNote text={sample.fullReportAdds} />
      </FlatCard>

      {/* Highlights + lever */}
      <FlatCard>
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-4" style={{ color }}>
          Highlights
        </div>
        <div className="space-y-2.5">
          {sample.highlights.map((h, i) => (
            <div key={h.label} className="flex gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-bold tabular-nums"
                style={{ background: bg, color }}
              >
                {String(i + 1).padStart(2, '0')}
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">{h.label}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{h.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-border/60">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Biggest lever
          </div>
          <div className="text-sm font-semibold text-foreground">{sample.lever.label}</div>
          <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">{sample.lever.desc}</p>
        </div>
      </FlatCard>

      {/* Members-only teaser */}
      <FlatCard>
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-4" style={{ color }}>
          Members only
        </div>
        <div className="grid grid-cols-2 gap-3">
          {['Improvement dashboard', 'AI coach, 24/7'].map((label) => (
            <div key={label} className="relative rounded-xl border border-border/70 h-28 overflow-hidden bg-muted/30">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground text-center px-2">{label}</span>
              </div>
            </div>
          ))}
        </div>
      </FlatCard>
    </div>
  );
}

/* ─── Coming soon placeholders ─── */

function ComingSoonPanel({ name, tagline }: { name: string; tagline: string }) {
  return (
    <FlatCard>
      <div className="flex flex-col items-center text-center py-6">
        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
          <Clock className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Coming soon
        </div>
        <h2 className="mt-1 text-xl font-semibold text-foreground">{name} IQ</h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{tagline}</p>
        <p className="mt-3 max-w-sm text-xs leading-relaxed text-muted-foreground/80">
          Like every category, {name} will have three scales: a scored core test, a health check, and a
          hidden-strengths profile. Complete members get it the day it launches.
        </p>
      </div>
    </FlatCard>
  );
}

/* ─── CTA ─── */

function InlineCTA() {
  const navigate = useNavigate();
  return (
    <div
      className="rounded-2xl p-6 text-center"
      style={{ background: 'linear-gradient(180deg, hsl(var(--iq-mint-wash)), hsl(var(--iq-paper)))' }}
    >
      <h2 className="text-xl font-semibold text-foreground">See your own report</h2>
      <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">
        Pick any scale and answer a short set of questions. Takes 5-10 minutes.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <Button
          onClick={() => navigate('/choose-test')}
          className="h-12 px-6 rounded-xl text-sm font-semibold"
          style={{ background: 'hsl(var(--iq-cobalt))', color: 'white' }}
        >
          Start my test
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/', { state: { scrollTo: 'pricing' } })}
          className="h-12 px-6 rounded-xl text-sm font-semibold"
        >
          See plans
        </Button>
      </div>
    </div>
  );
}

/* ─── Page ─── */

const SampleReportPage = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState<CategoryKey>('mind');
  const [scaleKey, setScaleKey] = useState<ScaleKey | null>('iq');

  useEffect(() => {
    document.title = 'Sample reports - Life Scale';
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const activeCategory = useMemo(
    () => CATEGORIES.find((c) => c.key === category) ?? CATEGORIES[0],
    [category],
  );
  const categoryScales = useMemo(() => scalesInCategory(category), [category]);
  const activeScale = useMemo(
    () => categoryScales.find((s) => s.key === scaleKey) ?? categoryScales[0] ?? null,
    [categoryScales, scaleKey],
  );
  const sample = activeScale ? getSample(activeScale.key) : null;

  function pickCategory(next: CategoryKey) {
    setCategory(next);
    const first = scalesInCategory(next)[0];
    setScaleKey(first ? first.key : null);
  }

  return (
    <div className="lifescale-root min-h-screen" style={{ background: 'hsl(var(--iq-paper))' }}>
      {/* Sticky banner */}
      <div className="sticky top-0 z-50 border-b border-border/60" style={{ background: 'hsl(var(--iq-surface))' }}>
        <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:opacity-70 transition-opacity"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>Home</span>
          </button>
          <Button
            size="sm"
            onClick={() => navigate('/choose-test')}
            className="h-8 px-3 rounded-lg text-xs font-semibold"
            style={{ background: 'hsl(var(--iq-cobalt))', color: 'white' }}
          >
            Get mine
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 pb-16 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Sample reports</h1>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            Pick a category and a scale to see what a finished report looks like.
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Categories">
          {CATEGORIES.map((c) => {
            const live = c.status === 'live';
            const selected = c.key === category;
            return (
              <button
                key={c.key}
                role="tab"
                aria-selected={selected}
                onClick={() => pickCategory(c.key)}
                className={
                  'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ' +
                  (selected
                    ? 'border-transparent bg-[hsl(var(--iq-cobalt))] text-white'
                    : 'border-border/70 bg-white text-foreground hover:border-[hsl(var(--iq-cobalt))]')
                }
              >
                {c.name}
                {!live && (
                  <span className={'ml-1.5 text-[10px] font-medium ' + (selected ? 'text-white/80' : 'text-muted-foreground')}>
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Scale selector, live categories only */}
        {activeCategory.status === 'live' && categoryScales.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-3">
            {categoryScales.map((s) => {
              const selected = activeScale?.key === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setScaleKey(s.key)}
                  className={
                    'flex items-center gap-2.5 rounded-xl border bg-white px-3 py-2.5 text-left transition-colors ' +
                    (selected ? 'border-[hsl(var(--iq-cobalt))] shadow-sm' : 'border-border/70 hover:border-[hsl(var(--iq-cobalt))]')
                  }
                  style={selected ? { borderColor: `hsl(${s.accent})` } : undefined}
                >
                  <BranchOrb branch={s.key} size={28} className="shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-foreground truncate">{s.shortName}</span>
                    <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">{s.role}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-start gap-2.5 rounded-xl p-3.5" style={{ background: 'hsl(var(--iq-mint-wash))', border: '1px solid hsl(var(--iq-border))' }}>
          <Eye className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'hsl(var(--iq-cobalt))' }} />
          <p className="text-xs text-muted-foreground leading-relaxed">
            This is a shortened preview. Your own report goes deeper in every section, is built from your answers,
            and updates as you work through your plan.
          </p>
        </div>

        {activeCategory.status !== 'live' || !activeScale || !sample ? (
          <ComingSoonPanel name={activeCategory.name} tagline={activeCategory.tagline} />
        ) : (
          <ScaleSample scale={activeScale} sample={sample} />
        )}

        <InlineCTA />

        <DisclaimerNote kind="productLong" />
      </div>
    </div>
  );
};

export default SampleReportPage;
