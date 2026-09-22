import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  question: string;
  type: string;
  options?: string[];
  correct: number | boolean;
}

interface QuizRunnerProps {
  questions: QuizQuestion[];
  xpReward: number;
  onComplete: (score: number) => void;
  onClose: () => void;
}

export default function QuizRunner({ questions, xpReward, onComplete, onClose }: QuizRunnerProps) {
  const [current, setCurrent] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | boolean | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [answers, setAnswers] = useState<(number | boolean)[]>([]);
  const [showResult, setShowResult] = useState(false);

  const q = questions[current];
  const isCorrect = selectedAnswer === q?.correct;
  const progressPercent = questions.length > 0 ? Math.round(((current + 1) / questions.length) * 100) : 0;

  const handleConfirm = () => {
    if (selectedAnswer === null) return;
    setConfirmed(true);
  };

  const handleNext = () => {
    const newAnswers = [...answers, selectedAnswer as number | boolean];
    setAnswers(newAnswers);

    if (current < questions.length - 1) {
      setCurrent(prev => prev + 1);
      setSelectedAnswer(null);
      setConfirmed(false);
    } else {
      const correct = newAnswers.reduce<number>((sum, ans, i) => sum + (ans === questions[i].correct ? 1 : 0), 0);
      const score = Math.round((correct / questions.length) * 100);
      setShowResult(true);
      if (score >= 70) onComplete(score);
    }
  };

  if (showResult) {
    const correct = answers.reduce<number>((sum, ans, i) => sum + (ans === questions[i].correct ? 1 : 0), 0);
    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= 70;

    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md mx-auto text-center">
        <Card>
          <CardContent className="p-8">
            <div className={cn(
              "w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4",
              passed ? "bg-accent/20" : "bg-destructive/20"
            )}>
              {passed ? <Trophy className="w-10 h-10 text-accent" /> : <XCircle className="w-10 h-10 text-destructive" />}
            </div>
            <h2 className="text-2xl font-bold mb-2">{passed ? "🎉 Quiz Passed!" : "Not quite yet"}</h2>
            <p className="text-3xl font-bold mb-1">{score}%</p>
            <p className="text-muted-foreground mb-1">{correct}/{questions.length} correct</p>
            {passed && <p className="text-accent font-semibold mb-4">+{xpReward} BrainPoints earned!</p>}
            {!passed && <p className="text-muted-foreground mb-4">You need 70% to pass. Review the material and try again.</p>}
            <Button onClick={onClose} className="w-full">{passed ? "Continue" : "Close"}</Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3 md:space-y-6">
      {/* Progress header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Quiz</span>
          <span>Question {current + 1} of {questions.length}</span>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-bold">{q.question}</h3>

          {q.type === "multiple_choice" && q.options && (
            <div className="space-y-2">
              {q.options.map((opt, i) => {
                const isSelected = selectedAnswer === i;
                const showCorrect = confirmed && i === q.correct;
                const showWrong = confirmed && isSelected && !isCorrect;

                return (
                  <button
                    key={i}
                    onClick={() => !confirmed && setSelectedAnswer(i)}
                    disabled={confirmed}
                    className={cn(
                      "w-full text-left px-3 md:px-4 py-2 md:py-3 rounded-lg border text-sm font-medium transition-all",
                      !confirmed && isSelected && "border-primary bg-primary/10",
                      !confirmed && !isSelected && "border-border hover:border-primary/30 hover:bg-muted/50",
                      showCorrect && "border-accent bg-accent/10 text-accent",
                      showWrong && "border-destructive bg-destructive/10 text-destructive",
                      confirmed && !showCorrect && !showWrong && "opacity-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs shrink-0">
                        {showCorrect ? <CheckCircle2 className="w-4 h-4 text-accent" /> :
                         showWrong ? <XCircle className="w-4 h-4 text-destructive" /> :
                         String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {q.type === "true_false" && (
            <div className="flex gap-3">
              {[true, false].map(val => {
                const isSelected = selectedAnswer === val;
                const showCorrect = confirmed && val === q.correct;
                const showWrong = confirmed && isSelected && selectedAnswer !== q.correct;
                return (
                  <button
                    key={String(val)}
                    onClick={() => !confirmed && setSelectedAnswer(val)}
                    disabled={confirmed}
                    className={cn(
                      "flex-1 py-3 rounded-lg border text-sm font-medium transition-all",
                      !confirmed && isSelected && "border-primary bg-primary/10",
                      !confirmed && !isSelected && "border-border hover:border-primary/30 hover:bg-muted/50",
                      showCorrect && "border-accent bg-accent/10 text-accent",
                      showWrong && "border-destructive bg-destructive/10 text-destructive",
                      confirmed && !showCorrect && !showWrong && "opacity-50"
                    )}
                  >
                    {val ? "True" : "False"}
                  </button>
                );
              })}
            </div>
          )}

          {/* Feedback after confirming */}
          {confirmed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className={cn(
                "rounded-lg border p-3 text-sm",
                isCorrect ? "bg-accent/10 border-accent/20" : "bg-destructive/10 border-destructive/20"
              )}
            >
              <p className="font-semibold">
                {isCorrect ? "✓ Correct!" : "✗ Incorrect"}
              </p>
            </motion.div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            {!confirmed ? (
              <Button onClick={handleConfirm} disabled={selectedAnswer === null}>
                Check Answer
              </Button>
            ) : (
              <Button onClick={handleNext}>
                {current < questions.length - 1 ? "Next Question" : "See Results"}
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
