import BranchLibraryLayout from '@/components/dashboard/BranchLibraryLayout';
import BrainTeasersPage from '@/pages/dashboard/BrainTeasersPage';
import PuzzlesPage from '@/pages/dashboard/PuzzlesPage';
import LessonsPage from '@/pages/dashboard/LessonsPage';
import AchievementsPage from '@/pages/dashboard/AchievementsPage';

/**
 * Genius (Hidden Genius) library pages.
 * Drills = Genius-branched brain_teasers (divergent-thinking format).
 * Patterns = existing pattern/logic puzzles reused via the branches[] tag on public.puzzles.
 */
export const HgDrills = () => (
  <BranchLibraryLayout branch="hg">
    <BrainTeasersPage
      branch="hidden_genius"
      title="Divergent Drills"
      subtitle="Practice idea range, analogy, and reframing — the reps behind your genius signature."
      formats={["remote_associates", "analogy_chain", "alternate_uses", "what_if", "constraint_flip"]}
      categories={["creativity", "pattern", "verbal", "self"]}
      emptyText="No Genius drills match these filters. Reset the filters to see the full practice set."
    />
  </BranchLibraryLayout>
);
export const HgPatterns = () => (
  <BranchLibraryLayout branch="hg">
    <PuzzlesPage
      title="Pattern Puzzles"
      subtitle="Spot the structure, then find the way through"
    />
  </BranchLibraryLayout>
);
export const HgLessons = () => (
  <BranchLibraryLayout branch="hg">
    <LessonsPage
      branch="hidden_genius"
      title="Genius Lessons"
      subtitle="Short lessons for using your signature deliberately without giving away the full paid deep dive."
      categories={["creativity", "pattern", "collaboration", "archetype", "self"]}
    />
  </BranchLibraryLayout>
);
export const HgAchievements = () => (
  <BranchLibraryLayout branch="hg"><AchievementsPage branch="hidden_genius" /></BranchLibraryLayout>
);
