import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  File,
  FileCode2,
  FileJson2,
  FileText,
  FileType,
  Globe2,
  Loader2,
  Lock,
  Settings2,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { z } from "zod";
import { getTeamApplications } from "@/app/actions/applications";
import { bulkCreateLinks, getLinkCategories } from "@/app/actions/links";
import { LinkManagerPage } from "@/components/link-manager/shared";
import { PageHeader } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Step } from "@/components/ui/step-timeline";
import { StepTimeline } from "@/components/ui/step-timeline";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { CreateLinkSchema } from "@/lib/zod/links.schema";

export const Route = createFileRoute("/teams/$teamId/link-manager/import")({
  component: ImportLinksPage,
});

// Types & Config
type ParsedLink = z.infer<typeof CreateLinkSchema> & {
  id: string;
  isValid: boolean;
  error?: string;
  isExpanded?: boolean;
};

type ImportFormat = "text" | "csv" | "json" | "html" | "markdown";

const FORMAT_CONFIG: Record<
  ImportFormat,
  {
    icon: React.ElementType;
    label: string;
    description: string;
    example: string;
  }
> = {
  text: {
    icon: FileText,
    label: "Plain Text",
    description: "Paste text with URLs.",
    example:
      "Check out these resources:\nInternal Docs: https://wiki.example.com/docs\nMonitoring Dashboard -> https://grafana.example.com/d/abc",
  },
  csv: {
    icon: FileType,
    label: "CSV",
    description: "Columns: title, url, tags.",
    example: `title,url,description,visibility,tags\nDocs,https://docs.example.com,Main docs,public,"docs,eng"`,
  },
  json: {
    icon: FileJson2,
    label: "JSON",
    description: "Array of link objects.",
    example: `[\n  { "title": "Docs", "url": "https://docs.example.com", "tags": ["docs"] }\n]`,
  },
  html: {
    icon: FileCode2,
    label: "HTML",
    description: "Bookmark exports.",
    example: `<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<DT><A HREF="https://docs.example.com">Docs</A>`,
  },
  markdown: {
    icon: File,
    label: "Markdown",
    description: "Markdown link syntax.",
    example: "[Engineering Docs](https://docs.example.com)",
  },
};

const STEPS: Step[] = [
  {
    id: 1,
    title: "Configuration",
    description: "Select format & defaults",
    icon: Settings2,
  },
  {
    id: 2,
    title: "Data Source",
    description: "Input your content",
    icon: Upload,
  },
  {
    id: 3,
    title: "Review & Verify",
    description: "Validate extracted links",
    icon: ShieldCheck,
  },
];

