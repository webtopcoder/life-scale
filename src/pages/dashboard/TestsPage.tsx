import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { usePostHog } from "@posthog/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Clock, Sparkles, Heart, Briefcase, Star, Users, Focus, Smile, MemoryStick, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import LikertTest, { LikertTestResult } from "@/components/dashboard/LikertTest";
import { LIKERT_TESTS, LikertTestDef } from "@/data/likert-tests";
import { api } from "@/integrations/api/client";
import { cognitoAuth } from "@/integrations/api/cognitoAuth";
import { addXP, insertLikertResult } from "@/services/dashboardService";
import { showXpToast } from "@/lib/xpToast";
import { toast } from "sonner";
import CelebrationOverlay from "@/components/dashboard/CelebrationOverlay";
import { useAuth } from "@/context/AuthContext";
import { EVENTS, trackEvent } from "@/constants/analytics";

interface TestDef {
  id: string;
  title: string;
  description: string;
  duration: string;
  questions: number;
  available: boolean;
  path: string;
  tag?: string;
  icon: LucideIcon;
  rating?: number;
  reviewCount?: string;
  likertId?: string;
}

const TESTS: TestDef[] = [
  {
    id: "iq",
    title: "How Smart Am I?",
    description: "Find out how your brain stacks up.",
    duration: "15 min",
    questions: 25,
    available: true,
    path: "/intro",
    tag: "Most Popular",
    icon: Brain,
    rating: 4.9,
    reviewCount: "24.1k",
  },
  {
    id: "adhd",
    title: "Do I Have ADHD Traits?",
    description: "Assess your focus, attention, and impulsivity patterns.",
    duration: "8 min",
    questions: 18,
    available: true,
    path: "#",
    tag: "New",
    icon: Focus,
    rating: 4.7,
    reviewCount: "14.2k",
    likertId: "adhd",
  },
  {
    id: "anxiety",
    title: "How Anxious Am I?",
    description: "Understand your anxiety patterns and stress responses.",
    duration: "7 min",
    questions: 15,
    available: true,
    path: "#",
    tag: "Popular",
    icon: Heart,
    rating: 4.8,
    reviewCount: "18.7k",
    likertId: "anxiety",
  },
  {
    id: "eq",
    title: "Am I Emotionally Intelligent?",
    description: "Measure your ability to understand and manage emotions.",
    duration: "10 min",
    questions: 20,
    available: true,
    path: "#",
    icon: Smile,
    rating: 4.6,
    reviewCount: "11.3k",
    likertId: "eq",
  },
  {
    id: "memory",
    title: "How's My Memory?",
    description: "Evaluate your memory patterns and recall ability.",
    duration: "6 min",
    questions: 14,
    available: true,
    path: "#",
    icon: MemoryStick,
    rating: 4.5,
    reviewCount: "9.8k",
    likertId: "memory",
  },
  {
    id: "personality",
    title: "Who Am I?",
    description: "Understand what makes you, you.",
    duration: "20 min",
    questions: 50,
    available: false,
    path: "#",
    tag: "Coming Soon",
    icon: Sparkles,
  },
  {
    id: "career",
    title: "What Should I Do?",
    description: "Discover work that fits who you are.",
    duration: "25 min",
    questions: 35,
    available: false,
    path: "#",
    tag: "Coming Soon",
    icon: Briefcase,
  },
];

