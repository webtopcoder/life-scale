import { useNavigate } from "react-router-dom";
import { usePostHog } from "@posthog/react";
import { useBrainScore } from "@/hooks/useBrainScore";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Puzzle, BookOpen, Trophy, Activity, CheckCircle, X, Sparkles, Sprout, ArrowRight, Calendar, UserPlus } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import StreakCard from "@/components/dashboard/StreakCard";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { EVENTS, trackEvent } from "@/constants/analytics";
import { STORAGE_KEYS } from "@/constants/storage";
import { api } from "@/integrations/api/client";
import { useUserPurchases } from "@/hooks/useUserPurchases";
import { PRODUCT_PRICING } from "@/lib/upsellPricing";
import { WeaknessReportUpsell } from "@/components/upsells/WeaknessReportUpsell";
import { GeniusBlueprintUpsell } from "@/components/upsells/GeniusBlueprintUpsell";
import { BrainCoachUpsell } from "@/components/upsells/BrainCoachUpsell";
import { getBrainTeasers, getPuzzles, getLessons } from "@/services/dashboardService";
import { mazes } from "@/components/dashboard/mazes/maze-data";
import { motion } from "framer-motion";

interface MilestoneDef {
  id: string;
  label: string;
  check: (counts: { total: number; teasers: number; puzzles: number; lessons: number; timed: number }) => boolean;
}

const MILESTONES: MilestoneDef[] = [
  { id: "first_teaser", label: "🧠 First Brain Teaser Done!", check: c => c.teasers >= 1 },
  { id: "first_puzzle", label: "🧩 First Maze Completed!", check: c => c.puzzles >= 1 },
  { id: "first_lesson", label: "📖 First Lesson Finished!", check: c => c.lessons >= 1 },
  { id: "5_teasers", label: "🧠 5 Brain Teasers Done!", check: c => c.teasers >= 5 },
  { id: "5_puzzles", label: "🧩 5 Mazes Completed!", check: c => c.puzzles >= 5 },
  { id: "5_lessons", label: "📖 5 Lessons Finished!", check: c => c.lessons >= 5 },
  { id: "10_total", label: "⚡ 10 Activities Complete!", check: c => c.total >= 10 },
  { id: "10_teasers", label: "🧠 10 Brain Teasers!", check: c => c.teasers >= 10 },
  { id: "10_puzzles", label: "🧩 10 Mazes!", check: c => c.puzzles >= 10 },
  { id: "5_timed", label: "⏱️ 5 Timed Mazes!", check: c => c.timed >= 5 },
  { id: "25_total", label: "🔥 25 Activities!", check: c => c.total >= 25 },
  { id: "50_total", label: "🏆 50 Activities!", check: c => c.total >= 50 },
  { id: "100_total", label: "👑 100 Activities!", check: c => c.total >= 100 },
];

