import { useState, useEffect } from "react";
import { usePostHog } from "@posthog/react";
import { useBrainScore } from "@/hooks/useBrainScore";
import { getBrainTeasers, BrainTeaser, type BranchTag } from "@/services/dashboardService";
import FilterBar from "@/components/dashboard/FilterBar";
import ContentCard from "@/components/dashboard/ContentCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, Eye, EyeOff, HelpCircle, CheckCircle, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { EVENTS, trackEvent } from "@/constants/analytics";
import GeniusDrill from "@/components/dashboard/drills/GeniusDrill";
import BrainHealthDrill from "@/components/dashboard/drills/BrainHealthDrill";

const GENIUS_KINDS = ["remote_associates", "analogy_chain", "alternate_uses", "what_if", "constraint_flip"];

/* ─── Visual Illusion SVG Renderer ─── */
function IllusionSvg({ type }: { type: string }) {
  switch (type) {
    case "muller_lyer":
      return (
        <svg viewBox="0 0 300 120" className="w-full max-w-[300px] mx-auto">
          <line x1={60} y1={35} x2={240} y2={35} stroke="hsl(var(--foreground))" strokeWidth={3} />
          <line x1={60} y1={35} x2={80} y2={15} stroke="hsl(var(--foreground))" strokeWidth={2} />
          <line x1={60} y1={35} x2={80} y2={55} stroke="hsl(var(--foreground))" strokeWidth={2} />
          <line x1={240} y1={35} x2={220} y2={15} stroke="hsl(var(--foreground))" strokeWidth={2} />
          <line x1={240} y1={35} x2={220} y2={55} stroke="hsl(var(--foreground))" strokeWidth={2} />
          <text x={20} y={40} fontSize={14} fill="hsl(var(--muted-foreground))">A</text>
          <line x1={60} y1={85} x2={240} y2={85} stroke="hsl(var(--foreground))" strokeWidth={3} />
          <line x1={60} y1={85} x2={40} y2={65} stroke="hsl(var(--foreground))" strokeWidth={2} />
          <line x1={60} y1={85} x2={40} y2={105} stroke="hsl(var(--foreground))" strokeWidth={2} />
          <line x1={240} y1={85} x2={260} y2={65} stroke="hsl(var(--foreground))" strokeWidth={2} />
          <line x1={240} y1={85} x2={260} y2={105} stroke="hsl(var(--foreground))" strokeWidth={2} />
          <text x={20} y={90} fontSize={14} fill="hsl(var(--muted-foreground))">B</text>
        </svg>
      );
    case "checker_shadow":
      return (
        <svg viewBox="0 0 200 200" className="w-full max-w-[200px] mx-auto">
          {Array.from({ length: 4 }, (_, r) =>
            Array.from({ length: 4 }, (_, c) => (
              <rect key={`${r}-${c}`} x={c * 45 + 10} y={r * 45 + 10} width={45} height={45}
                fill={(r + c) % 2 === 0 ? "hsl(220,10%,75%)" : "hsl(220,10%,40%)"} />
            ))
          )}
          <rect x={100} y={10} width={90} height={180} fill="hsl(220,20%,15%)" opacity={0.35} />
          <rect x={55} y={55} width={45} height={45} fill="hsl(220,10%,40%)" stroke="hsl(350,80%,55%)" strokeWidth={3} />
          <text x={67} y={84} fontSize={16} fontWeight="bold" fill="hsl(350,80%,55%)">A</text>
          <rect x={145} y={100} width={45} height={45} fill="hsl(220,10%,40%)" stroke="hsl(230,80%,56%)" strokeWidth={3} />
          <text x={157} y={129} fontSize={16} fontWeight="bold" fill="hsl(230,80%,56%)">B</text>
        </svg>
      );
    case "kanizsa":
      return (
        <svg viewBox="0 0 200 200" className="w-full max-w-[200px] mx-auto">
          {[
            { cx: 100, cy: 30, startAngle: 210, endAngle: 330 },
            { cx: 40, cy: 160, startAngle: 330, endAngle: 90 },
            { cx: 160, cy: 160, startAngle: 90, endAngle: 210 },
          ].map((pac, i) => {
            const r = 30;
            const sa = (pac.startAngle * Math.PI) / 180;
            const ea = (pac.endAngle * Math.PI) / 180;
            const x1 = pac.cx + r * Math.cos(sa);
            const y1 = pac.cy + r * Math.sin(sa);
            const x2 = pac.cx + r * Math.cos(ea);
            const y2 = pac.cy + r * Math.sin(ea);
            return (
              <path key={i}
                d={`M${pac.cx},${pac.cy} L${x1},${y1} A${r},${r} 0 1,1 ${x2},${y2} Z`}
                fill="hsl(230,80%,56%)" />
            );
          })}
        </svg>
      );
    case "spinning_dancer":
      return (
        <svg viewBox="0 0 140 240" className="w-full max-w-[120px] mx-auto">
          <circle cx={70} cy={25} r={14} fill="hsl(var(--foreground))" />
          <line x1={70} y1={39} x2={70} y2={120} stroke="hsl(var(--foreground))" strokeWidth={4} strokeLinecap="round" />
          <line x1={70} y1={65} x2={35} y2={50} stroke="hsl(var(--foreground))" strokeWidth={3} strokeLinecap="round" />
          <line x1={70} y1={65} x2={110} y2={80} stroke="hsl(var(--foreground))" strokeWidth={3} strokeLinecap="round" />
          <line x1={70} y1={120} x2={40} y2={190} stroke="hsl(var(--foreground))" strokeWidth={4} strokeLinecap="round" />
          <line x1={70} y1={120} x2={115} y2={170} stroke="hsl(var(--foreground))" strokeWidth={4} strokeLinecap="round" />
          <line x1={40} y1={190} x2={25} y2={192} stroke="hsl(var(--foreground))" strokeWidth={3} strokeLinecap="round" />
          <line x1={115} y1={170} x2={130} y2={172} stroke="hsl(var(--foreground))" strokeWidth={3} strokeLinecap="round" />
          <text x={10} y={225} fontSize={11} fill="hsl(var(--muted-foreground))">↺ or ↻ ?</text>
        </svg>
      );
    case "ebbinghaus":
      return (
        <svg viewBox="0 0 300 140" className="w-full max-w-[300px] mx-auto">
          <circle cx={80} cy={70} r={16} fill="hsl(38,92%,50%)" />
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i * 60) * Math.PI / 180;
            return <circle key={`l${i}`} cx={80 + 45 * Math.cos(a)} cy={70 + 45 * Math.sin(a)} r={22} fill="hsl(220,15%,70%)" opacity={0.5} />;
          })}
          <circle cx={80} cy={70} r={16} fill="hsl(38,92%,50%)" />
          <circle cx={220} cy={70} r={16} fill="hsl(38,92%,50%)" />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * 45) * Math.PI / 180;
            return <circle key={`r${i}`} cx={220 + 30 * Math.cos(a)} cy={70 + 30 * Math.sin(a)} r={8} fill="hsl(220,15%,70%)" opacity={0.5} />;
          })}
          <circle cx={220} cy={70} r={16} fill="hsl(38,92%,50%)" />
          <text x={150} y={135} textAnchor="middle" fontSize={12} fill="hsl(var(--muted-foreground))">Same size?</text>
        </svg>
      );
    default:
      return <p className="text-sm text-muted-foreground italic">Visual not available for this illusion type.</p>;
  }
}

