import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

const DESCRIPTOR = 'LIFE SCALE';

type DescriptorAckNoticeProps = {
  open: boolean;
  onDismiss: () => void;
};

export function DescriptorAckNotice({ open, onDismiss }: DescriptorAckNoticeProps) {
  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent
        className="w-[calc(100%-2rem)] max-w-sm gap-0 rounded-lg border-border bg-card p-0 shadow-2xl [&>button]:hidden"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <div className="px-6 pb-6 pt-7 text-center sm:px-7 sm:pb-7">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Info className="h-8 w-8 text-primary" strokeWidth={2.25} />
          </div>

          <DialogTitle className="mt-5 text-2xl font-bold leading-tight text-foreground">
            How charges appear
          </DialogTitle>
          <DialogDescription className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            This transaction and any others will appear on your statement as{' '}
            <strong className="font-bold text-foreground">{DESCRIPTOR}</strong>
          </DialogDescription>

          <Button
            size="lg"
            onClick={onDismiss}
            className="mt-6 h-12 w-full bg-[hsl(var(--cta-muted))] text-base font-bold text-[hsl(var(--cta-foreground))] hover:bg-[hsl(var(--cta))]"
          >
            I understand
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