function ImportLinksPage() {
  const { teamId } = Route.useParams();
  const queryClient = useQueryClient();
  const navigate = Route.useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFormat, setSelectedFormat] = useState<ImportFormat>("text");
  const [defaultVisibility, setDefaultVisibility] = useState<
    "private" | "public"
  >("private");
  const [rawInput, setRawInput] = useState("");
  const [parsedLinks, setParsedLinks] = useState<ParsedLink[]>([]);
  const [_expandedLinkId, _setExpandedLinkId] = useState<string | null>(null);

  // Queries
  const { data: categories } = useQuery({
    queryKey: ["linkCategories", teamId],
    queryFn: () => getLinkCategories({ data: { teamId } }),
  });
  useQuery({
    queryKey: ["teamApplications", teamId],
    queryFn: () => getTeamApplications({ data: { teamId } }),
  });

  // Parser Logic
  const parsers = useParseLinks(teamId, defaultVisibility);
  const mutation = useMutation({
    mutationFn: (data: {
      teamId: string;
      links: Omit<
        ParsedLink,
        "id" | "isValid" | "error" | "isExpanded" | "teamId"
      >[];
    }) => bulkCreateLinks({ data }),
    onSuccess: (data) => {
      toast.success(`Successfully imported ${data.count} links`);
      queryClient.invalidateQueries({ queryKey: ["links", teamId] });
      navigate({ to: "/teams/$teamId/link-manager", params: { teamId } });
    },
    onError: (err) => toast.error(`Import failed: ${err.message}`),
  });

  // Handlers
  const handleParse = () => {
    if (!rawInput.trim()) {
      toast.error("Please enter some content to parse");
      return;
    }

    try {
      let links: ParsedLink[] = parsers[selectedFormat](rawInput);
      // Deduplicate
      const seen = new Set<string>();
      links = links.filter((link) => {
        if (seen.has(link.url)) {
          return false;
        }
        seen.add(link.url);
        return true;
      });

      // Validate
      links = links.map((link) => {
        try {
          new URL(link.url);
          return { ...link, isValid: true };
        } catch {
          return { ...link, isValid: false, error: "Invalid URL" };
        }
      });

      if (links.length === 0) {
        toast.error("No links found in the content");
        return;
      }

      setParsedLinks(links);
      setCurrentStep(3);
      toast.success(`Found ${links.length} potential links`);
    } catch (_e) {
      toast.error("Failed to parse content. Check format.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawInput(content);

      // Auto-detect format override if needed
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "csv") {
        setSelectedFormat("csv");
      } else if (ext === "json") {
        setSelectedFormat("json");
      } else if (ext === "html" || ext === "htm") {
        setSelectedFormat("html");
      } else if (ext === "md" || ext === "markdown") {
        setSelectedFormat("markdown");
      }

      toast.success(`File loaded: ${file.name}`);
    };
    reader.readAsText(file);
  };

  // Link Management
  const updateLink = (id: string, updates: Partial<ParsedLink>) => {
    setParsedLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
  };
  const removeLink = (id: string) =>
    setParsedLinks((prev) => prev.filter((l) => l.id !== id));

  // Bulk Actions
  const handleFinalImport = () => {
    const validLinks = parsedLinks.filter((l) => l.isValid);
    const payload = validLinks.map(
      ({ id, isValid, error, isExpanded, teamId: _, ...rest }) => rest
    );
    mutation.mutate({ teamId, links: payload });
  };

  return (
    <LinkManagerPage>
      <PageHeader
        description="Import multiple links at once from text files, bookmarks, or other formats."
        title="Import Resources"
      />

      <div className="mt-8 flex min-h-[600px] flex-col items-start gap-8 lg:flex-row">
        {/* Sidebar Timeline */}
        <div className="shrink-0 lg:w-[280px]">
          <div className="sticky top-8">
            <Card>
              <CardContent className="p-6">
                <StepTimeline currentStep={currentStep} steps={STEPS} />
              </CardContent>
            </Card>

            {currentStep === 1 && (
              <div className="mt-6 rounded-md border bg-muted/50 p-4 text-sm">
                <p className="mb-2 flex items-center gap-2 font-medium">
                  <Settings2 className="h-4 w-4" /> Note
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Select the format that matching your raw data. You can paste
                  content directly or upload a file in next step.
                </p>
              </div>
            )}

            {currentStep === 3 && (
              <div className="mt-6 space-y-2">
                <Button
                  className="w-full"
                  disabled={
                    mutation.isPending ||
                    parsedLinks.filter((l) => l.isValid).length === 0
                  }
                  onClick={handleFinalImport}
                  size="lg"
                >
                  {mutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Import {parsedLinks.filter((l) => l.isValid).length} Links
                </Button>
                <Button
                  className="w-full"
                  onClick={() => setCurrentStep(2)}
                  variant="outline"
                >
                  Back to Edit
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                initial={{ opacity: 0, y: 10 }}
                key="step1"
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Configuration</CardTitle>
                    <CardDescription>
                      Choose the format of your source data and default
                      settings.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label>Source Format</Label>
                      <RadioGroup
                        className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5"
                        onValueChange={(val: string) =>
                          setSelectedFormat(val as ImportFormat)
                        }
                        value={selectedFormat}
                      >
                        {(Object.keys(FORMAT_CONFIG) as ImportFormat[]).map(
                          (format) => {
                            const Config = FORMAT_CONFIG[format];
                            const Icon = Config.icon;
                            return (
                              <div className="relative" key={format}>
                                <RadioGroupItem
                                  className="sr-only"
                                  id={`format-${format}`}
                                  value={format}
                                />
                                <Label
                                  className={cn(
                                    "flex h-full cursor-pointer flex-col items-center justify-between gap-4 rounded-md border-2 p-4 text-center transition-all",
                                    selectedFormat === format
                                      ? "border-primary bg-primary/5 shadow-sm"
                                      : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground"
                                  )}
                                  htmlFor={`format-${format}`}
                                >
                                  <Icon
                                    className={cn(
                                      "h-6 w-6",
                                      selectedFormat === format
                                        ? "text-primary"
                                        : "text-muted-foreground"
                                    )}
                                  />
                                  <div className="space-y-1">
                                    <p
                                      className={cn(
                                        "font-medium text-sm leading-none",
                                        selectedFormat === format
                                          ? "text-primary"
                                          : ""
                                      )}
                                    >
                                      {Config.label}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                      {Config.description}
                                    </p>
                                  </div>
                                </Label>
                              </div>
                            );
                          }
                        )}
                      </RadioGroup>
                    </div>

                    <div className="space-y-3">
                      <Label>Default Visibility</Label>
                      <RadioGroup
                        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                        onValueChange={(v: string) =>
                          setDefaultVisibility(v as "private" | "public")
                        }
                        value={defaultVisibility}
                      >
                        <div className="relative">
                          <RadioGroupItem
                            className="sr-only"
                            id="def-private"
                            value="private"
                          />
                          <Label
                            className={cn(
                              "flex cursor-pointer items-center gap-4 rounded-md border-2 p-4 transition-all",
                              defaultVisibility === "private"
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground"
                            )}
                            htmlFor="def-private"
                          >
                            <Lock
                              className={cn(
                                "h-5 w-5",
                                defaultVisibility === "private"
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              )}
                            />
                            <div>
                              <p
                                className={cn(
                                  "mb-1 font-medium text-sm leading-none",
                                  defaultVisibility === "private"
                                    ? "text-primary"
                                    : ""
                                )}
                              >
                                Private
                              </p>
                              <p className="text-muted-foreground text-xs">
                                Only visible to you initially
                              </p>
                            </div>
                          </Label>
                        </div>
                        <div className="relative">
                          <RadioGroupItem
                            className="sr-only"
                            id="def-public"
                            value="public"
                          />
                          <Label
                            className={cn(
                              "flex cursor-pointer items-center gap-4 rounded-md border-2 p-4 transition-all",
                              defaultVisibility === "public"
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground"
                            )}
                            htmlFor="def-public"
                          >
                            <Globe2
                              className={cn(
                                "h-5 w-5",
                                defaultVisibility === "public"
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              )}
                            />
                            <div>
                              <p
                                className={cn(
                                  "mb-1 font-medium text-sm leading-none",
                                  defaultVisibility === "public"
                                    ? "text-primary"
                                    : ""
                                )}
                              >
                                Public
                              </p>
                              <p className="text-muted-foreground text-xs">
                                Visible to everyone in team
                              </p>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end border-t p-6">
                    <Button onClick={() => setCurrentStep(2)}>
                      Next Step <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                initial={{ opacity: 0, x: 20 }}
                key="step2"
                transition={{ duration: 0.2 }}
              >
                <Card className="flex h-full flex-col">
                  <CardHeader>
                    <CardTitle>Data Source</CardTitle>
                    <CardDescription>
                      Paste your content or upload a file. Format:{" "}
                      {FORMAT_CONFIG[selectedFormat].label}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <div className="flex h-[400px] flex-col rounded-md border bg-card p-4 transition-all focus-within:ring-1 focus-within:ring-ring">
                      <Textarea
                        className="flex-1 resize-none border-0 p-0 font-mono text-sm leading-relaxed shadow-none focus-visible:ring-0"
                        onChange={(e) => setRawInput(e.target.value)}
                        placeholder={`Paste your ${FORMAT_CONFIG[selectedFormat].label} content here...\n\nExample:\n${FORMAT_CONFIG[selectedFormat].example}`}
                        value={rawInput}
                      />
                      <div className="mt-2 flex items-center justify-between border-t pt-4">
                        <p className="font-medium text-muted-foreground text-xs">
                          {rawInput.length} chars •{" "}
                          {rawInput.split("\n").length} lines
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            accept=".txt,.csv,.json,.html,.md"
                            className="hidden"
                            onChange={handleFileUpload}
                            ref={fileInputRef}
                            type="file"
                          />
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            size="sm"
                            variant="secondary"
                          >
                            <Upload className="mr-2 h-4 w-4" /> Upload File
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t p-6">
                    <Button onClick={() => setCurrentStep(1)} variant="outline">
                      Back
                    </Button>
                    <Button disabled={!rawInput.trim()} onClick={handleParse}>
                      Parse Content <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                initial={{ opacity: 0, x: 20 }}
                key="step3"
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div className="space-y-1">
                      <CardTitle>Review & Verify</CardTitle>
                      <CardDescription>
                        Found {parsedLinks.length} links.{" "}
                        {parsedLinks.filter((l) => l.isValid).length} valid.
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => setParsedLinks([])}
                      size="sm"
                      variant="secondary"
                    >
                      Clear All
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px] pr-4">
                      <div className="space-y-3">
                        {parsedLinks.map((link, _index) => (
                          <div
                            className={cn(
                              "rounded-md border bg-card p-4 text-sm transition-all",
                              link.isValid
                                ? ""
                                : "border-destructive/50 bg-destructive/10"
                            )}
                            key={link.id}
                          >
                            <div className="flex items-start gap-4">
                              <div
                                className={cn(
                                  "mt-1 flex shrink-0 items-center justify-center",
                                  link.isValid
                                    ? "text-primary"
                                    : "text-destructive"
                                )}
                              >
                                {link.isValid ? (
                                  <CheckCircle2 className="h-5 w-5" />
                                ) : (
                                  <AlertCircle className="h-5 w-5" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1 space-y-3">
                                <div>
                                  <Input
                                    className="h-8 bg-transparent shadow-none focus-visible:ring-1"
                                    onChange={(e) =>
                                      updateLink(link.id, {
                                        title: e.target.value,
                                      })
                                    }
                                    placeholder="Link Title"
                                    value={link.title}
                                  />
                                </div>
                                <div>
                                  <Input
                                    className={cn(
                                      "h-8 bg-muted/50 font-mono text-xs shadow-none focus-visible:ring-1",
                                      !link.isValid && "text-destructive"
                                    )}
                                    onChange={(e) =>
                                      updateLink(link.id, {
                                        url: e.target.value,
                                      })
                                    }
                                    value={link.url}
                                  />
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                  <Badge
                                    className="cursor-pointer font-normal hover:bg-muted"
                                    onClick={() =>
                                      updateLink(link.id, {
                                        visibility:
                                          link.visibility === "public"
                                            ? "private"
                                            : "public",
                                      })
                                    }
                                    variant="secondary"
                                  >
                                    {link.visibility === "public" ? (
                                      <Globe2 className="mr-1 h-3 w-3" />
                                    ) : (
                                      <Lock className="mr-1 h-3 w-3" />
                                    )}
                                    {link.visibility}
                                  </Badge>
                                  {link.categoryId && (
                                    <Badge
                                      className="font-normal"
                                      variant="outline"
                                    >
                                      {
                                        categories?.find(
                                          (c) => c.id === link.categoryId
                                        )?.name
                                      }
                                    </Badge>
                                  )}
                                  <Button
                                    className="ml-auto h-6 px-2 text-destructive text-xs hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => removeLink(link.id)}
                                    size="sm"
                                    variant="ghost"
                                  >
                                    <Trash2 className="mr-1 h-3 w-3" /> Remove
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </LinkManagerPage>
  );
}

function useParseLinks(
  teamId: string,
  defaultVisibility: "private" | "public"
) {
  return useMemo(
    () => ({
      text: (input: string): ParsedLink[] => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const matches = input.match(urlRegex) || [];
        return matches.map((url) => ({
          id: crypto.randomUUID(),
          url,
          title: new URL(url).hostname,
          description: "",
          tags: [],
          visibility: defaultVisibility,
          teamId,
          isValid: true,
          isExpanded: false,
          categoryId: null,
          applicationId: null,
        }));
      },
      csv: (input: string) => {
        const lines = input.split("\n").filter((l) => l.trim().length > 0);
        return lines
          .slice(1)
          .map((line) => {
            const [title, url, tags] = line.split(",").map((s) => s.trim());
            if (!url) {
              return null;
            }
            return {
              id: crypto.randomUUID(),
              url,
              title: title || new URL(url).hostname,
              description: "",
              tags: tags ? tags.split(";").map((t) => t.trim()) : [],
              visibility: defaultVisibility,
              teamId,
              isValid: true,
              isExpanded: false,
              categoryId: null,
              applicationId: null,
            };
          })
          .filter(Boolean) as ParsedLink[];
      },
      json: (input: string): ParsedLink[] => {
        try {
          const data = JSON.parse(input);
          const arr = Array.isArray(data) ? data : [data];
          return arr.map((item: Record<string, unknown>) => ({
            id: crypto.randomUUID(),
            url: item.url as string,
            title:
              (item.title as string) || new URL(item.url as string).hostname,
            description: (item.description as string) || "",
            tags: (item.tags as string[]) || [],
            visibility:
              (item.visibility as "private" | "public") || defaultVisibility,
            teamId,
            isValid: true,
            isExpanded: false,
            categoryId: null,
            applicationId: null,
          }));
        } catch {
          return [];
        }
      },
      html: (_input: string): ParsedLink[] => [],
      markdown: (_input: string): ParsedLink[] => [],
    }),
    [teamId, defaultVisibility]
  );
}
