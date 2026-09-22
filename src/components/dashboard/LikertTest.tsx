import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, AlertTriangle, Star, Clock, Users, Lightbulb, RotateCcw, Sparkles } from "lucide-react";
import { LikertTestDef, LikertResult } from "@/data/likert-tests";

export interface LikertTestResult {
  testId: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  resultLabel: string;
  answers: Record<number, number>;
}

interface LikertTestProps {
  test: LikertTestDef;
  onClose: () => void;
  onComplete?: (result: LikertTestResult) => void;
}

const LIKERT_OPTIONS = [
  { label: "Strongly Disagree", value: 1 },
  { label: "Disagree", value: 2 },
  { label: "Neutral", value: 3 },
  { label: "Agree", value: 4 },
  { label: "Strongly Agree", value: 5 },
];

type Phase = "intro" | "questions" | "result";

export default function LikertTest({ test, onClose, onComplete }: LikertTestProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [completedCalled, setCompletedCalled] = useState(false);
  const isTransitioning = useRef(false);

  const handleAnswer = (qId: number, value: number) => {
    if (isTransitioning.current) return;
    setAnswers(prev => ({ ...prev, [qId]: value }));
    isTransitioning.current = true;
    setTimeout(() => {
      if (currentQ < test.questions.length - 1) {
        setCurrentQ(c => c + 1);
      }
      isTransitioning.current = false;
    }, 300);
  };

  const totalScore = Object.entries(answers).reduce((sum, [qId, val]) => {
    const q = test.questions.find(q => q.id === Number(qId));
    return sum + (q?.reverse ? 6 - val : val);
  }, 0);

  const maxScore = test.questions.length * 5;
  const allAnswered = Object.keys(answers).length === test.questions.length;
  const percentage = Math.round((totalScore / maxScore) * 100);

  const getResult = (): LikertResult => {
    const sorted = [...test.results].sort((a, b) => b.minScore - a.minScore);
    return sorted.find(r => totalScore >= r.minScore) || test.results[0];
  };

  // Response distribution for the bar chart
  const responseDistribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]; // indices 0-4 for values 1-5
    Object.values(answers).forEach(v => { counts[v - 1]++; });
    const max = Math.max(...counts, 1);
    return LIKERT_OPTIONS.map((opt, i) => ({ label: opt.label, count: counts[i], pct: Math.round((counts[i] / max) * 100) }));
  }, [answers]);

  const handleShowResults = () => {
    setPhase("result");
    if (!completedCalled && onComplete) {
      setCompletedCalled(true);
      const result = getResult();
      onComplete({
        testId: test.id,
        totalScore,
        maxScore,
        percentage,
        resultLabel: result.label,
        answers,
      });
    }
  };

  const handleRetake = () => {
    setPhase("intro");
    setCurrentQ(0);
    setAnswers({});
    setCompletedCalled(false);
  };

  if (phase === "intro") {
    return (
      <div className="space-y-4 max-w-lg mx-auto">
        <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" onClick={onClose}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Card className="border-0 shadow-[var(--shadow-elevated)] overflow-hidden">
          <div className="h-1.5 w-full" style={{ background: "var(--gradient-primary)" }} />
          <CardContent className="p-6 text-center space-y-4">
            <h2 className="text-xl font-bold text-foreground">{test.title}</h2>
            <p className="text-sm text-muted-foreground">{test.description}</p>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{test.duration}</span>
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{test.reviewCount} taken</span>
              <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-warning fill-warning" />{test.rating}</span>
            </div>
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
              {test.disclaimer}
            </div>
            <Button onClick={() => setPhase("questions")} className="w-full h-12 text-base font-semibold rounded-xl">
              Start Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "result") {
    const result = getResult();
    const barColors = [
      "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-emerald-400", "bg-green-500",
    ];

    // SVG circular progress
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="space-y-5 max-w-lg mx-auto pb-8">
        <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" onClick={onClose}>
          <ArrowLeft className="w-4 h-4" /> Back to Tests
        </Button>

        {/* Hero Score */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="border-0 shadow-[var(--shadow-elevated)] overflow-hidden">
            <div className="h-2 w-full" style={{ backgroundColor: result.color }} />
            <CardContent className="p-6 text-center space-y-3">
              <div className="relative w-32 h-32 mx-auto">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                  <motion.circle
                    cx="64" cy="64" r={radius} fill="none"
                    stroke={result.color} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span
                    className="text-3xl font-black"
                    style={{ color: result.color }}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8, duration: 0.4 }}
                  >
                    {percentage}%
                  </motion.span>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-foreground">{result.label}</h2>
              <p className="text-xs text-muted-foreground">Score: {totalScore} / {maxScore}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* What This Means */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
          <Card className="border-0 shadow-[var(--shadow-card)] overflow-hidden">
            <div className="h-1 w-full" style={{ backgroundColor: result.color, opacity: 0.4 }} />
            <CardContent className="p-5 space-y-2">
              <h3 className="font-semibold text-sm text-foreground">What This Means</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{result.description}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Response Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }}>
          <Card className="border-0 shadow-[var(--shadow-card)]">
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold text-sm text-foreground">Your Responses at a Glance</h3>
              <div className="space-y-2">
                {responseDistribution.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-28 text-muted-foreground truncate text-right">{d.label}</span>
                    <div className="flex-1 h-5 bg-muted/50 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${barColors[i]}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${d.pct}%` }}
                        transition={{ duration: 0.6, delay: 0.5 + i * 0.08 }}
                      />
                    </div>
                    <span className="w-6 text-muted-foreground font-medium text-right">{d.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tips */}
        {result.tips && result.tips.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}>
            <Card className="border-0 shadow-[var(--shadow-card)]">
              <CardContent className="p-5 space-y-3">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-warning" /> Tips for You
                </h3>
                <ul className="space-y-2">
                  {result.tips.map((tip, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: result.color }} />
                      {tip}
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* XP Earned */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.5, type: "spring" }}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary">+25 BrainPoints Earned!</span>
          </div>
        </motion.div>

        {/* Disclaimer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
            {test.disclaimer}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="flex gap-3">
          <Button variant="outline" onClick={handleRetake} className="flex-1 h-11 rounded-xl gap-1.5">
            <RotateCcw className="w-4 h-4" /> Retake
          </Button>
          <Button onClick={onClose} className="flex-1 h-11 rounded-xl">
            Back to Tests
          </Button>
        </motion.div>
      </div>
    );
  }

  // Questions phase
  const q = test.questions[currentQ];
  const progress = ((currentQ + 1) / test.questions.length) * 100;

  const dotColors = [
    "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-lime-500", "bg-green-600",
  ];

  const cardBgs = [
    "border-red-200 bg-red-50 hover:bg-red-100",
    "border-orange-200 bg-orange-50 hover:bg-orange-100",
    "border-yellow-200 bg-yellow-50 hover:bg-yellow-100",
    "border-lime-200 bg-lime-50 hover:bg-lime-100",
    "border-green-300 bg-green-100 hover:bg-green-200",
  ];

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground font-medium">Question {currentQ + 1} of {test.questions.length}</span>
      </div>

      <Progress value={progress} className="h-2" />

      <AnimatePresence mode="wait">
        <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
          <Card className="border border-border/60 shadow-[var(--shadow-card)]">
            <CardContent className="p-5 md:p-8 space-y-5 md:space-y-8">
              <p className="text-base md:text-xl font-medium text-foreground leading-relaxed text-center">{q.text}</p>

              {/* Mobile: stacked rows */}
              <div className="flex flex-col gap-3 md:hidden">
                {LIKERT_OPTIONS.map((opt, idx) => {
                  const mobileBgs = [
                    "border-red-200 bg-red-50",
                    "border-orange-200 bg-orange-50",
                    "border-yellow-200 bg-yellow-50",
                    "border-lime-200 bg-lime-50",
                    "border-green-300 bg-green-100",
                  ];
                  const selected = answers[q.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleAnswer(q.id, opt.value)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-semibold transition-all border-2 ${mobileBgs[idx]} ${
                        selected
                          ? "ring-2 ring-primary ring-offset-1 scale-[1.02] shadow-sm"
                          : "opacity-85 hover:opacity-100"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex-shrink-0 ${dotColors[idx]} ${selected ? "scale-125" : ""} transition-transform`} />
                      <span className="text-black">{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Desktop: horizontal cards with dots */}
              <div className="hidden md:grid grid-cols-5 gap-3">
                {LIKERT_OPTIONS.map((opt, idx) => {
                  const selected = answers[q.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleAnswer(q.id, opt.value)}
                      className={`flex flex-col items-start justify-center gap-3 rounded-2xl border-2 p-5 min-h-[120px] transition-all cursor-pointer ${cardBgs[idx]} ${
                        selected
                          ? "ring-2 ring-primary ring-offset-2 scale-[1.03] shadow-md"
                          : "opacity-80 hover:opacity-100 hover:scale-[1.02]"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full ${dotColors[idx]} ${selected ? "scale-125" : ""} transition-transform`} />
                      <span className="text-sm font-semibold text-black text-left leading-tight">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Question dots */}
      <div className="flex items-center justify-center gap-1.5 py-2">
        {test.questions.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all ${
              i === currentQ
                ? "w-3 h-3 bg-primary"
                : answers[test.questions[i].id]
                  ? "w-2.5 h-2.5 bg-primary/40"
                  : "w-2.5 h-2.5 bg-muted-foreground/20"
            }`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between">
        {currentQ > 0 ? (
          <Button variant="ghost" size="sm" onClick={() => setCurrentQ(c => c - 1)} className="gap-1.5 text-base">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={onClose} className="gap-1.5 text-base">
            <ArrowLeft className="w-4 h-4" /> Exit
          </Button>
        )}
        <div className="flex gap-2">
          {currentQ < test.questions.length - 1 && answers[q.id] && (
            <Button variant="outline" size="sm" onClick={() => setCurrentQ(c => c + 1)} className="gap-1.5 text-base rounded-xl border-2">
              Skip <ArrowRight className="w-4 h-4" />
            </Button>
          )}
          {allAnswered && (
            <Button onClick={handleShowResults} className="gap-1 rounded-xl">
              See Results <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