export default function TestsPage() {
  const posthog = usePostHog();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeLikert, setActiveLikert] = useState<LikertTestDef | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedIQ, setCompletedIQ] = useState(false);
  const savingRef = useRef(false);
  const [completedLikertIds, setCompletedLikertIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    // Check IQ completion
    api.get<Array<{ id: string; testType?: string; test_type?: string }>>("/dashboard/reports")
      .then((data) => {
        const hasIQ = data?.some(r => (r.testType ?? r.test_type) === "iq");
        if (hasIQ) setCompletedIQ(true);
      })
      .catch(console.error);
    // Check Likert completions
    api.get<Array<{ testId?: string; test_id?: string }>>("/dashboard/likert-results")
      .then((data) => {
        if (data) setCompletedLikertIds(new Set(data.map((r) => r.testId ?? r.test_id).filter(Boolean)));
      })
      .catch(console.error);
  }, [user]);

  const handleLikertComplete = async (result: LikertTestResult) => {
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      const user = await cognitoAuth.getAuthUser();
      if (!user) return;

      const { firstCompletion } = await insertLikertResult({
        testId: result.testId,
        totalScore: result.totalScore,
        maxScore: result.maxScore,
        percentage: result.percentage,
        resultLabel: result.resultLabel,
        answersJson: result.answers,
      });

      // BrainPoints are only awarded the first time a test is completed.
      if (firstCompletion) {
        await addXP(user.id, 25);
        showXpToast({ amount: 25, label: "Test complete" });
      }


      trackEvent(posthog, EVENTS.ACTIVITY_COMPLETED, {
        activity_type: "test",
        test_id: result.testId,
        percentage: result.percentage,
        result_label: result.resultLabel,
        total_score: result.totalScore,
        max_score: result.maxScore,
      });

      // Mark as completed locally
      setCompletedLikertIds(prev => new Set(prev).add(result.testId));

      // Show celebration
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    } catch (err) {
      console.error("Error completing likert test:", err);
      toast.error("Could not save your results. Please try again.");
    } finally {
      savingRef.current = false;
    }
  };

  if (activeLikert) {
    return (
      <>
        {showCelebration && (
          <CelebrationOverlay
            event={{
              type: "activity_complete",
              title: "Assessment Complete!",
              message: "Great job finishing the self-assessment.",
              xp: 25,
            }}
            onDismiss={() => setShowCelebration(false)}
          />
        )}
        <LikertTest test={activeLikert} onClose={() => setActiveLikert(null)} onComplete={handleLikertComplete} />
      </>
    );
  }

  const handleTestClick = (test: TestDef) => {
    if (!test.available) return;
    trackEvent(posthog, EVENTS.ACTIVITY_STARTED, {
      activity_type: "test",
      test_id: test.id,
      test_title: test.title,
      is_likert: !!test.likertId,
    });
    if (test.likertId) {
      const likert = LIKERT_TESTS.find(l => l.id === test.likertId);
      if (likert) {
        setActiveLikert(likert);
        return;
      }
    }
    navigate(test.path);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl md:text-2xl font-bold mb-0.5">Tests</h1>
        <p className="text-sm text-muted-foreground">Take assessments to discover your cognitive strengths</p>
      </div>

      <div className="grid gap-3">
        {TESTS.map((test) => {
          const isHero = test.id === "iq";
          const isCompleted = (test.id === "iq" && completedIQ) || (!!test.likertId && completedLikertIds.has(test.likertId));
          const isAvailable = test.available && !isCompleted;
          return (
            <Card
              key={test.id}
              className={`transition-all ${
                isCompleted
                  ? "opacity-70 border-green-500/30 bg-green-500/5"
                  : isHero
                    ? "border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent shadow-md hover:shadow-lg cursor-pointer ring-1 ring-primary/20"
                    : isAvailable
                      ? "hover:shadow-md cursor-pointer"
                      : "opacity-60"
              }`}
              onClick={() => !isCompleted && handleTestClick(test)}
            >
              <CardContent className={`p-4 flex items-start gap-3 ${isHero ? "py-5" : ""}`}>
                <div className={`rounded-xl flex items-center justify-center shrink-0 ${
                  isCompleted
                    ? "w-12 h-12 bg-green-500/15"
                    : isHero
                      ? "w-12 h-12 bg-primary/15"
                      : isAvailable
                        ? "w-10 h-10 bg-primary/10"
                        : "w-10 h-10 bg-muted"
                }`}>
                  {isCompleted
                    ? <CheckCircle2 className="w-6 h-6 text-green-500" />
                    : isHero
                      ? <test.icon className="w-6 h-6 text-primary" />
                      : isAvailable
                        ? <test.icon className="w-5 h-5 text-primary" />
                        : <test.icon className="w-5 h-5 text-muted-foreground" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <h3 className={`font-semibold ${isHero ? "text-base" : "text-sm"}`}>{test.title}</h3>
                    {isCompleted ? (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-500/20 text-green-600 border-green-500/30">
                        Completed
                      </Badge>
                    ) : test.tag ? (
                      <Badge
                        variant={isAvailable ? "default" : "secondary"}
                        className={`text-[10px] px-1.5 py-0 ${isHero ? "bg-primary text-primary-foreground" : ""}`}
                      >
                        {test.tag}
                      </Badge>
                    ) : null}
                  </div>
                  <p className={`text-muted-foreground mb-2 ${isHero ? "text-sm" : "text-xs"}`}>{test.description}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2 sm:gap-3 text-[11px] text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{test.duration}</span>
                      <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" />{test.questions}q</span>
                      {test.rating && (
                        <span className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-warning fill-warning" />{test.rating}
                        </span>
                      )}
                      {test.reviewCount && (
                        <span className="hidden sm:flex items-center gap-0.5">
                          <Users className="w-3 h-3" />{test.reviewCount}
                        </span>
                      )}
                    </div>
                    {isCompleted ? (
                      <span className="text-xs text-green-600 font-medium ml-auto flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Done
                      </span>
                    ) : isAvailable ? (
                      <Button
                        size="sm"
                        className={`shrink-0 text-xs ml-auto ${isHero ? "h-8 px-5 font-semibold" : "h-7 px-3"}`}
                      >
                        Start
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
