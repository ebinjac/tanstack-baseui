import { useState } from "react";
import { Link, useLocation, useParams } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    ArrowRightLeft,
    Send,
    History,
    BarChart3,
    ChevronLeft,
    PanelLeftClose,
    PanelLeftOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

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
    const { teamId } = useParams({ strict: false }) as { teamId: string };
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(true);

    return (
        <TooltipProvider >
            <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? 80 : 288 }}
                className="border-r bg-background flex flex-col h-full overflow-hidden relative"
            >
                {/* Header */}
                <div className="p-4 border-b bg-gradient-to-br from-primary/5 to-transparent relative">
                    <div className={cn("flex items-center mb-4 transition-all", isCollapsed ? "justify-center" : "justify-between")}>
                        {!isCollapsed && (
                            <Link
                                to="/teams/$teamId/settings"
                                params={{ teamId }}
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Back
                            </Link>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={() => setIsCollapsed(!isCollapsed)}
                        >
                            {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                        </Button>
                    </div>

                    <div className={cn("flex items-center gap-3", isCollapsed && "flex-col")}>
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                            <ArrowRightLeft className="w-6 h-6 text-primary-foreground" />
                        </div>
                        {!isCollapsed && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="min-w-0"
                            >
                                <h1 className="text-xl font-bold tracking-tight truncate">Turnover Portal</h1>
                                <p className="text-xs text-muted-foreground truncate">
                                    Shift handover management
                                </p>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav
                    className={cn(
                        "flex-1 space-y-2 flex flex-col",
                        isCollapsed ? "items-center px-2 py-4" : "p-4 w-full"
                    )}
                >
                    {navItems.map((item) => {
                        const isActive = location.pathname.includes(item.path);
                        const Icon = item.icon;

                        const LinkComponent = (
                            <Link
                                to={`/teams/$teamId/turnover/${item.path}`}
                                params={{ teamId }}
                                className={cn(
                                    "group relative flex items-center rounded-lg transition-all duration-200 select-none",
                                    isActive
                                        ? "text-primary-foreground"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                                    isCollapsed
                                        ? "w-10 h-10 justify-center p-0"
                                        : "w-full gap-3 px-4 py-3"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTurnoverTab"
                                        className="absolute inset-0 bg-primary rounded-lg shadow-md"
                                        transition={{
                                            type: "spring",
                                            stiffness: 500,
                                            damping: 30,
                                        }}
                                    />
                                )}
                                <Icon
                                    className={cn(
                                        "w-5 h-5 shrink-0 transition-colors relative z-10",
                                        isActive
                                            ? "text-primary-foreground"
                                            : "text-muted-foreground group-hover:text-foreground"
                                    )}
                                />
                                {!isCollapsed && (
                                    <motion.div
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: "auto" }}
                                        exit={{ opacity: 0, width: 0 }}
                                        className="flex-1 min-w-0 relative z-10"
                                    >
                                        <p className="font-semibold text-sm leading-none mb-1">
                                            {item.title}
                                        </p>
                                        <p
                                            className={cn(
                                                "text-xs truncate transition-opacity",
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
                                <Tooltip key={item.path} >
                                    <TooltipTrigger >
                                        {LinkComponent}
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="font-semibold" sideOffset={10}>
                                        {item.title}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        }

                        return <div key={item.path} className="w-full">{LinkComponent}</div>;
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t">
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20"
                        >
                            <p className="text-xs font-medium text-primary mb-1">Quick Tip</p>
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
            <main className="flex-1 overflow-auto bg-background w-full">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="h-full"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
