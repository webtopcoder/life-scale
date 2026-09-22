import { useState, useEffect } from "react";
import { usePostHog } from "@posthog/react";
import { useBrainScore } from "@/hooks/useBrainScore";
import { getLessons, Lesson } from "@/services/dashboardService";
import FilterBar from "@/components/dashboard/FilterBar";
import ContentCard from "@/components/dashboard/ContentCard";
import LessonViewer from "@/components/dashboard/LessonViewer";
import { EVENTS, trackEvent } from "@/constants/analytics";

import type { BranchTag } from "@/services/dashboardService";

const DEFAULT_META: Record<BranchTag, { title: string; subtitle: string; categories: string[]; empty: string }> = {
  iq: {
    title: 'Lessons',
    subtitle: 'Strategy lessons that support the IQ categories in your report.',
    categories: ['logic', 'pattern', 'spatial', 'speed', 'self'],
    empty: 'No IQ lessons match these filters.',
  },
  brain_health: {
    title: 'Brain Health Lessons',
    subtitle: 'Plain-language lessons tied to sleep, mood, movement, focus, and long-term reserve.',
    categories: ['cognitive', 'vascular', 'sleep', 'movement', 'sensory', 'mood', 'reserve'],
    empty: 'No brain health lessons match these filters.',
  },
  hidden_genius: {
    title: 'Genius Lessons',
    subtitle: 'Lessons that turn your signature from a label into a repeatable way of working.',
    categories: ['creativity', 'pattern', 'collaboration', 'archetype', 'self'],
    empty: 'No Hidden Genius lessons match these filters.',
  },
};

export default function LessonsPage({
  branch = "iq",
  title,
  subtitle,
  categories,
}: {
  branch?: BranchTag;
  title?: string;
  subtitle?: string;
  categories?: string[];
} = {}) {
  const posthog = usePostHog();
  const { progress, completeActivity } = useBrainScore();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selected, setSelected] = useState<Lesson | null>(null);
  const [filters, setFilters] = useState({ category: "all", difficulty: "all", status: "all", format: "all" });
  const meta = DEFAULT_META[branch];

  useEffect(() => { getLessons(branch).then(setLessons); }, [branch]);

  const completedIds = new Set(progress.filter(p => p.content_type === "lesson" && p.status === "completed").map(p => p.content_id));

  const filtered = lessons.filter(l => {
    if (filters.category !== "all" && l.category !== filters.category) return false;
    if (filters.difficulty !== "all" && l.difficulty !== Number(filters.difficulty)) return false;
    if (filters.status === "completed" && !completedIds.has(l.id)) return false;
    if (filters.status === "not_started" && completedIds.has(l.id)) return false;
    return true;
  });

  const handleComplete = async (score: number) => {
    if (!selected) return;
    trackEvent(posthog, EVENTS.ACTIVITY_COMPLETED, {
      activity_type: "lesson",
      content_id: selected.id,
      score,
      title: selected.title,
    });
    await completeActivity("lesson", selected.id, selected.xp_reward, score);
  };

  if (selected) {
    return (
      <LessonViewer
        title={selected.title}
        modules={selected.modules_json}
        quiz={selected.quiz_json}
        xpReward={selected.xp_reward}
        onComplete={handleComplete}
        onClose={() => setSelected(null)}
      />
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">{title ?? meta.title}</h1>
      <p className="text-muted-foreground mb-6">{subtitle ?? meta.subtitle} {lessons.length} available · Pass with 70%+ to earn BrainPoints</p>

      <FilterBar
        categories={categories ?? meta.categories}
        difficulties={[1, 2, 3, 4, 5]}
        filters={filters}
        onFilterChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(l => (
          <ContentCard
            key={l.id}
            title={l.title}
            description={l.description}
            difficulty={l.difficulty}
            category={l.category}
            xpReward={l.xp_reward}
            isCompleted={completedIds.has(l.id)}
            onClick={() => {
              trackEvent(posthog, EVENTS.ACTIVITY_STARTED, {
                activity_type: "lesson",
                content_id: l.id,
                title: l.title,
                category: l.category,
              });
              setSelected(l);
            }}
          />
        ))}
      </div>
      {filtered.length === 0 && <p className="text-muted-foreground text-center py-12">{meta.empty}</p>}
    </div>
  );
}
