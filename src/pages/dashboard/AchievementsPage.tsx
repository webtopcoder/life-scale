import { useState, useEffect } from "react";
import { useBrainScore } from "@/hooks/useBrainScore";
import AchievementCard from "@/components/dashboard/AchievementCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { getAllMilestoneTitles, getMilestoneTitle } from "@/lib/xp";
import { Crown } from "lucide-react";
import { getAchievements, type Achievement, type BranchTag } from "@/services/dashboardService";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "brain_teaser", label: "Brain Teasers" },
  { key: "puzzle", label: "Mazes" },
  { key: "lesson", label: "Lessons" },
  { key: "general", label: "General" },
];

const BRANCH_COPY: Record<BranchTag, { title: string; subtitle: string }> = {
  iq: {
    title: 'IQ Achievements',
    subtitle: 'Progress markers for reasoning practice, mazes, lessons, and streaks.',
  },
  brain_health: {
    title: 'Brain Health Achievements',
    subtitle: 'Progress markers for daily checks, habits, drills, lessons, and consistency.',
  },
  hidden_genius: {
    title: 'Genius Achievements',
    subtitle: 'Progress markers for divergent drills, pattern work, lessons, and signature practice.',
  },
};

function getAchievementCategory(a: { condition_json: any }): string {
  const cond = a.condition_json;
  if (cond.content_type === "brain_teaser") return "brain_teaser";
  if (cond.content_type === "puzzle") return "puzzle";
  if (cond.content_type === "lesson") return "lesson";
  return "general";
}

function getCurrentProgress(cond: any, progress: any[]): { current: number; required: number } | null {
  if (cond.type === "complete_count" && cond.count) {
    const completed = cond.content_type
      ? progress.filter(p => p.status === "completed" && p.content_type === cond.content_type).length
      : progress.filter(p => p.status === "completed").length;
    return { current: completed, required: cond.count };
  }
  if (cond.type === "timed_count" && cond.count) {
    const timed = progress.filter(p => p.status === "completed" && p.mode === "timed").length;
    return { current: timed, required: cond.count };
  }
  return null;
}

export default function AchievementsPage({ branch = "iq" }: { branch?: BranchTag } = {}) {
  const { userAchievements, progress, profile, loading } = useBrainScore();
  const [category, setCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "earned" | "locked">("all");
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => { getAchievements(branch).then(setAchievements); }, [branch]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  const earnedMap = new Map(userAchievements.map(ua => [ua.achievement_id, ua]));

  const filtered = achievements.filter(a => {
    if (category !== "all" && getAchievementCategory(a) !== category) return false;
    if (statusFilter === "earned" && !earnedMap.has(a.id)) return false;
    if (statusFilter === "locked" && earnedMap.has(a.id)) return false;
    return true;
  });

  const milestoneTitles = getAllMilestoneTitles();
  const currentTitle = getMilestoneTitle(profile?.level ?? 1);
  const copy = BRANCH_COPY[branch];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">{copy.title}</h1>
      <p className="text-muted-foreground mb-4">
        {copy.subtitle} {earnedMap.size}/{achievements.length} unlocked.
      </p>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Tabs value={category} onValueChange={setCategory} className="w-full sm:w-auto">
          <TabsList className="flex-wrap h-auto">
            {CATEGORIES.map(c => (
              <TabsTrigger key={c.key} value={c.key} className="text-xs">{c.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex gap-1.5">
          {(["all", "earned", "locked"] as const).map(s => (
            <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" className="text-xs capitalize" onClick={() => setStatusFilter(s)}>
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
        {filtered.map(a => {
          const ua = earnedMap.get(a.id);
          const prog = getCurrentProgress(a.condition_json, progress);
          return (
            <AchievementCard
              key={a.id}
              achievement={a}
              earned={!!ua}
              earnedAt={ua?.earned_at}
              currentProgress={prog?.current}
              requiredCount={prog?.required}
            />
          );
        })}
        {filtered.length === 0 && (
          <p className="text-muted-foreground text-sm col-span-full text-center py-8">No achievements match this filter.</p>
        )}
      </div>

      {/* Milestone Titles */}
      <div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Crown className="w-5 h-5 text-warning" /> Milestone Titles</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {milestoneTitles.map(m => {
            const isActive = currentTitle === m.title;
            const isReached = (profile?.level ?? 1) >= m.minLevel;
            return (
              <div key={m.title} className={`rounded-xl p-4 text-center border transition-all ${isActive ? "border-accent bg-accent/10 shadow-sm" : isReached ? "border-border bg-muted/30" : "border-border/50 opacity-50"}`}>
                <p className={`font-bold text-sm ${isActive ? "text-accent" : ""}`}>{m.title}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Level {m.minLevel}+</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
