import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bulkCreateLinks, getLinkCategories } from '@/app/actions/links'
import { getTeamApplications } from '@/app/actions/applications'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
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
import {
  Upload,
  Globe2,
  Lock,
  Trash2,
  Loader2,
  ArrowRight,
  FileCode2,
  FileJson2,
  FileText,
  FileType,
  File,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Settings2,
  ShieldCheck,
  Box,
  Layers,
  ChevronDown,
} from 'lucide-react'
import { CreateLinkSchema } from '@/lib/zod/links.schema'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { LinkManagerPage } from '@/components/link-manager/shared'
import { PageHeader } from '@/components/shared'
import { StepTimeline, Step } from '@/components/ui/step-timeline'
import { useMemo } from 'react'

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

const STEPS: Step[] = [
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
  const [parsedLinks, setParsedLinks] = useState<ParsedLink[]>([])
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
    mutationFn: (data: { teamId: string; links: any[] }) =>
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
      let links: ParsedLink[] = parsers[selectedFormat](rawInput)
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
    <LinkManagerPage className="animate-in fade-in duration-500">
      <PageHeader
        title="Import Resources"
        description="Import multiple links at once from text files, bookmarks, or other formats."
      />

      <div className="flex flex-col lg:flex-row gap-8 min-h-[600px] items-start mt-8">
        {/* Sidebar Timeline */}
        <div className="lg:w-[280px] shrink-0">
          <div className="sticky top-8">
            <Card className="border-border/50 bg-muted/20 backdrop-blur-xl">
              <CardContent className="p-6">
                <StepTimeline steps={STEPS} currentStep={currentStep} />
              </CardContent>
            </Card>

            {currentStep === 1 && (
              <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10 text-xs">
                <p className="font-bold text-primary mb-2 flex items-center gap-2">
                  <Settings2 className="w-3 h-3" /> Note
                </p>
                <p className="text-muted-foreground">
                  Select the format that matching your raw data. You can paste
                  content directly or upload a file in next step.
                </p>
              </div>
            )}

            {currentStep === 3 && (
              <div className="mt-6">
                <Button
                  className="w-full font-bold shadow-lg shadow-primary/20"
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
                  variant="ghost"
                  className="w-full mt-2"
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
                <Card className="border-border/50 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                      Configuration
                    </CardTitle>
                    <CardDescription>
                      Choose the format of your source data and default
                      settings.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="space-y-4">
                      <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Source Format
                      </Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {(Object.keys(FORMAT_CONFIG) as ImportFormat[]).map(
                          (format) => {
                            const Config = FORMAT_CONFIG[format]
                            const Icon = Config.icon
                            return (
                              <div
                                key={format}
                                onClick={() => setSelectedFormat(format)}
                                className={cn(
                                  'cursor-pointer relative flex flex-col gap-2 p-3 rounded-xl border-2 transition-all duration-200 hover:shadow-md h-full',
                                  selectedFormat === format
                                    ? 'border-primary bg-primary/5 shadow-sm scale-[1.02]'
                                    : 'border-border/50 bg-card hover:border-primary/30 hover:bg-muted/30',
                                )}
                              >
                                <div
                                  className={cn(
                                    'w-8 h-8 rounded-md flex items-center justify-center transition-colors',
                                    selectedFormat === format
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted text-muted-foreground',
                                  )}
                                >
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div>
                                  <h4
                                    className={cn(
                                      'font-bold text-xs',
                                      selectedFormat === format
                                        ? 'text-primary'
                                        : 'text-foreground',
                                    )}
                                  >
                                    {Config.label}
                                  </h4>
                                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight line-clamp-2">
                                    {Config.description}
                                  </p>
                                </div>
                              </div>
                            )
                          },
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Default Visibility
                      </Label>
                      <RadioGroup
                        value={defaultVisibility}
                        onValueChange={(v: any) => setDefaultVisibility(v)}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                      >
                        <div className="relative">
                          <RadioGroupItem
                            value="private"
                            id="def-private"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="def-private"
                            className="flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all peer-checked:border-primary peer-checked:bg-primary/5 hover:bg-muted/50"
                          >
                            <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center border shadow-sm">
                              <Lock className="w-5 h-5 text-muted-foreground peer-checked:text-primary" />
                            </div>
                            <div>
                              <p className="font-bold">Private</p>
                              <p className="text-xs text-muted-foreground">
                                Only visible to you initially
                              </p>
                            </div>
                          </Label>
                        </div>
                        <div className="relative">
                          <RadioGroupItem
                            value="public"
                            id="def-public"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="def-public"
                            className="flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all peer-checked:border-primary peer-checked:bg-primary/5 hover:bg-muted/50"
                          >
                            <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center border shadow-sm">
                              <Globe2 className="w-5 h-5 text-muted-foreground peer-checked:text-primary" />
                            </div>
                            <div>
                              <p className="font-bold">Public</p>
                              <p className="text-xs text-muted-foreground">
                                Visible to everyone in team
                              </p>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-muted/20 p-6 flex justify-end">
                    <Button
                      onClick={() => setCurrentStep(2)}
                      size="lg"
                      className="font-bold shadow-lg shadow-primary/10"
                    >
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
                <Card className="border-border/50 shadow-sm h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                      Data Source
                    </CardTitle>
                    <CardDescription>
                      Paste your content or upload a file. Format:{' '}
                      {FORMAT_CONFIG[selectedFormat].label}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <div className="bg-muted/30 rounded-xl border border-dashed border-border p-4 h-[400px] flex flex-col focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                      <Textarea
                        value={rawInput}
                        onChange={(e) => setRawInput(e.target.value)}
                        placeholder={`Paste your ${FORMAT_CONFIG[selectedFormat].label} content here...\n\nExample:\n${FORMAT_CONFIG[selectedFormat].example}`}
                        className="flex-1 resize-none bg-transparent border-none focus-visible:ring-0 p-4 font-mono text-sm leading-relaxed"
                      />
                      <div className="pt-4 border-t border-dashed flex items-center justify-between">
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
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="mr-2 h-3.5 w-3.5" /> Upload File
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-muted/20 p-6 flex justify-between">
                    <Button variant="ghost" onClick={() => setCurrentStep(1)}>
                      Back
                    </Button>
                    <Button
                      onClick={handleParse}
                      size="lg"
                      className="font-bold"
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
                <Card className="border-border/50 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold tracking-tight">
                        Review & Verify
                      </CardTitle>
                      <CardDescription>
                        Found {parsedLinks.length} links.{' '}
                        {parsedLinks.filter((l) => l.isValid).length} valid.
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
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
                              'group p-4 rounded-xl border transition-all hover:shadow-md bg-card',
                              link.isValid
                                ? 'border-border/50'
                                : 'border-destructive/30 bg-destructive/5',
                            )}
                          >
                            <div className="flex items-start gap-4">
                              <div
                                className={cn(
                                  'mt-1 h-6 w-6 rounded-full flex items-center justify-center shrink-0',
                                  link.isValid
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-destructive/10 text-destructive',
                                )}
                              >
                                {link.isValid ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                  <AlertCircle className="w-4 h-4" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={link.title}
                                    onChange={(e) =>
                                      updateLink(link.id, {
                                        title: e.target.value,
                                      })
                                    }
                                    placeholder="Link Title"
                                    className="h-8 font-bold border-transparent hover:border-border focus:border-input transition-colors px-2 -ml-2 w-full bg-transparent"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={link.url}
                                    onChange={(e) =>
                                      updateLink(link.id, {
                                        url: e.target.value,
                                      })
                                    }
                                    className={cn(
                                      'h-7 text-xs font-mono bg-muted/50 border-transparent hover:border-border focus:border-input transition-colors px-2 -ml-2 w-full',
                                      !link.isValid && 'text-destructive',
                                    )}
                                  />
                                </div>
                                <div className="flex flex-wrap gap-2 pt-1">
                                  <Badge
                                    variant="outline"
                                    className="cursor-pointer hover:bg-muted"
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
                                      variant="secondary"
                                      className="bg-purple-500/10 text-purple-600 border-purple-200"
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
                                    className="h-5 px-2 text-[10px] text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
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
          .filter(Boolean) as ParsedLink[]
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
