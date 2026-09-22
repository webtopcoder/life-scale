import { FLOW_IDS } from '@/engine/datasetLoader';
import OnboardingFlowPage from './OnboardingFlowPage';

const OnboardingPage = () => (
  <OnboardingFlowPage flowId={FLOW_IDS.FIXED_V1} />
);

export default OnboardingPage;
