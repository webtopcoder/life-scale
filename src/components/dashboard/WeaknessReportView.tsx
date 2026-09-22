import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Loader2, AlertTriangle, Clock, Eye, BrainCircuit, Zap,
  Target, Puzzle, RefreshCw, TrendingUp, Lightbulb, Sparkles,
  Calendar, ChevronRight, Star
} from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/integrations/api/client";
import { useAuth } from "@/context/AuthContext";

/* ─── types ─── */
interface HeroData { headline: string; subheadline: string }
interface OverallSummary {
  what_went_well: string; where_you_struggled: string; the_big_picture: string;
  potential_increase: number; accuracy_percent: number; strongest_area: string; weakest_area: string;
}
interface QuestionTypeMissed {
  category: string; count: number; total_in_category: number; icon_hint: string;
  why_you_missed: string; what_it_means: string; how_to_improve: string; difficulty_rating: string;
}
interface ErrorPattern {
  pattern_name: string; emoji: string; severity: string; percentage: number;
  what_happened: string; why_it_matters: string; the_fix: string;
}
interface TimeZone { zone_name: string; emoji: string; description: string; impact: string; tip: string }
interface TimeAnalysis {
  avg_time_correct_ms: number; avg_time_incorrect_ms: number;
  fastest_correct_ms: number; slowest_incorrect_ms: number;
  sweet_spot_description: string; zones: TimeZone[];
}
interface BlindSpot {
  blind_spot: string; emoji: string; score: number; percentile: number;
  explanation: string; real_world_impact: string; training_plan: string; improvement_timeline: string;
}
interface ActionPlanWeek { focus: string; daily_exercise: string; goal: string }
interface ActionPlan { week_1: ActionPlanWeek; week_2_4: ActionPlanWeek; month_2_3: ActionPlanWeek; expected_improvement: string }

interface ReportData {
  hero?: HeroData;
  overall_summary?: OverallSummary;
  question_types_missed?: QuestionTypeMissed[];
  error_patterns?: ErrorPattern[];
  time_analysis?: TimeAnalysis;
  cognitive_blind_spots?: BlindSpot[];
  action_plan?: ActionPlan;
  fun_facts?: string[];
  // Legacy fields
  summary?: string;
  potential_increase?: number;
  time_inefficiency?: any[];
}

interface WeaknessReportViewProps { sessionId?: string }

const iconMap: Record<string, typeof Zap> = {
  zap: Zap, brain: BrainCircuit, eye: Eye, clock: Clock, target: Target, puzzle: Puzzle,
};

const severityColor: Record<string, string> = {
  low: "text-accent", medium: "text-warning", high: "text-destructive", critical: "text-destructive",
};
const severityBg: Record<string, string> = {
  low: "bg-accent/10 border-accent/20", medium: "bg-warning/10 border-warning/20",
  high: "bg-destructive/10 border-destructive/20", critical: "bg-destructive/10 border-destructive/20",
};
const difficultyLabel: Record<string, { text: string; color: string }> = {
  easy: { text: "Quick Win", color: "text-accent" },
  medium: { text: "Worth the Effort", color: "text-warning" },
  hard: { text: "Long-term Project", color: "text-destructive" },
};

const prettifyCategory = (slug: string) => {
  const map: Record<string, string> = {
    logic: "Logical Thinking", pattern: "Pattern Recognition", spatial: "Spatial Reasoning",
    speed: "Processing Speed", memory: "Memory", verbal: "Verbal Skills", self: "Self-Awareness",
  };
  return map[slug?.toLowerCase()] || slug?.charAt(0).toUpperCase() + slug?.slice(1) || slug;
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const } }),
};

