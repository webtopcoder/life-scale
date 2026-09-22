import { Zap, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Profile } from "@/services/dashboardService";
import { levelProgress, xpToNextLevel } from "@/lib/xp";

export default function BrainScoreCard({ profile }: { profile: Profile | null }) {
  if (!profile) return null;
  const progressPct = levelProgress(profile.xp);
  const toNext = xpToNextLevel(profile.xp);

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">BrainPoints</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3 text-primary" />
            Lv {profile.level}
          </span>
        </div>

        <div className="flex items-baseline gap-1.5">
          <Zap className="w-4 h-4 text-accent shrink-0" />
          <span className="text-2xl font-bold leading-none">{profile.xp}</span>
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
            <span>Level {profile.level}</span>
            <span>{toNext > 0 ? `${toNext} to next` : "Max"}</span>
          </div>
          <Progress value={progressPct} className="h-1.5" />
        </div>
      </CardContent>
    </Card>
  );
}
