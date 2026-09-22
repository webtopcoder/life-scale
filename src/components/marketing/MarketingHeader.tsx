import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { LifeScaleWordmark } from './LifeScaleWordmark';
import { scrollToSection } from '@/lib/scrollToSection';
import supportAgentIcon from '@/assets/support-agent.webp';
import { CATEGORIES, scalesInCategory } from '@/config/scales';
import { useAuth } from '@/context/AuthContext';


const NAV_SCALES = CATEGORIES.filter((c) => c.status === 'live').flatMap((c) =>
  scalesInCategory(c.key).map((s) => ({
    name: s.shortName,
    category: c.name,
    id: `scale-${s.key}`,
  })),
);


export const MarketingHeader = ({ onStart }: { onStart?: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileTestsOpen, setMobileTestsOpen] = useState(false);

  const startFn = onStart ?? (() => navigate('/choose-test'));
  const isHome = location.pathname === '/';

  const closeMobile = () => {
    setMobileOpen(false);
    setMobileTestsOpen(false);
  };

  const goToSection = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    closeMobile();
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: id } });
      return;
    }
    scrollToSection(id);
    history.replaceState(null, '', `#${id}`);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[hsl(var(--iq-border))] bg-[hsl(var(--iq-surface))]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <LifeScaleWordmark />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <div className="relative">
              <button
                onClick={() => setOpen((v) => !v)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-[hsl(var(--iq-ink))] hover:text-[hsl(var(--iq-cobalt))]"
              >
                Tests <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {open && (
                <div className="absolute right-0 top-full mt-1 w-64 overflow-hidden rounded-lg border border-[hsl(var(--iq-border))] bg-[hsl(var(--iq-surface))] shadow-[0_10px_30px_-10px_rgba(15,23,42,0.15)]">
                  {NAV_SCALES.map((b) => (
                    <a
                      key={b.name}
                      href={`/#${b.id}`}
                      onClick={goToSection(b.id)}
                      className="block border-b border-[hsl(var(--iq-border))] px-4 py-3 text-sm font-medium text-[hsl(var(--iq-ink))] last:border-b-0 hover:bg-[hsl(var(--iq-mint-wash))]"
                    >
                      {b.category} · {b.name}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <a href="#pricing" onClick={goToSection('pricing')} className="rounded-md px-3 py-2 text-sm font-medium text-[hsl(var(--iq-ink))] hover:text-[hsl(var(--iq-cobalt))]">
              Plans
            </a>
            <a href="#faq" onClick={goToSection('faq')} className="rounded-md px-3 py-2 text-sm font-medium text-[hsl(var(--iq-ink))] hover:text-[hsl(var(--iq-cobalt))]">
              FAQ
            </a>
            <Link to="/help" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[hsl(var(--iq-ink))] hover:text-[hsl(var(--iq-cobalt))]">
              Help
              <img src={supportAgentIcon} alt="" aria-hidden="true" className="h-5 w-5 object-contain" />
            </Link>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              to={user ? '/main-dashboard' : '/auth-gate?mode=login'}
              className="iq-btn-outline inline-flex h-9 items-center px-4 text-sm"
            >
              {user ? 'Dashboard' : 'Login'}
            </Link>
          </div>

          <button
            className="md:hidden rounded-md p-2 text-[hsl(var(--iq-ink))]"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

          {mobileOpen && (
          <div className="border-t border-[hsl(var(--iq-border))] bg-[hsl(var(--iq-surface))] md:hidden">
            <div className="mx-auto max-w-6xl px-4 py-3">
              <Link
                to={user ? '/main-dashboard' : '/auth-gate?mode=login'}
                onClick={closeMobile}
                className="block border-b border-[hsl(var(--iq-border))] py-3 text-sm font-medium text-[hsl(var(--iq-ink))]"
              >
                {user ? 'Dashboard' : 'Login'}
              </Link>

              <button
                onClick={() => setMobileTestsOpen((v) => !v)}
                className="flex w-full items-center justify-between border-b border-[hsl(var(--iq-border))] py-3 text-sm font-medium text-[hsl(var(--iq-ink))]"
              >
                <span>Tests</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${mobileTestsOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobileTestsOpen && (
                <div className="border-b border-[hsl(var(--iq-border))] py-1 pl-3">
                  {NAV_SCALES.map((b) => (
                    <a
                      key={b.name}
                      href={`/#${b.id}`}
                      onClick={goToSection(b.id)}
                      className="block py-2 text-sm text-[hsl(var(--iq-ink-soft))]"
                    >
                      {b.category} · {b.name}
                    </a>
                  ))}
                </div>
              )}

              <a
                href="#pricing"
                onClick={goToSection('pricing')}
                className="block border-b border-[hsl(var(--iq-border))] py-3 text-sm font-medium text-[hsl(var(--iq-ink))]"
              >
                Plans
              </a>
              <a
                href="#faq"
                onClick={goToSection('faq')}
                className="block border-b border-[hsl(var(--iq-border))] py-3 text-sm font-medium text-[hsl(var(--iq-ink))]"
              >
                FAQ
              </a>
              <Link
                to="/help"
                onClick={closeMobile}
                className="flex items-center gap-2 border-b border-[hsl(var(--iq-border))] py-3 text-sm font-medium text-[hsl(var(--iq-ink))]"
              >
                Help
                <img src={supportAgentIcon} alt="" aria-hidden="true" className="h-5 w-5 object-contain" />
              </Link>


            </div>
          </div>
        )}
      </header>

      {isHome && !mobileOpen && (
        <Link
          to="/help"
          className="block w-full bg-[hsl(var(--iq-cobalt-deep))] py-2 text-center text-sm text-white hover:opacity-95 md:hidden"
        >
          Need help? Click here to go to our <span className="font-bold">Help Center</span>
        </Link>
      )}
    </>
  );
};

export default MarketingHeader;
