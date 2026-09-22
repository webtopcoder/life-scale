import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ChevronRight, LogIn, HelpCircle, MessageCircleQuestion, BookOpen, LayoutDashboard, Gift, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useFunnel } from '@/context/FunnelContext';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const { dispatch } = useFunnel();
  const isLoggedIn = !!user;

  const hiddenPaths = ['/assessment2', '/social-proof2', '/calculating2', '/email2', '/checkout', '/checkout2', '/report'];
  const pathname = location.pathname.replace(/\/+$/, '') || '/';
  const isOnboardingRoute = pathname.startsWith('/onboarding');
  const shouldHideHeader = isOnboardingRoute || hiddenPaths.some((path) =>
    pathname === path || pathname.startsWith(`${path}/`)
  );

  if (shouldHideHeader) {
    return null;
  }

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleStartTest = () => {
    setMenuOpen(false);
    dispatch({ type: 'RESET' });
    dispatch({ type: 'SET_STAGE', stage: 'intro' });
    navigate('/onboarding');
  };

  const menuItems = [
    ...(isLoggedIn
      ? [{ label: 'Dashboard', icon: LayoutDashboard, action: () => { setMenuOpen(false); navigate('/main-dashboard'); }, isButton: true }]
      : [{ label: 'Take the Test', icon: ChevronRight, action: handleStartTest, isButton: true }]
    ),
    { label: 'How It Works', icon: BookOpen, action: () => scrollTo('how-it-works') },
    { label: 'What You Get', icon: Gift, action: () => scrollTo('what-you-get') },
    { label: 'Reviews', icon: Star, action: () => scrollTo('reviews') },
    { label: 'FAQ', icon: MessageCircleQuestion, action: () => scrollTo('faq') },
    { label: 'Help Center', icon: HelpCircle, action: () => { setMenuOpen(false); navigate('/help'); } },
    ...(!isLoggedIn
      ? [{ label: 'Sign In', icon: LogIn, action: () => { setMenuOpen(false); navigate('/auth-gate?mode=login'); } }]
      : []
    ),
  ] as Array<{ label: string; icon: any; action: () => void; isButton?: boolean }>;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <span className="text-xl font-bold tracking-tight text-foreground">
              Life Scale
            </span>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <Button size="sm" onClick={() => navigate('/main-dashboard')}>
                <LayoutDashboard className="w-4 h-4 mr-1" /> Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/auth-gate?mode=login')}>
                  Sign In
                </Button>
                <Button size="sm" onClick={handleStartTest}>
                  Take a Test
                </Button>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 -mr-2 text-foreground"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="fixed top-14 left-0 right-0 z-50 bg-background border-b border-border shadow-lg md:hidden"
            >
              <nav className="max-w-5xl mx-auto px-4 py-3 space-y-1">
                {menuItems.map((item) =>
                  item.isButton ? (
                    <Button
                      key={item.label}
                      onClick={item.action}
                      className="w-full justify-center gap-1 mt-1 mb-2 bg-[hsl(var(--cta))] hover:bg-[hsl(var(--cta-hover))] text-[hsl(var(--cta-foreground))]"
                      size="sm"
                    >
                      {item.label}
                      <item.icon className="w-4 h-4" />
                    </Button>
                  ) : (
                    <button
                      key={item.label}
                      onClick={item.action}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors"
                    >
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                      {item.label}
                    </button>
                  )
                )}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
