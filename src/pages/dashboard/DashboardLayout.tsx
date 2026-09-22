import { useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useBrainScore } from "@/hooks/useBrainScore";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { Home, ClipboardList, FileText, Lightbulb, Puzzle, BookOpen, Trophy, User, LogOut, AlertTriangle, Compass, MessageCircle, Lock, Sparkles } from "lucide-react";
import { useUserPurchases } from "@/hooks/useUserPurchases";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import BrainScoreCard from "@/components/dashboard/BrainScoreCard";
import CelebrationOverlay from "@/components/dashboard/CelebrationOverlay";
import StreakCard from "@/components/dashboard/StreakCard";
import { ClaimProvider } from "@/context/ClaimContext";
import { Skeleton } from "@/components/ui/skeleton";

const mainNav = [
  { title: "Home", url: "/dashboard", icon: Home },
  { title: "Tests", url: "/dashboard/tests", icon: ClipboardList },
  { title: "My Report", url: "/dashboard/reports", icon: FileText },
];

const trainingNav = [
  { title: "Brain Teasers", url: "/dashboard/brain-teasers", icon: Lightbulb },
  { title: "Mazes", url: "/dashboard/puzzles", icon: Puzzle },
  { title: "Lessons", url: "/dashboard/lessons", icon: BookOpen },
];

const premiumNav = [
  { title: "Weakness Report", url: "/dashboard/weakness-report", icon: AlertTriangle, purchaseKey: "hasWeaknessReport" as const },
  { title: "Genius Blueprint", url: "/dashboard/genius-blueprint", icon: Compass, purchaseKey: "hasGeniusBlueprint" as const },
  { title: "Brain Coach", url: "/dashboard/brain-coach", icon: MessageCircle, purchaseKey: "hasBrainCoach" as const },
];

const progressNav = [
  { title: "Achievements", url: "/dashboard/achievements", icon: Trophy },
  { title: "Profile", url: "/dashboard/profile", icon: User },
];

function DashboardSidebar() {
  const { signOut } = useAuth();
  const { profile } = useBrainScore();
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useSidebar();
  const purchases = useUserPurchases();

  const handleNav = (path: string) => {
    navigate(path);
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarContent className="p-4 overflow-y-auto">
        <div className="flex items-center gap-2 mb-4 px-2 cursor-pointer" onClick={() => handleNav("/")}>
          <span className="text-lg font-bold tracking-tight text-foreground">
            True<span className="text-primary">IQ</span>
          </span>
        </div>

        <div className="mb-3">
          <BrainScoreCard profile={profile} />
        </div>

        {[
          { label: null, items: mainNav },
          { label: "Training", items: trainingNav },
        ].map((group, gi) => (
          <SidebarGroup key={gi} className="py-1">
            {group.label && <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/60 px-3 mb-0.5">{group.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/dashboard"}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
                        activeClassName="bg-primary/10 text-primary font-medium"
                        onClick={() => { if (isMobile) setOpenMobile(false); }}
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Premium nav group */}
        <SidebarGroup className="py-1">
          <SidebarGroupLabel className="text-[10px] uppercase tracking-wider px-3 mb-0.5 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent font-semibold">Premium</span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {purchases.loading ? (
                premiumNav.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <div className="flex items-center gap-3 px-3 py-2">
                      <Skeleton className="h-6 w-6 rounded-md" />
                      <Skeleton className="h-4 flex-1 rounded" />
                    </div>
                  </SidebarMenuItem>
                ))
              ) : (
                premiumNav.map((item) => {
                  const owned = purchases[item.purchaseKey];
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm border ${
                            owned
                              ? "border-primary/20 bg-primary/5 hover:bg-primary/10 text-foreground"
                              : "border-border/50 bg-muted/30 hover:bg-muted/60 text-muted-foreground"
                          }`}
                          activeClassName="!bg-primary/15 !border-primary/40 text-primary font-medium"
                          onClick={() => { if (isMobile) setOpenMobile(false); }}
                        >
                          <div className={`rounded-md p-1 ${owned ? "bg-primary/10" : "bg-muted"}`}>
                            <item.icon className={`w-3.5 h-3.5 ${owned ? "text-primary" : "text-muted-foreground/70"}`} />
                          </div>
                          <span className="flex-1">{item.title}</span>
                          {owned
                            ? <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                            : <Lock className="w-3.5 h-3.5 text-muted-foreground/40" />
                          }
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Progress nav group */}
        <SidebarGroup className="py-1">
          <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/60 px-3 mb-0.5">Progress</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {progressNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
                      activeClassName="bg-primary/10 text-primary font-medium"
                      onClick={() => { if (isMobile) setOpenMobile(false); }}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto pt-4">
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground text-sm" onClick={async () => { await signOut(); navigate("/auth-gate"); }}>
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export default function DashboardLayout() {
  const { celebration, dismissCelebration } = useBrainScore();
  const mainRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <ClaimProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <DashboardSidebar />
          <main id="dashboard-scroll-container" ref={mainRef} className="flex-1 p-4 md:p-8 overflow-auto">
            <div className="md:hidden mb-4">
              <SidebarTrigger />
            </div>
            <Outlet />
          </main>
        </div>
        <CelebrationOverlay event={celebration} onDismiss={dismissCelebration} />
      </SidebarProvider>
    </ClaimProvider>
  );
}
