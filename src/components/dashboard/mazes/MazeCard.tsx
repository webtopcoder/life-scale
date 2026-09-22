import { Lock, Clock, Zap, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MazeData } from "./maze-types";
import { themeConfig } from "./maze-types";

interface MazeCardProps {
  maze: MazeData;
  completed?: boolean;
  onClick: () => void;
}

const difficultyLabels: Record<number, { label: string; className: string }> = {
  1: { label: "Easy", className: "bg-success/15 text-success" },
  2: { label: "Medium", className: "bg-accent/15 text-accent" },
  3: { label: "Hard", className: "bg-primary/15 text-primary" },
  4: { label: "Expert", className: "bg-destructive/15 text-destructive" },
  5: { label: "Master", className: "bg-destructive/20 text-destructive" },
};

const MiniGrid = ({ grid, completed }: { grid: number[][]; completed?: boolean }) => {
  return (
    <div className="relative flex flex-col gap-[1px] items-center justify-center">
      {grid.map((row, y) => (
        <div key={y} className="flex gap-[1px]">
          {row.map((cell, x) => (
            <div
              key={x}
              className={`w-[5px] h-[5px] rounded-[1px] transition-colors duration-500 ${
                completed
                  ? cell === 0
                    ? "bg-success/10"
                    : "bg-success/40"
                  : cell === 0
                  ? "bg-muted-foreground/20"
                  : cell === 2
                  ? "bg-primary"
                  : cell === 3
                  ? "bg-emerald-500"
                  : cell === 4
                  ? "bg-accent"
                  : cell === 5
                  ? "bg-destructive/60"
                  : cell === 6
                  ? "bg-blue-400"
                  : cell === 7
                  ? "bg-accent"
                  : cell === 8
                  ? "bg-destructive/40"
                  : "bg-muted-foreground/8"
              }`}
            />
          ))}
        </div>
      ))}
      {completed && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-7 w-7 rounded-full bg-success/90 flex items-center justify-center shadow-lg shadow-success/30 animate-scale-in">
            <Check className="h-4 w-4 text-success-foreground stroke-[3]" />
          </div>
        </div>
      )}
    </div>
  );
};

const MazeCard = ({ maze, completed, onClick }: MazeCardProps) => {
  const config = themeConfig[maze.theme];

  return (
    <Card
      className={`group relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 ${
        maze.locked ? "opacity-60" : "cursor-pointer"
      } ${completed ? "ring-1 ring-success/30 bg-success/[0.03]" : ""}`}
      onClick={() => !maze.locked && onClick()}
    >
      {maze.locked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
      )}

      <CardContent className="p-4 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-start justify-between">
          <Badge variant="outline" className={`${config.bgClass} ${config.color} border-0 text-xs`}>
            {config.icon} {config.label}
          </Badge>
          <Badge variant="outline" className={`border-0 text-xs ${difficultyLabels[maze.difficulty].className}`}>
            {difficultyLabels[maze.difficulty].label}
          </Badge>
        </div>

        {/* Mini grid preview */}
        <div className="flex items-center justify-center py-3 rounded-lg bg-muted/50">
          <MiniGrid grid={maze.gridData} completed={completed} />
        </div>

        {/* Title & description */}
        <div>
          <h3 className="font-semibold text-foreground text-sm">
            {maze.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {maze.description}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-accent" />
            {maze.xpReward} XP
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {maze.estimatedTime}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default MazeCard;
