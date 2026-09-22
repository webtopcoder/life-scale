import iqOrb from '@/assets/orbs/orb-iq.webp';
import bhOrb from '@/assets/orbs/orb-bh.webp';
import hgOrb from '@/assets/orbs/orb-hg.webp';
import bodyOrb from '@/assets/orbs/orb-body.webp';
import sleepOrb from '@/assets/orbs/orb-sleep.webp';
import athleteOrb from '@/assets/orbs/orb-athlete.webp';

import type { ScaleKey } from '@/config/scales';

export type BranchKey = ScaleKey;

const ORBS: Record<BranchKey, { url: string; alt: string }> = {
  'iq': { url: iqOrb, alt: '' },
  'brain-health': { url: bhOrb, alt: '' },
  'hidden-genius': { url: hgOrb, alt: '' },
  'body': { url: bodyOrb, alt: '' },
  'sleep-health': { url: sleepOrb, alt: '' },
  'hidden-athlete': { url: athleteOrb, alt: '' },
};

interface BranchOrbProps {
  branch: BranchKey;
  size?: number;
  className?: string;
}

/**
 * Rendered 3D gradient orb — the single visual identity element for each branch.
 * Replaces the legacy lucide branch icons across the platform.
 */
export function BranchOrb({ branch, size = 64, className = '' }: BranchOrbProps) {
  const { url, alt } = ORBS[branch];
  return (
    <img
      src={url}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={`inline-block select-none ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export default BranchOrb;