/* ─── MCQ Helper for Word Puzzles ─── */
function WordPuzzleMCQ({ correctAnswer, allAnswers, onAnswer, answered }: {
  correctAnswer: string;
  allAnswers: string[];
  onAnswer: (correct: boolean) => void;
  answered: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const options = useMemo(() => {
    const opts = [correctAnswer];
    const pool = allAnswers.filter(a => a.toLowerCase() !== correctAnswer.toLowerCase());
    for (let i = 0; opts.length < Math.min(4, pool.length + 1) && i < pool.length; i++) {
      opts.push(pool[i]);
    }
    // Pad with modified versions if needed
    while (opts.length < 3) {
      opts.push(correctAnswer.split('').reverse().join(''));
    }
    // Seeded shuffle
    let seed = correctAnswer.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return opts.sort(() => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 - 0.5; });
  }, [correctAnswer, allAnswers]);

  const correctIndex = options.indexOf(correctAnswer);

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    onAnswer(selected === correctIndex);
  };

  if (answered && !submitted) return null;

  return (
    <div className="space-y-2 mt-2">
      {options.map((opt, i) => {
        const showCorrect = submitted && i === correctIndex;
        const showWrong = submitted && selected === i && i !== correctIndex;
        return (
          <button
            key={i}
            onClick={() => !submitted && setSelected(i)}
            disabled={submitted}
            className={cn(
              "w-full text-left px-3 py-2 rounded-lg border text-sm font-medium transition-all flex items-center gap-2",
              !submitted && selected === i && "border-primary bg-primary/10",
              !submitted && selected !== i && "border-border hover:border-primary/30 hover:bg-muted/50",
              showCorrect && "border-accent bg-accent/10 text-accent",
              showWrong && "border-destructive bg-destructive/10 text-destructive",
              submitted && !showCorrect && !showWrong && "opacity-50"
            )}
          >
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] shrink-0">
              {showCorrect ? <CheckCircle className="w-3.5 h-3.5 text-accent" /> :
               showWrong ? <Minus className="w-3.5 h-3.5 text-destructive" /> :
               String.fromCharCode(65 + i)}
            </span>
            {opt}
          </button>
        );
      })}
      {!submitted && (
        <Button size="sm" onClick={handleSubmit} disabled={selected === null}>Check Answer</Button>
      )}
      {submitted && (
        <p className={`text-sm font-medium ${selected === correctIndex ? "text-accent" : "text-destructive"}`}>
          {selected === correctIndex ? "✓ Correct!" : `✗ Answer: ${correctAnswer}`}
        </p>
      )}
    </div>
  );
}

