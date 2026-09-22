import { api } from "@/integrations/api/client";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  brain_score: number;
  xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  last_login_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface BrainTeaser {
  id: string;
  title: string;
  description: string | null;
  format: string;
  category: string;
  difficulty: number;
  content_json: any;
  solution: string | null;
  xp_reward: number;
  created_at: string;
}

export interface Puzzle {
  id: string;
  title: string;
  format: string;
  category: string;
  difficulty: number;
  content_json: any;
  xp_reward: number;
  time_limit_seconds: number | null;
  created_at: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: number;
  modules_json: any[];
  quiz_json: any[];
  xp_reward: number;
  order_index: number;
  created_at: string;
}

export interface UserContentProgress {
  id: string;
  user_id: string;
  content_type: string;
  content_id: string;
  status: string;
  score: number | null;
  time_spent_ms: number;
  mode: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  xp_reward: number;
  condition_json: any;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
}

function mapProfile(p: Record<string, unknown>): Profile {
  return {
    id: String(p.id),
    user_id: String(p.userId ?? p.user_id),
    display_name: (p.displayName ?? p.display_name ?? null) as string | null,
    avatar_url: (p.avatarUrl ?? p.avatar_url ?? null) as string | null,
    brain_score: Number(p.brainScore ?? p.brain_score ?? 0),
    xp: Number(p.xp ?? 0),
    level: Number(p.level ?? 1),
    current_streak: Number(p.currentStreak ?? p.current_streak ?? 0),
    longest_streak: Number(p.longestStreak ?? p.longest_streak ?? 0),
    last_login_date: (p.lastLoginDate ?? p.last_login_date ?? null) as string | null,
    created_at: String(p.createdAt ?? p.created_at),
    updated_at: String(p.updatedAt ?? p.updated_at),
  };
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const data = await api.get<Record<string, unknown>>("/dashboard/profile");
  return data ? mapProfile(data) : null;
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const body: Record<string, unknown> = {};
  if (updates.display_name !== undefined) body.displayName = updates.display_name;
  if (updates.avatar_url !== undefined) body.avatarUrl = updates.avatar_url;
  return { data: await api.patch("/dashboard/profile", body), error: null };
}

export type BranchTag = "iq" | "hidden_genius" | "brain_health";

export async function getBrainTeasers(branch: BranchTag = "iq"): Promise<BrainTeaser[]> {
  const rows = await api.get<any[]>(`/dashboard/brain-teasers?branch=${branch}`);
  return rows.map((r) => ({
    ...r,
    content_json: r.contentJson ?? r.content_json,
    xp_reward: r.xpReward ?? r.xp_reward,
    created_at: r.createdAt ?? r.created_at,
  }));
}

export async function getPuzzles(branch: BranchTag = "iq"): Promise<Puzzle[]> {
  const rows = await api.get<any[]>("/dashboard/puzzles");
  return rows
    .filter((r) => Array.isArray(r.branches) && r.branches.includes(branch))
    .map((r) => ({
      ...r,
      content_json: r.contentJson ?? r.content_json,
      xp_reward: r.xpReward ?? r.xp_reward,
      time_limit_seconds: r.timeLimitSeconds ?? r.time_limit_seconds,
      created_at: r.createdAt ?? r.created_at,
    }));
}

export async function getLessons(branch: BranchTag = "iq"): Promise<Lesson[]> {
  const rows = await api.get<any[]>(`/dashboard/lessons?branch=${branch}`);
  return rows.map((r) => ({
    ...r,
    modules_json: r.modulesJson ?? r.modules_json,
    quiz_json: r.quizJson ?? r.quiz_json,
    xp_reward: r.xpReward ?? r.xp_reward,
    order_index: r.orderIndex ?? r.order_index,
    created_at: r.createdAt ?? r.created_at,
  }));
}

export async function getUserProgress(userId: string): Promise<UserContentProgress[]> {
  const rows = await api.get<any[]>("/dashboard/progress");
  return rows.map((r) => ({
    id: r.id,
    user_id: r.userId ?? r.user_id,
    content_type: r.contentType ?? r.content_type,
    content_id: r.contentId ?? r.content_id,
    status: r.status,
    score: r.score,
    time_spent_ms: r.timeSpentMs ?? r.time_spent_ms,
    mode: r.mode,
    completed_at: r.completedAt ?? r.completed_at,
    created_at: r.createdAt ?? r.created_at,
  }));
}

export interface UpsertProgressInput {
  user_id: string;
  content_type: string;
  content_id: string;
  status?: string;
  score?: number | null;
  time_spent_ms?: number;
  mode?: string | null;
  completed_at?: string | null;
}

export async function upsertProgress(progress: UpsertProgressInput) {
  const data = await api.put<{ firstCompletion?: boolean }>("/dashboard/progress", {
    contentId: progress.content_id,
    contentType: progress.content_type,
    status: progress.status ?? "in_progress",
    score: progress.score,
    timeSpentMs: progress.time_spent_ms,
    mode: progress.mode,
    completed: !!progress.completed_at,
  });
  return { data, firstCompletion: !!data?.firstCompletion, error: null };
}


export async function getAchievements(branch: BranchTag = "iq"): Promise<Achievement[]> {
  const rows = await api.get<any[]>(`/dashboard/achievements?branch=${branch}`);
  return rows.map((r) => ({
    ...r,
    xp_reward: r.xpReward ?? r.xp_reward,
    condition_json: r.conditionJson ?? r.condition_json,
    created_at: r.createdAt ?? r.created_at,
  }));
}

export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  const rows = await api.get<any[]>("/dashboard/user-achievements");
  return rows.map((r) => ({
    id: r.id,
    user_id: r.userId ?? r.user_id,
    achievement_id: r.achievementId ?? r.achievement_id,
    earned_at: r.earnedAt ?? r.earned_at,
  }));
}

export async function grantAchievement(userId: string, achievementId: string) {
  const data = await api.post<{ granted?: boolean; xpAwarded?: number }>(
    "/dashboard/user-achievements",
    { achievementId },
  );
  return {
    data,
    /** False when the achievement was already earned (no points awarded). */
    granted: !!data?.granted,
    xpAwarded: Number(data?.xpAwarded ?? 0),
    error: null,
  };
}

export async function addXP(userId: string, xpAmount: number) {
  const amount = Math.round(xpAmount);
  if (!Number.isFinite(amount) || amount < 1) return;
  await api.post("/dashboard/add-xp", { amount: Math.min(amount, 500) });
}

export interface StreakCheckInResult {
  already_checked_in: boolean;
  current_streak: number;
  longest_streak: number;
  xp_bonus: number;
  milestone: string | null;
}

export async function checkInDaily(userId: string): Promise<StreakCheckInResult | null> {
  const data = await api.post<{
    profile: { currentStreak: number; longestStreak: number };
    xpGain: number;
    streak: number;
    alreadyCheckedIn?: boolean;
    milestone?: string | null;
  }>("/dashboard/check-in", {});
  return {
    already_checked_in: !!data.alreadyCheckedIn,
    current_streak: data.profile.currentStreak,
    longest_streak: data.profile.longestStreak,
    xp_bonus: data.xpGain,
    milestone: data.milestone ?? null,
  };
}

export async function insertLikertResult(input: {
  testId: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  resultLabel: string;
  answersJson: unknown;
}): Promise<{ firstCompletion: boolean }> {
  const data = await api.post<{ firstCompletion?: boolean }>(
    "/dashboard/likert-results",
    input,
  );
  return { firstCompletion: !!data?.firstCompletion };
}

