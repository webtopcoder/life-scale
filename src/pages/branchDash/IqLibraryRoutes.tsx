import BranchLibraryLayout from '@/components/dashboard/BranchLibraryLayout';
import BrainTeasersPage from '@/pages/dashboard/BrainTeasersPage';
import PuzzlesPage from '@/pages/dashboard/PuzzlesPage';
import LessonsPage from '@/pages/dashboard/LessonsPage';
import AchievementsPage from '@/pages/dashboard/AchievementsPage';

export const IqBrainTeasers = () => (
  <BranchLibraryLayout branch="iq"><BrainTeasersPage branch="iq" /></BranchLibraryLayout>
);
export const IqMazes = () => (
  <BranchLibraryLayout branch="iq"><PuzzlesPage /></BranchLibraryLayout>
);
export const IqLessons = () => (
  <BranchLibraryLayout branch="iq"><LessonsPage branch="iq" /></BranchLibraryLayout>
);
export const IqAchievements = () => (
  <BranchLibraryLayout branch="iq"><AchievementsPage branch="iq" /></BranchLibraryLayout>
);
