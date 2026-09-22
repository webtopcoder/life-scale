import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getProfile, getUserProgress, getUserAchievements, getAchievements, addXP, upsertProgress, grantAchievement, Profile, UserContentProgress, Achievement, UserAchievement, StreakCheckInResult } from "@/services/dashboardService";
import type { CelebrationEvent } from "@/components/dashboard/CelebrationOverlay";
import { getMilestoneTitle } from "@/lib/xp";
import { showXpToast } from "@/lib/xpToast";
import { runDailyCheckIn } from "@/lib/dailyCheckIn";

export function useBrainScore() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<UserContentProgress[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [celebration, setCelebration] = useState<CelebrationEvent | null>(null);
  const [streakResult, setStreakResult] = useState<StreakCheckInResult | null>(null);

  const dismissCelebration = useCallback(() => setCelebration(null), []);

  const refresh = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const [p, prog, ach, uAch] = await Promise.all([
      getProfile(user.id),
      getUserProgress(user.id),
      getAchievements(),
      getUserAchievements(user.id),
    ]);
    setProfile(p);
    setProgress(prog);
    setAchievements(ach);
    setUserAchievements(uAch);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Daily streak check-in: deduped to once per user per day across all mounts.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    runDailyCheckIn(user.id).then(({ result, awarded }) => {
      if (cancelled || !result) return;
      setStreakResult(result);
      if (!awarded) return;
      refresh();
      if (result.milestone) {
        setCelebration({
          type: "achievement",
          title: "Streak Milestone!",
          message: result.milestone,
          xp: result.xp_bonus,
        });
      } else {
        showXpToast({ amount: result.xp_bonus, label: "Daily check-in" });
      }
    });
    return () => { cancelled = true; };
  }, [user, refresh]);

  const completeActivity = useCallback(async (contentType: string, contentId: string, xpReward: number, score?: number, mode?: string) => {
    if (!user || !profile) return;
    const oldLevel = profile.level;
    const timedBonus = mode === "timed" ? Math.floor(xpReward * 0.5) : 0;
    const totalXP = xpReward + timedBonus;

    // The server tells us whether this is the first completion — replays earn nothing.
    const { firstCompletion } = await upsertProgress({
      user_id: user.id,
      content_type: contentType as "brain_teaser" | "lesson" | "puzzle",
      content_id: contentId,
      status: "completed",
      score: score ?? null,
      mode: mode ?? null,
      completed_at: new Date().toISOString(),
    });

    const earned = firstCompletion ? totalXP : 0;

    setCelebration({
      type: "activity_complete",
      title: "Activity Complete!",
      message: earned > 0 ? `You earned ${earned} BrainPoints` : "Already completed — no extra BrainPoints",
      xp: earned,
    });
    if (earned > 0) showXpToast({ amount: earned, label: "Activity complete" });

    // Run XP + achievement checks in background
    try {
      if (earned > 0) await addXP(user.id, earned);

      // Check achievements against fresh server state
      const [updatedProgress, earnedAlready] = await Promise.all([
        getUserProgress(user.id),
        getUserAchievements(user.id),
      ]);
      const completedCount = updatedProgress.filter(p => p.status === "completed").length;
      const timedCount = updatedProgress.filter(p => p.status === "completed" && p.mode === "timed").length;

      const newlyEarned: Achievement[] = [];
      for (const ach of achievements) {
        if (earnedAlready.some(ua => ua.achievement_id === ach.id)) continue;
        const cond = ach.condition_json;
        let earnedAch = false;
        if (cond.type === "complete_count" && !cond.content_type && completedCount >= cond.count) earnedAch = true;
        if (cond.type === "complete_count" && cond.content_type) {
          const typeCount = updatedProgress.filter(p => p.status === "completed" && p.content_type === cond.content_type).length;
          if (typeCount >= cond.count) earnedAch = true;
        }
        if (cond.type === "timed_count" && timedCount >= cond.count) earnedAch = true;
        if (cond.type === "perfect_quiz" && score === 100) earnedAch = true;
        if (earnedAch) {
          // Points for achievements are awarded server-side, exactly once.
          const { granted, xpAwarded } = await grantAchievement(user.id, ach.id);
          if (!granted) continue;
          if (xpAwarded > 0) showXpToast({ amount: xpAwarded, label: `Achievement: ${ach.name}` });
          newlyEarned.push(ach);
        }
      }

      await refresh();

      // Upgrade celebration if level-up or achievement detected
      const updatedProfile = await getProfile(user.id);
      const newLevel = updatedProfile?.level ?? oldLevel;

      if (newLevel > oldLevel) {
        setCelebration({
          type: "level_up",
          title: `Level ${newLevel}!`,
          message: `You've reached ${getMilestoneTitle(newLevel)} rank!`,
          xp: earned,
        });
      } else if (newlyEarned.length > 0) {
        setCelebration({
          type: "achievement",
          title: "Achievement Unlocked!",
          message: newlyEarned[0].name,
          xp: newlyEarned[0].xp_reward,
        });
      }
    } catch (err) {
      console.error("Error in post-activity processing:", err);
    }
  }, [user, profile, achievements, refresh]);

  return { profile, progress, achievements, userAchievements, loading, refresh, completeActivity, celebration, dismissCelebration, streakResult };
}

