import { useRef, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { FunnelProvider, useFunnel } from "@/context/FunnelContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import BranchGate from "@/components/BranchGate";
import CategoryGate from "@/components/CategoryGate";
import BodyStartPage from "./pages/body/BodyStartPage";
import BodyDashPage from "./pages/body/BodyDashPage";
import BodyReportPage from "./pages/body/BodyReportPage";
import SleepStartPage from "./pages/body/SleepStartPage";
import SleepDashPage from "./pages/body/SleepDashPage";
import SleepReportPage from "./pages/body/SleepReportPage";
import AthleteStartPage from "./pages/body/AthleteStartPage";
import AthleteDashPage from "./pages/body/AthleteDashPage";
import AthleteReportPage from "./pages/body/AthleteReportPage";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ScrollToTop } from "@/components/ScrollToTop";
import SupportChatWidget from "@/components/SupportChatWidget";
import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/NotFound";
import HelpPage from "./pages/HelpPage";
import Header from "./components/Header";
import OnboardingFlowPage from "./pages/OnboardingFlowPage";
import OnboardingFlowPageFF from "./pages/OnboardingFlowPageFF";
import OnboardingFlowPage888 from "./pages/OnboardingFlowPage888";
import OnboardingFlowPage888Tt from "./pages/OnboardingFlowPage888Tt";
import { Funnel888Provider } from "@/context/Funnel888Context";
import { Funnel888TtProvider } from "@/context/Funnel888TtContext";
import { FLOW_IDS } from "@/engine/datasetLoader";

import ResetPasswordPage from "./pages/ResetPasswordPage";
import CareersPage from "./pages/CareersPage";
import SampleReportPage from "./pages/SampleReportPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import RefundPolicyPage from "./pages/RefundPolicyPage";
import CookiesPage from "./pages/CookiesPage";
import PreviewUpsellsPage from "./pages/preview/PreviewUpsellsPage";
import PreviewSignupIndex from "./pages/preview/signup/PreviewSignupIndex";
import {
  PreviewChooseTest,
  PreviewAuthGate,
  PreviewAuthGateVerify,
  PreviewChooseTier,
  PreviewTrialOffer,
  PreviewCheckoutSummary,
} from "./pages/preview/signup/PreviewSignupScreens";

import PreviewPlanSelection from "./pages/preview/PreviewPlanSelection";
import ChooseTestPage from "./pages/funnel/ChooseTestPage";
import AuthGatePage from "./pages/funnel/AuthGatePage";
import ChooseTierPage from "./pages/funnel/ChooseTierPage";
import TrialOfferPage from "./pages/funnel/TrialOfferPage";
import CheckoutSummaryPage from "./pages/funnel/CheckoutSummaryPage";
import FunnelCheckoutPage from "./pages/funnel/FunnelCheckoutPage";
import LifeScaleUpsellPage from "./pages/LifeScaleUpsellPage";
import ThankYouPage from "./pages/ThankYouPage";
import BrainHealthFlow from "./pages/funnel/BrainHealthFlow";
import BrainHealthDashPage from "./pages/funnel/BrainHealthDashPage";
import HiddenGeniusStartPage from "./pages/funnel/HiddenGeniusStartPage";
import HiddenGeniusDashPage from "./pages/funnel/HiddenGeniusDashPage";
import IqStartPage from "./pages/funnel/IqStartPage";
import IqDashPage from "./pages/funnel/IqDashPage";
import IqReportPage from "./pages/funnel/IqReportPage";
import HiddenGeniusReportPage from "./pages/funnel/HiddenGeniusReportPage";
import BrainHealthReportPage from "./pages/funnel/BrainHealthReportPage";
import MainDashboardPage from "./pages/funnel/MainDashboardPage";
import CategoryHubPage from "./pages/funnel/CategoryHubPage";
import CoachPage from "./pages/CoachPage";
import { IqBrainTeasers, IqMazes, IqLessons, IqAchievements } from "./pages/branchDash/IqLibraryRoutes";
import { HgDrills, HgPatterns, HgLessons, HgAchievements } from "./pages/branchDash/HgLibraryRoutes";
import { BhCognitiveDrills, BhLessons, BhAchievements } from "./pages/branchDash/BhLibraryRoutes";
import BhDailyCheckPage from "./pages/branchDash/BhDailyCheckPage";
import BhHabitTrackerPage from "./pages/branchDash/BhHabitTrackerPage";
import HgArchetypeLabPage from "./pages/branchDash/HgArchetypeLabPage";
import { BrainHealthProvider, useBrainHealth } from "./context/BrainHealthContext";
import { HiddenGeniusProvider, useHiddenGenius } from "./context/HiddenGeniusContext";
import PreviewIndex from "./pages/PreviewIndex";
import AddonCheckoutPage from "./pages/addons/AddonCheckoutPage";
import AddonReportPage from "./pages/addons/AddonReportPage";
const queryClient = new QueryClient();

