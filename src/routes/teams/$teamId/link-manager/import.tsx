import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  AlertCircle,
  ArrowRight,
  Box,
  CheckCircle2,
  ChevronDown,
  Copy,
  File,
  FileCode2,
  FileJson2,
  FileText,
  FileType,
  Globe2,
  Layers,
  Loader2,
  Lock,
  Settings2,
  ShieldCheck,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import type { CreateLinkSchema } from '@/lib/zod/links.schema'
import type { z } from 'zod'
import type { Step } from '@/components/ui/step-timeline';
import { bulkCreateLinks, getLinkCategories } from '@/app/actions/links'
import { getTeamApplications } from '@/app/actions/applications'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { LinkManagerPage } from '@/components/link-manager/shared'
import { PageHeader } from '@/components/shared'
import { StepTimeline } from '@/components/ui/step-timeline'

export const Route = createFileRoute('/teams/$teamId/link-manager/import')({
  component: ImportLinksPage,
})

// Types & Config
type ParsedLink = z.infer<typeof CreateLinkSchema> & {
  id: string
  isValid: boolean
  error?: string
  isExpanded?: boolean
}

type ImportFormat = 'text' | 'csv' | 'json' | 'html' | 'markdown'

const FORMAT_CONFIG: Record<
  ImportFormat,
  {
    icon: React.ElementType
    label: string
    description: string
    example: string
  }
> = {
  text: {
    icon: FileText,
    label: 'Plain Text',
    description: 'Paste text with URLs.',
    example: `Check out these resources:\nInternal Docs: https://wiki.example.com/docs\nMonitoring Dashboard -> https://grafana.example.com/d/abc`,
  },
  csv: {
    icon: FileType,
    label: 'CSV',
    description: 'Columns: title, url, tags.',
    example: `title,url,description,visibility,tags\nDocs,https://docs.example.com,Main docs,public,"docs,eng"`,
  },
  json: {
    icon: FileJson2,
    label: 'JSON',
    description: 'Array of link objects.',
    example: `[\n  { "title": "Docs", "url": "https://docs.example.com", "tags": ["docs"] }\n]`,
  },
  html: {
    icon: FileCode2,
    label: 'HTML',
    description: 'Bookmark exports.',
    example: `<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<DT><A HREF="https://docs.example.com">Docs</A>`,
  },
  markdown: {
    icon: File,
    label: 'Markdown',
    description: 'Markdown link syntax.',
    example: `[Engineering Docs](https://docs.example.com)`,
  },
}

const STEPS: Array<Step> = [
  {
    id: 1,
    title: 'Configuration',
    description: 'Select format & defaults',
    icon: Settings2,
  },
  {
    id: 2,
    title: 'Data Source',
    description: 'Input your content',
    icon: Upload,
  },
  {
    id: 3,
    title: 'Review & Verify',
    description: 'Validate extracted links',
    icon: ShieldCheck,
  },
]

