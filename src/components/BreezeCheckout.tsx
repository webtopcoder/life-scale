/**
 * @deprecated Breeze Cash checkout is retired in favor of Life-Scale widgets.
 * Remaining call sites (dashboard one-time add-ons) show this placeholder until
 * Life-Scale offer IDs exist for those products.
 */
export type BreezeCheckoutSuccessPayload = {
  pageId?: string;
  subscriptionId?: string;
  orderId?: string;
};

type BreezeCheckoutProps = {
  onSuccess?: (result: BreezeCheckoutSuccessPayload) => void;
  onError?: (message: string) => void;
  onPaymentStarted?: (eventName: string) => void;
  [key: string]: unknown;
};

export function BreezeCheckout(_props: BreezeCheckoutProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
      Card checkout has moved to Life Scale billing. One-time add-ons are temporarily
      unavailable here — please{' '}
      <a href="/help" className="underline text-foreground">
        contact support
      </a>{' '}
      if you need help.
    </div>
  );
}