function LandingHome() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden />
      </div>
    );
  }
  if (user) return <Navigate to="/main-dashboard" replace />;
  return <LandingPage />;
}

function BhPreviewReset({ children }: { children: ReactNode }) {
  const { reset } = useBrainHealth();
  const didRef = useRef(false);
  if (!didRef.current) {
    didRef.current = true;
    reset();
  }
  return <>{children}</>;
}

function HgPreviewReset({ children }: { children: ReactNode }) {
  const { reset } = useHiddenGenius();
  const didRef = useRef(false);
  if (!didRef.current) {
    didRef.current = true;
    reset();
    try { localStorage.removeItem('iqscale.hgResult'); } catch { /* noop */ }
  }
  return <>{children}</>;
}

function IqPreviewReset({ children }: { children: ReactNode }) {
  const { dispatch } = useFunnel();
  const didRef = useRef(false);
  if (!didRef.current) {
    didRef.current = true;
    dispatch({ type: 'RESET' });
  }
  return <>{children}</>;
}


const HEADERLESS_FUNNEL_ROUTES = ['/assessment2', '/social-proof2', '/calculating2', '/email2', '/checkout', '/checkout2', '/report', '/choose-test', '/auth-gate', '/choose-tier', '/trial-offer', '/checkout-summary', '/upsell', '/thank-you', '/upgrade', '/iq-start', '/iq-dash', '/iq-report', '/bh-start', '/bh-dash', '/bh-report', '/hg-start', '/hg-dash', '/hg-report', '/body-start', '/body-dash', '/body-report', '/sleep-start', '/sleep-dash', '/sleep-report', '/ha-start', '/ha-dash', '/ha-report', '/main-dashboard', '/dash', '/coach', '/help', '/preview', '/preview-upsells', '/preview-signup', '/addons'];

