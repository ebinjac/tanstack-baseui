import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Globe2, Loader2, Lock, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { z } from "zod";
import { bulkCreateLinks } from "@/app/actions/links";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { CreateLinkSchema } from "@/lib/zod/links.schema";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const TITLE_CLEANUP_REGEX = /^[-:;>]+$/;
const LEADING_SPECIAL_CHARS_REGEX = /^[-:;>]+/;
const NEWLINE_SPLIT_REGEX = /\n+/;

interface UniversalImporterDialogProps {
  teamId: string;
}

type ParsedLink = z.infer<typeof CreateLinkSchema> & {
  id: string;
  isValid: boolean;
  error?: string;
};

export function UniversalImporterDialog({
  teamId,
}: UniversalImporterDialogProps) {
  const [open, setOpen] = useState(false);
  const [rawInput, setRawInput] = useState("");
  const [parsedLinks, setParsedLinks] = useState<ParsedLink[]>([]);
  const [step, setStep] = useState<"input" | "review">("input");

  const queryClient = useQueryClient();

  // Helper to extract title from line
  const getTitleFromLine = (line: string, url: string): string => {
    let title = line.replace(url, "").trim();

    // If title is empty or just special chars, use domain as title
    if (!title || TITLE_CLEANUP_REGEX.test(title)) {
      try {
        title = new URL(url).hostname;
      } catch {
        title = "Untitled Link";
      }
    }

    // Clean up title (remove leading special chars)
    return title.replace(LEADING_SPECIAL_CHARS_REGEX, "").trim();
  };

  const parseLinks = () => {
    const lines = rawInput.split(NEWLINE_SPLIT_REGEX);
    const links: ParsedLink[] = [];

    for (const line of lines) {
      const match = line.match(URL_REGEX);
      if (!match) {
        continue;
      }

      for (const url of match) {
        const title = getTitleFromLine(line, url);

        links.push({
          id: crypto.randomUUID(),
          teamId,
          title,
          url,
          description: "",
          visibility: "private",
          tags: [],
          isValid: true,
        });
      }
    }

    if (links.length === 0) {
      toast.error("No valid links found in text");
      return;
    }

    setParsedLinks(links);
    setStep("review");
  };

  const mutation = useMutation({
    mutationFn: (data: {
      teamId: string;
      links: Omit<ParsedLink, "id" | "isValid" | "error" | "teamId">[];
    }) => bulkCreateLinks({ data }),
    onSuccess: (data) => {
      toast.success(`Successfully imported ${data.count} links`);
      queryClient.invalidateQueries({ queryKey: ["links", teamId] });
      setOpen(false);
      setRawInput("");
      setParsedLinks([]);
      setStep("input");
    },
    onError: (err) => {
      toast.error(`Import failed: ${err.message}`);
    },
  });

  const handleImport = () => {
    const validLinks = parsedLinks.filter((l) => l.isValid);
    if (validLinks.length === 0) {
      return;
    }

    // Strip UI-only fields
    const payload = validLinks.map(
      ({ id, isValid, error, teamId: _, ...rest }) => rest
    );

    mutation.mutate({
      teamId,
      links: payload,
    });
  };

  const removeLink = (id: string) => {
    setParsedLinks((prev) => prev.filter((l) => l.id !== id));
  };

  const updateLink = (id: string, updates: Partial<ParsedLink>) => {
    setParsedLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
  };

  const setAllVisibility = (vis: "public" | "private") => {
    setParsedLinks((prev) => prev.map((l) => ({ ...l, visibility: vis })));
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger>
        <Button className="gap-2" type="button" variant="outline">
          <Upload className="h-4 w-4" /> Import
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-[80vh] max-w-4xl flex-col">
        <DialogHeader>
          <DialogTitle>Universal Link Importer</DialogTitle>
          <DialogDescription>
            {step === "input"
              ? "Paste text containing URLs (emails, chat logs, lists). We'll extract and organize them."
              : "Review and refine your links before importing."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-hidden pt-4">
          {step === "input" ? (
            <Textarea
              className="h-full resize-none font-mono text-sm"
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="Paste your links here...
Example:
Check out this design resource: https://dribbble.com/shots/123
Also relevant: https://github.com/shadcn/ui - Component library
"
              value={rawInput}
            />
          ) : (
            <div className="flex h-full flex-col gap-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex gap-2 text-muted-foreground text-sm">
                  <span>{parsedLinks.length} links found</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="h-7 text-xs"
                    onClick={() => setAllVisibility("public")}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Set all Public
                  </Button>
                  <Button
                    className="h-7 text-xs"
                    onClick={() => setAllVisibility("private")}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Set all Private
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1 rounded-md border p-4">
                <div className="space-y-4">
                  {parsedLinks.map((link) => (
                    <div
                      className="group flex items-start gap-4 rounded-lg bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                      key={link.id}
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                          <Input
                            className="h-8 border-transparent bg-transparent font-bold hover:border-input focus:bg-background"
                            onChange={(e) =>
                              updateLink(link.id, { title: e.target.value })
                            }
                            value={link.title}
                          />
                          <div className="flex shrink-0">
                            <Button
                              className={cn(
                                "h-8 px-2",
                                link.visibility === "public"
                                  ? "text-blue-500"
                                  : "text-amber-500"
                              )}
                              onClick={() =>
                                updateLink(link.id, {
                                  visibility:
                                    link.visibility === "public"
                                      ? "private"
                                      : "public",
                                })
                              }
                              size="sm"
                              type="button"
                              variant="ghost"
                            >
                              {link.visibility === "public" ? (
                                <Globe2 className="h-4 w-4" />
                              ) : (
                                <Lock className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              className="h-8 w-8 text-destructive opacity-50 group-hover:opacity-100"
                              onClick={() => removeLink(link.id)}
                              size="sm"
                              type="button"
                              variant="ghost"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 px-3">
                          <span className="max-w-[500px] truncate font-mono text-muted-foreground text-xs">
                            {link.url}
                          </span>
                        </div>
                        <Input
                          className="h-7 border-transparent bg-transparent text-xs hover:border-input focus:bg-background"
                          onChange={(e) =>
                            updateLink(link.id, { description: e.target.value })
                          }
                          placeholder="Description (optional)"
                          value={link.description || ""}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          {step === "review" && (
            <Button
              onClick={() => setStep("input")}
              type="button"
              variant="outline"
            >
              Back to Paste
            </Button>
          )}

          {step === "input" ? (
            <Button
              disabled={!rawInput.trim()}
              onClick={parseLinks}
              type="button"
            >
              Review Links
            </Button>
          ) : (
            <Button
              disabled={parsedLinks.length === 0 || mutation.isPending}
              onClick={handleImport}
              type="button"
            >
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Import {parsedLinks.length} Links
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
