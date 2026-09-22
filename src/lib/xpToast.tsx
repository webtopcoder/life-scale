import { toast } from "sonner";
import { Zap } from "lucide-react";

export interface XpToastOptions {
  amount: number;
  label?: string;
  duration?: number;
}

export function showXpToast({ amount, label, duration = 2600 }: XpToastOptions) {
  if (amount <= 0) return;

  toast.success(
    <div className="flex items-center gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15">
        <Zap className="h-4 w-4 text-primary" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold leading-tight">+{amount} BrainPoints</span>
        {label ? <span className="text-xs text-muted-foreground leading-tight">{label}</span> : null}
      </div>
    </div>,
    { duration }
  );
}
