"use client";

import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { ChevronsUpDown, PlusCircle, Settings } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { SessionData } from "@/lib/auth/config";
import { cn } from "@/lib/utils";

type Team = SessionData["permissions"][number];

interface TeamSwitcherProps {
  className?: string;
  teams: Team[];
}

const STORAGE_KEY = "ensemble-last-team-id";

// Extracted outside component to avoid re-creation on every render
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

export function TeamSwitcher({ className, teams }: TeamSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Optimized: extract only the teamId (primitive) to avoid re-renders on unrelated router changes
  const activeTeamIdFromUrl = useRouterState({
    select: (s) => {
      const match = s.matches.find(
        (d) => (d.params as Record<string, string>).teamId
      );
      return (match?.params as Record<string, string>)?.teamId;
    },
  });

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // Sync selectedTeamId with URL or storage
  useEffect(() => {
    if (activeTeamIdFromUrl) {
      setSelectedTeamId(activeTeamIdFromUrl);
      localStorage.setItem(STORAGE_KEY, activeTeamIdFromUrl);
    } else {
      const savedTeamId = localStorage.getItem(STORAGE_KEY);
      if (savedTeamId && teams.find((t) => t.teamId === savedTeamId)) {
        setSelectedTeamId(savedTeamId);
      } else if (teams.length > 0) {
        setSelectedTeamId(teams[0].teamId);
      }
    }
  }, [activeTeamIdFromUrl, teams]);

  const activeTeam = useMemo(
    () => teams.find((team) => team.teamId === selectedTeamId),
    [teams, selectedTeamId]
  );

  if (teams.length === 0) {
    return (
      // biome-ignore lint/suspicious/noExplicitAny: TanStack Router dynamic route
      <Link to={"/teams/register" as any}>
        <Button
          className={cn(
            "h-10 w-full justify-start transition-all md:w-[200px]",
            "border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10",
            "hover:border-primary/30 hover:from-primary/10 hover:to-primary/20",
            "group",
            className
          )}
          size="sm"
          variant="outline"
        >
          <PlusCircle className="mr-2 h-4 w-4 text-primary transition-transform group-hover:scale-110" />
          <span className="font-semibold text-primary">Create Team</span>
        </Button>
      </Link>
    );
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-11 justify-between px-3 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:border-none group-data-[collapsible=icon]:px-0",
          "border-border/40 bg-background/80 backdrop-blur-md",
          "hover:border-border/60 hover:bg-accent/50",
          "transition-colors duration-200",
          "shadow-sm hover:shadow-md",
          className
        )}
      >
        <div className="flex h-full items-center gap-3 overflow-hidden group-data-[collapsible=icon]:gap-0">
          <div
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
              "font-bold text-xs",
              "transition-all duration-200",
              "border border-primary/20 bg-primary/10 text-primary",
              "group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:rounded-md"
            )}
          >
            {activeTeam ? getInitials(activeTeam.teamName) : "T"}
          </div>
          <div className="flex flex-col items-start overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold text-sm tracking-tight">
              {activeTeam ? activeTeam.teamName : "Select Team..."}
            </span>
            {activeTeam && (
              <span className="font-medium text-[9px] text-muted-foreground/60 uppercase tracking-wider">
                {activeTeam.role}
              </span>
            )}
          </div>
        </div>
        <ChevronsUpDown
          className={cn(
            "ml-2 h-4 w-4 shrink-0 text-muted-foreground/50",
            "transition-transform duration-200",
            "group-data-[collapsible=icon]:hidden",
            open && "rotate-180"
          )}
        />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className={cn(
          "relative w-[320px] overflow-hidden p-0",
          "border-border/50 shadow-lg",
          "rounded-2xl bg-popover/95 backdrop-blur-xl",
          "data-closed:animate-none"
        )}
      >
        {/* Texture Overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url('/patterns/amex-3.avif')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <Command className="relative z-10 bg-transparent p-0">
          {/* Header */}
          <div className="relative border-border/50 border-b bg-muted/30 p-3">
            <div className="pointer-events-none absolute inset-0 bg-[url('/patterns/amex-3.avif')] bg-cover opacity-10 mix-blend-overlay" />
            <div className="relative z-10 flex items-center gap-2 px-1">
              <span className="pl-1 font-bold text-muted-foreground text-xs uppercase tracking-widest">
                Select Organization
              </span>
            </div>
          </div>

          <div className="p-2">
            <CommandInput
              className="h-9 rounded-lg border border-border/50 bg-background/50 text-xs transition-all focus:border-primary/50 focus:ring-0"
              placeholder="Search workspaces..."
            />
          </div>

          <CommandList className="scrollbar-thin max-h-[280px] px-2 pb-2">
            <CommandEmpty className="py-6 text-center text-muted-foreground text-xs">
              No workspaces found.
            </CommandEmpty>
            <CommandGroup>
              {teams.map((team) => {
                const isActive = selectedTeamId === team.teamId;

                return (
                  <CommandItem
                    className={cn(
                      "group mb-1 flex cursor-pointer items-center justify-between rounded-xl px-3 py-3 transition-all duration-200",
                      isActive
                        ? "border border-primary/10 bg-primary/5 shadow-sm"
                        : "border border-transparent hover:border-border/30 hover:bg-muted/50"
                    )}
                    key={team.teamId}
                    onSelect={() => {
                      setOpen(false);
                      localStorage.setItem(STORAGE_KEY, team.teamId);
                      setSelectedTeamId(team.teamId);

                      // Read matches fresh at selection time instead of subscribing to it
                      const currentMatches = router.state.matches;
                      const teamMatch = [...currentMatches]
                        .reverse()
                        .find(
                          (m) => (m.params as Record<string, string>).teamId
                        );
                      const leafMatch = currentMatches.at(-1);

                      if (teamMatch && leafMatch) {
                        router.navigate({
                          // biome-ignore lint/suspicious/noExplicitAny: TanStack Router dynamic navigation
                          to: leafMatch.routeId as any,
                          params: {
                            // biome-ignore lint/suspicious/noExplicitAny: TanStack Router dynamic params
                            ...(leafMatch.params as any),
                            teamId: team.teamId,
                          },
                          // biome-ignore lint/suspicious/noExplicitAny: TanStack Router search params
                          search: (prev: any) => prev,
                          // biome-ignore lint/suspicious/noExplicitAny: TanStack Router dynamic navigation
                        } as any);
                      }
                    }}
                    value={team.teamName}
                  >
                    <div className="flex flex-1 items-center gap-3 overflow-hidden">
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm transition-all duration-200",
                          "border font-bold text-[10px]",
                          isActive
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border/50 bg-background text-muted-foreground group-hover:border-primary/30 group-hover:text-foreground"
                        )}
                      >
                        {getInitials(team.teamName)}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span
                            className={cn(
                              "truncate font-semibold text-sm tracking-tight transition-colors",
                              isActive ? "text-primary" : "text-foreground"
                            )}
                          >
                            {team.teamName}
                          </span>
                        </div>
                        <span className="truncate font-medium text-[10px] text-muted-foreground/70 uppercase tracking-wider">
                          {team.role}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isActive && (
                        <div className="mr-2 h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                      )}

                      <Button
                        className={cn(
                          "h-7 w-7 rounded-md transition-all",
                          "opacity-0 group-hover:opacity-100",
                          "hover:bg-background hover:text-primary hover:shadow-sm",
                          "text-muted-foreground"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpen(false);
                          router.navigate({
                            to: `/teams/${team.teamId}/settings`,
                            // biome-ignore lint/suspicious/noExplicitAny: TanStack Router dynamic navigation
                          } as any);
                        }}
                        size="icon"
                        variant="ghost"
                      >
                        <Settings className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>

          <div className="border-border/50 border-t bg-muted/20 p-3">
            <CommandItem
              className={cn(
                "group relative flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl py-2.5 transition-all",
                "bg-gradient-to-r from-primary/5 to-transparent hover:from-primary/10 hover:to-primary/5",
                "border border-primary/10 hover:border-primary/20 hover:shadow-sm"
              )}
              onSelect={() => {
                setOpen(false);
                // biome-ignore lint/suspicious/noExplicitAny: TanStack Router dynamic route
                router.navigate({ to: "/teams/register" as any });
              }}
            >
              <div className="pointer-events-none absolute inset-0 bg-[url('/patterns/amex-3.avif')] bg-cover opacity-0 transition-opacity duration-500 group-hover:opacity-10" />
              <div className="relative z-10 flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 transition-transform group-hover:scale-110">
                <PlusCircle className="h-3 w-3 text-primary" />
              </div>
              <span className="relative z-10 font-bold text-foreground text-xs transition-colors group-hover:text-primary">
                Create New Workspace
              </span>
            </CommandItem>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
