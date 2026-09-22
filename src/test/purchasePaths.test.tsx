import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import ChooseTestPage from '@/pages/funnel/ChooseTestPage';
import ChooseTierPage from '@/pages/funnel/ChooseTierPage';
import TrialOfferPage from '@/pages/funnel/TrialOfferPage';
import CheckoutSummaryPage from '@/pages/funnel/CheckoutSummaryPage';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import { FUNNEL_KEYS } from '@/lib/funnelState';

const mocks = vi.hoisted(() => ({
  user: { id: 'user-1', email: 'buyer@example.com' } as { id: string; email?: string } | null,
  entitlements: {
    tier: 'focus',
    entitledBranches: new Set(['iq', 'brain-health', 'hidden-genius']),
    entitledCategories: new Set(['mind']),
    hasSubscription: true,
  },
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: mocks.user, loading: false }),
}));

vi.mock('@/lib/entitlements', () => ({
  getEntitlements: vi.fn(async () => mocks.entitlements),
}));

vi.mock('@/integrations/api/client', () => ({
  api: {
    get: vi.fn(async () => ({ hasUsedTrial: true })),
    post: vi.fn(async () => ({})),
    patch: vi.fn(async () => ({})),
  },
}));

vi.mock('@/components/LifeScaleCheckout', () => ({
  LifeScaleCheckout: ({ offerId }: { offerId: string }) => (
    <div data-testid="payment-widget" data-offer-id={offerId} />
  ),
}));

function LocationProbe() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}

describe('purchase paths', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    mocks.user = { id: 'user-1', email: 'buyer@example.com' };
  });

  it('sends an existing subscriber upgrade to trial selection instead of granting access', async () => {
    render(
      <MemoryRouter initialEntries={['/upgrade/body']}>
        <Routes>
          <Route path="/upgrade/:branch" element={<ChooseTierPage />} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: /continue to payment/i }));

    expect(await screen.findByTestId('location')).toHaveTextContent('/upgrade/body/trial');
    expect(localStorage.getItem(FUNNEL_KEYS.selectedTier)).toBe('complete');
  });

  it('keeps all scale upgrade routes intact through trial selection', async () => {
    localStorage.setItem(FUNNEL_KEYS.selectedTier, 'complete');
    render(
      <MemoryRouter initialEntries={['/upgrade/sleep-health/trial']}>
        <Routes>
          <Route path="/upgrade/:branch/trial" element={<TrialOfferPage />} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /continue with 3-day trial/i }));

    expect(await screen.findByTestId('location')).toHaveTextContent('/upgrade/sleep-health/checkout');
  });

  it('shows the payment widget at the end of an upgrade path', async () => {
    localStorage.setItem(FUNNEL_KEYS.selectedTier, 'complete');
    localStorage.setItem(FUNNEL_KEYS.selectedTrial, '3-day');
    render(
      <MemoryRouter initialEntries={['/upgrade/body/checkout']}>
        <Routes>
          <Route path="/upgrade/:branch/checkout" element={<CheckoutSummaryPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByTestId('payment-widget')).toBeInTheDocument());
    expect(screen.getByTestId('payment-widget')).toHaveAttribute(
      'data-offer-id',
      'complete_1.00_3d_38.99_28d',
    );
  });

  it('sends a signed-in homepage buyer directly into the selected scale purchase path', () => {
    render(
      <MemoryRouter initialEntries={['/choose-test']}>
        <Routes>
          <Route path="/choose-test" element={<ChooseTestPage />} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    const bodyHeading = screen
      .getAllByRole('heading', { name: 'Body IQ' })
      .find((heading) => heading.tagName === 'H3');
    const bodyCard = bodyHeading?.closest('article') ?? null;
    expect(bodyCard).not.toBeNull();
    fireEvent.click(within(bodyCard as HTMLElement).getByRole('button', { name: /start/i }));

    expect(screen.getByTestId('location')).toHaveTextContent('/upgrade/body');
    expect(localStorage.getItem(FUNNEL_KEYS.selectedTest)).toBe('body');
  });

  it('shows Dashboard rather than Login in the signed-in purchase header', () => {
    render(
      <MemoryRouter>
        <MarketingHeader />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/main-dashboard');
    expect(screen.queryByRole('link', { name: 'Login' })).not.toBeInTheDocument();
  });
});