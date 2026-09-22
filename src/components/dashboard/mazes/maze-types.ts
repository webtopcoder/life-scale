export type CellType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
// 0=wall, 1=path, 2=start, 3=exit, 4=key, 5=door, 6=teleporter, 7=star, 8=moving wall

export type MazeTheme = "classic" | "key_lock" | "portal" | "star_hunt" | "gauntlet";

export interface SpecialElement {
  type: "teleporter" | "key" | "door" | "moving_wall" | "star";
  positions: [number, number][];
  linkedTo?: [number, number][];
}

export interface MazeData {
  id: string;
  title: string;
  theme: MazeTheme;
  difficulty: 1 | 2 | 3 | 4 | 5;
  gridData: CellType[][];
  specialElements: SpecialElement[];
  xpReward: number;
  estimatedTime: string;
  locked: boolean;
  description: string;
}

export const themeConfig: Record<MazeTheme, { label: string; color: string; bgClass: string; icon: string }> = {
  classic:   { label: "Classic",     color: "text-blue-500",    bgClass: "bg-blue-500/10",    icon: "🧩" },
  key_lock:  { label: "Key & Lock",  color: "text-amber-500",   bgClass: "bg-amber-500/10",   icon: "🔑" },
  portal:    { label: "Portal",      color: "text-blue-500",    bgClass: "bg-blue-500/10",    icon: "🌀" },
  star_hunt: { label: "Star Hunt",   color: "text-emerald-500", bgClass: "bg-emerald-500/10", icon: "⭐" },
  gauntlet:  { label: "Gauntlet",    color: "text-rose-500",    bgClass: "bg-rose-500/10",    icon: "⚔️" },
};
