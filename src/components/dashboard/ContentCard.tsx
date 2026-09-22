import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star } from "lucide-react";

interface ContentCardProps {
  title: string;
  description?: string | null;
  difficulty: number;
  category: string;
  xpReward: number;
  isCompleted: boolean;
  format?: string;
  theme?: string;
  onClick: () => void;
}

const difficultyColors = ["", "bg-accent/20 text-accent", "bg-info/20 text-info", "bg-warning/20 text-warning", "bg-destructive/20 text-destructive", "bg-destructive text-destructive-foreground"];

const formatLabels: Record<string, string> = {
  riddle: "Riddle",
  lateral_thinking: "Lateral Thinking",
  word_puzzle: "Word Puzzle",
  logic_trap: "Logic Trap",
  visual_illusion: "Visual Illusion",
  matrix_pattern: "Matrix",
  sequence_completion: "Sequence",
  odd_one_out: "Odd One Out",
  spatial_rotation: "Rotation",
  path_trace: "Path Trace",
};

const themeStyles: Record<string, string> = {
  classic: "",
  emoji: "border-2 border-warning/30",
  neon: "bg-foreground/[0.03] border-primary/40 shadow-[0_0_15px_hsl(var(--primary)/0.1)]",
  pastel: "rounded-2xl border-accent/30 shadow-[var(--shadow-soft)]",
};

const themeEmojis: Record<string, string> = {
  emoji: "🧩",
  neon: "⚡",
  pastel: "🌸",
};

export default function ContentCard({ title, description, difficulty, category, xpReward, isCompleted, format, theme, onClick }: ContentCardProps) {
  const appliedTheme = theme || "classic";
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${isCompleted ? "border-accent/40 bg-accent/5" : ""} ${themeStyles[appliedTheme] || ""}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">
            {themeEmojis[appliedTheme] ? `${themeEmojis[appliedTheme]} ` : ""}{title}
          </h3>
          {isCompleted && <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 ml-2" />}
        </div>
        {description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{description}</p>}
        <div className="flex flex-wrap gap-1.5 mt-auto">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 capitalize">{category}</Badge>
          <Badge className={`text-[10px] px-1.5 py-0 ${difficultyColors[difficulty]}`}>Lv.{difficulty}</Badge>
          {format && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{formatLabels[format] || format.replace(/_/g, " ")}</Badge>}
          {appliedTheme !== "classic" && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">{appliedTheme}</Badge>
          )}
          <div className="flex items-center gap-0.5 ml-auto">
            <Star className="w-3 h-3 text-warning" />
            <span className="text-[10px] font-medium text-muted-foreground">{xpReward} BP</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
