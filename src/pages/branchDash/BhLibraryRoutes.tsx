import BranchLibraryLayout from '@/components/dashboard/BranchLibraryLayout';
import BrainTeasersPage from '@/pages/dashboard/BrainTeasersPage';
import LessonsPage from '@/pages/dashboard/LessonsPage';
import AchievementsPage from '@/pages/dashboard/AchievementsPage';

/**
 * Brain Health library pages.
 * Cognitive drills = brain_teasers filtered to branch='brain_health' (reaction time, digit span, Stroop, etc.).
 */
export const BhCognitiveDrills = () => (
  <BranchLibraryLayout branch="bh">
    <BrainTeasersPage
      branch="brain_health"
      title="Cognitive Drills"
      subtitle="Short timed tasks for attention, inhibition, processing speed, and working memory."
      formats={["reaction_time", "stroop", "digit_span", "n_back", "trail_making", "go_no_go", "symbol_search"]}
      categories={["cognitive", "speed", "memory", "self"]}
      emptyText="No Brain Health drills match these filters. Reset the filters to see the full set."
    />
  </BranchLibraryLayout>
);
export const BhLessons = () => (
  <BranchLibraryLayout branch="bh">
    <LessonsPage
      branch="brain_health"
      title="Brain Health Lessons"
      subtitle="Plain-language lessons tied to your wellbeing domains, not generic puzzle categories."
      categories={["cognitive", "vascular", "sleep", "movement", "sensory", "mood", "reserve"]}
    />
  </BranchLibraryLayout>
);
export const BhAchievements = () => (
  <BranchLibraryLayout branch="bh"><AchievementsPage branch="brain_health" /></BranchLibraryLayout>
);
