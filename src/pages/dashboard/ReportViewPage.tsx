import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/integrations/api/client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CategoryScores, Category } from "@/types/funnel";
import { getStrongestCategory, getSecondaryCategory, scoreToPercentile } from "@/engine/scoringEngine";
import { ChevronLeft, ChevronRight, Lock, ArrowLeft } from "lucide-react";

import {
  SECTIONS_CONFIG,
  ScoreRevealSection,
  CategoryBreakdownSection,
  DeepDiveStrengthSection,
  PopulationComparisonSection,
  CognitiveAgeSection,
  StrengthsProfileSection,
  WeaknessAnalysisSection,
  CareerInsightsSection,
  LearningStyleSection,
  PersonalityMatrixSection,
  DecisionMakingSection,
  MemoryProcessingSection,
  BrainHealthSection,
  CognitiveTrajectorySection,
  BrainGrowthPlanSection,
} from "@/pages/ReportPage";
import GeographicSection from "@/components/report/GeographicSection";
import CertificateSection from "@/components/report/CertificateSection";
import ShareModal from "@/components/report/ShareModal";

export default function ReportViewPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!user || !reportId) return;
    (async () => {
      try {
        const data = await api.get<Record<string, unknown>>(
          `/dashboard/reports/${reportId}`,
        );
        setReport(data);
      } catch {
        setReport(null);
      }
      setLoading(false);
    })();
  }, [user, reportId]);

  const [currentSection, setCurrentSection] = useState(0);
  const [unlockedSections, setUnlockedSections] = useState(SECTIONS_CONFIG.length);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const scrollMainToTop = useCallback(() => {
    const main =
      (document.getElementById("dashboard-scroll-container") as HTMLElement | null) ??
      (pageRef.current?.closest("main") as HTMLElement | null);

    if (main) {
      main.scrollTop = 0;
      main.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, []);

  const goToNext = useCallback(() => {
    if (currentSection >= SECTIONS_CONFIG.length - 1) return;
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();

    setIsTransitioning(true);
    setTimeout(() => {
      const next = currentSection + 1;
      setCurrentSection(next);
      setUnlockedSections((s) => Math.max(s, next + 1));
      setIsTransitioning(false);
      requestAnimationFrame(() => requestAnimationFrame(scrollMainToTop));
    }, 300);
  }, [currentSection, scrollMainToTop]);

  const goToSection = (index: number) => {
    if (index >= unlockedSections) return;
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();

    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSection(index);
      setIsTransitioning(false);
      requestAnimationFrame(() => requestAnimationFrame(scrollMainToTop));
    }, 300);
  };

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(scrollMainToTop));
  }, [currentSection, scrollMainToTop]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12 space-y-3">
        <h2 className="text-lg font-semibold">Report not found</h2>
        <Button variant="ghost" onClick={() => navigate("/main-dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  // Derive data from DB row
  const scores: CategoryScores = (report.scores as CategoryScores) || {
    logic: 0,
    pattern: 0,
    spatial: 0,
    speed: 0,
    self: 0,
  };
  const finalScore = report.final_score || 0;
  const rawPercentile = finalScore ? scoreToPercentile(finalScore) : 0;
  const percentile = Math.max(rawPercentile, 92);
  const strongest = getStrongestCategory(scores);
  const secondary = getSecondaryCategory(scores);

  const renderSection = () => {
    switch (SECTIONS_CONFIG[currentSection].id) {
      case "score":
        return <ScoreRevealSection finalScore={finalScore} />;
      case "breakdown":
        return <CategoryBreakdownSection scores={scores} finalScore={finalScore} />;
      case "deepdive":
        return <DeepDiveStrengthSection strongest={strongest} scores={scores} finalScore={finalScore} />;
      case "comparison":
        return <PopulationComparisonSection finalScore={finalScore} percentile={percentile} />;
      case "geographic":
        return <GeographicSection finalScore={finalScore} percentile={percentile} />;
      case "cognitive-age":
        return <CognitiveAgeSection finalScore={finalScore} />;
      case "strengths":
        return <StrengthsProfileSection scores={scores} strongest={strongest} secondary={secondary} />;
      case "weakness":
        return <WeaknessAnalysisSection scores={scores} finalScore={finalScore} />;
      case "career":
        return <CareerInsightsSection strongest={strongest} secondary={secondary} />;
      case "learning":
        return <LearningStyleSection strongest={strongest} />;
      case "matrix":
        return <PersonalityMatrixSection scores={scores} finalScore={finalScore} />;
      case "decision":
        return <DecisionMakingSection scores={scores} strongest={strongest} finalScore={finalScore} />;
      case "memory":
        return <MemoryProcessingSection scores={scores} finalScore={finalScore} />;
      case "health":
        return <BrainHealthSection finalScore={finalScore} />;
      case "trajectory":
        return <CognitiveTrajectorySection finalScore={finalScore} />;
      case "certificate":
        return <CertificateSection finalScore={finalScore} percentile={percentile} strongest={strongest} />;
      case "growth-plan":
        return <BrainGrowthPlanSection scores={scores} strongest={strongest} finalScore={finalScore} />;
      default:
        return null;
    }
  };

  const progressPercent = ((currentSection + 1) / SECTIONS_CONFIG.length) * 100;

  return (
    <div ref={pageRef} className="max-w-2xl mx-auto pb-8">
      {/* Back link */}
      <button
        onClick={() => navigate("/main-dashboard")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      {/* Progress header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium text-muted-foreground">
            Section {currentSection + 1} of {SECTIONS_CONFIG.length}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs font-medium text-primary">
              {SECTIONS_CONFIG[currentSection].title}
            </div>
            <ShareModal finalScore={finalScore} />
          </div>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>

      {/* Section navigation dots */}
      <div className="flex items-center justify-center gap-1 mb-8 flex-wrap">
        {SECTIONS_CONFIG.map((section, i) => {
          const Icon = section.icon;
          const isUnlocked = i < unlockedSections;
          const isCurrent = i === currentSection;
          return (
            <button
              key={section.id}
              onClick={() => goToSection(i)}
              disabled={!isUnlocked}
              className={`flex items-center gap-0.5 px-2 py-1.5 rounded-full text-[10px] font-medium transition-all duration-200 ${
                isCurrent
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : isUnlocked
                  ? "bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer"
                  : "bg-muted/30 text-muted-foreground/40 cursor-not-allowed"
              }`}
            >
              {isUnlocked ? <Icon className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              <span className="hidden lg:inline">{section.title}</span>
            </button>
          );
        })}
      </div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        className="flex items-center justify-center gap-1.5 mb-4"
      >
        <motion.div animate={{ y: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 rotate-90" />
        </motion.div>
        <span className="text-xs text-muted-foreground/50">Scroll down to read more</span>
        <motion.div animate={{ y: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 rotate-90" />
        </motion.div>
      </motion.div>

      {/* Section content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isTransitioning ? 0 : 1, y: isTransitioning ? 20 : 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
        >
          {renderSection()}
        </motion.div>
      </AnimatePresence>

      {/* Inline navigation (not fixed, since dashboard has its own chrome) */}
      <div className="mt-8 flex gap-2">
        {currentSection > 0 && (
          <Button
            variant="outline"
            onClick={() => goToSection(currentSection - 1)}
            className="h-12 px-4 rounded-xl"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline ml-1">Back</span>
          </Button>
        )}
        {currentSection < SECTIONS_CONFIG.length - 1 ? (
          <Button
            onClick={goToNext}
            className="flex-1 h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg"
          >
            {currentSection === 0
              ? "Reveal Your Breakdown"
              : `Next: ${SECTIONS_CONFIG[currentSection + 1].title}`}
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => navigate("/main-dashboard")}
            className="flex-1 h-12 text-base font-semibold rounded-xl"
          >
            Back to Dashboard
          </Button>
        )}
      </div>
    </div>
  );
}