function FunnelRouter() {
  const location = useLocation();
  const pathname = location.pathname.replace(/\/+$/, '') || '/';

  const shouldHideGlobalHeader =
    pathname === '/' ||
    pathname.startsWith('/onboarding') ||
    HEADERLESS_FUNNEL_ROUTES.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  return (
    <>
      {!shouldHideGlobalHeader && <Header />}
      <Routes>
        <Route path="/" element={<LandingHome />} />
        <Route path="/preview" element={<PreviewIndex />} />
        <Route path="/preview-upsells" element={<PreviewUpsellsPage />} />
        <Route path="/preview-signup" element={<PreviewSignupIndex />} />
        <Route path="/preview-signup/choose-test" element={<PreviewChooseTest />} />
        <Route path="/preview-signup/auth-gate" element={<PreviewAuthGate />} />
        <Route path="/preview-signup/auth-gate-verify" element={<PreviewAuthGateVerify />} />
        <Route path="/preview-signup/choose-tier" element={<PreviewChooseTier />} />
        <Route path="/preview-signup/trial-offer" element={<PreviewTrialOffer />} />
        <Route path="/preview-signup/checkout" element={<PreviewCheckoutSummary />} />

        <Route path="/preview/iq-start" element={<IqPreviewReset><IqStartPage /></IqPreviewReset>} />
        <Route
          path="/preview/bh-start"
          element={
            <BrainHealthProvider>
              <BhPreviewReset>
                <BrainHealthFlow />
              </BhPreviewReset>
            </BrainHealthProvider>
          }
        />
        <Route
          path="/preview/hg-start"
          element={
            <HiddenGeniusProvider>
              <HgPreviewReset>
                <HiddenGeniusStartPage />
              </HgPreviewReset>
            </HiddenGeniusProvider>
          }
        />
        {/* Ungated view of the finished report, for reviewing report copy without
            re-running the whole flow. Reads whatever responses are already stored. */}
        <Route
          path="/preview/hg-report"
          element={
            <HiddenGeniusProvider>
              <HiddenGeniusReportPage />
            </HiddenGeniusProvider>
          }
        />
        <Route
          path="/preview/bh-report"
          element={
            <BrainHealthProvider>
              <BrainHealthReportPage />
            </BrainHealthProvider>
          }
        />
        <Route path="/preview/iq-report" element={<IqReportPage />} />




        <Route path="/choose-test" element={<ChooseTestPage />} />
        <Route path="/auth-gate" element={<AuthGatePage />} />
        <Route path="/choose-tier" element={<ChooseTierPage />} />
        <Route path="/trial-offer" element={<ProtectedRoute><TrialOfferPage /></ProtectedRoute>} />
        <Route path="/checkout-summary" element={<ProtectedRoute><CheckoutSummaryPage /></ProtectedRoute>} />
        <Route path="/checkout" element={<FunnelCheckoutPage />} />
        <Route path="/upsell" element={<LifeScaleUpsellPage />} />
        <Route path="/thank-you" element={<ThankYouPage />} />
        <Route
          path="/bh-start"
          element={
            <BranchGate branch="brain-health">
              <BrainHealthProvider>
                <BrainHealthFlow />
              </BrainHealthProvider>
            </BranchGate>
          }
        />
        <Route
          path="/bh-dash"
          element={
            <BranchGate branch="brain-health">
              <BrainHealthProvider>
                <BrainHealthDashPage />
              </BrainHealthProvider>
            </BranchGate>
          }
        />
        <Route
          path="/bh-report"
          element={
            <BranchGate branch="brain-health">
              <BrainHealthProvider>
                <BrainHealthReportPage />
              </BrainHealthProvider>
            </BranchGate>
          }
        />
        <Route
          path="/hg-start"
          element={
            <BranchGate branch="hidden-genius">
              <HiddenGeniusProvider>
                <HiddenGeniusStartPage />
              </HiddenGeniusProvider>
            </BranchGate>
          }
        />
        <Route
          path="/hg-dash"
          element={
            <BranchGate branch="hidden-genius">
              <HiddenGeniusProvider>
                <HiddenGeniusDashPage />
              </HiddenGeniusProvider>
            </BranchGate>
          }
        />
        <Route
          path="/hg-report"
          element={
            <BranchGate branch="hidden-genius">
              <HiddenGeniusProvider>
                <HiddenGeniusReportPage />
              </HiddenGeniusProvider>
            </BranchGate>
          }
        />
        <Route path="/body-start" element={<BranchGate branch="body"><BodyStartPage /></BranchGate>} />
        <Route path="/body-dash" element={<BranchGate branch="body"><BodyDashPage /></BranchGate>} />
        <Route path="/body-report" element={<BranchGate branch="body"><BodyReportPage /></BranchGate>} />
        <Route path="/sleep-start" element={<BranchGate branch="sleep-health"><SleepStartPage /></BranchGate>} />
        <Route path="/sleep-dash" element={<BranchGate branch="sleep-health"><SleepDashPage /></BranchGate>} />
        <Route path="/sleep-report" element={<BranchGate branch="sleep-health"><SleepReportPage /></BranchGate>} />
        <Route path="/ha-start" element={<BranchGate branch="hidden-athlete"><AthleteStartPage /></BranchGate>} />
        <Route path="/ha-dash" element={<BranchGate branch="hidden-athlete"><AthleteDashPage /></BranchGate>} />
        <Route path="/ha-report" element={<BranchGate branch="hidden-athlete"><AthleteReportPage /></BranchGate>} />
        <Route path="/preview/body-start" element={<BodyStartPage />} />
        <Route path="/preview/sleep-start" element={<SleepStartPage />} />
        <Route path="/preview/ha-start" element={<AthleteStartPage />} />
        <Route path="/iq-start" element={<BranchGate branch="iq"><IqStartPage /></BranchGate>} />
        <Route path="/iq-dash" element={<BranchGate branch="iq"><IqDashPage /></BranchGate>} />
        <Route path="/iq-dash/brain-teasers" element={<BranchGate branch="iq"><IqBrainTeasers /></BranchGate>} />
        <Route path="/iq-dash/mazes" element={<BranchGate branch="iq"><IqMazes /></BranchGate>} />
        <Route path="/iq-dash/lessons" element={<BranchGate branch="iq"><IqLessons /></BranchGate>} />
        <Route path="/iq-dash/achievements" element={<BranchGate branch="iq"><IqAchievements /></BranchGate>} />
        <Route path="/iq-report" element={<BranchGate branch="iq"><IqReportPage /></BranchGate>} />
        <Route path="/hg-dash/drills" element={<BranchGate branch="hidden-genius"><HiddenGeniusProvider><HgDrills /></HiddenGeniusProvider></BranchGate>} />
        <Route path="/hg-dash/patterns" element={<BranchGate branch="hidden-genius"><HiddenGeniusProvider><HgPatterns /></HiddenGeniusProvider></BranchGate>} />
        <Route path="/hg-dash/lessons" element={<BranchGate branch="hidden-genius"><HiddenGeniusProvider><HgLessons /></HiddenGeniusProvider></BranchGate>} />
        <Route path="/hg-dash/achievements" element={<BranchGate branch="hidden-genius"><HiddenGeniusProvider><HgAchievements /></HiddenGeniusProvider></BranchGate>} />
        <Route path="/hg-dash/archetype-lab" element={<BranchGate branch="hidden-genius"><HiddenGeniusProvider><HgArchetypeLabPage /></HiddenGeniusProvider></BranchGate>} />
        <Route path="/bh-dash/drills" element={<BranchGate branch="brain-health"><BrainHealthProvider><BhCognitiveDrills /></BrainHealthProvider></BranchGate>} />
        <Route path="/bh-dash/lessons" element={<BranchGate branch="brain-health"><BrainHealthProvider><BhLessons /></BrainHealthProvider></BranchGate>} />
        <Route path="/bh-dash/achievements" element={<BranchGate branch="brain-health"><BrainHealthProvider><BhAchievements /></BrainHealthProvider></BranchGate>} />
        <Route path="/bh-dash/daily-check" element={<BranchGate branch="brain-health"><BrainHealthProvider><BhDailyCheckPage /></BrainHealthProvider></BranchGate>} />
        <Route path="/bh-dash/habits" element={<BranchGate branch="brain-health"><BrainHealthProvider><BhHabitTrackerPage /></BrainHealthProvider></BranchGate>} />
        <Route path="/main-dashboard" element={<ProtectedRoute><MainDashboardPage /></ProtectedRoute>} />
        <Route path="/dash/:category" element={<ProtectedRoute><CategoryGate><CategoryHubPage /></CategoryGate></ProtectedRoute>} />
        <Route path="/coach" element={<ProtectedRoute><CoachPage /></ProtectedRoute>} />
        <Route path="/addons/:branch/:key" element={<ProtectedRoute><AddonCheckoutPage /></ProtectedRoute>} />
        <Route path="/addons/:branch/:key/view" element={<ProtectedRoute><AddonReportPage /></ProtectedRoute>} />
        <Route path="/upgrade/:branch" element={<ProtectedRoute><ChooseTierPage /></ProtectedRoute>} />
        <Route path="/upgrade/:branch/trial" element={<ProtectedRoute><TrialOfferPage /></ProtectedRoute>} />
        <Route path="/upgrade/:branch/checkout" element={<ProtectedRoute><CheckoutSummaryPage /></ProtectedRoute>} />
        <Route path="/onboarding-rvr2" element={<OnboardingFlowPage flowId={FLOW_IDS.FIXED_V1_RVR2} resetOnMount />} />
        <Route path="/onboarding-rvr2-tt" element={<OnboardingFlowPage flowId={FLOW_IDS.FIXED_V1_RVR2} resetOnMount />} />
        <Route path="/onboarding-ff" element={<OnboardingFlowPageFF />} />
        <Route path="/onboarding-888" element={<Funnel888Provider><OnboardingFlowPage888 /></Funnel888Provider>} />
        <Route path="/onboarding-888-tt" element={<Funnel888TtProvider><OnboardingFlowPage888Tt /></Funnel888TtProvider>} />
        {/* Retired onboarding funnel — hard-blocked, renders 404. */}
        <Route path="/onboarding/*" element={<NotFound />} />
        <Route path="/onboarding-home" element={<NotFound />} />
        <Route path="/onboarding-plans/*" element={<NotFound />} />
        <Route path="/onboarding-boa" element={<NotFound />} />
        <Route path="/onboarding-rvr" element={<NotFound />} />
        <Route path="/onboarding-alt" element={<NotFound />} />
        <Route path="/onboarding-dev" element={<NotFound />} />
        {/* Retired legacy funnel screens — hard-blocked, renders 404. */}
        <Route path="/assessment2" element={<NotFound />} />
        <Route path="/social-proof2" element={<NotFound />} />
        <Route path="/calculating2" element={<NotFound />} />
        <Route path="/email2" element={<NotFound />} />
        <Route path="/checkout2" element={<NotFound />} />
        <Route path="/upsell/weakness-report" element={<Navigate to="/main-dashboard" replace />} />
        <Route path="/upsell/genius-blueprint" element={<Navigate to="/main-dashboard" replace />} />
        <Route path="/upsell/brain-coach" element={<Navigate to="/coach" replace />} />
        <Route path="/report" element={<Navigate to="/main-dashboard" replace />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ErrorBoundary>
        <AuthProvider>
          <FunnelProvider>
            <BrowserRouter>
              <ScrollToTop />
              <SupportChatWidget />
              <Routes>
                {/* Auth routes */}
                <Route path="/auth" element={<Navigate to="/auth-gate" replace />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Old /dashboard/* library — dormant, redirect any hits back to the main dashboard. */}
                <Route path="/dashboard/*" element={<Navigate to="/main-dashboard" replace />} />

                {/* Careers */}
                <Route path="/careers" element={<><Header /><CareersPage /></>} />
                <Route path="/affiliates" element={<Navigate to="/careers" replace />} />

                {/* Sample Report */}
                <Route path="/sample" element={<SampleReportPage />} />

                {/* Legal pages */}
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/refund-policy" element={<RefundPolicyPage />} />
                <Route path="/cookies" element={<CookiesPage />} />

                {/* Preview routes (unguarded, for design editing) */}
                <Route path="/preview/checkout" element={<FunnelCheckoutPage />} />
                <Route path="/preview/plan-selection" element={<PreviewPlanSelection />} />
                <Route path="/checkout2-preview" element={<NotFound />} />

                {/* Retired short-IQ funnel — hard-blocked, renders 404. */}
                <Route path="/short-iq/*" element={<NotFound />} />

                {/* Funnel routes */}
                <Route path="/*" element={<FunnelRouter />} />
              </Routes>
            </BrowserRouter>
          </FunnelProvider>
        </AuthProvider>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
