import { useState } from "react";
import { usePostHog } from "@posthog/react";
import { useBrainScore } from "@/hooks/useBrainScore";
import { mazes } from "@/components/dashboard/mazes/maze-data";
import { themeConfig, type MazeTheme } from "@/components/dashboard/mazes/maze-types";
import MazeCard from "@/components/dashboard/mazes/MazeCard";
import MazeRenderer from "@/components/dashboard/mazes/MazeRenderer";
import { solveMaze } from "@/components/dashboard/mazes/maze-solver";
import FilterBar from "@/components/dashboard/FilterBar";
import { EVENTS, trackEvent } from "@/constants/analytics";

const THEME_OPTIONS: MazeTheme[] = ["classic", "key_lock", "portal", "star_hunt", "gauntlet"];

export default function PuzzlesPage({
  title = "Mazes",
  subtitle,
}: { title?: string; subtitle?: string } = {}) {
  const posthog = usePostHog();
  const { progress, completeActivity } = useBrainScore();
  const [selected, setSelected] = useState<typeof mazes[number] | null>(null);
  const [filters, setFilters] = useState({ category: "all", difficulty: "all", status: "all", format: "all" });

  const completedIds = new Set(
    progress
      .filter(p => p.content_type === "puzzle" && p.status === "completed")
      .map(p => p.content_id)
  );

  const filtered = mazes.filter(m => {
    if (filters.format !== "all" && m.theme !== filters.format) return false;
    if (filters.difficulty !== "all" && m.difficulty !== Number(filters.difficulty)) return false;
    if (filters.status === "completed" && !completedIds.has(m.id)) return false;
    if (filters.status === "not_started" && completedIds.has(m.id)) return false;
    return true;
  });

  const handleMazeComplete = async (stars: number, time: number, moves: number) => {
    if (!selected) return;
    const result = solveMaze(selected);
    const minMoves = result.minMoves;
    const score = Math.max(0, 100 - Math.max(0, moves - minMoves) * 5);

    trackEvent(posthog, EVENTS.ACTIVITY_COMPLETED, {
      activity_type: "puzzle",
      content_id: selected.id,
      score,
      moves,
      minMoves,
      stars,
      time,
      theme: selected.theme,
      difficulty: selected.difficulty,
    });

    await completeActivity("puzzle", selected.id, selected.xpReward, score, "relaxed");
  };

  if (selected) {
    return (
      <MazeRenderer
        maze={selected}
        onBack={() => setSelected(null)}
        onComplete={handleMazeComplete}
      />
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">{title}</h1>
      <p className="text-muted-foreground mb-6">
        {subtitle ?? `${mazes.length} mazes across 5 themes · Swipe, tap or use arrow keys`}
      </p>

      <FilterBar
        formats={THEME_OPTIONS}
        difficulties={[1, 2, 3, 4, 5]}
        filters={filters}
        onFilterChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(m => (
          <MazeCard
            key={m.id}
            maze={m}
            completed={completedIds.has(m.id)}
            onClick={() => {
              trackEvent(posthog, EVENTS.ACTIVITY_STARTED, {
                activity_type: "puzzle",
                content_id: m.id,
                theme: m.theme,
                difficulty: m.difficulty,
              });
              setSelected(m);
            }}
          />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-muted-foreground text-center py-12">No mazes match your filters.</p>
      )}
    </div>
  );
}
