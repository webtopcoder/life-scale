import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, BookOpen, CheckCircle2, Circle } from "lucide-react";
import QuizRunner from "./QuizRunner";

interface Module { title: string; content: string; type: string; }
interface QuizQuestion { question: string; type: string; options?: string[]; correct: number | boolean; }

interface LessonViewerProps {
  title: string;
  modules: Module[];
  quiz: QuizQuestion[];
  xpReward: number;
  onComplete: (score: number) => void;
  onClose: () => void;
}

export default function LessonViewer({ title, modules, quiz, xpReward, onComplete, onClose }: LessonViewerProps) {
  const [step, setStep] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [visitedModules, setVisitedModules] = useState<Set<number>>(new Set([0]));

  const markVisited = (idx: number) => {
    setVisitedModules(prev => new Set(prev).add(idx));
  };

  const goTo = (idx: number) => {
    setStep(idx);
    markVisited(idx);
  };

  const progressPercent = modules.length > 0 ? Math.round((visitedModules.size / modules.length) * 100) : 0;
  const allModulesVisited = visitedModules.size >= modules.length;

  if (showQuiz) {
    return <QuizRunner questions={quiz} xpReward={xpReward} onComplete={onComplete} onClose={onClose} />;
  }

  const mod = modules[step];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-lg">{title}</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
      </div>

      {/* Progress bar */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Module {step + 1} of {modules.length}</span>
          <span>{progressPercent}% read</span>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>

      <div className="flex gap-6">
        {/* Sidebar - module list */}
        <div className="hidden md:block w-56 shrink-0">
          <nav className="space-y-1 sticky top-4">
            {modules.map((m, i) => {
              const isActive = i === step;
              const isVisited = visitedModules.has(i);
              return (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                    isActive ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isVisited ? (
                      <CheckCircle2 className={`w-4 h-4 ${isActive ? "text-primary" : "text-accent"}`} />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground/50" />
                    )}
                  </div>
                  <span className={`font-medium leading-tight line-clamp-2 ${isActive ? "text-primary" : ""}`}>
                    {m.title}
                  </span>
                </button>
              );
            })}
            {/* Quiz entry in sidebar */}
            <div className="pt-2 border-t border-border mt-2">
              <button
                onClick={() => allModulesVisited && setShowQuiz(true)}
                disabled={!allModulesVisited}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                  allModulesVisited ? "hover:bg-muted/50" : "opacity-40 cursor-not-allowed"
                }`}
              >
                <Badge variant="secondary" className="text-[10px] px-1.5">Quiz</Badge>
                <span className="font-medium text-sm">Final Quiz</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Main content area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardContent className="p-5 md:p-8">
                  <Badge variant="outline" className="mb-3 text-xs capitalize">{mod.type}</Badge>
                  <h3 className="text-xl font-semibold mb-4">{mod.title}</h3>
                  <div className="text-foreground/80 leading-relaxed text-base whitespace-pre-line">
                    {mod.content}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => goTo(step - 1)} disabled={step === 0}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            {step < modules.length - 1 ? (
              <Button onClick={() => goTo(step + 1)}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={() => setShowQuiz(true)} disabled={!allModulesVisited}>
                {allModulesVisited ? "Take Quiz" : `Read all modules first (${visitedModules.size}/${modules.length})`}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>

          {/* Mobile module dots */}
          <div className="flex justify-center gap-1.5 mt-4 md:hidden">
            {modules.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  i === step ? "bg-primary" : visitedModules.has(i) ? "bg-accent" : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