/* ─── Word Puzzle Renderer (MCQ) ─── */
function WordPuzzleContent({ content, onAllRevealed }: { content: any; onAllRevealed: (allCorrect: boolean) => void }) {
  const [results, setResults] = useState<boolean[]>([]);
  const puzzles = content.puzzles || [];
  const puzzleType = content.type;

  const allAnswers = useMemo(() => {
    if (puzzleType === "anagram") return puzzles.map((p: any) => p.answer);
    if (puzzleType === "hidden_word") return puzzles.map((p: any) => p.hidden_word);
    if (puzzleType === "compound" || puzzleType === "cryptic") return puzzles.map((p: any) => p.answer);
    return [];
  }, [puzzles, puzzleType]);

  const handleItemAnswer = (index: number, correct: boolean) => {
    const newResults = [...results];
    newResults[index] = correct;
    setResults(newResults);
    const totalNeeded = puzzleType === "association" ? 1 : puzzles.length;
    if (newResults.filter(r => r !== undefined).length >= totalNeeded) {
      const correctCount = newResults.filter(Boolean).length;
      onAllRevealed(correctCount >= Math.ceil(totalNeeded * 0.5));
    }
  };

  if (puzzleType === "anagram") {
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium text-muted-foreground mb-2">Unscramble each word:</p>
        {puzzles.map((p: any, i: number) => (
          <div key={i} className="p-3 bg-muted/30 rounded-lg space-y-2">
            <span className="font-mono text-lg font-bold tracking-widest">{p.scrambled}</span>
            <p className="text-xs text-muted-foreground">Hint: {p.hint}</p>
            <WordPuzzleMCQ
              correctAnswer={p.answer}
              allAnswers={allAnswers}
              onAnswer={(correct) => handleItemAnswer(i, correct)}
              answered={results[i] !== undefined}
            />
          </div>
        ))}
      </div>
    );
  }

  if (puzzleType === "hidden_word") {
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium text-muted-foreground mb-2">Find the hidden word in each sentence:</p>
        {puzzles.map((p: any, i: number) => (
          <div key={i} className="p-3 bg-muted/30 rounded-lg space-y-2">
            <p className="text-base leading-relaxed">{p.sentence}</p>
            <p className="text-xs text-muted-foreground">Hint: {p.hint}</p>
            <WordPuzzleMCQ
              correctAnswer={p.hidden_word}
              allAnswers={allAnswers}
              onAnswer={(correct) => handleItemAnswer(i, correct)}
              answered={results[i] !== undefined}
            />
          </div>
        ))}
      </div>
    );
  }

  if (puzzleType === "compound") {
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium text-muted-foreground mb-2">Find the word that connects both words:</p>
        {puzzles.map((p: any, i: number) => (
          <div key={i} className="p-3 bg-muted/30 rounded-lg space-y-2">
            <div>
              <span className="font-bold">{p.word1}</span>
              <span className="mx-2 text-muted-foreground">___</span>
              <span className="font-bold">{p.word2}</span>
            </div>
            <p className="text-xs text-muted-foreground">Hint: {p.hint}</p>
            <WordPuzzleMCQ
              correctAnswer={p.answer}
              allAnswers={allAnswers}
              onAnswer={(correct) => handleItemAnswer(i, correct)}
              answered={results[i] !== undefined}
            />
          </div>
        ))}
      </div>
    );
  }

  if (puzzleType === "cryptic") {
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium text-muted-foreground mb-2">Solve each cryptic clue:</p>
        {puzzles.map((p: any, i: number) => (
          <div key={i} className="p-3 bg-muted/30 rounded-lg space-y-2">
            <p className="font-medium">{p.clue}</p>
            <p className="text-xs text-muted-foreground">Hint: {p.hint}</p>
            <WordPuzzleMCQ
              correctAnswer={p.answer}
              allAnswers={allAnswers}
              onAnswer={(correct) => handleItemAnswer(i, correct)}
              answered={results[i] !== undefined}
            />
          </div>
        ))}
      </div>
    );
  }

  if (puzzleType === "association") {
    const chains = content.possible_chains || [];
    const correctChain = chains[0] ? chains[0].join(" → ") : "";
    // Generate wrong chain options by shuffling
    const wrongChains: string[] = [];
    if (chains[0]) {
      const chain = [...chains[0]];
      for (let s = 1; s <= 3; s++) {
        const shuffled = [...chain];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = (i * s * 7 + 3) % (i + 1);
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const str = shuffled.join(" → ");
        if (str !== correctChain && !wrongChains.includes(str)) wrongChains.push(str);
      }
    }

    return (
      <div className="p-3 bg-muted/30 rounded-lg space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Build a word chain from start to end:</p>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="default" className="text-base px-3 py-1">{content.start_word}</Badge>
          {Array.from({ length: content.chain_length - 2 }, (_, i) => (
            <span key={i} className="text-lg text-muted-foreground">→ ___</span>
          ))}
          <span className="text-lg text-muted-foreground">→</span>
          <Badge variant="default" className="text-base px-3 py-1">{content.end_word}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">Hint: {content.hint}</p>
        <p className="text-sm font-medium mt-2">Select the correct chain:</p>
        <WordPuzzleMCQ
          correctAnswer={correctChain}
          allAnswers={[correctChain, ...wrongChains]}
          onAnswer={(correct) => handleItemAnswer(0, correct)}
          answered={results[0] !== undefined}
        />
      </div>
    );
  }

  return <p className="text-muted-foreground italic">Unknown word puzzle format.</p>;
}

