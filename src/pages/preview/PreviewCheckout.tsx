import CheckoutPage from '@/pages/CheckoutPage';
import Header from '@/components/Header';
import { FunnelProvider } from '@/context/FunnelContext';

export default function PreviewCheckout() {
  return (
    <FunnelProvider>
      <Header />
      <CheckoutPage />
    </FunnelProvider>
  );
}
