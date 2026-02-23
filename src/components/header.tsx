import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { domAnimation, LazyMotion, m } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  ChevronRight,
  Command,
  ExternalLink,
  HelpCircle,
  Info,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  Link2,
  LogOut,
  Menu,
  RefreshCcw,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { loginUser } from "@/app/ssr/auth";
import { ModeToggle } from "@/components/mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import type { SessionData } from "@/lib/auth/config";
import { TeamSwitcher } from "./team-switcher";
import { useAuthBlueSSO } from "./use-authblue-sso";

// ============================================================================
// Types & Config
// ============================================================================
interface Tool {
  description: string;
  href: string;
  icon: LucideIcon;
  title: string;
}

interface NavLink {
  href: string;
  icon: LucideIcon;
  label: string;
}

const getTools = (teamId: string | null): Tool[] => [
  {
    title: "Scorecard",
    href: teamId ? `/teams/${teamId}/scorecard` : "/scorecard",
    description: "Real-time performance metrics and health monitoring.",
    icon: LayoutDashboard,
  },
  {
    title: "TO - HUB",
    href: teamId ? `/teams/${teamId}/turnover` : "/turnover",
    description: "Seamless shift handovers and transition tracking.",
    icon: RefreshCcw,
  },
  {
    title: "Link Manager",
    href: teamId ? `/teams/${teamId}/link-manager` : "/link-manager",
    description: "Centralized repository for all your documentation.",
    icon: Link2,
  },
  {
    title: "EnvMatrix",
    href: teamId ? `/teams/${teamId}/envmatrix` : "/envmatrix",
    description: "Track versions across environments effortlessly.",
    icon: Layers,
  },
];

const NAV_LINKS: NavLink[] = [
  { href: "/support", icon: HelpCircle, label: "Support" },
  { href: "/about", icon: Info, label: "About" },
  { href: "/docs", icon: BookOpen, label: "Docs" },
];