/* ─── Self-Assessment for Riddles/Lateral ─── */
function SelfAssessment({ onRate }: { onRate: (rating: "correct" | "partial" | "wrong") => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 p-4 bg-muted/50 rounded-lg border"
    >
      <p className="text-sm font-medium mb-3">How did you do?</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="flex-1 min-w-[7.5rem] bg-accent hover:bg-accent/90" onClick={() => onRate("correct")}>
          <ThumbsUp className="w-4 h-4 mr-1" /> Got it right
        </Button>
        <Button size="sm" variant="outline" className="flex-1 min-w-[7.5rem]" onClick={() => onRate("partial")}>
          <Minus className="w-4 h-4 mr-1" /> Partially
        </Button>
        <Button size="sm" variant="outline" className="flex-1 min-w-[7.5rem]" onClick={() => onRate("wrong")}>
          <ThumbsDown className="w-4 h-4 mr-1" /> Didn't get it
        </Button>
      </div>
    </motion.div>
  );
}

/* ─── Visual Illusion MCQ ─── */
function IllusionQuestion({ type, onAnswer }: { type: string; onAnswer: (correct: boolean) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const questions: Record<string, { q: string; options: string[]; correct: number }> = {
    muller_lyer: { q: "Which line is longer?", options: ["Line A", "Line B", "They're the same length"], correct: 2 },
    checker_shadow: { q: "Are squares A and B the same shade?", options: ["A is darker", "B is darker", "They're identical"], correct: 2 },
    kanizsa: { q: "Is there a white triangle in the image?", options: ["Yes, clearly visible", "No, it's an illusion"], correct: 1 },
    spinning_dancer: { q: "Which direction is the dancer spinning?", options: ["Clockwise", "Counter-clockwise", "It's ambiguous—both are valid"], correct: 2 },
    ebbinghaus: { q: "Which orange circle is larger?", options: ["The left one", "The right one", "They're the same size"], correct: 2 },
  };

  const qData = questions[type];
  if (!qData) return null;

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    onAnswer(selected === qData.correct);
  };

  return (
    <div className="mt-4 p-4 bg-muted/30 rounded-lg border space-y-3">
      <p className="font-medium text-sm">{qData.q}</p>
      <div className="space-y-2">
        {qData.options.map((opt, i) => (
          <Button
            key={i}
            variant={submitted ? (i === qData.correct ? "default" : selected === i ? "destructive" : "outline") : selected === i ? "default" : "outline"}
            className="w-full justify-start text-left h-auto py-2.5 text-sm"
            onClick={() => !submitted && setSelected(i)}
            disabled={submitted}
          >
            <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs shrink-0 mr-2">
              {submitted && i === qData.correct ? <CheckCircle className="w-4 h-4" /> : String.fromCharCode(65 + i)}
            </span>
            {opt}
          </Button>
        ))}
      </div>
      {!submitted && (
        <Button size="sm" onClick={handleSubmit} disabled={selected === null}>Check Answer</Button>
      )}
      {submitted && (
        <p className={`text-sm font-medium ${selected === qData.correct ? "text-accent" : "text-destructive"}`}>
          {selected === qData.correct ? "✓ Correct!" : "✗ Not quite — the answer is revealed below."}
        </p>
      )}
    </div>
  );
}

