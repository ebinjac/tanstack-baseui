import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Box,
  Copy,
  ExternalLink,
  Globe2,
  Layers,
  Loader2,
  Lock,
  SearchX,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { AILinkSearchResult } from "@/app/actions/ai/link-search";
import { searchLinksWithAI } from "@/app/actions/ai/link-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LinkWithRelations } from "@/db/schema/links";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────

interface LinkAIAssistantProps {
  teamId: string;
}

// ─── Suggested Queries ─────────────────────────────────────────────────────

const SUGGESTED_QUERIES = [
  "Show me monitoring links",
  "Find CI/CD pipeline links",
  "What Dynatrace links do we have?",
  "Show me all public resources",
];

// ─── Main Component ────────────────────────────────────────────────────────

export function LinkAIAssistant({ teamId }: LinkAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AILinkSearchResult | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const searchMutation = useMutation({
    mutationFn: (q: string) =>
      searchLinksWithAI({ data: { teamId, query: q } }),
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (err) => {
      toast.error(`AI search failed: ${err.message}`);
    },
  });

  const handleSubmit = () => {
    const trimmed = query.trim();
    if (!trimmed || searchMutation.isPending) {
      return;
    }
    setResult(null);
    searchMutation.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    setResult(null);
    searchMutation.mutate(suggestion);
    inputRef.current?.focus();
  };

  const handleOpen = () => {
    setIsOpen(true);
    // Focus input after animation
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Trigger Button */}
      <Button
        className="group gap-2 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 to-violet-500/10 font-semibold text-primary text-sm shadow-sm transition-all hover:from-primary/20 hover:to-violet-500/20 hover:shadow-md hover:shadow-primary/10"
        id="ai-assistant-trigger"
        onClick={handleOpen}
        variant="ghost"
      >
        <Sparkles className="h-4 w-4 transition-transform group-hover:scale-110" />
        Ask AI
      </Button>

      {/* Overlay + Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              onClick={handleClose}
              transition={{ duration: 0.2 }}
            />

            {/* Side Panel */}
            <motion.div
              animate={{ x: 0, opacity: 1 }}
              className="fixed top-0 right-0 z-50 flex h-full w-full flex-col bg-background shadow-2xl sm:max-w-md"
              exit={{ x: 40, opacity: 0 }}
              initial={{ x: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Header */}
              <div className="relative overflow-hidden border-border/50 border-b bg-gradient-to-br from-primary/5 via-violet-500/5 to-background px-6 py-5">
                {/* Background decoration */}
                <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-violet-500/5 blur-2xl" />

                <div className="relative flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {/* AI Icon */}
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-violet-600 shadow-lg shadow-primary/20">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-black text-base tracking-tight">
                        Link Assistant
                      </h2>
                      <p className="font-medium text-[11px] text-muted-foreground">
                        Ask anything about your team's links
                      </p>
                    </div>
                  </div>
                  <Button
                    className="rounded-xl text-muted-foreground hover:text-foreground"
                    onClick={handleClose}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </div>
              </div>

              {/* Body — scrollable results area */}
              <div className="flex-1 overflow-y-auto">
                {/* Empty / Idle State */}
                {!(result || searchMutation.isPending) && (
                  <div className="flex flex-col gap-6 p-6">
                    {/* Welcome text */}
                    <div className="rounded-2xl border border-border/40 bg-muted/30 p-4">
                      <p className="font-medium text-[13px] text-muted-foreground leading-relaxed">
                        Ask me to find links using plain English. I'll search
                        your team's entire link library and surface the most
                        relevant results.
                      </p>
                    </div>

                    {/* Suggestions */}
                    <div>
                      <p className="mb-3 font-black text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                        Try asking
                      </p>
                      <div className="flex flex-col gap-2">
                        {SUGGESTED_QUERIES.map((suggestion) => (
                          <button
                            className="group flex items-center gap-3 rounded-xl border border-border/40 bg-card/40 px-4 py-3 text-left transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm"
                            key={suggestion}
                            onClick={() => handleSuggestion(suggestion)}
                            type="button"
                          >
                            <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary/40 transition-colors group-hover:text-primary" />
                            <span className="font-semibold text-[12px] text-foreground/70 transition-colors group-hover:text-foreground">
                              {suggestion}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Loading State */}
                {searchMutation.isPending && (
                  <div className="flex flex-col items-center justify-center gap-4 p-12">
                    <div className="relative">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-violet-600 shadow-lg shadow-primary/20" />
                      <Loader2 className="absolute inset-0 m-auto h-7 w-7 animate-spin text-white" />
                    </div>
                    <div className="text-center">
                      <p className="font-black text-sm tracking-tight">
                        Searching your links...
                      </p>
                      <p className="mt-1 font-medium text-[11px] text-muted-foreground">
                        AI is analyzing your repository
                      </p>
                    </div>
                    {/* Animated dots */}
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          className="h-1.5 w-1.5 rounded-full bg-primary"
                          key={i}
                          transition={{
                            duration: 1.2,
                            repeat: Number.POSITIVE_INFINITY,
                            delay: i * 0.2,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Results */}
                {result && !searchMutation.isPending && (
                  <div className="flex flex-col gap-4 p-6">
                    {/* AI Summary */}
                    <div className="flex gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-4">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-violet-600">
                        <Sparkles className="h-3 w-3 text-white" />
                      </div>
                      <p className="font-medium text-[13px] text-foreground/80 leading-relaxed">
                        {result.summary}
                      </p>
                    </div>

                    {/* No results state */}
                    {result.matches.length === 0 && (
                      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/50 border-dashed py-10 text-center">
                        <SearchX className="h-8 w-8 text-muted-foreground/30" />
                        <div>
                          <p className="font-bold text-muted-foreground/60 text-sm">
                            No matches found
                          </p>
                          {result.noResultsMessage && (
                            <p className="mt-1 px-6 font-medium text-[11px] text-muted-foreground/40 leading-relaxed">
                              {result.noResultsMessage}
                            </p>
                          )}
                        </div>
                        <Button
                          className="mt-2 h-8 rounded-lg px-4 text-xs"
                          onClick={() => {
                            setResult(null);
                            setQuery("");
                            inputRef.current?.focus();
                          }}
                          variant="secondary"
                        >
                          Try a different query
                        </Button>
                      </div>
                    )}

                    {/* Match Count */}
                    {result.matches.length > 0 && (
                      <p className="font-black text-[10px] text-muted-foreground/50 uppercase tracking-widest">
                        {result.matches.length}{" "}
                        {result.matches.length === 1 ? "result" : "results"}{" "}
                        found
                      </p>
                    )}

                    {/* Link Result Cards */}
                    <div className="flex flex-col gap-3">
                      {result.matches.map(
                        ({ link, reason, relevanceScore }) => (
                          <AILinkResultCard
                            key={link.id}
                            link={link}
                            reason={reason}
                            relevanceScore={relevanceScore}
                          />
                        )
                      )}
                    </div>

                    {/* Ask again */}
                    {result.matches.length > 0 && (
                      <button
                        className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-border/40 border-dashed py-3 font-semibold text-[12px] text-muted-foreground/50 transition-colors hover:border-primary/30 hover:text-primary"
                        onClick={() => {
                          setResult(null);
                          setQuery("");
                          inputRef.current?.focus();
                        }}
                        type="button"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Ask another question
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Input Footer */}
              <div className="border-border/50 border-t bg-muted/20 p-4">
                <div className="flex gap-3 rounded-2xl border border-border/50 bg-background p-2 shadow-sm transition-shadow focus-within:border-primary/30 focus-within:shadow-md focus-within:shadow-primary/5">
                  <textarea
                    className="min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2 font-medium text-[13px] placeholder:text-muted-foreground/40 focus:outline-none"
                    disabled={searchMutation.isPending}
                    id="ai-query-input"
                    maxLength={500}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me about your links..."
                    ref={inputRef}
                    rows={1}
                    value={query}
                  />
                  <Button
                    className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-primary to-violet-600 text-white shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30 disabled:opacity-40"
                    disabled={!query.trim() || searchMutation.isPending}
                    id="ai-submit-button"
                    onClick={handleSubmit}
                    size="icon"
                    variant="default"
                  >
                    {searchMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span className="sr-only">Send</span>
                  </Button>
                </div>
                <p className="mt-2 text-center font-medium text-[10px] text-muted-foreground/30">
                  Press Enter to search · Shift+Enter for new line
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── AI Link Result Card ────────────────────────────────────────────────────

interface AILinkResultCardProps {
  link: LinkWithRelations;
  reason: string;
  relevanceScore: number;
}

function AILinkResultCard({
  link,
  reason,
  relevanceScore,
}: AILinkResultCardProps) {
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(link.url);
      toast.success("URL copied to clipboard");
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  const handleOpen = () => {
    window.open(link.url, "_blank", "noopener,noreferrer");
  };

  // Relevance bar color
  let barColor = "bg-amber-500";
  if (relevanceScore >= 0.8) {
    barColor = "bg-green-500";
  } else if (relevanceScore >= 0.5) {
    barColor = "bg-primary";
  }

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="group overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-md"
      initial={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
    >
      {/* Relevance indicator bar */}
      <div className="h-0.5 w-full bg-muted/50">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${Math.round(relevanceScore * 100)}%` }}
        />
      </div>

      <div className="p-4">
        {/* Title + actions */}
        <div className="flex items-start justify-between gap-2">
          <button
            className="min-w-0 text-left"
            onClick={handleOpen}
            type="button"
          >
            <h3 className="line-clamp-2 font-bold text-[13px] leading-snug tracking-tight transition-colors group-hover:text-primary">
              {link.title}
            </h3>
          </button>
          <div className="flex shrink-0 items-center gap-1">
            <button
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/40 text-muted-foreground/40 transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
              onClick={handleCopyUrl}
              title="Copy URL"
              type="button"
            >
              <Copy className="h-3 w-3" />
              <span className="sr-only">Copy URL</span>
            </button>
            <button
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/40 text-muted-foreground/40 transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
              onClick={handleOpen}
              title="Open link"
              type="button"
            >
              <ExternalLink className="h-3 w-3" />
              <span className="sr-only">Open link</span>
            </button>
          </div>
        </div>

        {/* URL */}
        <p className="mt-1 truncate font-medium text-[10px] text-muted-foreground/40 italic">
          {link.url}
        </p>

        {/* Badges */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {link.application && (
            <Badge
              className="h-5 gap-1 rounded-md border-blue-500/20 bg-blue-500/5 px-2 font-bold text-[9px] text-blue-600 uppercase tracking-wider"
              variant="outline"
            >
              <Box className="h-2.5 w-2.5" />
              {link.application.tla}
            </Badge>
          )}
          {link.category && (
            <Badge
              className="h-5 gap-1 rounded-md border-purple-500/20 bg-purple-500/5 px-2 font-bold text-[9px] text-purple-600 uppercase tracking-wider"
              variant="outline"
            >
              <Layers className="h-2.5 w-2.5" />
              {link.category.name}
            </Badge>
          )}
          <Badge
            className={cn(
              "h-5 gap-1 rounded-md px-2 font-bold text-[9px] uppercase tracking-wider",
              link.visibility === "public"
                ? "border-green-500/20 bg-green-500/5 text-green-600"
                : "border-border/50 bg-muted/50 text-muted-foreground"
            )}
            variant="outline"
          >
            {link.visibility === "public" ? (
              <Globe2 className="h-2.5 w-2.5" />
            ) : (
              <Lock className="h-2.5 w-2.5" />
            )}
            {link.visibility}
          </Badge>
        </div>

        {/* AI Reason */}
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-muted/30 px-3 py-2">
          <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-primary/50" />
          <p className="font-medium text-[11px] text-muted-foreground/70 leading-relaxed">
            {reason}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
