import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, ThumbsUp, ThumbsDown, Minus, Timer } from "lucide-react";
import { motion } from "framer-motion";

type Finish = (score: number, metric?: string) => void;

const norm = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

/* ─── Self rating row (reused by open-ended drills) ─── */
function RateRow({ onRate }: { onRate: (r: "correct" | "partial" | "wrong") => void }) {
  return (
    <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
      <p className="text-sm font-medium mb-3">How did your answer compare?</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="flex-1 min-w-[9rem] bg-accent hover:bg-accent/90" onClick={() => onRate("correct")}>
          <ThumbsUp className="w-4 h-4 mr-1" /> As strong or better
        </Button>
        <Button size="sm" variant="outline" className="flex-1 min-w-[9rem]" onClick={() => onRate("partial")}>
          <Minus className="w-4 h-4 mr-1" /> Somewhere in between
        </Button>
        <Button size="sm" variant="outline" className="flex-1 min-w-[9rem]" onClick={() => onRate("wrong")}>
          <ThumbsDown className="w-4 h-4 mr-1" /> Closer to the weak one
        </Button>
      </div>
    </div>
  );
}

function ExampleCompare({ weak, strong, rubric }: { weak?: string; strong?: string; rubric?: any }) {
  return (
    <div className="mt-4 space-y-3">
      {weak && (
        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
          <p className="text-xs font-semibold text-destructive mb-1">Weak response</p>
          <p className="text-sm text-foreground/90">{weak}</p>
        </div>
      )}
      {strong && (
        <div className="p-3 rounded-lg border border-accent/30 bg-accent/5">
          <p className="text-xs font-semibold text-accent mb-1">Strong response</p>
          <p className="text-sm text-foreground/90">{strong}</p>
        </div>
      )}
      {rubric?.levels && (
        <div className="p-3 rounded-lg bg-muted/40 border">
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            Scored on {(rubric.axes || []).join(", ")}
          </p>
          <ul className="space-y-1">
            {Object.entries(rubric.levels as Record<string, string>).map(([lvl, text]) => (
              <li key={lvl} className="text-sm flex gap-2">
                <Badge variant="outline" className="shrink-0 h-5">Lv.{lvl}</Badge>
                <span className="text-muted-foreground">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─── Remote Associates: one word connects three ─── */
function RemoteAssociates({ content, onFinish }: { content: any; onFinish: Finish }) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const correct = submitted && norm(value) === norm(content.answer || "");

  const submit = () => {
    if (!value.trim() || submitted) return;
    setSubmitted(true);
    const isCorrect = norm(value) === norm(content.answer || "");
    onFinish(isCorrect ? 100 : 30, isCorrect ? "Correct" : "Not quite");
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-muted-foreground">
        What single word connects all three?
      </p>
      <div className="flex flex-wrap gap-2">
        {(content.words || []).map((w: string) => (
          <Badge key={w} variant="secondary" className="text-base px-3 py-1.5 capitalize">{w}</Badge>
        ))}
      </div>
      {content.time_seconds && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Timer className="w-3 h-3" /> Target: under {content.time_seconds}s
        </p>
      )}
      <div className="flex gap-2">
        <Input
          className="min-w-0 flex-1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Your answer"
          disabled={submitted}
        />
        <Button className="shrink-0" onClick={submit} disabled={submitted || !value.trim()}>Submit</Button>
      </div>
      {submitted && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-sm font-medium ${correct ? "text-accent" : "text-destructive"}`}
        >
          {correct ? "✓ Correct!" : `✗ The connecting word is "${content.answer}"`}
        </motion.p>
      )}
    </div>
  );
}

/* ─── Analogy Chain: relational reasoning, self-scored ─── */
function AnalogyChain({ content, onFinish }: { content: any; onFinish: Finish }) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-muted-foreground">Complete the analogy:</p>
      <p className="text-lg font-mono font-semibold">{content.stem}</p>
      <div className="flex gap-2">
        <Input
          className="min-w-0 flex-1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && value.trim() && setSubmitted(true)}
          placeholder="Your answer"
          disabled={submitted}
        />
        <Button className="shrink-0" onClick={() => setSubmitted(true)} disabled={submitted || !value.trim()}>Submit</Button>
      </div>
      {submitted && (
        <>
          <ExampleCompare weak={content.weak_example} strong={content.strong_example} />
          <RateRow onRate={(r) => onFinish(r === "correct" ? 100 : r === "partial" ? 50 : 25)} />
        </>
      )}
    </div>
  );
}

/* ─── Open-ended divergent drills ─── */
function OpenEnded({ content, onFinish }: { content: any; onFinish: Finish }) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const ideas = value.split("\n").filter(l => l.trim()).length;

  return (
    <div className="space-y-4">
      <p className="text-base leading-relaxed">{content.prompt}</p>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {content.target_count && <span>Target: {content.target_count} ideas</span>}
        {content.time_seconds && (
          <span className="flex items-center gap-1">
            <Timer className="w-3 h-3" /> Suggested: {Math.round(content.time_seconds / 60)} min
          </span>
        )}
      </div>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="One idea per line…"
        rows={7}
        disabled={submitted}
      />
      {!submitted && (
        <div className="flex items-center gap-3">
          <Button onClick={() => setSubmitted(true)} disabled={!value.trim()}>
            <CheckCircle className="w-4 h-4 mr-1" /> Done
          </Button>
          <span className="text-xs text-muted-foreground">
            {ideas} {ideas === 1 ? "idea" : "ideas"}
            {content.target_count ? ` of ${content.target_count}` : ""}
          </span>
        </div>
      )}
      {submitted && (
        <>
          <ExampleCompare weak={content.weak_example} strong={content.strong_example} rubric={content.rubric} />
          <RateRow onRate={(r) => onFinish(r === "correct" ? 100 : r === "partial" ? 50 : 25, `${ideas} ${ideas === 1 ? "idea" : "ideas"}`)} />
        </>
      )}
    </div>
  );
}

export default function GeniusDrill({ content, onFinish }: { content: any; onFinish: Finish }) {
  switch (content?.drill_kind) {
    case "remote_associates":
      return <RemoteAssociates content={content} onFinish={onFinish} />;
    case "analogy_chain":
      return <AnalogyChain content={content} onFinish={onFinish} />;
    case "alternate_uses":
    case "what_if":
    case "constraint_flip":
      return <OpenEnded content={content} onFinish={onFinish} />;
    default:
      return null;
  }
}