// ============================================================================
// Main Header Component
// ============================================================================
export function Header({ session }: { session: SessionData | null }) {
  const user = useAuthBlueSSO();
  const router = useRouter();
  const teams = session?.permissions || [];

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Scroll detection for header transformation
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Refresh permissions logic
  const handleRefreshPermissions = async () => {
    if (!user) {
      toast.error("SSO User not found. Please re-login.");
      return;
    }

    setIsRefreshing(true);
    const toastId = toast.loading("Refreshing your permissions...");

    try {
      await loginUser({ data: user });
      await router.invalidate();
      toast.success("Permissions refreshed successfully", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to refresh permissions", { id: toastId });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get active team from URL or storage
  const matches = useRouterState({ select: (s) => s.matches });
  const activeTeamIdFromUrl = (
    matches.find((d) => (d.params as Record<string, string>).teamId)
      ?.params as Record<string, string>
  )?.teamId;

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTeamIdFromUrl) {
      setSelectedTeamId(activeTeamIdFromUrl);
    } else {
      const savedTeamId = localStorage.getItem("ensemble-last-team-id");
      if (savedTeamId && teams.find((t) => t.teamId === savedTeamId)) {
        setSelectedTeamId(savedTeamId);
      } else if (teams.length > 0) {
        setSelectedTeamId(teams[0].teamId);
      }
    }
  }, [activeTeamIdFromUrl, teams]);

  const tools = getTools(selectedTeamId);
  const userInitials = `${user?.attributes.firstName?.[0] || ""}${user?.attributes.lastName?.[0] || ""}`;

  return (
    <LazyMotion features={domAnimation}>
      <header
        className={`fixed top-0 right-0 left-0 z-50 transition-all duration-150 ease-out ${
          scrolled
            ? "border-border/50 border-b bg-background/80 shadow-sm backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
        {/* Subtle gradient line at top */}
        <div className="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center gap-8">
              <LogoLink />
              <DesktopNav tools={tools} />
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {/* Team Switcher */}
              <div className="hidden sm:block">
                <TeamSwitcher teams={teams} />
              </div>

              {/* Separator */}
              <div className="hidden h-6 w-px bg-border/50 sm:block" />

              {/* Mode Toggle */}
              <ModeToggle />

              {/* User Menu */}
              <UserDropdown
                isRefreshing={isRefreshing}
                onRefreshPermissions={handleRefreshPermissions}
                userEmail={user?.attributes.email}
                userInitials={userInitials}
                userName={user?.attributes.fullName}
              />

              {/* Mobile Menu Button */}
              <Button
                className="hidden h-9 w-9 rounded-full max-lg:flex"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                size="icon"
                style={{ display: "var(--mobile-menu-display, none)" }}
                variant="ghost"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        teams={teams}
        tools={tools}
      />

      {/* Spacer for fixed header */}
      <div className="h-16" />
    </LazyMotion>
  );
}

// ============================================================================
// Logo Component
// ============================================================================
export function LogoLink() {
  return (
    <Link className="group flex items-center gap-3" to="/">
      <m.div
        className="relative flex h-10 w-10 items-center justify-center"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Subtle ambient glow on hover */}
        <div className="absolute inset-0 z-0 rounded-full bg-primary/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />

        {/* Asymmetrical Matrix Logo */}
        <svg
          aria-label="Ensemble logo"
          className="relative z-10 h-10 w-10 drop-shadow-sm"
          fill="none"
          role="img"
          viewBox="0 0 40 40"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g className="origin-center transition-transform duration-700 ease-in-out group-hover:rotate-[90deg] group-hover:scale-110">
            {/* Top Left (Large, Solid) */}
            <rect
              className="fill-primary"
              height="18"
              rx="5"
              width="18"
              x="4"
              y="4"
            />

            {/* Bottom Right (Large, Translucent, Overlapping center) */}
            <rect
              className="fill-primary/60"
              height="18"
              rx="5"
              width="18"
              x="18"
              y="18"
            />

            {/* Bottom Left (Small, Light) */}
            <rect
              className="fill-primary/30"
              height="12"
              rx="4"
              width="12"
              x="4"
              y="24"
            />

            {/* Top Right (Small, Medium) */}
            <rect
              className="fill-primary/80"
              height="12"
              rx="4"
              width="12"
              x="24"
              y="4"
            />
          </g>
        </svg>
      </m.div>
      <div className="hidden flex-col sm:flex">
        <span className="font-black text-[22px] text-foreground leading-[1.1] tracking-tight">
          Ensemble
        </span>
        <span className="font-bold text-[10px] text-muted-foreground uppercase leading-none tracking-widest">
          Platform
        </span>
      </div>
    </Link>
  );
}

// ============================================================================
// Desktop Navigation Component
// ============================================================================
function DesktopNav({ tools }: { tools: Tool[] }) {
  return (
    <NavigationMenu className="hidden lg:flex">
      <NavigationMenuList className="gap-1">
        <NavigationMenuItem>
          <NavigationMenuTrigger className="h-9 rounded-full bg-transparent px-4 transition-colors hover:bg-muted/50 data-[state=open]:bg-muted/50">
            <Command className="mr-2 h-4 w-4 text-primary" />
            <span>Tools</span>
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="relative w-[550px] overflow-hidden rounded-2xl border border-border/50 bg-background/95 p-0 shadow-2xl backdrop-blur-2xl">
              {/* Texture Overlay - Increased Visibility */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `url('/patterns/amex-3.avif')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />

              {/* Header Section */}
              <div className="relative border-border/50 border-b bg-muted/30 p-4">
                <div className="pointer-events-none absolute inset-0 bg-[url('/patterns/amex-3.avif')] bg-cover opacity-20" />
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/20">
                      <Command className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div>
                      <span className="block font-bold text-foreground text-xs uppercase tracking-widest">
                        Platform Suite
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Select a tool to launch
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-md border border-border/20 bg-background/50 px-2 py-1 font-medium text-[10px] text-muted-foreground/60">
                    <kbd className="font-sans">⌘</kbd>
                    <span>+</span>
                    <kbd className="font-sans">K</kbd>
                  </div>
                </div>
              </div>

              {/* Tools Grid */}
              <div className="relative z-10 p-4">
                <ul className="grid grid-cols-2 gap-2">
                  {tools.map((tool, index) => (
                    <ToolMenuItem index={index} key={tool.title} tool={tool} />
                  ))}
                </ul>

                {/* Footer */}
                <div className="mt-4 border-border/50 border-t pt-4">
                  <Link
                    className="group relative flex items-center justify-between overflow-hidden rounded-xl border border-primary/10 bg-gradient-to-r from-primary/5 to-transparent p-3 transition-all hover:border-primary/20 hover:from-primary/10 hover:to-primary/5"
                    // biome-ignore lint/suspicious/noExplicitAny: TanStack Router dynamic route
                    to={"/teams/register" as any}
                  >
                    <div className="absolute inset-0 bg-[url('/patterns/amex-3.avif')] bg-cover opacity-0 transition-opacity duration-500 group-hover:opacity-10" />

                    <div className="relative z-10 flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background shadow-sm">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground text-sm">
                          Create a new workspace
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Launch a new team environment
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="relative z-10 h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
                  </Link>
                </div>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {NAV_LINKS.map((item) => (
          <NavigationMenuItem key={item.label}>
            <Link
              className="group inline-flex h-9 items-center justify-center rounded-full px-4 font-medium text-muted-foreground text-sm transition-all duration-200 hover:bg-muted/50 hover:text-foreground"
              // biome-ignore lint/suspicious/noExplicitAny: TanStack Router dynamic route
              to={item.href as any}
            >
              <item.icon className="mr-2 h-4 w-4 transition-colors group-hover:text-foreground" />
              {item.label}
            </Link>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

// ============================================================================
// Tool Menu Item Component
// ============================================================================
function ToolMenuItem({ tool, index }: { tool: Tool; index: number }) {
  return (
    <m.li
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 10 }}
      transition={{ delay: index * 0.05 }}
    >
      <NavigationMenuLink
        render={
          <Link
            className="group flex flex-col rounded-xl border border-transparent bg-transparent p-4 transition-all duration-300 hover:border-border/50 hover:bg-muted/50"
            // biome-ignore lint/suspicious/noExplicitAny: TanStack Router dynamic route
            to={tool.href as any}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                <tool.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-sm transition-colors group-hover:text-primary">
                    {tool.title}
                  </span>
                  <ChevronRight className="h-3 w-3 -translate-x-2 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                </div>
                <p className="mt-1 line-clamp-2 text-muted-foreground text-xs leading-relaxed">
                  {tool.description}
                </p>
              </div>
            </div>
          </Link>
        }
      />
    </m.li>
  );
}

// ============================================================================
// User Dropdown Component
// ============================================================================
interface UserDropdownProps {
  isRefreshing: boolean;
  onRefreshPermissions: () => void;
  userEmail?: string;
  userInitials: string;
  userName?: string;
}

function UserDropdown({
  userInitials,
  userName,
  userEmail,
  isRefreshing,
  onRefreshPermissions,
}: UserDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            className="relative h-9 w-9 rounded-full p-0 transition-colors hover:ring-2 hover:ring-primary/20"
            variant="ghost"
          >
            <Avatar className="h-9 w-9 border-2 border-transparent transition-colors hover:border-primary/20">
              <AvatarImage alt={userName} src="" />
              <AvatarFallback className="bg-primary/10 font-semibold text-primary text-sm">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            {/* Online indicator */}
            <span className="absolute right-0 bottom-0 block h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
          </Button>
        }
      />
      <DropdownMenuContent
        align="end"
        className="w-64 p-2 data-closed:animate-none"
        sideOffset={8}
      >
        {/* User Info Header */}
        <div className="mb-2 flex items-center gap-3 rounded-lg bg-muted/50 p-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 font-semibold text-primary">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-foreground text-sm">
              {userName}
            </p>
            <p className="truncate text-muted-foreground text-xs">
              {userEmail}
            </p>
          </div>
        </div>

        <DropdownMenuGroup>
          <DropdownMenuItem
            render={
              <Link
                className="flex w-full cursor-pointer items-center rounded-lg"
                to="/profile"
              >
                <User className="mr-3 h-4 w-4 text-muted-foreground" />
                <span>Profile</span>
              </Link>
            }
          />

          <DropdownMenuItem
            className="cursor-pointer rounded-lg"
            disabled={isRefreshing}
            onClick={onRefreshPermissions}
          >
            <RefreshCcw
              className={`mr-3 h-4 w-4 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh Permissions</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-2" />

        <DropdownMenuGroup>
          <DropdownMenuItem
            render={
              <Link
                className="flex w-full cursor-pointer items-center rounded-lg"
                to="/support"
              >
                <LifeBuoy className="mr-3 h-4 w-4 text-muted-foreground" />
                <span>Help & Support</span>
              </Link>
            }
          />
          <DropdownMenuItem
            render={
              <a
                className="flex w-full cursor-pointer items-center rounded-lg"
                href="https://slack.com/app_redirect?channel=ensemble"
                rel="noopener noreferrer"
                target="_blank"
              >
                <Sparkles className="mr-3 h-4 w-4 text-muted-foreground" />
                <span>What's New</span>
                <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground/50" />
              </a>
            }
          />
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-2" />

        <DropdownMenuItem
          className="cursor-pointer rounded-lg text-destructive focus:bg-destructive/10 focus:text-destructive"
          variant="destructive"
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// Mobile Menu Component
// ============================================================================
interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  teams: SessionData["permissions"];
  tools: Tool[];
}

function MobileMenu({ isOpen, onClose, tools, teams }: MobileMenuProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <m.div
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-x-0 top-16 z-40 lg:hidden"
      exit={{ opacity: 0, y: -10 }}
      initial={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="border-border/50 border-b bg-background/95 shadow-xl backdrop-blur-xl">
        <div className="mx-auto max-w-7xl space-y-2 px-4 py-4">
          {tools.map((tool) => (
            <Link
              className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted/50"
              key={tool.title}
              onClick={onClose}
              // biome-ignore lint/suspicious/noExplicitAny: TanStack Router dynamic route
              to={tool.href as any}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <tool.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-medium text-foreground">{tool.title}</div>
                <div className="text-muted-foreground text-xs">
                  {tool.description}
                </div>
              </div>
            </Link>
          ))}
          <div className="mt-2 border-border/50 border-t pt-2">
            <TeamSwitcher teams={teams} />
          </div>
        </div>
      </div>
    </m.div>
  );
}
