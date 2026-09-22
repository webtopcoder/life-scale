import { Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  xpBonus?: number;
  compact?: boolean;
}

export default function StreakCard({ currentStreak, longestStreak, xpBonus, compact = false }: StreakCardProps) {
  const streakLevel =
    currentStreak >= 30 ? "legendary" :
    currentStreak >= 14 ? "blazing" :
    currentStreak >= 7 ? "hot" :
    currentStreak >= 3 ? "warm" : "cool";

  const flameColor = {
    legendary: "text-yellow-400",
    blazing: "text-orange-500",
    hot: "text-orange-400",
    warm: "text-amber-400",
    cool: "text-muted-foreground",
  }[streakLevel];

  if (compact) {
    return (
      <Card className="bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border-orange-500/20">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔥</span>
              <span className="text-sm font-medium text-muted-foreground">Streak</span>
            </div>
            <span className="text-xl font-bold">{currentStreak}</span>
          </div>
          {currentStreak > 0 && xpBonus !== undefined && xpBonus > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Zap className="w-3 h-3 text-accent" />
              +{xpBonus} BrainPoints daily bonus
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border-orange-500/20">
      <CardContent className="p-3 md:p-4">
        <div className="flex flex-col items-center justify-center text-center">
          <div>
            <p className="text-[11px] text-muted-foreground font-medium leading-none mb-0.5">Daily Streak</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold leading-none">{currentStreak} <span className="text-xs font-normal text-muted-foreground">{currentStreak === 1 ? "day" : "days"}</span></span>
              <span className="text-[11px] text-muted-foreground">· Best: {longestStreak}</span>
              {currentStreak > 0 && xpBonus !== undefined && xpBonus > 0 && (
                <span className="text-[11px] text-muted-foreground">· +{xpBonus}/day</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