function BrainGrowthPlanCard() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchPlan = async () => {
      try {
        const data = await api.get<
          Array<{ planJson?: unknown; plan_json?: unknown; createdAt?: string; created_at?: string }>
        >("/dashboard/learning-paths");
        if (data.length > 0) {
          setPlan({
            plan_json: data[0].planJson ?? data[0].plan_json,
            created_at: data[0].createdAt ?? data[0].created_at,
          });
        }
      } catch {
        /* ignore */
      }
      setLoading(false);
    };
    fetchPlan();
  }, [user]);

  if (loading || !plan) return null;

  const planData = plan.plan_json as any;
  const weeks = planData?.weeks || [];
  const createdDate = new Date(plan.created_at);
  const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  const currentWeek = Math.min(Math.floor(daysSinceCreated / 7) + 1, 4);

  return (
    <Card className="border-0 shadow-[var(--shadow-elevated)] overflow-hidden">
      <div className="h-1.5 w-full bg-primary" />
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-accent" />
            <h3 className="font-bold text-sm">Your Brain Growth Plan</h3>
          </div>
        </div>
        
        {/* Week progress */}
        <div className="flex gap-1 mb-3">
          {[1, 2, 3, 4].map(w => (
            <div key={w} className={`flex-1 h-1.5 rounded-full ${w <= currentWeek ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        {/* Current week theme */}
        {weeks[currentWeek - 1] && (
          <div className="bg-muted/50 rounded-lg p-3 mb-3">
            <div className="text-xs text-muted-foreground mb-0.5">This Week's Focus</div>
            <div className="text-sm font-semibold text-foreground">{weeks[currentWeek - 1].theme}</div>
            {weeks[currentWeek - 1].milestone && (
              <div className="text-xs text-accent mt-1">
                Goal: {weeks[currentWeek - 1].milestone}
              </div>
            )}
          </div>
        )}

        {/* Quick actions */}
        {planData?.recommended_content && (
          <div className="flex gap-2">
            {(planData.recommended_content as string[]).slice(0, 3).map((type: string) => {
              const label = type === 'brain_teaser' ? 'Brain Teasers' : (type === 'puzzle' || type === 'maze') ? 'Mazes' : 'Lessons';
              const path = type === 'brain_teaser' ? '/dashboard/brain-teasers' : (type === 'puzzle' || type === 'maze') ? '/dashboard/puzzles' : '/dashboard/lessons';
              return (
                <a key={type} href={path} className="flex-1 text-center bg-primary/5 hover:bg-primary/10 rounded-lg px-2 py-2 transition-colors">
                  <div className="text-[10px] font-medium text-primary">{label}</div>
                </a>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardHome() {
  const posthog = usePostHog();
  const { profile, progress, userAchievements, loading, streakResult } = useBrainScore();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Content title lookup map
  const [contentTitleMap, setContentTitleMap] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    Promise.all([getBrainTeasers(), getPuzzles(), getLessons()]).then(([teasers, puzzles, lessons]) => {
      const map = new Map<string, string>();
      teasers.forEach(t => map.set(t.id, t.title));
      puzzles.forEach(p => map.set(p.id, p.title));
      lessons.forEach(l => map.set(l.id, l.title));
      mazes.forEach(m => map.set(m.id, m.title));
      setContentTitleMap(map);
    });
  }, []);
  
  const { hasWeaknessReport, hasGeniusBlueprint, hasBrainCoach, declinedUpsells, loading: purchasesLoading } = useUserPurchases();
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const handleUpsellPurchase = (productKey: string, amountCents: number) => {
    if (!user) { navigate('/auth-gate'); return; }
    trackEvent(posthog, EVENTS.CHECKOUT_CTA_CLICKED, {
      location: 'dashboard_home',
      product: productKey,
      price_cents: amountCents,
      is_win_back: declinedUpsells.includes(productKey),
    });
    const path =
      productKey === 'weakness_report'
        ? '/dashboard/weakness-report'
        : productKey === 'genius_blueprint'
          ? '/dashboard/genius-blueprint'
          : '/dashboard/brain-coach';
    navigate(path);
  };

  // Asset claiming is now handled centrally in DashboardLayout via claim-funnel-assets edge function

  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEYS.DISMISSED_MILESTONES);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  const completed = progress.filter(p => p.status === "completed");
  const teasersDone = completed.filter(p => p.content_type === "brain_teaser").length;
  const puzzlesDone = completed.filter(p => p.content_type === "puzzle").length;
  const lessonsDone = completed.filter(p => p.content_type === "lesson").length;
  const timedDone = completed.filter(p => p.mode === "timed").length;

  const counts = { total: completed.length, teasers: teasersDone, puzzles: puzzlesDone, lessons: lessonsDone, timed: timedDone };

  const activeBanners = MILESTONES.filter(m => m.check(counts) && !dismissedBanners.has(m.id));
  const topBanner = activeBanners.length > 0 ? activeBanners[activeBanners.length - 1] : null;

  const dismissBanner = (id: string) => {
    const next = new Set(dismissedBanners);
    next.add(id);
    setDismissedBanners(next);
    sessionStorage.setItem(STORAGE_KEYS.DISMISSED_MILESTONES, JSON.stringify([...next]));
  };

  const quickStart = [
    { title: "Brain Teasers", desc: "Riddles, lateral thinking & more", icon: Lightbulb, path: "/dashboard/brain-teasers", count: teasersDone, total: 25, color: "text-warning" },
    { title: "Mazes", desc: "Navigate themed maze challenges", icon: Puzzle, path: "/dashboard/puzzles", count: puzzlesDone, total: mazes.length, color: "text-primary" },
    { title: "Lessons", desc: "Expert-guided cognitive training", icon: BookOpen, path: "/dashboard/lessons", count: lessonsDone, total: 25, color: "text-accent" },
    { title: "Achievements", desc: "Track your milestones", icon: Trophy, path: "/dashboard/achievements", count: userAchievements.length, total: 15, color: "text-destructive" },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Account creation prompt for unauthenticated users */}
      {!user && (
        <div className="rounded-xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 animate-fade-in">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="rounded-full bg-primary/15 p-2 shrink-0">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Create an account to save your progress</p>
              <p className="text-xs text-muted-foreground mt-0.5">Track streaks, earn achievements, and keep your brain score across devices.</p>
            </div>
          </div>
          <Button size="sm" className="shrink-0" onClick={() => navigate("/auth-gate")}>
            Sign Up Free
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Milestone Banner */}
      {topBanner && (
        <div className="rounded-lg bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20 px-3 py-2.5 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent shrink-0" />
            <p className="text-sm font-semibold">{topBanner.label}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => dismissBanner(topBanner.id)}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      <div>
        <h1 className="text-xl md:text-2xl font-bold mb-0.5">Welcome back{profile?.display_name ? `, ${profile.display_name}` : ""}!</h1>
        <p className="text-muted-foreground text-sm">Continue your journey to getting smarter</p>
      </div>

      {/* Brain Growth Plan Card */}
      <BrainGrowthPlanCard />


      {/* Upsell Cards */}
      {!purchasesLoading && (
        <div className="space-y-3">
          {!hasWeaknessReport && (
            <WeaknessReportUpsell
              onPurchase={() => handleUpsellPurchase('weakness_report', PRODUCT_PRICING.weakness_report.originalCents)}
              loading={purchaseLoading === 'weakness_report'}
              isWinBack={declinedUpsells.includes('weakness_report')}
            />
          )}
          {!hasGeniusBlueprint && (
            <GeniusBlueprintUpsell
              onPurchase={() => handleUpsellPurchase('genius_blueprint', PRODUCT_PRICING.genius_blueprint.originalCents)}
              loading={purchaseLoading === 'genius_blueprint'}
              isWinBack={declinedUpsells.includes('genius_blueprint')}
            />
          )}
          {!hasBrainCoach && (
            <BrainCoachUpsell
              onPurchase={() => handleUpsellPurchase('brain_coach', PRODUCT_PRICING.brain_coach.originalCents)}
              loading={purchaseLoading === 'brain_coach'}
              isWinBack={declinedUpsells.includes('brain_coach')}
            />
          )}
        </div>
      )}

      {/* Quick-start grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
        {quickStart.map(item => (
          <Card
            key={item.title}
            className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5"
            onClick={() => {
              trackEvent(posthog, EVENTS.DASHBOARD_CARD_CLICKED, { card: item.title });
              navigate(item.path);
            }}
          >
            <CardContent className="p-2.5 md:p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <item.icon className={`w-4 h-4 md:w-5 md:h-5 shrink-0 ${item.color}`} />
                <h3 className="font-semibold text-xs md:text-sm leading-tight">{item.title}</h3>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <CheckCircle className="w-3 h-3 text-accent shrink-0" />
                <span className="font-medium">{item.count}/{item.total}</span>
              </div>
              <Progress value={item.total > 0 ? Math.round((item.count / item.total) * 100) : 0} className="h-1.5 mt-1.5" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4" /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {completed.length === 0 ? (
            <p className="text-muted-foreground text-sm">No activities completed yet. Start with a brain teaser or maze!</p>
          ) : (
            <div className="space-y-2">
              {completed.slice(-5).reverse().map(p => (
                <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-accent shrink-0" />
                    <div>
                      <p className="text-sm font-medium capitalize">{contentTitleMap.get(p.content_id) || p.content_type.replace("_", " ")}</p>
                      <p className="text-[11px] text-muted-foreground">{p.completed_at ? new Date(p.completed_at).toLocaleDateString() : ""}</p>
                    </div>
                  </div>
                  {p.score !== null && <span className="text-sm font-semibold">{p.score}%</span>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
