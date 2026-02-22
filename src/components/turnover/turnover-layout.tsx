import { Link, useLocation, useParams } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRightLeft,
  BarChart3,
  ChevronLeft,
  History,
  PanelLeftClose,
  PanelLeftOpen,
  Send,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const navItems = [
  {
    title: "Pass the Baton",
    path: "pass-the-baton",
    icon: ArrowRightLeft,
    description: "Create and manage turnover entries",
  },
  {
    title: "Dispatch Turnover",
    path: "dispatch-turnover",
    icon: Send,
    description: "Shift briefing and finalization",
  },
  {
    title: "Transition History",
    path: "transition-history",
    icon: History,
    description: "View archived turnovers",
  },
  {
    title: "Turnover Metrics",
    path: "turnover-metrics",
    icon: BarChart3,
    description: "Analytics and performance",
  },
] as const;

export function TurnoverSidebar() {
  const { teamId } = useParams({ strict: false });
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <TooltipProvider>
      <motion.aside
        animate={{ width: isCollapsed ? 80 : 288 }}
        className="relative flex h-full flex-col overflow-hidden border-r bg-background"
        initial={false}
      >
        {/* Header */}
        <div className="relative border-b bg-gradient-to-br from-primary/5 to-transparent p-4">
          <div
            className={cn(
              "mb-4 flex items-center transition-all",
              isCollapsed ? "justify-center" : "justify-between"
            )}
          >
            {!isCollapsed && (
              <Link
                className="flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
                params={{ teamId: teamId ?? "" }}
                to="/teams/$teamId/settings"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Link>
            )}
            <Button
              className="h-8 w-8 text-muted-foreground"
              onClick={() => setIsCollapsed(!isCollapsed)}
              size="icon"
              variant="ghost"
            >
              {isCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div
            className={cn("flex items-center gap-3", isCollapsed && "flex-col")}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
              <ArrowRightLeft className="h-6 w-6 text-primary-foreground" />
            </div>
            {!isCollapsed && (
              <motion.div
                animate={{ opacity: 1 }}
                className="min-w-0"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
              >
                <h1 className="truncate font-bold text-xl tracking-tight">
                  TO - HUB
                </h1>
                <p className="truncate text-muted-foreground text-xs">
                  Shift handover management
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav
          className={cn(
            "flex flex-1 flex-col space-y-2",
            isCollapsed ? "items-center px-2 py-4" : "w-full p-4"
          )}
        >
          {navItems.map((item) => {
            const isActive = location.pathname.includes(item.path);
            const Icon = item.icon;

            const LinkComponent = (
              <Link
                className={cn(
                  "group relative flex select-none items-center rounded-lg transition-all duration-200",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  isCollapsed
                    ? "h-10 w-10 justify-center p-0"
                    : "w-full gap-3 px-4 py-3"
                )}
                params={{ teamId: teamId ?? "" }}
                to={`/teams/$teamId/turnover/${item.path}`}
              >
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-primary shadow-md"
                    layoutId="activeTurnoverTab"
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}
                <Icon
                  className={cn(
                    "relative z-10 h-5 w-5 shrink-0 transition-colors",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {!isCollapsed && (
                  <motion.div
                    animate={{ opacity: 1, width: "auto" }}
                    className="relative z-10 min-w-0 flex-1"
                    exit={{ opacity: 0, width: 0 }}
                    initial={{ opacity: 0, width: 0 }}
                  >
                    <p className="mb-1 font-semibold text-sm leading-none">
                      {item.title}
                    </p>
                    <p
                      className={cn(
                        "truncate text-xs transition-opacity",
                        isActive
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground group-hover:text-foreground/70"
                      )}
                    >
                      {item.description}
                    </p>
                  </motion.div>
                )}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger>{LinkComponent}</TooltipTrigger>
                  <TooltipContent
                    className="font-semibold"
                    side="right"
                    sideOffset={10}
                  >
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <div className="w-full" key={item.path}>
                {LinkComponent}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t p-4">
          {!isCollapsed && (
            <motion.div
              animate={{ opacity: 1 }}
              className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-4"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
            >
              <p className="mb-1 font-medium text-primary text-xs">Quick Tip</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Mark critical items as important to ensure they're highlighted
                during shift handovers.
              </p>
            </motion.div>
          )}
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}

export function TurnoverLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <TurnoverSidebar />
      <main className="w-full flex-1 overflow-auto bg-background">
        <AnimatePresence mode="wait">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="h-full"
            exit={{ opacity: 0, y: -10 }}
            initial={{ opacity: 0, y: 10 }}
            key={location.pathname}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