/* ─── Logic Trap MCQ ─── */
function LogicTrapQuestion({ content, onAnswer }: { content: any; onAnswer: (correct: boolean) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Build options: the intuitive wrong answer + the correct answer + a distractor
  const options = [
    content.wrong_intuition || "The obvious answer",
    content.follow_up ? "It's a paradox / impossible" : "None of the above",
  ];
  const correct = 1; // The non-intuitive answer

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    onAnswer(selected === correct);
  };

  return (
    <div className="mt-4 p-4 bg-muted/30 rounded-lg border space-y-3">
      <p className="font-medium text-sm">What's the answer?</p>
      <div className="space-y-2">
        {options.map((opt, i) => (
          <Button
            key={i}
            variant={submitted ? (i === correct ? "default" : selected === i ? "destructive" : "outline") : selected === i ? "default" : "outline"}
            className="w-full justify-start text-left h-auto py-2.5 text-sm"
            onClick={() => !submitted && setSelected(i)}
            disabled={submitted}
          >
            <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs shrink-0 mr-2">
              {submitted && i === correct ? <CheckCircle className="w-4 h-4" /> : String.fromCharCode(65 + i)}
            </span>
            {opt}
          </Button>
        ))}
      </div>
      {!submitted && <Button size="sm" onClick={handleSubmit} disabled={selected === null}>Check Answer</Button>}
      {submitted && (
        <p className={`text-sm font-medium ${selected === correct ? "text-accent" : "text-destructive"}`}>
          {selected === correct ? "✓ You avoided the trap!" : "✗ That's the common wrong answer!"}
        </p>
      )}
    </div>
  );
}

