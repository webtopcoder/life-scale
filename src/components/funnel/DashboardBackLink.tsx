import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Props {
  /** Ask for confirmation before leaving (use while the user is mid-quiz). */
  confirmBeforeLeave?: boolean;
}

/**
 * Back link to the main dashboard, shown to any signed-in user inside a test
 * flow. Hidden for signed-out funnel visitors so the marketing flow is
 * unchanged. Test progress is persisted by each flow's context, so leaving
 * and returning resumes where the user left off.
 */
const DashboardBackLink = ({ confirmBeforeLeave = false }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const leave = () => navigate('/main-dashboard');

  return (
    <>
      <button
        type="button"
        onClick={() => (confirmBeforeLeave ? setOpen(true) : leave())}
        aria-label="Back to home"
        className="-ml-1 flex min-h-[36px] items-center gap-1 rounded-full px-2 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Home</span>
      </button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave the test?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress is saved and you can pick up where you left off.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep going</AlertDialogCancel>
            <AlertDialogAction onClick={leave}>Leave</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DashboardBackLink;
