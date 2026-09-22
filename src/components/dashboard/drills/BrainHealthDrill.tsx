import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Timer, Play } from "lucide-react";
import { cn } from "@/lib/utils";

type Finish = (score: number, metric?: string) => void;

const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};
const clampScore = (n: number) => Math.max(25, Math.min(100, Math.round(n)));
const rand = (n: number) => Math.floor(Math.random() * n);

/* ─── Countdown hook ─── */
function useCountdown(seconds: number, running: boolean, onEnd: () => void) {
  const [left, setLeft] = useState(seconds);
  const endRef = useRef(onEnd);
  endRef.current = onEnd;
  useEffect(() => {
    if (!running) return;
    setLeft(seconds);
    const started = Date.now();
    const id = setInterval(() => {
      const remaining = seconds - Math.floor((Date.now() - started) / 1000);
      if (remaining <= 0) {
        clearInterval(id);
        setLeft(0);
        endRef.current();
      } else setLeft(remaining);
    }, 250);
    return () => clearInterval(id);
  }, [running, seconds]);
  return left;
}

function Shell({ title, instructions, started, onStart, children, timeLeft, total }: {
  title: string;
  instructions: string;
  started: boolean;
  onStart: () => void;
  children?: React.ReactNode;
  timeLeft?: number;
  total?: number;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{instructions}</p>
      </div>
      {!started ? (
        <Button onClick={onStart}><Play className="w-4 h-4 mr-1" /> Start drill</Button>
      ) : (
        <>
          {typeof timeLeft === "number" && typeof total === "number" && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Timer className="w-3 h-3" /> {timeLeft}s left
              </div>
              <Progress value={((total - timeLeft) / total) * 100} className="h-1.5" />
            </div>
          )}
          {children}
        </>
      )}
    </div>
  );
}