/* ─── Main Page ─── */
export default function BrainTeasersPage({
  branch = "iq",
  title = "Brain Teasers",
  subtitle = "Challenge your thinking with 5 creative formats",
  formats,
  categories,
  emptyText,
}: { branch?: BranchTag; title?: string; subtitle?: string; formats?: string[]; categories?: string[]; emptyText?: string } = {}) {
  const posthog = usePostHog();
  const { progress, completeActivity } = useBrainScore();
  const [teasers, setTeasers] = useState<BrainTeaser[]>([]);
  const [selected, setSelected] = useState<BrainTeaser | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [filters, setFilters] = useState({ category: "all", difficulty: "all", status: "all", format: "all" });

  const [selfRating, setSelfRating] = useState<"correct" | "partial" | "wrong" | null>(null);
  const [interactionScore, setInteractionScore] = useState<number | null>(null);
  const [drillMetric, setDrillMetric] = useState<string | null>(null);

  useEffect(() => { getBrainTeasers(branch).then(setTeasers); }, [branch]);

  const completedIds = new Set(progress.filter(p => p.content_type === "brain_teaser" && p.status === "completed").map(p => p.content_id));

  const filtered = teasers.filter(t => {
    if (filters.format !== "all" && t.format !== filters.format) return false;
    if (filters.category !== "all" && t.category !== filters.category) return false;
    if (filters.difficulty !== "all" && t.difficulty !== Number(filters.difficulty)) return false;
    if (filters.status === "completed" && !completedIds.has(t.id)) return false;
    if (filters.status === "not_started" && completedIds.has(t.id)) return false;
    return true;
  });

  const resetState = () => {
    setSelected(null);
    setShowSolution(false);
    setHintIndex(0);
    setSelfRating(null);
    setInteractionScore(null);
    setDrillMetric(null);
  };

  const handleComplete = async (teaser: BrainTeaser, score: number) => {
    trackEvent(posthog, EVENTS.ACTIVITY_COMPLETED, {
      activity_type: "brain_teaser",
      content_id: teaser.id,
      score,
      format: teaser.format,
      difficulty: teaser.difficulty,
    });
    await completeActivity("brain_teaser", teaser.id, teaser.xp_reward, score);
    resetState();
  };

  const handleSelfRate = (rating: "correct" | "partial" | "wrong") => {
    setSelfRating(rating);
    const score = rating === "correct" ? 100 : rating === "partial" ? 50 : 25;
    setInteractionScore(score);
  };

  const handleInteractionComplete = (correct: boolean) => {
    setInteractionScore(correct ? 100 : 25);
    setShowSolution(true);
  };

  const handleWordPuzzleComplete = (allCorrect: boolean) => {
    setInteractionScore(allCorrect ? 100 : 50);
    setShowSolution(true);
  };

  const handleDrillFinish = (score: number, metric?: string) => {
    setInteractionScore(score);
    setDrillMetric(metric ?? null);
    setShowSolution(true);
  };

  /* ─── Branch drills (Genius / Brain Health) keyed by content_json.drill_kind ─── */
  if (selected && selected.content_json?.drill_kind) {
    const content = selected.content_json;
    const kind = content.drill_kind as string;
    const isGenius = GENIUS_KINDS.includes(kind);
    const alreadyCompleted = completedIds.has(selected.id);
    const canComplete = interactionScore !== null && !alreadyCompleted;

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
        <Button variant="ghost" className="mb-4" onClick={resetState}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="capitalize">{kind.replace(/_/g, " ")}</Badge>
              <Badge variant="secondary">Lv.{selected.difficulty}</Badge>
              {alreadyCompleted && <Badge className="bg-accent/20 text-accent"><CheckCircle className="w-3 h-3 mr-1" /> Done</Badge>}
            </div>
            <h2 className="text-xl font-bold mb-2">{selected.title}</h2>
            {selected.description && <p className="text-muted-foreground mb-4">{selected.description}</p>}

            <div className="bg-muted/50 rounded-lg p-4">
              {isGenius
                ? <GeniusDrill content={content} onFinish={handleDrillFinish} />
                : <BrainHealthDrill content={content} onFinish={handleDrillFinish} />}
            </div>

            <AnimatePresence>
              {showSolution && drillMetric && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-4 p-4 bg-accent/10 rounded-lg border border-accent/20">
                  <p className="font-medium text-accent mb-1">Result</p>
                  <p className="text-foreground text-sm">{drillMetric}</p>
                </motion.div>
              )}
            </AnimatePresence>


            {canComplete && interactionScore !== null && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex items-center justify-between p-4 bg-accent/5 rounded-lg border border-accent/20">
                <div>
                  <p className="font-semibold text-sm">
                    {interactionScore >= 75 ? "Great work! 🎉" : interactionScore >= 50 ? "Good effort! 👍" : "Nice try! Keep practicing 💪"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Score: {interactionScore}% · Earn {Math.round(selected.xp_reward * (interactionScore / 100))} XP
                  </p>
                </div>
                <Button className="bg-accent hover:bg-accent/90" onClick={() => handleComplete(selected, interactionScore)}>
                  <CheckCircle className="w-4 h-4 mr-1" /> Claim XP
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (selected) {
    const content = selected.content_json;
    const hints = content.hints || content.yes_no_hints || [];
    const isLateral = selected.format === "lateral_thinking";
    const isLogicTrap = selected.format === "logic_trap";
    const isWordPuzzle = selected.format === "word_puzzle";
    const isVisualIllusion = selected.format === "visual_illusion";
    const isRiddle = selected.format === "riddle";
    const alreadyCompleted = completedIds.has(selected.id);
    const needsSelfAssess = (isRiddle || isLateral) && showSolution && selfRating === null;
    const canComplete = interactionScore !== null && !alreadyCompleted;

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
        <Button variant="ghost" className="mb-4" onClick={resetState}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="capitalize">{selected.format.replace("_", " ")}</Badge>
              <Badge variant="secondary">Lv.{selected.difficulty}</Badge>
              {alreadyCompleted && <Badge className="bg-accent/20 text-accent"><CheckCircle className="w-3 h-3 mr-1" /> Done</Badge>}
            </div>
            <h2 className="text-xl font-bold mb-2">{selected.title}</h2>
            {selected.description && <p className="text-muted-foreground mb-4">{selected.description}</p>}

            {/* Visual Illusion SVG */}
            {isVisualIllusion && content.svg_config?.type && (
              <div className="mb-4 p-4 bg-muted/30 rounded-lg flex justify-center">
                <IllusionSvg type={content.svg_config.type} />
              </div>
            )}

            {/* Main content area */}
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              {isWordPuzzle ? (
                <WordPuzzleContent content={content} onAllRevealed={handleWordPuzzleComplete} />
              ) : (
                <p className="text-foreground leading-relaxed">
                  {(isLateral ? content.situation : isLogicTrap ? content.statement : isVisualIllusion ? content.description : content.question) ?? content.prompt ?? content.stem}
                </p>
              )}
            </div>

            {/* Interactive Q&A section */}
            {isVisualIllusion && content.svg_config?.type && interactionScore === null && (
              <IllusionQuestion type={content.svg_config.type} onAnswer={handleInteractionComplete} />
            )}

            {isLogicTrap && interactionScore === null && (
              <LogicTrapQuestion content={content} onAnswer={handleInteractionComplete} />
            )}

            {/* For riddles/lateral: prompt to think, then reveal */}
            {(isRiddle || isLateral) && !showSolution && !alreadyCompleted && (
              <div className="mt-3 p-3 bg-primary/5 rounded-lg">
                <p className="text-sm text-muted-foreground">Think about your answer, then use the hints or reveal the solution below to check.</p>
              </div>
            )}

            {/* Hints */}
            {hints.length > 0 && !showSolution && (
              <div className="mt-4 mb-4">
                <Button variant="outline" size="sm" onClick={() => setHintIndex(Math.min(hintIndex + 1, hints.length))} disabled={hintIndex >= hints.length}>
                  <HelpCircle className="w-4 h-4 mr-1" /> {hintIndex >= hints.length ? "No more hints" : `Show Hint (${hintIndex}/${hints.length})`}
                </Button>
                {hintIndex > 0 && (
                  <div className="mt-3 space-y-2">
                    {hints.slice(0, hintIndex).map((h: any, i: number) => (
                      <div key={i} className="p-2 bg-primary/5 rounded text-sm">
                        {isLateral ? <><span className="font-medium">{h.question}</span> → <Badge variant={h.answer === "yes" ? "default" : "destructive"} className="text-xs">{h.answer}</Badge></> : <span>💡 {h}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Solution reveal */}
            {!isWordPuzzle && (
              <div className="flex gap-3 mt-4">
              {(isRiddle || isLateral) ? (
                  <Button
                    onClick={() => setShowSolution(!showSolution)}
                    variant={showSolution ? "secondary" : "default"}
                  >
                    {showSolution ? <><EyeOff className="w-4 h-4 mr-1" /> Hide Solution</> : <><Eye className="w-4 h-4 mr-1" /> Reveal Solution</>}
                  </Button>
                ) : (interactionScore !== null || alreadyCompleted) ? (
                  <Button onClick={() => setShowSolution(!showSolution)} variant={showSolution ? "secondary" : "default"}>
                    {showSolution ? <><EyeOff className="w-4 h-4 mr-1" /> Hide</> : <><Eye className="w-4 h-4 mr-1" /> Full Explanation</>}
                  </Button>
                ) : null}
              </div>
            )}

            {/* Self-assessment for riddles/lateral */}
            {needsSelfAssess && <SelfAssessment onRate={handleSelfRate} />}

            {/* Solution content */}
            <AnimatePresence>
              {showSolution && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-4 p-4 bg-accent/10 rounded-lg border border-accent/20">
                  <p className="font-medium text-accent mb-1">Solution:</p>
                  <p className="text-foreground">{selected.solution}</p>
                  {isLogicTrap && content.explanation && <p className="mt-2 text-sm text-muted-foreground">{content.explanation}</p>}
                  {isVisualIllusion && content.illusion_explanation && <p className="mt-2 text-sm text-muted-foreground">{content.illusion_explanation}</p>}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Complete button */}
            {canComplete && interactionScore !== null && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex items-center justify-between p-4 bg-accent/5 rounded-lg border border-accent/20">
                <div>
                  <p className="font-semibold text-sm">
                    {interactionScore >= 75 ? "Great work! 🎉" : interactionScore >= 50 ? "Good effort! 👍" : "Nice try! Keep practicing 💪"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Score: {interactionScore}% · Earn {Math.round(selected.xp_reward * (interactionScore / 100))} XP
                  </p>
                </div>
                <Button className="bg-accent hover:bg-accent/90" onClick={() => handleComplete(selected, interactionScore)}>
                  <CheckCircle className="w-4 h-4 mr-1" /> Claim XP
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">{title}</h1>
      <p className="text-muted-foreground mb-6">{subtitle}</p>

      <FilterBar
        formats={formats ?? ["riddle", "lateral_thinking", "word_puzzle", "logic_trap", "visual_illusion"]}
        categories={categories ?? ["logic", "pattern", "spatial", "verbal"]}
        difficulties={[1, 2, 3, 4, 5]}
        filters={filters}
        onFilterChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(t => (
          <ContentCard
            key={t.id}
            title={t.title}
            description={t.description}
            difficulty={t.difficulty}
            category={t.category}
            xpReward={t.xp_reward}
            isCompleted={completedIds.has(t.id)}
            format={t.format}
            onClick={() => {
              trackEvent(posthog, EVENTS.ACTIVITY_STARTED, {
                activity_type: "brain_teaser",
                content_id: t.id,
                format: t.format,
                difficulty: t.difficulty,
              });
              setSelected(t);
            }}
          />
        ))}
      </div>
      {filtered.length === 0 && <p className="text-muted-foreground text-center py-12">{emptyText ?? 'No brain teasers match your filters.'}</p>}
    </div>
  );
}
