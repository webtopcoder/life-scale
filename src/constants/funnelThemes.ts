import { FLOW_IDS } from '@/engine/datasetLoader';

export interface FunnelTheme {
  optionDefault: string;
  optionSelected: string;
  optionTouchDefault: string;
  optionTouchSelected: string;
}

const DEFAULT_THEME: FunnelTheme = {
  optionDefault: 'bg-primary/[0.06] hover:bg-primary/10',
  optionSelected: 'bg-primary/15 ring-1 ring-primary/60',
  optionTouchDefault: 'hsl(var(--primary) / 0.06)',
  optionTouchSelected: 'hsl(var(--primary) / 0.15)',
};

const ALT_THEME: FunnelTheme = {
  optionDefault: 'bg-[#F3F5FB] hover:bg-[#E8ECF5]',
  optionSelected: 'bg-[#E8ECF5] ring-1 ring-primary/60',
  optionTouchDefault: '#F3F5FB',
  optionTouchSelected: '#E8ECF5',
};

export function getFunnelTheme(flowId: string): FunnelTheme {
  if (flowId === FLOW_IDS.ALT_V1) return ALT_THEME;
  return DEFAULT_THEME;
}
