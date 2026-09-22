import { ReactNode } from 'react';
import MarketingHeader from './MarketingHeader';
import MarketingFooter from './MarketingFooter';

export const LifeScaleMarketingLayout = ({
  children,
  onStart,
}: {
  children: ReactNode;
  onStart?: () => void;
}) => {
  return (
    <div className="lifescale-root min-h-screen">
      <MarketingHeader onStart={onStart} />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
};

export default LifeScaleMarketingLayout;
