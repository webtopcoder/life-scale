type OpenListener = () => void;

let openListener: OpenListener | null = null;

export function setSupportChatOpenListener(listener: OpenListener | null): void {
  openListener = listener;
}

/** Imperatively open the floating policy support chat (e.g. from Help). */
export function openSupportChat(): void {
  openListener?.();
}
