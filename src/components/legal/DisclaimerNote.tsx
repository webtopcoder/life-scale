import { cn } from '@/lib/utils';
import { disclaimer, type DisclaimerKind } from '@/content/legalCopy';
import type { CategoryKey } from '@/config/scales';

interface DisclaimerNoteProps {
  kind: DisclaimerKind;
  category?: CategoryKey;
  /** Long variants render inside a soft bordered card by default. */
  variant?: 'plain' | 'card';
  className?: string;
}

/**
 * Consistent presentation for every disclaimer surface. Copy always comes from
 * `src/content/legalCopy.ts` — never pass literal text in.
 */
const DisclaimerNote = ({ kind, category, variant, className }: DisclaimerNoteProps) => {
  const isLong = kind === 'reportLong' || kind === 'productLong';
  const style = variant ?? (isLong ? 'card' : 'plain');

  if (style === 'card') {
    return (
      <div
        className={cn(
          'rounded-lg border border-border bg-muted/40 p-4 text-[13px] leading-relaxed text-muted-foreground',
          className,
        )}
      >
        {disclaimer(kind, category)}
      </div>
    );
  }

  return (
    <p className={cn('text-[12px] leading-snug text-muted-foreground', className)}>
      {disclaimer(kind, category)}
    </p>
  );
};

export default DisclaimerNote;
