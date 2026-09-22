export const HeroIllustration = () => (
  <svg viewBox="0 0 520 460" className="h-auto w-full max-w-[520px]" role="img" aria-label="Session profile with score">
    <defs>
      {/* Soft card surface with a top-left highlight — orb material */}
      <radialGradient id="hi-card" cx="28%" cy="18%" r="120%">
        <stop offset="0%" stopColor="hsl(0 0% 100%)" />
        <stop offset="55%" stopColor="hsl(var(--iq-surface))" />
        <stop offset="100%" stopColor="hsl(var(--iq-mint-wash))" />
      </radialGradient>

      {/* Progress arc gradient (cobalt → emerald) */}
      <linearGradient id="hi-bar" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="hsl(var(--iq-cobalt))" />
        <stop offset="100%" stopColor="hsl(var(--iq-emerald))" />
      </linearGradient>

      {/* Score chip material — lit dark orb */}
      <radialGradient id="hi-chip" cx="30%" cy="25%" r="120%">
        <stop offset="0%" stopColor="hsl(220 30% 32%)" />
        <stop offset="60%" stopColor="hsl(var(--iq-ink))" />
        <stop offset="100%" stopColor="hsl(220 40% 8%)" />
      </radialGradient>

      {/* Pearl for knob / accent dot */}
      <radialGradient id="hi-pearl" cx="30%" cy="30%" r="80%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="55%" stopColor="hsl(155 62% 55%)" />
        <stop offset="100%" stopColor="hsl(155 62% 30%)" />
      </radialGradient>

      {/* Ambient wash behind the card */}
      <radialGradient id="hi-aura" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="hsl(var(--iq-cobalt) / 0.18)" />
        <stop offset="100%" stopColor="hsl(var(--iq-cobalt) / 0)" />
      </radialGradient>

      {/* Bar fill gradient with subtle highlight */}
      <linearGradient id="hi-bar-fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(var(--iq-cobalt))" stopOpacity="1" />
        <stop offset="50%" stopColor="hsl(var(--iq-cobalt))" stopOpacity="0.85" />
        <stop offset="100%" stopColor="hsl(var(--iq-cobalt-deep))" stopOpacity="0.9" />
      </linearGradient>

      {/* Soft outer glow filter for the progress arc */}
      <filter id="hi-glow" x="-20%" y="-40%" width="140%" height="180%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Card drop shadow */}
      <filter id="hi-card-shadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="hsl(220 40% 20%)" floodOpacity="0.10" />
      </filter>
    </defs>

    {/* Ambient off-center glow behind everything */}
    <circle cx="360" cy="120" r="220" fill="url(#hi-aura)" />

    {/* Main profile card — lit surface */}
    <g filter="url(#hi-card-shadow)">
      <rect x="40" y="40" width="440" height="340" rx="20" fill="url(#hi-card)" stroke="hsl(var(--iq-border))" strokeWidth="1" />
      {/* Rim highlight along the top edge */}
      <path d="M 56 41 Q 260 36 464 41" stroke="hsl(0 0% 100%)" strokeOpacity="0.9" strokeWidth="1" fill="none" />
    </g>

    {/* Card header */}
    <text x="68" y="82" fontSize="11" fontWeight="700" letterSpacing="1.6" fill="hsl(var(--iq-emerald))">SESSION PROFILE</text>
    <text x="68" y="114" fontSize="26" fontWeight="700" fill="hsl(var(--iq-ink))" letterSpacing="-0.5">Pattern overview</text>

    {/* Segmented scale with luminous arc */}
    <g transform="translate(68, 152)">
      {/* Track */}
      <rect x="0" y="0" width="384" height="10" rx="5" fill="hsl(var(--iq-mint-wash))" stroke="hsl(var(--iq-border))" />
      {/* Glowing progress */}
      <g filter="url(#hi-glow)">
        <rect x="0" y="0" width="248" height="10" rx="5" fill="url(#hi-bar)" />
      </g>
      {/* Highlight sheen along the top of the fill */}
      <rect x="4" y="1.5" width="240" height="2" rx="1" fill="hsl(0 0% 100%)" opacity="0.55" />
      {/* Pearl knob */}
      <circle cx="248" cy="5" r="10" fill="url(#hi-pearl)" />
      <circle cx="248" cy="5" r="10" fill="none" stroke="hsl(0 0% 100%)" strokeOpacity="0.6" strokeWidth="0.5" />

      <text x="0" y="34" fontSize="10" fill="hsl(var(--iq-muted))">Baseline</text>
      <text x="192" y="34" textAnchor="middle" fontSize="10" fill="hsl(var(--iq-muted))">Developing</text>
      <text x="384" y="34" textAnchor="end" fontSize="10" fill="hsl(var(--iq-muted))">Advanced</text>
    </g>

    {/* Dimension bars — lit material */}
    <g transform="translate(68, 214)">
      {[
        { label: 'Pattern recognition', w: 300 },
        { label: 'Working memory', w: 220 },
        { label: 'Verbal reasoning', w: 260 },
        { label: 'Spatial insight', w: 180 },
      ].map((d, i) => {
        const fillW = (d.w / 384) * 220;
        return (
          <g key={d.label} transform={`translate(0, ${i * 32})`}>
            <text x="0" y="10" fontSize="11" fill="hsl(var(--iq-ink-soft))">{d.label}</text>
            <rect x="150" y="2" width="220" height="10" rx="5" fill="hsl(var(--iq-mint-wash))" stroke="hsl(var(--iq-border))" />
            <rect x="150" y="2" width={fillW} height="10" rx="5" fill="url(#hi-bar-fill)" opacity={0.95 - i * 0.08} />
            {/* Sheen */}
            <rect x="153" y="3.5" width={Math.max(0, fillW - 6)} height="2" rx="1" fill="hsl(0 0% 100%)" opacity={0.45 - i * 0.06} />
          </g>
        );
      })}
    </g>

    {/* Floating score chip — lit dark orb */}
    <g transform="translate(360, 30)" filter="url(#hi-card-shadow)">
      <rect x="0" y="0" width="130" height="70" rx="14" fill="url(#hi-chip)" />
      {/* Top rim light */}
      <path d="M 12 1 Q 65 -2 118 1" stroke="hsl(0 0% 100%)" strokeOpacity="0.35" strokeWidth="1" fill="none" />
      <text x="16" y="26" fontSize="10" fontWeight="600" letterSpacing="1.4" fill="hsl(var(--iq-mint))">SESSION INDEX</text>
      <text x="16" y="56" fontSize="28" fontWeight="700" fill="#fff">124</text>
      {/* Emerald pearl accent */}
      <circle cx="112" cy="46" r="14" fill="url(#hi-pearl)" />
    </g>

    {/* Floating accent - dot network with pearl material */}
    <g transform="translate(30, 350)">
      <line x1="0" y1="0" x2="40" y2="20" stroke="hsl(var(--iq-border))" strokeWidth="1" />
      <line x1="40" y1="20" x2="80" y2="6" stroke="hsl(var(--iq-border))" strokeWidth="1" />
      <circle cx="0" cy="0" r="6" fill="url(#hi-pearl)" />
      <circle cx="40" cy="20" r="4" fill="url(#hi-pearl)" />
      <circle cx="80" cy="6" r="5" fill="url(#hi-pearl)" opacity="0.7" />
    </g>
  </svg>
);

export default HeroIllustration;
