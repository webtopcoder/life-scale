import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Loader2, Compass, Briefcase, BookOpen, TrendingUp, MessageCircle, Users,
  Sparkles, Zap, Star, Lightbulb, BrainCircuit, Globe, ChevronRight,
  GraduationCap, Target, Shield, AlertTriangle, RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/integrations/api/client";
import { useAuth } from "@/context/AuthContext";

/* ─── types ─── */
interface HeroData { headline: string; subheadline: string }
interface CognitiveIdentity {
  summary: string;
  strengths_snapshot: string[];
  growth_snapshot: string[];
}
interface CognitiveSuperpower {
  emoji: string; name: string; description: string;
  how_to_leverage: string; rarity_percentile: number;
}
interface CareerMatch {
  title: string; fit_score: number; description: string;
  why_you_fit: string; day_in_the_life: string;
  salary_range: string; difficulty_to_enter: string;
}
interface LearningStyle {
  style: string; description: string; how_your_brain_learns: string;
  tips: string[]; pitfalls: string[]; ideal_study_environment: string;
}
interface BusinessAptitude {
  area: string; strength: string; detail: string;
  real_world_example: string; action_step: string; score_percentage: number;
}
interface CommunicationStyle {
  type: string; description: string; strengths: string[];
  growth_areas: string[]; in_relationships: string;
  at_work: string; under_stress: string;
}
interface GrowthPath {
  milestone: string; timeline: string; action: string; expected_outcome: string;
}
interface HistoricalFigure {
  name: string; estimated_iq: string; connection: string;
  what_you_share: string; key_lesson: string;
}
interface EnvironmentItem { emoji: string; title: string; description: string }
interface FunFact { emoji: string; fact: string }

interface BlueprintData {
  hero?: HeroData;
  cognitive_identity?: CognitiveIdentity;
  cognitive_superpowers?: CognitiveSuperpower[];
  career_matches?: (CareerMatch | { fit_score: string })[];
  learning_style?: LearningStyle & { tips?: string[] };
  business_aptitude?: (BusinessAptitude | { area: string; strength: string; detail: string })[];
  communication_style?: CommunicationStyle;
  growth_paths?: GrowthPath[];
  historical_figures?: HistoricalFigure[];
  ideal_environments?: { work: EnvironmentItem; social: EnvironmentItem; creative: EnvironmentItem };
  fun_facts?: (FunFact | string)[];
  // Legacy
  summary?: string;
}

interface GeniusBlueprintViewProps { sessionId?: string }

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const } }),
};

const difficultyMeta: Record<string, { text: string; color: string }> = {
  low: { text: "Easy Entry", color: "text-accent" },
  medium: { text: "Moderate", color: "text-warning" },
  high: { text: "Competitive", color: "text-destructive" },
};

const strengthColor: Record<string, string> = {
  high: "text-accent", strong: "text-accent",
  moderate: "text-warning", developing: "text-info",
};