function ImportLinksPage() {
  const { teamId } = Route.useParams()
  const queryClient = useQueryClient()
  const navigate = Route.useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // State
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedFormat, setSelectedFormat] = useState<ImportFormat>('text')
  const [defaultVisibility, setDefaultVisibility] = useState<
    'private' | 'public'
  >('private')
  const [rawInput, setRawInput] = useState('')
  const [parsedLinks, setParsedLinks] = useState<Array<ParsedLink>>([])
  const [expandedLinkId, setExpandedLinkId] = useState<string | null>(null)

  // Queries
  const { data: categories } = useQuery({
    queryKey: ['linkCategories', teamId],
    queryFn: () => getLinkCategories({ data: { teamId } }),
  })
  const { data: applications } = useQuery({
    queryKey: ['teamApplications', teamId],
    queryFn: () => getTeamApplications({ data: { teamId } }),
  })

  // Parser Logic
  const parsers = useParseLinks(teamId, defaultVisibility)
  const mutation = useMutation({
    mutationFn: (data: { teamId: string; links: Array<any> }) =>
      bulkCreateLinks({ data }),
    onSuccess: (data) => {
      toast.success(`Successfully imported ${data.count} links`)
      queryClient.invalidateQueries({ queryKey: ['links', teamId] })
      navigate({ to: '/teams/$teamId/link-manager', params: { teamId } })
    },
    onError: (err) => toast.error('Import failed: ' + err.message),
  })

  // Handlers
  const handleParse = () => {
    if (!rawInput.trim()) {
      toast.error('Please enter some content to parse')
      return
    }

    try {
      let links: Array<ParsedLink> = parsers[selectedFormat](rawInput)
      // Deduplicate
      const seen = new Set<string>()
      links = links.filter((link) => {
        if (seen.has(link.url)) return false
        seen.add(link.url)
        return true
      })

      // Validate
      links = links.map((link) => {
        try {
          new URL(link.url)
          return { ...link, isValid: true }
        } catch {
          return { ...link, isValid: false, error: 'Invalid URL' }
        }
      })

      if (links.length === 0) {
        toast.error('No links found in the content')
        return
      }

      setParsedLinks(links)
      setCurrentStep(3)
      toast.success(`Found ${links.length} potential links`)
    } catch (e) {
      toast.error('Failed to parse content. Check format.')
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setRawInput(content)

      // Auto-detect format override if needed
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (ext === 'csv') setSelectedFormat('csv')
      else if (ext === 'json') setSelectedFormat('json')
      else if (ext === 'html' || ext === 'htm') setSelectedFormat('html')
      else if (ext === 'md' || ext === 'markdown') setSelectedFormat('markdown')

      toast.success(`File loaded: ${file.name}`)
    }
    reader.readAsText(file)
  }

  // Link Management
  const updateLink = (id: string, updates: Partial<ParsedLink>) => {
    setParsedLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    )
  }
  const removeLink = (id: string) =>
    setParsedLinks((prev) => prev.filter((l) => l.id !== id))

  // Bulk Actions
  const handleFinalImport = () => {
    const validLinks = parsedLinks.filter((l) => l.isValid)
    const payload = validLinks.map(
      ({ id, isValid, error, isExpanded, teamId: _, ...rest }) => rest,
    )
    mutation.mutate({ teamId, links: payload })
  }

  return (
    <LinkManagerPage>
      <PageHeader
        title="Import Resources"
        description="Import multiple links at once from text files, bookmarks, or other formats."
      />

      <div className="flex flex-col lg:flex-row gap-8 min-h-[600px] items-start mt-8">
        {/* Sidebar Timeline */}
        <div className="lg:w-[280px] shrink-0">
          <div className="sticky top-8">
            <Card>
              <CardContent className="p-6">
                <StepTimeline steps={STEPS} currentStep={currentStep} />
              </CardContent>
            </Card>

            {currentStep === 1 && (
              <div className="mt-6 p-4 rounded-md border bg-muted/50 text-sm">
                <p className="font-medium flex items-center gap-2 mb-2">
                  <Settings2 className="w-4 h-4" /> Note
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
                  size="lg"
                  onClick={handleFinalImport}
                  disabled={
                    mutation.isPending ||
                    parsedLinks.filter((l) => l.isValid).length === 0
                  }
                >
                  {mutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Import {parsedLinks.filter((l) => l.isValid).length} Links
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setCurrentStep(2)}
                >
                  Back to Edit
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Configuration</CardTitle>
                    <CardDescription>
                      Choose the format of your source data and default settings.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label>Source Format</Label>
                      <RadioGroup
                        value={selectedFormat}
                        onValueChange={(val: any) => setSelectedFormat(val)}
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
                      >
                        {(Object.keys(FORMAT_CONFIG) as Array<ImportFormat>).map(
                          (format) => {
                            const Config = FORMAT_CONFIG[format]
                            const Icon = Config.icon
                            return (
                              <div key={format} className="relative">
                                <RadioGroupItem value={format} id={`format-${format}`} className="sr-only" />
                                <Label
                                  htmlFor={`format-${format}`}
                                  className={cn(
                                    "flex flex-col items-center justify-between rounded-md border-2 p-4 gap-4 cursor-pointer text-center h-full transition-all",
                                    selectedFormat === format
                                      ? "border-primary bg-primary/5 shadow-sm"
                                      : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground"
                                  )}
                                >
                                  <Icon className={cn("w-6 h-6", selectedFormat === format ? "text-primary" : "text-muted-foreground")} />
                                  <div className="space-y-1">
                                    <p className={cn("text-sm font-medium leading-none", selectedFormat === format ? "text-primary" : "")}>{Config.label}</p>
                                    <p className="text-xs text-muted-foreground">{Config.description}</p>
                                  </div>
                                </Label>
                              </div>
                            )
                          },
                        )}
                      </RadioGroup>
                    </div>

                    <div className="space-y-3">
                      <Label>Default Visibility</Label>
                      <RadioGroup
                        value={defaultVisibility}
                        onValueChange={(v: any) => setDefaultVisibility(v)}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                      >
                        <div className="relative">
                          <RadioGroupItem
                            value="private"
                            id="def-private"
                            className="sr-only"
                          />
                          <Label
                            htmlFor="def-private"
                            className={cn(
                              "flex items-center gap-4 rounded-md border-2 p-4 cursor-pointer transition-all",
                              defaultVisibility === 'private'
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground"
                            )}
                          >
                            <Lock className={cn("w-5 h-5", defaultVisibility === 'private' ? "text-primary" : "text-muted-foreground")} />
                            <div>
                              <p className={cn("text-sm font-medium leading-none mb-1", defaultVisibility === 'private' ? "text-primary" : "")}>Private</p>
                              <p className="text-xs text-muted-foreground">Only visible to you initially</p>
                            </div>
                          </Label>
                        </div>
                        <div className="relative">
                          <RadioGroupItem
                            value="public"
                            id="def-public"
                            className="sr-only"
                          />
                          <Label
                            htmlFor="def-public"
                            className={cn(
                              "flex items-center gap-4 rounded-md border-2 p-4 cursor-pointer transition-all",
                              defaultVisibility === 'public'
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground"
                            )}
                          >
                            <Globe2 className={cn("w-5 h-5", defaultVisibility === 'public' ? "text-primary" : "text-muted-foreground")} />
                            <div>
                              <p className={cn("text-sm font-medium leading-none mb-1", defaultVisibility === 'public' ? "text-primary" : "")}>Public</p>
                              <p className="text-xs text-muted-foreground">Visible to everyone in team</p>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end border-t p-6">
                    <Button onClick={() => setCurrentStep(2)}>
                      Next Step <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <CardTitle>Data Source</CardTitle>
                    <CardDescription>
                      Paste your content or upload a file. Format:{' '}
                      {FORMAT_CONFIG[selectedFormat].label}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <div className="rounded-md border p-4 h-[400px] flex flex-col focus-within:ring-1 focus-within:ring-ring transition-all bg-card">
                      <Textarea
                        value={rawInput}
                        onChange={(e) => setRawInput(e.target.value)}
                        placeholder={`Paste your ${FORMAT_CONFIG[selectedFormat].label} content here...\n\nExample:\n${FORMAT_CONFIG[selectedFormat].example}`}
                        className="flex-1 resize-none border-0 focus-visible:ring-0 shadow-none p-0 font-mono text-sm leading-relaxed"
                      />
                      <div className="pt-4 mt-2 border-t flex items-center justify-between">
                        <p className="text-xs text-muted-foreground font-medium">
                          {rawInput.length} chars •{' '}
                          {rawInput.split('\n').length} lines
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileUpload}
                            accept=".txt,.csv,.json,.html,.md"
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="mr-2 h-4 w-4" /> Upload File
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t p-6 flex justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep(1)}>
                      Back
                    </Button>
                    <Button
                      onClick={handleParse}
                      disabled={!rawInput.trim()}
                    >
                      Parse Content <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div className="space-y-1">
                      <CardTitle>Review & Verify</CardTitle>
                      <CardDescription>
                        Found {parsedLinks.length} links.{' '}
                        {parsedLinks.filter((l) => l.isValid).length} valid.
                      </CardDescription>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setParsedLinks([])}
                    >
                      Clear All
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px] pr-4">
                      <div className="space-y-3">
                        {parsedLinks.map((link, index) => (
                          <div
                            key={link.id}
                            className={cn(
                              'p-4 rounded-md border text-sm transition-all bg-card',
                              link.isValid
                                ? ''
                                : 'border-destructive/50 bg-destructive/10',
                            )}
                          >
                            <div className="flex items-start gap-4">
                              <div
                                className={cn(
                                  'mt-1 flex items-center justify-center shrink-0',
                                  link.isValid
                                    ? 'text-primary'
                                    : 'text-destructive',
                                )}
                              >
                                {link.isValid ? (
                                  <CheckCircle2 className="w-5 h-5" />
                                ) : (
                                  <AlertCircle className="w-5 h-5" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 space-y-3">
                                <div>
                                  <Input
                                    value={link.title}
                                    onChange={(e) =>
                                      updateLink(link.id, {
                                        title: e.target.value,
                                      })
                                    }
                                    placeholder="Link Title"
                                    className="h-8 shadow-none focus-visible:ring-1 bg-transparent"
                                  />
                                </div>
                                <div>
                                  <Input
                                    value={link.url}
                                    onChange={(e) =>
                                      updateLink(link.id, {
                                        url: e.target.value,
                                      })
                                    }
                                    className={cn(
                                      'h-8 text-xs font-mono shadow-none focus-visible:ring-1 bg-muted/50',
                                      !link.isValid && 'text-destructive',
                                    )}
                                  />
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                  <Badge
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-muted font-normal"
                                    onClick={() =>
                                      updateLink(link.id, {
                                        visibility:
                                          link.visibility === 'public'
                                            ? 'private'
                                            : 'public',
                                      })
                                    }
                                  >
                                    {link.visibility === 'public' ? (
                                      <Globe2 className="w-3 h-3 mr-1" />
                                    ) : (
                                      <Lock className="w-3 h-3 mr-1" />
                                    )}
                                    {link.visibility}
                                  </Badge>
                                  {link.categoryId && (
                                    <Badge
                                      variant="outline"
                                      className="font-normal"
                                    >
                                      {
                                        categories?.find(
                                          (c) => c.id === link.categoryId,
                                        )?.name
                                      }
                                    </Badge>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
                                    onClick={() => removeLink(link.id)}
                                  >
                                    <Trash2 className="w-3 h-3 mr-1" /> Remove
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
  )
}

function useParseLinks(
  teamId: string,
  defaultVisibility: 'private' | 'public',
) {
  return useMemo(
    () => ({
      text: (input: string) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g
        const matches = input.match(urlRegex) || []
        return matches.map((url) => ({
          id: crypto.randomUUID(),
          url,
          title: new URL(url).hostname,
          description: '',
          tags: [],
          visibility: defaultVisibility,
          teamId,
          isValid: true,
          isExpanded: false,
        }))
      },
      csv: (input: string) => {
        const lines = input.split('\n').filter((l) => l.trim().length > 0)
        return lines
          .slice(1)
          .map((line) => {
            const [title, url, tags] = line.split(',').map((s) => s.trim())
            if (!url) return null
            return {
              id: crypto.randomUUID(),
              url,
              title: title || new URL(url).hostname,
              description: '',
              tags: tags ? tags.split(';').map((t) => t.trim()) : [],
              visibility: defaultVisibility,
              teamId,
              isValid: true,
              isExpanded: false,
              categoryId: null,
              applicationId: null,
            }
          })
          .filter(Boolean) as Array<ParsedLink>
      },
      json: (input: string) => {
        try {
          const data = JSON.parse(input)
          const arr = Array.isArray(data) ? data : [data]
          return arr.map((item: any) => ({
            id: crypto.randomUUID(),
            url: item.url,
            title: item.title || new URL(item.url).hostname,
            description: item.description || '',
            tags: item.tags || [],
            visibility: item.visibility || defaultVisibility,
            teamId,
            isValid: true,
            isExpanded: false,
            categoryId: null,
            applicationId: null,
          }))
        } catch {
          return []
        }
      },
      html: (input: string) => [],
      markdown: (input: string) => [],
    }),
    [teamId, defaultVisibility],
  )
}
