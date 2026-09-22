import ChooseTestPage from '@/pages/funnel/ChooseTestPage';
import AuthGatePage from '@/pages/funnel/AuthGatePage';
import ChooseTierPage from '@/pages/funnel/ChooseTierPage';
import TrialOfferPage from '@/pages/funnel/TrialOfferPage';
import CheckoutSummaryPage from '@/pages/funnel/CheckoutSummaryPage';
import PreviewSignupShell from './PreviewSignupShell';

export function PreviewChooseTest() {
  return (
    <PreviewSignupShell>
      <ChooseTestPage previewMode />
    </PreviewSignupShell>
  );
}

export function PreviewAuthGate() {
  return (
    <PreviewSignupShell>
      <AuthGatePage previewMode />
    </PreviewSignupShell>
  );
}

export function PreviewAuthGateVerify() {
  return (
    <PreviewSignupShell>
      <AuthGatePage previewMode previewVerify />
    </PreviewSignupShell>
  );
}

export function PreviewChooseTier() {
  return (
    <PreviewSignupShell>
      <ChooseTierPage previewMode />
    </PreviewSignupShell>
  );
}

export function PreviewTrialOffer() {
  return (
    <PreviewSignupShell>
      <TrialOfferPage previewMode />
    </PreviewSignupShell>
  );
}

export function PreviewCheckoutSummary() {
  return (
    <PreviewSignupShell>
      <CheckoutSummaryPage previewMode />
    </PreviewSignupShell>
  );
}