/* ─── Reaction Time ─── */
function ReactionTime({ content, onFinish }: { content: any; onFinish: Finish }) {
  const trials = (content.rounds || 3) * (content.taps_per_round || 5);
  const [range0, range1] = content.target_ms_range || [200, 400];
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState<"wait" | "go">("wait");
  const [times, setTimes] = useState<number[]>([]);
  const goAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const schedule = useCallback(() => {
    setPhase("wait");
    timer.current = setTimeout(() => {
      goAt.current = Date.now();
      setPhase("go");
    }, 800 + rand(2200));
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const start = () => { setStarted(true); schedule(); };

  const tap = () => {
    if (phase === "wait") return;
    const rt = Date.now() - goAt.current;
    const next = [...times, rt];
    setTimes(next);
    if (next.length >= trials) {
      const med = median(next);
      const score = clampScore(100 - ((med - range0) / (range1 - range0)) * 50);
      onFinish(score, `Median ${med} ms`);
      setPhase("wait");
    } else schedule();
  };

  return (
    <Shell
      title="Reaction Time"
      instructions={`Tap the panel the instant it turns green. ${trials} taps total.`}
      started={started}
      onStart={start}
    >
      <button
        type="button"
        onClick={tap}
        className={cn(
          "w-full h-44 rounded-xl border-2 flex items-center justify-center text-lg font-semibold transition-colors select-none",
          phase === "go" ? "bg-accent/20 border-accent text-accent" : "bg-muted/40 border-border text-muted-foreground"
        )}
      >
        {phase === "go" ? "TAP NOW" : "Wait for green…"}
      </button>
      <p className="text-xs text-muted-foreground">
        {times.length} / {trials} taps{times.length > 0 && ` · last ${times[times.length - 1]} ms`}
      </p>
    </Shell>
  );
}

/* ─── PVT (sustained attention) ─── */
function Pvt({ content, onFinish }: { content: any; onFinish: Finish }) {
  const seconds = Math.min(content.seconds || 180, 120);
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState<"wait" | "go">("wait");
  const [times, setTimes] = useState<number[]>([]);
  const goAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const timesRef = useRef<number[]>([]);
  timesRef.current = times;

  const schedule = useCallback(() => {
    setPhase("wait");
    timer.current = setTimeout(() => {
      goAt.current = Date.now();
      setPhase("go");
    }, 2000 + rand(6000));
  }, []);

  const end = useCallback(() => {
    clearTimeout(timer.current);
    setPhase("wait");
    const rts = timesRef.current;
    const med = median(rts);
    const lapses = rts.filter(r => r > 500).length;
    const score = rts.length ? clampScore(100 - lapses * 8 - Math.max(0, med - 300) / 8) : 25;
    onFinish(score, `Median ${med} ms · ${lapses} lapses`);
  }, [onFinish]);

  const left = useCountdown(seconds, started, end);
  useEffect(() => () => clearTimeout(timer.current), []);

  const tap = () => {
    if (phase !== "go") return;
    setTimes(t => [...t, Date.now() - goAt.current]);
    schedule();
  };

  return (
    <Shell
      title="Psychomotor Vigilance"
      instructions="Stay alert. Tap as soon as the counter appears — it comes at random intervals."
      started={started}
      onStart={() => { setStarted(true); schedule(); }}
      timeLeft={left}
      total={seconds}
    >
      <button
        type="button"
        onClick={tap}
        className={cn(
          "w-full h-44 rounded-xl border-2 flex items-center justify-center text-3xl font-mono font-bold transition-colors select-none",
          phase === "go" ? "bg-primary/15 border-primary text-primary" : "bg-muted/40 border-border text-muted-foreground text-lg"
        )}
      >
        {phase === "go" ? "TAP" : "•"}
      </button>
      <p className="text-xs text-muted-foreground">{times.length} responses</p>
    </Shell>
  );
}

/* ─── Stroop ─── */
const STROOP = [
  { name: "RED", css: "hsl(0,80%,55%)" },
  { name: "GREEN", css: "hsl(145,65%,42%)" },
  { name: "BLUE", css: "hsl(220,80%,58%)" },
  { name: "YELLOW", css: "hsl(45,90%,50%)" },
];

function Stroop({ content, onFinish }: { content: any; onFinish: Finish }) {
  const seconds = content.seconds || 60;
  const [started, setStarted] = useState(false);
  const [trial, setTrial] = useState(() => ({ word: rand(4), ink: rand(4) }));
  const [correct, setCorrect] = useState(0);
  const [errors, setErrors] = useState(0);
  const stats = useRef({ correct: 0, errors: 0 });

  const end = useCallback(() => {
    const { correct: c, errors: e } = stats.current;
    const acc = c + e ? c / (c + e) : 0;
    onFinish(clampScore(acc * 70 + Math.min(30, c * 1.5)), `${c} correct / ${e} errors`);
  }, [onFinish]);

  const left = useCountdown(seconds, started, end);

  const next = () => {
    let w = rand(4), i = rand(4);
    if (w === i && Math.random() < 0.7) i = (i + 1 + rand(3)) % 4;
    setTrial({ word: w, ink: i });
  };

  const answer = (idx: number) => {
    if (idx === trial.ink) { stats.current.correct++; setCorrect(c => c + 1); }
    else { stats.current.errors++; setErrors(e => e + 1); }
    next();
  };

  return (
    <Shell
      title="Stroop"
      instructions="Tap the COLOUR of the ink, not the word itself."
      started={started}
      onStart={() => setStarted(true)}
      timeLeft={left}
      total={seconds}
    >
      <div className="h-28 flex items-center justify-center rounded-xl bg-muted/40 border">
        <span className="text-4xl font-extrabold tracking-wide" style={{ color: STROOP[trial.ink].css }}>
          {STROOP[trial.word].name}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {STROOP.map((c, i) => (
          <Button key={c.name} variant="outline" onClick={() => answer(i)}>{c.name}</Button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{correct} correct · {errors} errors</p>
    </Shell>
  );
}

/* ─── Flanker ─── */
function Flanker({ content, onFinish }: { content: any; onFinish: Finish }) {
  const seconds = content.seconds || 60;
  const [started, setStarted] = useState(false);
  const [row, setRow] = useState<string[]>(() => makeRow());
  const [correct, setCorrect] = useState(0);
  const [errors, setErrors] = useState(0);
  const stats = useRef({ correct: 0, errors: 0 });

  function makeRow() {
    const flank = Math.random() < 0.5 ? "←" : "→";
    const center = Math.random() < 0.5 ? flank : (flank === "←" ? "→" : "←");
    return [flank, flank, center, flank, flank];
  }

  const end = useCallback(() => {
    const { correct: c, errors: e } = stats.current;
    const acc = c + e ? c / (c + e) : 0;
    onFinish(clampScore(acc * 70 + Math.min(30, c * 1.5)), `${c} correct / ${e} errors`);
  }, [onFinish]);

  const left = useCountdown(seconds, started, end);

  const answer = (dir: string) => {
    if (dir === row[2]) { stats.current.correct++; setCorrect(c => c + 1); }
    else { stats.current.errors++; setErrors(e => e + 1); }
    setRow(makeRow());
  };

  return (
    <Shell
      title="Flanker"
      instructions="Pick the direction of the MIDDLE arrow. Ignore the others."
      started={started}
      onStart={() => setStarted(true)}
      timeLeft={left}
      total={seconds}
    >
      <div className="h-28 flex items-center justify-center gap-3 rounded-xl bg-muted/40 border text-4xl">
        {row.map((a, i) => (
          <span key={i} className={i === 2 ? "text-foreground" : "text-muted-foreground"}>{a}</span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="text-xl" onClick={() => answer("←")}>←</Button>
        <Button variant="outline" className="text-xl" onClick={() => answer("→")}>→</Button>
      </div>
      <p className="text-xs text-muted-foreground">{correct} correct · {errors} errors</p>
    </Shell>
  );
}

/* ─── Digit Span ─── */
function DigitSpan({ content, onFinish }: { content: any; onFinish: Finish }) {
  const startLength = content.start_length || 3;
  const maxLength = content.max_length || 8;
  const backward = content.direction === "backward";
  const [started, setStarted] = useState(false);
  const [length, setLength] = useState(startLength);
  const [seq, setSeq] = useState<number[]>([]);
  const [showIdx, setShowIdx] = useState(-1);
  const [value, setValue] = useState("");
  const [best, setBest] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const playSeq = (len: number) => {
    const s = Array.from({ length: len }, () => rand(10));
    setSeq(s);
    setValue("");
    setFeedback(null);
    timers.current.forEach(clearTimeout);
    timers.current = s.map((_, i) =>
      setTimeout(() => setShowIdx(i), i * 900)
    );
    timers.current.push(setTimeout(() => setShowIdx(-1), s.length * 900));
  };

  const start = () => { setStarted(true); playSeq(startLength); };

  const submit = () => {
    const expected = (backward ? [...seq].reverse() : seq).join("");
    const ok = value.replace(/\D/g, "") === expected;
    if (ok) {
      const newBest = Math.max(best, length);
      setBest(newBest);
      if (length >= maxLength) {
        onFinish(clampScore((newBest / maxLength) * 100), `Max span ${newBest}`);
        setFeedback(`Perfect run — max span ${newBest}.`);
        return;
      }
      setFeedback("✓ Correct — one more digit.");
      setLength(length + 1);
      setTimeout(() => playSeq(length + 1), 900);
    } else {
      const finalBest = Math.max(best, 0);
      onFinish(clampScore((finalBest / maxLength) * 100), `Max span ${finalBest}`);
      setFeedback(`✗ Sequence was ${expected}. Max span: ${finalBest}.`);
    }
  };

  return (
    <Shell
      title={`Digit Span (${backward ? "backward" : "forward"})`}
      instructions={`Memorise the digits, then type them${backward ? " in reverse order" : ""}.`}
      started={started}
      onStart={start}
    >
      <div className="h-28 flex items-center justify-center rounded-xl bg-muted/40 border">
        <span className="text-5xl font-mono font-bold">
          {showIdx >= 0 ? seq[showIdx] : "—"}
        </span>
      </div>
      {showIdx < 0 && (
        <div className="flex gap-2">
          <Input
            className="min-w-0 flex-1"
            value={value}
            inputMode="numeric"
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={backward ? "Digits in reverse" : "Digits in order"}
          />
          <Button className="shrink-0" onClick={submit} disabled={!value.trim()}>Submit</Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">Length {length} of {maxLength}</p>
      {feedback && <p className="text-sm font-medium">{feedback}</p>}
    </Shell>
  );
}

/* ─── Vigilance ─── */
function Vigilance({ content, onFinish }: { content: any; onFinish: Finish }) {
  const seconds = Math.min(content.seconds || 180, 120);
  const prob = content.target_prob || 0.05;
  const [started, setStarted] = useState(false);
  const [letter, setLetter] = useState("A");
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const stats = useRef({ hits: 0, misses: 0, falseAlarms: 0 });
  const pending = useRef(false);

  const end = useCallback(() => {
    const { hits: h, misses: m, falseAlarms: f } = stats.current;
    const total = h + m;
    const acc = total ? h / total : 0;
    onFinish(clampScore(acc * 100 - f * 5), `${h} hits / ${m} misses`);
  }, [onFinish]);

  const left = useCountdown(seconds, started, end);

  useEffect(() => {
    if (!started) return;
    const id = setInterval(() => {
      if (pending.current) { stats.current.misses++; setMisses(m => m + 1); }
      const isTarget = Math.random() < Math.max(prob, 0.12);
      pending.current = isTarget;
      setLetter(isTarget ? "X" : "ABCDEFGHJKLMNPQRSTUVWZ"[rand(22)]);
    }, 1100);
    return () => clearInterval(id);
  }, [started, prob]);

  const tap = () => {
    if (pending.current) { pending.current = false; stats.current.hits++; setHits(h => h + 1); }
    else stats.current.falseAlarms++;
  };

  return (
    <Shell
      title="Vigilance"
      instructions="Letters appear one at a time. Tap only when you see an X."
      started={started}
      onStart={() => setStarted(true)}
      timeLeft={left}
      total={seconds}
    >
      <div className="h-28 flex items-center justify-center rounded-xl bg-muted/40 border">
        <span className="text-5xl font-mono font-bold">{letter}</span>
      </div>
      <Button className="w-full" onClick={tap}>Tap for X</Button>
      <p className="text-xs text-muted-foreground">{hits} hits · {misses} misses</p>
    </Shell>
  );
}

/* ─── Dual Task ─── */
const DUAL_WORDS = ["anchor", "velvet", "candle", "harbor", "pepper", "ladder", "silver", "meadow"];

function DualTask({ content, onFinish }: { content: any; onFinish: Finish }) {
  const seconds = Math.min(content.seconds || 60, 60);
  const [phase, setPhase] = useState<"idle" | "memorise" | "track" | "recall">("idle");
  const [words] = useState(() => [...DUAL_WORDS].sort(() => Math.random() - 0.5).slice(0, 3));
  const [pos, setPos] = useState(0);
  const [hits, setHits] = useState(0);
  const [shown, setShown] = useState(0);
  const stats = useRef({ hits: 0, shown: 0 });
  const [recall, setRecall] = useState("");

  const left = useCountdown(seconds, phase === "track", () => setPhase("recall"));

  useEffect(() => {
    if (phase !== "memorise") return;
    const id = setTimeout(() => setPhase("track"), 4000);
    return () => clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "track") return;
    const id = setInterval(() => {
      stats.current.shown++;
      setShown(s => s + 1);
      setPos(rand(9));
    }, 1200);
    return () => clearInterval(id);
  }, [phase]);

  const submitRecall = () => {
    const given = recall.toLowerCase().split(/[^a-z]+/).filter(Boolean);
    const recalled = words.filter(w => given.includes(w)).length;
    const track = stats.current.shown ? stats.current.hits / stats.current.shown : 0;
    onFinish(
      clampScore(track * 50 + (recalled / words.length) * 50),
      `${Math.round(track * 100)}% tracking · ${recalled}/${words.length} recalled`
    );
    setPhase("idle");
  };

  if (phase === "idle") {
    return (
      <Shell
        title="Dual Task"
        instructions="Hold three words in memory while tapping a moving dot. Recall the words at the end."
        started={false}
        onStart={() => setPhase("memorise")}
      />
    );
  }

  if (phase === "memorise") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Memorise these three words:</p>
        <div className="flex gap-2 flex-wrap">
          {words.map(w => <Badge key={w} className="text-base px-3 py-1.5">{w}</Badge>)}
        </div>
        <p className="text-xs text-muted-foreground">Tracking starts in a moment…</p>
      </div>
    );
  }

  if (phase === "track") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Timer className="w-3 h-3" /> {left}s left
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { if (i === pos) { stats.current.hits++; setHits(h => h + 1); } }}
              className={cn(
                "aspect-square rounded-lg border-2 transition-colors",
                i === pos ? "bg-primary/20 border-primary" : "bg-muted/30 border-border"
              )}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{hits} / {shown} caught</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Which three words did you memorise?</p>
      <Input
        value={recall}
        onChange={(e) => setRecall(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submitRecall()}
        placeholder="word, word, word"
      />
      <Button onClick={submitRecall} disabled={!recall.trim()}>Submit</Button>
    </div>
  );
}

export default function BrainHealthDrill({ content, onFinish }: { content: any; onFinish: Finish }) {
  switch (content?.drill_kind) {
    case "reaction_time": return <ReactionTime content={content} onFinish={onFinish} />;
    case "pvt": return <Pvt content={content} onFinish={onFinish} />;
    case "stroop": return <Stroop content={content} onFinish={onFinish} />;
    case "flanker": return <Flanker content={content} onFinish={onFinish} />;
    case "digit_span": return <DigitSpan content={content} onFinish={onFinish} />;
    case "vigilance": return <Vigilance content={content} onFinish={onFinish} />;
    case "dual_task": return <DualTask content={content} onFinish={onFinish} />;
    default: return null;
  }
}
