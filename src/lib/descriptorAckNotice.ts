import { useEffect, useState } from 'react';
import { STORAGE_KEYS } from '@/constants/storage';

/** Mark that the descriptor acknowledgment dialog should show on the next report mount. */
export function markDescriptorAckPending(): void {
  try {
    sessionStorage.setItem(STORAGE_KEYS.DESCRIPTOR_ACK_NOTICE, '1');
  } catch {
    // Ignore storage failures (private mode / quota).
  }
}

/** Read and clear the one-shot pending marker. Returns true when pending. */
export function consumeDescriptorAckPending(): boolean {
  try {
    const value = sessionStorage.getItem(STORAGE_KEYS.DESCRIPTOR_ACK_NOTICE);
    if (!value) return false;
    sessionStorage.removeItem(STORAGE_KEYS.DESCRIPTOR_ACK_NOTICE);
    return true;
  } catch {
    return false;
  }
}

/**
 * Consume pending marker on mount and expose open/dismiss state for the notice dialog.
 * Pass `enabled: false` on preview mounts so the one-shot flag is not cleared.
 */
export function useDescriptorAckNotice(enabled = true) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    setOpen(consumeDescriptorAckPending());
  }, [enabled]);

  return {
    open,
    dismiss: () => setOpen(false),
  } as const;
}
