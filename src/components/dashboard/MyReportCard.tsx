import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText } from 'lucide-react';
import type { Branch } from '@/lib/testCompletions';
import { SCALES } from '@/config/scales';

const BLURB_OVERRIDE: Partial<Record<Branch, string>> = {
  'iq': 'Your full cognitive breakdown — score, strengths, and how to sharpen further.',
  'hidden-genius': 'The way your mind actually works — your cognitive signature and where it shines.',
  'brain-health': 'Your check-in results across seven areas, with plain-language next steps.',
  'body': 'Your Body IQ score, the seven areas behind it, and what moves it fastest.',
  'sleep-health': 'How your nights are actually going, area by area, with a first week to run.',
  'hidden-athlete': 'How your body is wired to train, and the way of working it rewards.',
};

const BRANCH_META: Record<Branch, { title: string; blurb: string; path: string }> =
  Object.fromEntries(
    SCALES.map((s) => [
      s.key,
      {
        title: `My ${s.shortName} Report`,
        blurb: BLURB_OVERRIDE[s.key] ?? s.blurb,
        path: s.reportPath,
      },
    ]),
  ) as Record<Branch, { title: string; blurb: string; path: string }>;

export default function MyReportCard({ branch }: { branch: Branch }) {
  const navigate = useNavigate();
  const meta = BRANCH_META[branch];
  return (
    <button
      type="button"
      onClick={() => navigate(meta.path)}
      className="group relative w-full text-left rounded-2xl border border-border bg-card p-5 sm:p-6 hover:border-primary/40 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FileText className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            Your report
          </div>
          <h3 className="mt-0.5 text-[16px] sm:text-[18px] font-bold text-foreground leading-tight">
            {meta.title}
          </h3>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            {meta.blurb}
          </p>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  );
}
