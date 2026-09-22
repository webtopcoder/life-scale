import logoUrl from '@/assets/life-scale-logo.webp';

type Props = {
  className?: string;
  variant?: 'lockup' | 'mark';
  size?: number;
};

export const LifeScaleMark = ({ size = 28 }: { size?: number }) => (
  <img
    src={logoUrl}
    width={size}
    height={size}
    alt=""
    aria-hidden="true"
    className="block object-contain"
    style={{ width: size, height: size }}
  />
);

export const LifeScaleWordmark = ({ className = '', variant = 'lockup', size = 28 }: Props) => {
  if (variant === 'mark') {
    return (
      <span className={`inline-flex ${className}`}>
        <LifeScaleMark size={size} />
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LifeScaleMark size={size} />
      <span className="text-[17px] font-semibold tracking-[-0.02em] text-[hsl(var(--iq-ink))] leading-none">
        Life Scale
      </span>
    </span>
  );
};

