import type { CSSProperties, MouseEvent, PointerEvent } from 'react';

type ActivationHandler = () => void;

let suppressNextPointerClick = false;

export function pointerSafeActivation(onActivate: ActivationHandler) {
  return {
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;

      suppressNextPointerClick = true;
      event.preventDefault();
      event.currentTarget.blur();
      onActivate();
    },
    onClick: (event: MouseEvent<HTMLElement>) => {
      if (suppressNextPointerClick && event.detail !== 0) {
        suppressNextPointerClick = false;
        event.preventDefault();
        return;
      }

      onActivate();
    },
  };
}

export function touchFeedbackStyle(backgroundColor: string) {
  return { '--touch-bg': backgroundColor } as CSSProperties;
}