export function WeaknessReportView({ sessionId }: WeaknessReportViewProps) {
  const { user } = useAuth();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (user) loadReport(); }, [user]);

  async function loadReport() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Array<{ reportJson?: any; report_json?: any; reportType?: string; report_type?: string }>>("/dashboard/generated-reports");
      const weaknessReport = data?.find(r => (r.reportType ?? r.report_type) === "weakness");
      if (weaknessReport) {
        setReport((weaknessReport.reportJson ?? weaknessReport.report_json) as unknown as ReportData);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("Weakness report DB query error:", err);
    }
    // No cached report — call API while still showing loading spinner
    try {
      const fnData = await api.post<ReportData>("/ai/generate-weakness-report", {
        sessionId,
        regenerate: false,
      });
      if (fnData) {
        setReport(fnData as ReportData);
        setLoading(false);
        return;
      }
    } catch (e: any) {
      console.error("Weakness report edge function error:", e);
    }
    setLoading(false);
  }

  async function generate(regenerate = false) {
    if (!user) return;
    setGenerating(true);
    setError(null);
    try {
      const data = await api.post<ReportData>("/ai/generate-weakness-report", {
        sessionId,
        regenerate,
      });
      setReport(data as ReportData);
    } catch (e: any) { setError(e.message); }
    finally { setGenerating(false); }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!report) return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto text-center py-12 px-4">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <BrainCircuit className="w-10 h-10 text-primary" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-3">Your Weakness Report is Ready to Generate</h3>
      <p className="text-muted-foreground mb-8 leading-relaxed">We'll analyze every answer you gave — how long you took, where you slipped up, and what patterns your brain falls into. This takes about 30 seconds.</p>
      {error && <p className="text-destructive text-sm mb-4 bg-destructive/10 rounded-lg p-3">{error}</p>}
      <Button onClick={() => generate(false)} disabled={generating} size="lg" className="rounded-xl px-8">
        {generating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Analyzing Your Brain…</> : "Generate My Weakness Report"}
      </Button>
    </motion.div>
  );

  // Check if new format
  const isNewFormat = !!report.hero;

  // Fallback for old format reports
  if (!isNewFormat) {
    return (
      <div className="space-y-4">
        <Card className="border-primary/20 bg-card">
          <CardContent className="pt-6">
            <p className="text-foreground">{report.summary}</p>
            <p className="text-accent font-semibold mt-2">Potential increase: ~{report.potential_increase} points</p>
          </CardContent>
        </Card>
        <div className="text-center pt-4">
          <Button variant="outline" onClick={() => generate(true)} disabled={generating} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Regenerate with Enhanced Format
          </Button>
        </div>
      </div>
    );
  }

  const { hero, overall_summary: os, question_types_missed: qtm, error_patterns: ep, time_analysis: ta, cognitive_blind_spots: cbs, action_plan: ap, fun_facts: ff } = report;

  let sectionIdx = 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Hero */}
      <motion.div custom={sectionIdx++} variants={fadeUp} initial="hidden" animate="visible"
        className="relative overflow-hidden rounded-2xl p-6 md:p-8"
        style={{ background: "var(--gradient-primary)" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
        <div className="relative z-10">
          <Sparkles className="w-8 h-8 text-primary-foreground/80 mb-3" />
          <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-2">{hero?.headline}</h1>
          <p className="text-primary-foreground/80 text-base md:text-lg leading-relaxed">{hero?.subheadline}</p>
        </div>
        <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-primary-foreground/5" />
      </motion.div>

      {/* Quick Stats Row */}
      {os && (
        <motion.div custom={sectionIdx++} variants={fadeUp} initial="hidden" animate="visible"
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <StatCard icon={Target} label="Accuracy" value={`${os.accuracy_percent}%`} color="text-accent" />
          <StatCard icon={TrendingUp} label="Room to Grow" value={`+${os.potential_increase} pts`} color="text-primary" />
          <StatCard icon={Star} label="Strongest" value={prettifyCategory(os.strongest_area)} color="text-accent" />
          <StatCard icon={AlertTriangle} label="Weakest" value={prettifyCategory(os.weakest_area)} color="text-warning" />
        </motion.div>
      )}

      {/* Overall Summary */}
      {os && (
        <motion.div custom={sectionIdx++} variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
          <SectionTitle icon={Sparkles} title="The Full Picture" />
          <Card className="border-accent/20 overflow-hidden">
            <div className="h-1 bg-accent" />
            <CardContent className="pt-5 space-y-4">
              <div>
                <h4 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                  <span className="text-lg">🎉</span> What Went Well
                </h4>
                <p className="text-foreground/80 leading-relaxed">{os.what_went_well}</p>
              </div>
              <div className="border-t border-border pt-4">
                <h4 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                  <span className="text-lg">🔍</span> Where You Struggled
                </h4>
                <p className="text-foreground/80 leading-relaxed">{os.where_you_struggled}</p>
              </div>
              <div className="border-t border-border pt-4">
                <h4 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                  <span className="text-lg">🧠</span> The Big Picture
                </h4>
                <p className="text-foreground/80 leading-relaxed">{os.the_big_picture}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Question Types Missed */}
      {qtm && qtm.length > 0 && (
        <motion.div custom={sectionIdx++} variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
          <SectionTitle icon={Target} title="Where You Lost Points" />
          <div className="space-y-4">
            {qtm.map((item, i) => {
              const Icon = iconMap[item.icon_hint] || AlertTriangle;
              const diff = difficultyLabel[item.difficulty_rating] || difficultyLabel.medium;
              const total = item.total_in_category > 0 ? item.total_in_category : null;
              const validTotal = total && total >= item.count ? total : null;
              const pct = validTotal ? Math.round(((validTotal - item.count) / validTotal) * 100) : null;
              return (
                <motion.div key={i} custom={sectionIdx + i * 0.3} variants={fadeUp} initial="hidden" animate="visible">
                  <Card className="border-border overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="pt-5">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-foreground capitalize">{prettifyCategory(item.category)}</h4>
                            <span className={`text-xs font-medium ${diff.color}`}>{diff.text}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{item.count} missed{validTotal ? ` out of ${validTotal}` : ""}</span>
                          </div>
                        </div>
                      </div>
                      {validTotal && pct !== null && (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Category accuracy</span>
                          <span>{pct}%</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>
                      )}
                      <div className="space-y-3 text-sm">
                        <div className="rounded-xl bg-card border border-border p-3">
                          <p className="font-medium text-foreground mb-1">Why you missed these</p>
                          <p className="text-foreground/70 leading-relaxed">{item.why_you_missed}</p>
                        </div>
                        <div className="rounded-xl bg-card border border-border p-3">
                          <p className="font-medium text-foreground mb-1">What it means</p>
                          <p className="text-foreground/70 leading-relaxed">{item.what_it_means}</p>
                        </div>
                        <div className="rounded-xl bg-accent/5 border border-accent/15 p-3">
                          <p className="font-medium text-accent mb-1 flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5" /> How to improve
                          </p>
                          <p className="text-foreground/70 leading-relaxed">{item.how_to_improve}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Error Patterns */}
      {ep && ep.length > 0 && (
        <motion.div custom={sectionIdx++} variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
          <SectionTitle icon={BrainCircuit} title="Your Error Patterns" subtitle="These are the habits that cost you the most points" />
          <div className="space-y-4">
            {ep.map((item, i) => (
              <motion.div key={i} custom={sectionIdx + i * 0.3} variants={fadeUp} initial="hidden" animate="visible">
                <Card className={`border overflow-hidden ${severityBg[item.severity] || "border-border"}`}>
                  <CardContent className="pt-5">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-2xl">{item.emoji}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-semibold text-foreground">{item.pattern_name}</h4>
                          <span className={`text-xs font-bold uppercase ${severityColor[item.severity]}`}>{item.severity}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{item.percentage}% of your errors</span>
                      </div>
                    </div>
                    <div className="mb-3">
                      <Progress value={item.percentage} className="h-1.5" />
                    </div>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-medium text-foreground mb-1">What happened</p>
                        <p className="text-foreground/70 leading-relaxed">{item.what_happened}</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground mb-1">Why it matters</p>
                        <p className="text-foreground/70 leading-relaxed">{item.why_it_matters}</p>
                      </div>
                      <div className="rounded-xl bg-accent/5 border border-accent/15 p-3">
                        <p className="font-medium text-accent mb-1 flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5" /> The Fix
                        </p>
                        <p className="text-foreground/70 leading-relaxed">{item.the_fix}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Time Analysis */}
      {ta && (
        <motion.div custom={sectionIdx++} variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
          <SectionTitle icon={Clock} title="Your Timing Breakdown" subtitle="Speed vs accuracy — finding your sweet spot" />
          <Card className="border-info/20 overflow-hidden">
            <div className="h-1 bg-info" />
            <CardContent className="pt-5">
              <div className="grid grid-cols-2 gap-3 mb-5">
                <MiniStat label="Avg time (correct)" value={`${Math.round(ta.avg_time_correct_ms / 1000)}s`} />
                <MiniStat label="Avg time (wrong)" value={`${Math.round(ta.avg_time_incorrect_ms / 1000)}s`} />
                <MiniStat label="Fastest correct" value={`${Math.round(ta.fastest_correct_ms / 1000)}s`} />
                <MiniStat label="Slowest wrong" value={`${Math.round(ta.slowest_incorrect_ms / 1000)}s`} />
              </div>
              <p className="text-foreground/80 leading-relaxed mb-5">{ta.sweet_spot_description}</p>
              <div className="space-y-3">
                {ta.zones?.map((zone, i) => (
                  <div key={i} className="rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{zone.emoji}</span>
                      <h5 className="font-semibold text-foreground">{zone.zone_name}</h5>
                    </div>
                    <p className="text-sm text-foreground/70 leading-relaxed mb-2">{zone.description}</p>
                    <p className="text-sm text-foreground/70 leading-relaxed mb-2">{zone.impact}</p>
                    <div className="rounded-lg bg-accent/5 border border-accent/15 p-2.5">
                      <p className="text-xs text-accent font-medium flex items-center gap-1.5">
                        <Lightbulb className="w-3 h-3" /> {zone.tip}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Cognitive Blind Spots */}
      {cbs && cbs.length > 0 && (
        <motion.div custom={sectionIdx++} variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
          <SectionTitle icon={Eye} title="Your Cognitive Blind Spots" subtitle="Things your brain does without you realizing" />
          <div className="space-y-4">
            {cbs.map((item, i) => (
              <motion.div key={i} custom={sectionIdx + i * 0.3} variants={fadeUp} initial="hidden" animate="visible">
                <Card className="border-border overflow-hidden">
                  <CardContent className="pt-5">
                    <div className="flex items-start gap-3 mb-4">
                      <span className="text-2xl">{item.emoji}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground mb-1">{item.blind_spot}</h4>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>Score: {(item.score * 100).toFixed(0)}%</span>
                          <span>•</span>
                          <span>Smarter than {item.percentile}% of test-takers</span>
                        </div>
                      </div>
                    </div>
                    <div className="mb-4">
                      <Progress value={item.score * 100} className="h-2" />
                    </div>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-medium text-foreground mb-1">What's going on</p>
                        <p className="text-foreground/70 leading-relaxed">{item.explanation}</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground mb-1">How it affects your daily life</p>
                        <p className="text-foreground/70 leading-relaxed">{item.real_world_impact}</p>
                      </div>
                      <div className="rounded-xl bg-primary/5 border border-primary/15 p-3">
                        <p className="font-medium text-primary mb-1">Your training plan</p>
                        <p className="text-foreground/70 leading-relaxed">{item.training_plan}</p>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" /> {item.improvement_timeline}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Action Plan */}
      {ap && (
        <motion.div custom={sectionIdx++} variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
          <SectionTitle icon={TrendingUp} title="Your Improvement Roadmap" subtitle="Follow this plan and watch your score climb" />
          <div className="space-y-3">
            <ActionPlanCard phase="Week 1" color="bg-accent" data={ap.week_1} />
            <ActionPlanCard phase="Weeks 2–4" color="bg-primary" data={ap.week_2_4} />
            <ActionPlanCard phase="Months 2–3" color="bg-info" data={ap.month_2_3} />
          </div>
          <Card className="border-accent/20 overflow-hidden">
            <div className="h-1 bg-accent" />
            <CardContent className="pt-5">
              <p className="text-foreground/80 leading-relaxed flex items-start gap-2">
                <TrendingUp className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                {ap.expected_improvement}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Fun Facts */}
      {ff && ff.length > 0 && (
        <motion.div custom={sectionIdx++} variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
          <SectionTitle icon={Lightbulb} title="Brain Booster Facts" />
          <div className="grid gap-3 md:grid-cols-3">
            {ff.map((fact, i) => (
              <Card key={i} className="border-border">
                <CardContent className="pt-5">
                  <Sparkles className="w-5 h-5 text-primary mb-2" />
                  <p className="text-sm text-foreground/80 leading-relaxed">{fact}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

    </div>
  );
}

/* ─── sub-components ─── */

function SectionTitle({ icon: Icon, title, subtitle }: { icon: typeof Zap; title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
        <Icon className="w-5 h-5 text-primary" />
        {title}
      </h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Zap; label: string; value: string; color: string }) {
  return (
    <Card className="border-border">
      <CardContent className="pt-4 pb-4 flex flex-col items-center text-center gap-1">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="text-lg font-bold text-foreground">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-3 text-center">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ActionPlanCard({ phase, color, data }: { phase: string; color: string; data: ActionPlanWeek }) {
  return (
    <Card className="border-border overflow-hidden">
      <div className={`h-1 ${color}`} />
      <CardContent className="pt-4">
        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-primary" />
          {phase}
        </h4>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-foreground">Focus: </span>
            <span className="text-foreground/70">{data.focus}</span>
          </div>
          <div>
            <span className="font-medium text-foreground">Daily exercise: </span>
            <span className="text-foreground/70">{data.daily_exercise}</span>
          </div>
          <div>
            <span className="font-medium text-foreground">Goal: </span>
            <span className="text-foreground/70">{data.goal}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