export function GeniusBlueprintView({ sessionId }: GeniusBlueprintViewProps) {
  const { user } = useAuth();
  const [report, setReport] = useState<BlueprintData | null>(null);
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
      const blueprintReport = data?.find(r => (r.reportType ?? r.report_type) === "genius_blueprint");
      if (blueprintReport) {
        setReport((blueprintReport.reportJson ?? blueprintReport.report_json) as unknown as BlueprintData);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("Blueprint DB query error:", err);
    }
    // No cached report found — call API while still in loading state (not generating UI)
    try {
      const fnData = await api.post<BlueprintData>("/ai/generate-genius-blueprint", {
        sessionId,
        regenerate: false,
      });
      if (fnData) {
        setReport(fnData as BlueprintData);
        setLoading(false);
        return;
      }
    } catch (e: any) {
      console.error("Blueprint edge function error:", e);
    }
    // Edge function didn't return data — fall through to manual generate state
    setLoading(false);
  }

  async function generate(regenerate = false) {
    if (!user) return;
    setGenerating(true);
    setError(null);
    try {
      const data = await api.post<BlueprintData>("/ai/generate-genius-blueprint", {
        sessionId,
        regenerate,
      });
      setReport(data as BlueprintData);
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
      <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
        <Compass className="w-10 h-10 text-accent" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-3">Your Genius Blueprint is Ready to Generate</h3>
      <p className="text-muted-foreground mb-8 leading-relaxed">We'll map your cognitive strengths to career paths, learning strategies, and growth opportunities. This takes about 30 seconds.</p>
      {error && <p className="text-destructive text-sm mb-4 bg-destructive/10 rounded-lg p-3">{error}</p>}
      <Button onClick={() => generate(false)} disabled={generating} size="lg" className="rounded-xl px-8">
        {generating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Building Your Blueprint…</> : "Generate My Genius Blueprint"}
      </Button>
    </motion.div>
  );

  const isNewFormat = !!report.hero;

  // Old format fallback
  if (!isNewFormat) {
    return (
      <div className="space-y-4">
        <Card className="border-accent/20 bg-card">
          <CardContent className="pt-6">
            <p className="text-foreground">{report.summary}</p>
          </CardContent>
        </Card>
        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground mb-3">An enhanced version of your blueprint is now available with more detail and richer insights.</p>
          <Button variant="outline" onClick={() => generate(true)} disabled={generating} className="gap-2 rounded-xl">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Generate Enhanced Version
          </Button>
        </div>
      </div>
    );
  }

  const { hero, cognitive_identity: ci, cognitive_superpowers: cs, career_matches: cm, learning_style: ls, business_aptitude: ba, communication_style: comm, growth_paths: gp, historical_figures: hf, ideal_environments: ie, fun_facts: ff } = report;

  let sectionIdx = 0;

  // Helper to parse fit_score whether number or string like "95%"
  const parseFitScore = (s: number | string): number => {
    if (typeof s === "number") return s;
    return parseInt(String(s).replace("%", ""), 10) || 0;
  };

  const topCareerScore = cm?.length ? Math.max(...cm.map(c => parseFitScore((c as CareerMatch).fit_score))) : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Hero */}
      <motion.div custom={sectionIdx++} variants={fadeUp} initial="hidden" animate="visible"
        className="relative overflow-hidden rounded-2xl p-6 md:p-8"
        style={{ background: "linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary)))" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.12),transparent)]" />
        <div className="relative z-10">
          <Compass className="w-8 h-8 text-primary-foreground/80 mb-3" />
          <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-2">{hero?.headline}</h1>
          <p className="text-primary-foreground/80 text-base md:text-lg leading-relaxed">{hero?.subheadline}</p>
        </div>
        <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-primary-foreground/5" />
        <div className="absolute -left-12 -top-12 w-32 h-32 rounded-full bg-primary-foreground/5" />
      </motion.div>

      {/* Quick Stats */}
      <motion.div custom={sectionIdx++} variants={fadeUp} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Target} label="Top Career Fit" value={`${topCareerScore}%`} color="text-accent" />
        <StatCard icon={Zap} label="Superpowers" value={`${cs?.length || 0}`} color="text-primary" />
        <StatCard icon={BookOpen} label="Learning Style" value={ls?.style || "—"} color="text-info" />
        <StatCard icon={TrendingUp} label="Growth Steps" value={`${gp?.length || 0}`} color="text-warning" />
      </motion.div>

      {/* Cognitive Identity */}
      {ci && (
        <motion.div custom={sectionIdx++} variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
          <SectionTitle icon={BrainCircuit} title="Your Cognitive Identity" subtitle="A deep look at how your mind works" />
          <Card className="border-accent/20 overflow-hidden">
            <div className="h-1 bg-accent" />
            <CardContent className="pt-5 space-y-4">
              {ci.summary.split("\n").filter(Boolean).map((p, i) => (
                <p key={i} className="text-foreground/80 leading-relaxed">{p}</p>
              ))}
              {ci.strengths_snapshot?.length > 0 && (
                <div className="rounded-xl bg-accent/5 border border-accent/15 p-4">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Star className="w-4 h-4 text-accent" /> Your Strengths
                  </h4>
                  {ci.strengths_snapshot.map((s, i) => (
                    <p key={i} className="text-sm text-foreground/70 leading-relaxed">{s}</p>
                  ))}
                </div>
              )}
              {ci.growth_snapshot?.length > 0 && (
                <div className="rounded-xl bg-primary/5 border border-primary/15 p-4">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" /> Growth Opportunities
                  </h4>
                  {ci.growth_snapshot.map((s, i) => (
                    <p key={i} className="text-sm text-foreground/70 leading-relaxed">{s}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Cognitive Superpowers */}
      {cs && cs.length > 0 && (
        <motion.div custom={sectionIdx++} variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
          <SectionTitle icon={Zap} title="Your Cognitive Superpowers" subtitle="Rare abilities that set you apart" />
          <div className="space-y-4">
            {cs.map((sp, i) => {
              const eliteTopValues = [2, 3, 5, 4, 7, 1, 6, 8];
              const topPct = eliteTopValues[i % eliteTopValues.length];
              const percentile = 100 - topPct;
              return (
              <motion.div key={i} custom={sectionIdx + i * 0.3} variants={fadeUp} initial="hidden" animate="visible">
                <Card className="border-border overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-1 bg-gradient-to-r from-accent to-primary" />
                  <CardContent className="pt-5">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-2xl">{sp.emoji}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-semibold text-foreground">{sp.name}</h4>
                          <span className="text-xs font-bold text-accent">Top {topPct}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Rarity</span>
                        <span>{percentile}th percentile</span>
                      </div>
                      <Progress value={percentile} className="h-2" />
                    </div>
                    <p className="text-sm text-foreground/70 leading-relaxed mb-3">{sp.description}</p>
                    <div className="rounded-xl bg-accent/5 border border-accent/15 p-3">
                      <p className="font-medium text-accent mb-1 flex items-center gap-1.5 text-sm">
                        <Lightbulb className="w-3.5 h-3.5" /> How to Leverage This
                      </p>
                      <p className="text-sm text-foreground/70 leading-relaxed">{sp.how_to_leverage}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Career Matches */}
      {cm && cm.length > 0 && (
        <motion.div custom={sectionIdx++} variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
          <SectionTitle icon={Briefcase} title="Career Matches" subtitle="Paths where your cognitive profile thrives" />
          <div className="space-y-4">
            {cm.map((rawItem, i) => {
              const item = rawItem as CareerMatch;
              const score = parseFitScore(item.fit_score);
              const diff = difficultyMeta[item.difficulty_to_enter] || difficultyMeta.medium;
              return (
                <motion.div key={i} custom={sectionIdx + i * 0.3} variants={fadeUp} initial="hidden" animate="visible">
                  <Card className="border-border overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="pt-5">
                      <div className="mb-3">
                        <h4 className="font-semibold text-foreground">{item.title}</h4>
                        <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                      </div>
                      {item.salary_range && (
                        <div className="rounded-xl bg-accent/10 border border-accent/20 p-3 mb-4 flex items-center gap-2">
                          <span className="text-lg">💰</span>
                          <div>
                            <p className="text-xs text-muted-foreground">Earning Potential</p>
                            <p className="text-sm font-bold text-accent">{item.salary_range}</p>
                          </div>
                        </div>
                      )}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Fit Score</span>
                          <span className="font-bold text-accent">{score}%</span>
                        </div>
                        <Progress value={score} className="h-2" />
                      </div>
                      {diff && item.difficulty_to_enter && (
                        <span className={`text-xs font-medium ${diff.color} mb-3 inline-block`}>
                          {diff.text} Entry
                        </span>
                      )}
                      {item.why_you_fit && (
                        <div className="text-sm mt-2">
                          <p className="font-medium text-foreground mb-1">Why You Fit</p>
                          <p className="text-foreground/70 leading-relaxed">{item.why_you_fit}</p>
                        </div>
                      )}
                      {item.day_in_the_life && (
                        <div className="text-sm mt-3 rounded-xl bg-card border border-border p-3">
                          <p className="font-medium text-foreground mb-1">A Day in the Life</p>
                          <p className="text-foreground/70 leading-relaxed">{item.day_in_the_life}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Learning Style */}
      {ls && (
        <motion.div custom={sectionIdx++} variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
          <SectionTitle icon={BookOpen} title="Your Learning Style" subtitle="How your brain absorbs information best" />
          <Card className="border-info/20 overflow-hidden">
            <div className="h-1 bg-info" />
            <CardContent className="pt-5 space-y-4">
              <div>
                <h4 className="font-semibold text-foreground text-lg mb-2">{ls.style}</h4>
                <p className="text-foreground/80 leading-relaxed">{ls.description}</p>
              </div>
              {ls.how_your_brain_learns && (
                <div className="border-t border-border pt-4">
                  <h4 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                    <span className="text-lg">🧠</span> How Your Brain Learns
                  </h4>
                  {ls.how_your_brain_learns.split("\n").filter(Boolean).map((p, i) => (
                    <p key={i} className="text-foreground/70 leading-relaxed mb-2">{p}</p>
                  ))}
                </div>
              )}
              {ls.tips && ls.tips.length > 0 && (
                <div className="rounded-xl bg-accent/5 border border-accent/15 p-4">
                  <h4 className="font-semibold text-accent mb-2 flex items-center gap-2 text-sm">
                    <Lightbulb className="w-4 h-4" /> Learning Tips
                  </h4>
                  <ul className="space-y-1.5">
                    {ls.tips.map((tip, i) => (
                      <li key={i} className="text-sm text-foreground/70 flex items-start gap-2">
                        <span className="text-accent mt-0.5">✓</span> {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {ls.pitfalls && ls.pitfalls.length > 0 && (
                <div className="rounded-xl bg-warning/5 border border-warning/15 p-4">
                  <h4 className="font-semibold text-warning mb-2 flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4" /> Pitfalls to Avoid
                  </h4>
                  <ul className="space-y-1.5">
                    {ls.pitfalls.map((p, i) => (
                      <li key={i} className="text-sm text-foreground/70 flex items-start gap-2">
                        <span className="text-warning mt-0.5">⚠</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {ls.ideal_study_environment && (
                <div className="border-t border-border pt-4">
                  <h4 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                    <span className="text-lg">📚</span> Ideal Study Environment
                  </h4>
                  <p className="text-foreground/70 leading-relaxed">{ls.ideal_study_environment}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Business Aptitude */}
      {ba && ba.length > 0 && (
        <motion.div custom={sectionIdx++} variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
          <SectionTitle icon={Shield} title="Business Aptitude" subtitle="Your natural strengths in the professional world" />
          <div className="space-y-4">
            {ba.map((rawItem, i) => {
              const item = rawItem as BusinessAptitude;
              const sColor = strengthColor[item.strength?.toLowerCase()] || "text-muted-foreground";
              return (
                <motion.div key={i} custom={sectionIdx + i * 0.3} variants={fadeUp} initial="hidden" animate="visible">
                  <Card className="border-border overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="pt-5">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-foreground">{item.area}</h4>
                        <span className={`text-xs font-bold uppercase ${sColor}`}>{item.strength}</span>
                      </div>
                      {item.score_percentage !== undefined && (
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Score</span>
                            <span>{item.score_percentage}%</span>
                          </div>
                          <Progress value={item.score_percentage} className="h-2" />
                        </div>
                      )}
                      <p className="text-sm text-foreground/70 leading-relaxed mb-3">{item.detail}</p>
                      {item.real_world_example && (
                        <div className="rounded-xl bg-card border border-border p-3 mb-3 text-sm">
                          <p className="font-medium text-foreground mb-1">💡 Real-world Example</p>
                          <p className="text-foreground/70 leading-relaxed">{item.real_world_example}</p>
                        </div>
                      )}
                      {item.action_step && (
                        <div className="rounded-xl bg-accent/5 border border-accent/15 p-3 text-sm">
                          <p className="font-medium text-accent mb-1 flex items-center gap-1.5">
                            <ChevronRight className="w-3.5 h-3.5" /> Action Step
                          </p>
                          <p className="text-foreground/70 leading-relaxed">{item.action_step}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Communication Style */}
      {comm && (
        <motion.div custom={sectionIdx++} variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
          <SectionTitle icon={MessageCircle} title="Communication Style" subtitle="How you connect and express ideas" />
          <Card className="border-primary/20 overflow-hidden">
            <div className="h-1 bg-primary" />
            <CardContent className="pt-5 space-y-4">
              <div>
                <h4 className="font-semibold text-foreground text-lg mb-2">{comm.type}</h4>
                <p className="text-foreground/80 leading-relaxed">{comm.description}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl bg-accent/5 border border-accent/15 p-3">
                  <p className="text-xs font-bold text-accent mb-2">Strengths</p>
                  {comm.strengths?.map((s, i) => (
                    <p key={i} className="text-sm text-foreground/70">✓ {s}</p>
                  ))}
                </div>
                <div className="rounded-xl bg-warning/5 border border-warning/15 p-3">
                  <p className="text-xs font-bold text-warning mb-2">Growth Areas</p>
                  {comm.growth_areas?.map((g, i) => (
                    <p key={i} className="text-sm text-foreground/70">→ {g}</p>
                  ))}
                </div>
              </div>
              {comm.in_relationships && (
                <div className="border-t border-border pt-4">
                  <h4 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                    <span className="text-lg">❤️</span> In Relationships
                  </h4>
                  <p className="text-foreground/70 leading-relaxed">{comm.in_relationships}</p>
                </div>
              )}
              {comm.at_work && (
                <div className="border-t border-border pt-4">
                  <h4 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                    <span className="text-lg">💼</span> At Work
                  </h4>
                  <p className="text-foreground/70 leading-relaxed">{comm.at_work}</p>
                </div>
              )}
              {comm.under_stress && (
                <div className="border-t border-border pt-4">
                  <h4 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                    <span className="text-lg">⚡</span> Under Stress
                  </h4>
                  <p className="text-foreground/70 leading-relaxed">{comm.under_stress}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Growth Roadmap */}
      {gp && gp.length > 0 && (
        <motion.div custom={sectionIdx++} variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
          <SectionTitle icon={TrendingUp} title="Your Growth Roadmap" subtitle="A phased plan to unlock your potential" />
          <div className="space-y-3">
            {gp.map((item, i) => {
              const colors = ["bg-accent", "bg-primary", "bg-info", "bg-warning", "bg-accent", "bg-primary"];
              return (
                <Card key={i} className="border-border overflow-hidden">
                  <div className={`h-1 ${colors[i % colors.length]}`} />
                  <CardContent className="pt-4">
                    <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                      <ChevronRight className="w-4 h-4 text-primary" />
                      {item.milestone}
                    </h4>
                    <span className="text-xs text-info font-medium">{item.timeline}</span>
                    <p className="text-sm text-foreground/70 leading-relaxed mt-2">{item.action}</p>
                    {item.expected_outcome && (
                      <p className="text-sm text-accent mt-2 font-medium">🎯 {item.expected_outcome}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Historical Figures */}
      {hf && hf.length > 0 && (
        <motion.div custom={sectionIdx++} variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
          <SectionTitle icon={Users} title="Minds Like Yours" subtitle="Historical figures who share your cognitive profile" />
          <div className="space-y-4">
            {hf.map((item, i) => (
              <motion.div key={i} custom={sectionIdx + i * 0.3} variants={fadeUp} initial="hidden" animate="visible">
                <Card className="border-border overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="pt-5">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-foreground">{item.name}</h4>
                      <span className="text-xs text-muted-foreground">Est. IQ: {item.estimated_iq}</span>
                    </div>
                    <p className="text-sm text-accent font-medium mb-2">{item.connection}</p>
                    {item.what_you_share && (
                      <div className="text-sm mb-3">
                        <p className="font-medium text-foreground mb-1">What You Share</p>
                        <p className="text-foreground/70 leading-relaxed">{item.what_you_share}</p>
                      </div>
                    )}
                    {item.key_lesson && (
                      <div className="rounded-xl bg-primary/5 border border-primary/15 p-3 text-sm">
                        <p className="font-medium text-primary mb-1 flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5" /> Key Lesson
                        </p>
                        <p className="text-foreground/70 leading-relaxed">{item.key_lesson}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Ideal Environments */}
      {ie && (
        <motion.div custom={sectionIdx++} variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
          <SectionTitle icon={Globe} title="Ideal Environments" subtitle="Where your mind performs at its peak" />
          <div className="grid gap-3 md:grid-cols-3">
            {[ie.work, ie.social, ie.creative].filter(Boolean).map((env, i) => (
              <Card key={i} className="border-border overflow-hidden">
                <div className={`h-1 ${["bg-accent", "bg-primary", "bg-info"][i]}`} />
                <CardContent className="pt-4">
                  <span className="text-2xl mb-2 block">{env.emoji}</span>
                  <h4 className="font-semibold text-foreground mb-2">{env.title}</h4>
                  <p className="text-sm text-foreground/70 leading-relaxed">{env.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Fun Facts */}
      {ff && ff.length > 0 && (
        <motion.div custom={sectionIdx++} variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
          <SectionTitle icon={Sparkles} title="Brain Booster Facts" />
          <div className="grid gap-3 md:grid-cols-2">
            {ff.map((rawFact, i) => {
              const fact = typeof rawFact === "string" ? { emoji: "🧠", fact: rawFact } : rawFact;
              return (
                <Card key={i} className="border-border">
                  <CardContent className="pt-5 flex items-start gap-3">
                    <span className="text-xl">{fact.emoji}</span>
                    <p className="text-sm text-foreground/80 leading-relaxed">{fact.fact}</p>
                  </CardContent>
                </Card>
              );
            })}
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
    <Card className="border-border h-full">
      <CardContent className="pt-4 pb-4 flex flex-col items-center justify-center text-center gap-1 h-full">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="text-sm md:text-lg font-bold text-foreground leading-tight line-clamp-2">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  );
}
