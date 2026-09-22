import { Card, CardContent } from "@/components/ui/card";
import { Lock, Trophy, Star, Zap, Brain, BookOpen, Target, Flame, Crown, Lightbulb, MessageCircle, Cpu, Circle, Footprints, GraduationCap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { Achievement } from "@/services/dashboardService";

const iconMap: Record<string, any> = {
  trophy: Trophy, star: Star, zap: Zap, brain: Brain, "book-open": BookOpen, target: Target,
  flame: Flame, crown: Crown, lightbulb: Lightbulb, "message-circle": MessageCircle,
  cpu: Cpu, circle: Circle, footprints: Footprints, "graduation-cap": GraduationCap, puzzle: Target,
};

interface Props {
  achievement: Achievement;
  earned: boolean;
  earnedAt?: string;
  currentProgress?: number;
  requiredCount?: number;
}

export default function AchievementCard({ achievement, earned, earnedAt, currentProgress, requiredCount }: Props) {
  const Icon = iconMap[achievement.icon] || Trophy;
  const showProgress = !earned && currentProgress !== undefined && requiredCount !== undefined && requiredCount > 0;
  const progressPct = showProgress ? Math.min(100, Math.round((currentProgress! / requiredCount!) * 100)) : 0;

  return (
    <Card className={`transition-all ${earned ? "border-accent/40 bg-accent/5 shadow-sm" : "opacity-70"}`}>
      <CardContent className="p-4 text-center">
        <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 ${earned ? "bg-accent/20" : "bg-muted"}`}>
          {earned ? <Icon className="w-6 h-6 text-accent" /> : <Lock className="w-5 h-5 text-muted-foreground" />}
        </div>
        <h3 className="font-semibold text-sm">{achievement.name}</h3>
        <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>

        {showProgress && (
          <div className="mt-3 space-y-1">
            <Progress value={progressPct} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground">{currentProgress}/{requiredCount}</p>
          </div>
        )}

        <p className="text-xs font-medium text-warning mt-2">+{achievement.xp_reward} BrainPoints</p>

        {earned && earnedAt && (
          <p className="text-[10px] text-accent mt-1">
            Earned {new Date(earnedAt).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
