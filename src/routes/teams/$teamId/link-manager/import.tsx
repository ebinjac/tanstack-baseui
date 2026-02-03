
import { createFileRoute, Link as RouterLink } from '@tanstack/react-router'
import { useState, useCallback, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bulkCreateLinks, getLinkCategories } from '@/app/actions/links'
import { getTeamApplications } from '@/app/actions/applications'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronLeft,
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
  RotateCcw,
  Check,
  X,
  Tag,
  Box,
  Layers,
  ChevronDown,
  Copy,
  Sparkles,
  ExternalLink,
  Activity,
  FileSearch,
} from 'lucide-react'
import { CreateLinkSchema } from '@/lib/zod/links.schema'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export const Route = createFileRoute('/teams/$teamId/link-manager/import')({
  component: ImportLinksPage,
})

type ParsedLink = z.infer<typeof CreateLinkSchema> & {
  id: string
  isValid: boolean
  error?: string
  isExpanded?: boolean
}

type ImportFormat = 'text' | 'csv' | 'json' | 'html' | 'markdown'

const formatInfo: Record<ImportFormat, { icon: React.ReactNode; label: string; description: string; example: string }> = {
  text: {
    icon: <FileText className="w-5 h-5" />,
    label: 'Plain Text',
    description: 'Paste any text containing URLs. We\'ll extract them automatically.',
    example: `Check out these resources:
Internal Docs: https://wiki.example.com/docs
Monitoring Dashboard -> https://grafana.example.com/d/abc
Jenkins: https://jenkins.example.com/job/main`,
  },
  csv: {
    icon: <FileType className="w-5 h-5" />,
    label: 'CSV',
    description: 'Comma-separated values with headers: title, url, description, visibility, tags',
    example: `title,url,description,visibility,tags
Engineering Docs,https://docs.example.com,Main documentation,public,"docs,engineering"
Grafana,https://grafana.example.com,Monitoring dashboards,private,"monitoring,ops"
Jenkins,https://jenkins.example.com,CI/CD Pipeline,public,"ci,devops"`,
  },
  json: {
    icon: <FileJson2 className="w-5 h-5" />,
    label: 'JSON',
    description: 'JSON array of link objects with title, url, description, visibility, tags',
    example: `[
  {
    "title": "Engineering Docs",
    "url": "https://docs.example.com",
    "description": "Main documentation",
    "visibility": "public",
    "tags": ["docs", "engineering"]
  },
  {
    "title": "Grafana",
    "url": "https://grafana.example.com",
    "visibility": "private"
  }
]`,
  },
  html: {
    icon: <FileCode2 className="w-5 h-5" />,
    label: 'HTML Bookmarks',
    description: 'HTML bookmark export from browsers (Chrome, Firefox, Edge)',
    example: `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<DL>
  <DT><A HREF="https://docs.example.com">Engineering Docs</A>
  <DT><A HREF="https://grafana.example.com">Grafana Dashboard</A>
  <DT><A HREF="https://github.com/org/repo">GitHub Repository</A>
</DL>`,
  },
  markdown: {
    icon: <File className="w-5 h-5" />,
    label: 'Markdown',
    description: 'Markdown links in [title](url) format',
    example: `# My Bookmarks

## Documentation
- [Engineering Docs](https://docs.example.com)
- [API Reference](https://api.example.com/docs)

## Monitoring
- [Grafana](https://grafana.example.com)
- [Datadog](https://app.datadoghq.com)`,
  },
}

function ImportLinksPage() {
  const { teamId } = Route.useParams()
  const queryClient = useQueryClient()
  const navigate = Route.useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [rawInput, setRawInput] = useState("")
  const [parsedLinks, setParsedLinks] = useState<ParsedLink[]>([])
  const [step, setStep] = useState<"input" | "review">("input")
  const [selectedFormat, setSelectedFormat] = useState<ImportFormat>('text')
  const [defaultVisibility, setDefaultVisibility] = useState<'private' | 'public'>('private')
  const [expandedLinkId, setExpandedLinkId] = useState<string | null>(null)

  // Fetch categories and applications for assignment
  const { data: categories } = useQuery({
    queryKey: ['linkCategories', teamId],
    queryFn: () => getLinkCategories({ data: { teamId } }),
  })

  const { data: applications } = useQuery({
    queryKey: ['teamApplications', teamId],
    queryFn: () => getTeamApplications({ data: { teamId } }),
  })

  // Parse functions for different formats
  const parseText = useCallback((text: string): ParsedLink[] => {
    const lines = text.split(/\n+/)
    const links: ParsedLink[] = []
    const urlRegex = /(https?:\/\/[^\s<>"]+)/g

    lines.forEach(line => {
      const matches = line.match(urlRegex)
      if (matches) {
        matches.forEach(url => {
          let cleanUrl = url.replace(/[.,;:!?)]+$/, '')
          let title = line.replace(url, '').trim()
          title = title.replace(/^[-:;>\|•→]+/, '').replace(/[-:;>\|•→]+$/, '').trim()

          if (!title) {
            try {
              const urlObj = new URL(cleanUrl)
              title = urlObj.hostname.replace('www.', '')
            } catch {
              title = "Untitled Link"
            }
          }

          links.push({
            id: crypto.randomUUID(),
            teamId,
            title,
            url: cleanUrl,
            description: "",
            visibility: defaultVisibility,
            tags: [],
            isValid: true,
          })
        })
      }
    })

    return links
  }, [teamId, defaultVisibility])

  const parseCSV = useCallback((text: string): ParsedLink[] => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''))
    const links: ParsedLink[] = []

    for (let i = 1; i < lines.length; i++) {
      const values: string[] = []
      let current = ''
      let inQuotes = false

      for (const char of lines[i]) {
        if (char === '"') inQuotes = !inQuotes
        else if (char === ',' && !inQuotes) {
          values.push(current.trim())
          current = ''
        } else current += char
      }
      values.push(current.trim())

      const row: Record<string, string> = {}
      headers.forEach((header, idx) => {
        row[header] = values[idx]?.replace(/^"|"$/g, '') || ''
      })

      if (row.url) {
        const tags = row.tags ? row.tags.split(/[,;]/).map(t => t.trim()).filter(Boolean) : []
        links.push({
          id: crypto.randomUUID(),
          teamId,
          title: row.title || row.name || new URL(row.url).hostname,
          url: row.url,
          description: row.description || row.desc || '',
          visibility: (row.visibility === 'public' ? 'public' : defaultVisibility),
          tags,
          isValid: true,
        })
      }
    }
    return links
  }, [teamId, defaultVisibility])

  const parseJSON = useCallback((text: string): ParsedLink[] => {
    try {
      const data = JSON.parse(text)
      const items = Array.isArray(data) ? data : [data]
      return items.filter(item => item.url).map(item => ({
        id: crypto.randomUUID(),
        teamId,
        title: item.title || item.name || new URL(item.url).hostname,
        url: item.url,
        description: item.description || item.desc || '',
        visibility: item.visibility === 'public' ? 'public' : defaultVisibility,
        tags: Array.isArray(item.tags) ? item.tags : (item.tags ? String(item.tags).split(',').map((t: string) => t.trim()) : []),
        isValid: true,
      }))
    } catch (e) {
      toast.error("Invalid JSON format")
      return []
    }
  }, [teamId, defaultVisibility])

  const parseHTML = useCallback((text: string): ParsedLink[] => {
    const links: ParsedLink[] = []
    const anchorRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi
    let match
    while ((match = anchorRegex.exec(text)) !== null) {
      const url = match[1]
      const title = match[2].trim() || new URL(url).hostname
      if (url.startsWith('http')) {
        links.push({
          id: crypto.randomUUID(),
          teamId,
          title,
          url,
          description: '',
          visibility: defaultVisibility,
          tags: [],
          isValid: true,
        })
      }
    }
    return links
  }, [teamId, defaultVisibility])

  const parseMarkdown = useCallback((text: string): ParsedLink[] => {
    const links: ParsedLink[] = []
    const mdLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    let match
    while ((match = mdLinkRegex.exec(text)) !== null) {
      const title = match[1].trim()
      const url = match[2].trim()
      if (url.startsWith('http')) {
        links.push({
          id: crypto.randomUUID(),
          teamId,
          title,
          url,
          description: '',
          visibility: defaultVisibility,
          tags: [],
          isValid: true,
        })
      }
    }
    return links
  }, [teamId, defaultVisibility])

  const parseLinks = useCallback(() => {
    let links: ParsedLink[] = []
    switch (selectedFormat) {
      case 'text': links = parseText(rawInput); break
      case 'csv': links = parseCSV(rawInput); break
      case 'json': links = parseJSON(rawInput); break
      case 'html': links = parseHTML(rawInput); break
      case 'markdown': links = parseMarkdown(rawInput); break
    }

    const seen = new Set<string>()
    links = links.filter(link => {
      if (seen.has(link.url)) return false
      seen.add(link.url)
      return true
    })

    links = links.map(link => {
      try {
        new URL(link.url)
        return { ...link, isValid: true }
      } catch {
        return { ...link, isValid: false, error: 'Invalid URL format' }
      }
    })

    if (links.length === 0) {
      toast.error("No valid links found. Check the format and try again.")
      return
    }

    toast.success(`Found ${links.length} links!`)
    setParsedLinks(links)
    setStep("review")
  }, [rawInput, selectedFormat, parseText, parseCSV, parseJSON, parseHTML, parseMarkdown])

  const mutation = useMutation({
    mutationFn: (data: { teamId: string, links: any[] }) => bulkCreateLinks({ data }),
    onSuccess: (data) => {
      toast.success(`Successfully imported ${data.count} links`)
      queryClient.invalidateQueries({ queryKey: ["links", teamId] })
      navigate({ to: "/teams/$teamId/link-manager", params: { teamId } })
    },
    onError: (err) => {
      toast.error("Import failed: " + err.message)
    }
  })

  const handleImport = () => {
    const validLinks = parsedLinks.filter(l => l.isValid)
    if (validLinks.length === 0) {
      toast.error("No valid links to import")
      return
    }
    const payload = validLinks.map(({ id, isValid, error, isExpanded, teamId: _, ...rest }) => rest)
    mutation.mutate({ teamId, links: payload })
  }

  const updateLink = (id: string, updates: Partial<ParsedLink>) => {
    setParsedLinks(prev => prev.map(l => {
      if (l.id !== id) return l
      if (updates.url !== undefined) {
        try {
          new URL(updates.url)
          return { ...l, ...updates, isValid: true, error: undefined }
        } catch {
          return { ...l, ...updates, isValid: false, error: 'Invalid URL format' }
        }
      }
      return { ...l, ...updates }
    }))
  }

  const removeLink = (id: string) => setParsedLinks(prev => prev.filter(l => l.id !== id))
  const duplicateLink = (id: string) => {
    const link = parsedLinks.find(l => l.id === id)
    if (link) setParsedLinks(prev => [...prev, { ...link, id: crypto.randomUUID() }])
  }

  const setAllVisibility = (vis: "public" | "private") => setParsedLinks(prev => prev.map(l => ({ ...l, visibility: vis })))
  const setAllApplication = (appId: string | null) => setParsedLinks(prev => prev.map(l => ({ ...l, applicationId: appId })))
  const setAllCategory = (catId: string | null) => setParsedLinks(prev => prev.map(l => ({ ...l, categoryId: catId })))

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setRawInput(content)
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (ext === 'csv') setSelectedFormat('csv')
      else if (ext === 'json') setSelectedFormat('json')
      else if (ext === 'html' || ext === 'htm') setSelectedFormat('html')
      else if (ext === 'md' || ext === 'markdown') setSelectedFormat('markdown')
      else setSelectedFormat('text')
    }
    reader.readAsText(file)
  }

  const loadExample = () => setRawInput(formatInfo[selectedFormat].example)
  const validCount = parsedLinks.filter(l => l.isValid).length
  const invalidCount = parsedLinks.filter(l => !l.isValid).length

  return (
    <div className="container mx-auto p-8 max-w-6xl space-y-8">
      {/* Professional Header */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-6">
            <RouterLink
              to="/teams/$teamId/link-manager"
              params={{ teamId }}
              className="h-14 w-14 rounded-2xl bg-background border border-border flex items-center justify-center hover:bg-muted/50 transition-all group shadow-sm"
            >
              <ChevronLeft className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </RouterLink>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] font-bold bg-primary/5 border-primary/20 text-primary px-2 h-5">
                  Link Manager
                </Badge>
                <span className="text-muted-foreground/30">/</span>
                <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">Bulk Operations</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-foreground">
                Import Resources
              </h1>
            </div>
          </div>
          <p className="text-sm font-medium text-muted-foreground max-w-[280px] text-right hidden lg:block italic opacity-60">
            Rapidly populate your repository from browser exports, documentation, or raw text.
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto py-4">
        <div className="relative flex justify-between items-center px-4">
          <div className="absolute left-8 right-8 top-1/2 h-[2px] bg-muted -translate-y-[18px] -z-10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: step === 'review' ? '100%' : '0%' }}
              className="h-full bg-primary"
            />
          </div>
          {[
            { id: 'input', label: 'Extract Content', icon: <Upload className="w-4 h-4" />, step: 1 },
            { id: 'review', label: 'Review & Verify', icon: <CheckCircle2 className="w-4 h-4" />, step: 2 },
          ].map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-3 w-32">
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center font-bold transition-all duration-500 border-2",
                step === s.id
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-110"
                  : step === 'review' && s.id === 'input'
                    ? "bg-primary/10 text-primary border-primary shadow-sm"
                    : "bg-muted text-muted-foreground border-border"
              )}>
                {step === 'review' && s.id === 'input' ? <Check className="w-5 h-5" /> : s.icon}
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className={cn(
                  "text-[10px] font-bold tracking-wider",
                  step === s.id ? "text-primary" : "text-muted-foreground/60"
                )}>
                  STEP {s.step}
                </span>
                <span className={cn(
                  "text-xs font-bold whitespace-nowrap",
                  step === s.id ? "text-foreground" : "text-muted-foreground/40"
                )}>
                  {s.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'input' ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="space-y-10">
              <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" />

              <div className="space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                  <div className="space-y-1.5">
                    <h3 className="text-xl font-bold tracking-tight">Source Selection</h3>
                    <p className="text-sm text-muted-foreground">Select the data format you wish to import from.</p>
                  </div>

                  <div className="flex items-center gap-3 bg-muted/30 p-1.5 rounded-2xl border border-border/50">
                    <span className="text-[10px] font-bold text-muted-foreground/60 px-3 py-1 uppercase tracking-wider">Default Visibility</span>
                    <div className="flex gap-1">
                      <Button variant={defaultVisibility === 'private' ? 'secondary' : 'ghost'} size="sm" onClick={() => setDefaultVisibility('private')} className={cn("h-9 px-4 rounded-xl font-bold text-xs gap-2 transition-all", defaultVisibility === 'private' ? "bg-background shadow-sm text-primary" : "text-muted-foreground")}>
                        <Lock className="w-3.5 h-3.5" /> Private
                      </Button>
                      <Button variant={defaultVisibility === 'public' ? 'secondary' : 'ghost'} size="sm" onClick={() => setDefaultVisibility('public')} className={cn("h-9 px-4 rounded-xl font-bold text-xs gap-2 transition-all", defaultVisibility === 'public' ? "bg-background shadow-sm text-primary" : "text-muted-foreground")}>
                        <Globe2 className="w-3.5 h-3.5" /> Public
                      </Button>
                    </div>
                  </div>
                </div>

                <Tabs value={selectedFormat} onValueChange={(v) => setSelectedFormat(v as ImportFormat)} className="w-full space-y-12">
                  <TabsList className="bg-transparent h-auto p-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    {(Object.keys(formatInfo) as ImportFormat[]).map((format) => (
                      <TabsTrigger
                        key={format}
                        value={format}
                        className={cn(
                          "group relative flex flex-col items-center justify-center gap-4 p-6 h-[140px] w-full border border-border/50 rounded-[2rem] transition-all duration-300 text-center bg-card hover:bg-muted/30 hover:shadow-2xl hover:shadow-primary/5 overflow-hidden",
                          "data-[state=active]:bg-primary/[0.03] data-[state=active]:border-primary data-[state=active]:shadow-2xl data-[state=active]:shadow-primary/10"
                        )}
                      >
                        <div className={cn("w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center transition-all duration-500", selectedFormat === format ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-105")}>
                          {formatInfo[format].icon}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className={cn("text-base font-bold transition-colors leading-none", selectedFormat === format ? "text-primary" : "text-foreground")}>{formatInfo[format].label}</span>
                        </div>
                        {selectedFormat === format && (
                          <motion.div layoutId="active-format-check" className="absolute top-5 right-5"><div className="bg-primary text-primary-foreground rounded-full p-1 shadow-sm"><Check className="w-3.5 h-3.5" /></div></motion.div>
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {(Object.keys(formatInfo) as ImportFormat[]).map((format) => (
                    <TabsContent key={format} value={format} className="mt-20">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 space-y-4">
                          <Card className="border border-border/50 bg-muted/10 rounded-3xl shadow-none p-6 h-full">
                            <h4 className="font-bold text-base flex items-center gap-2 mb-3"><AlertCircle className="w-4 h-4 text-primary" /> Setup Helper</h4>
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground leading-relaxed">{formatInfo[format].description}</p>
                              <Button variant="outline" size="sm" onClick={loadExample} className="rounded-xl font-bold text-xs gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all shadow-sm">Load Sample Data <ArrowRight className="w-4 h-4" /></Button>
                            </div>
                          </Card>
                        </div>
                        <div className="lg:col-span-2">
                          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full h-full min-h-[160px] rounded-3xl border-2 border-dashed border-primary/20 hover:border-primary/40 hover:bg-primary/[0.02] transition-all flex flex-col gap-3 group shadow-inner">
                            <div className="h-14 w-14 rounded-full bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform"><Upload className="w-6 h-6 text-primary" /></div>
                            <div className="space-y-1"><p className="font-bold text-lg">Drop your file here</p><p className="text-xs text-muted-foreground">Supports .CSV, .JSON, .HTML, and .MD exports</p></div>
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20"><FileCode2 className="w-5 h-5 text-primary" /></div>
                    <div className="space-y-0.5"><h4 className="font-bold text-base">Content Editor</h4><p className="text-xs text-muted-foreground">Paste or refine your import content below.</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="px-3 h-8 rounded-lg bg-muted/50 border-border/50 font-mono text-[11px] font-bold">{rawInput.length.toLocaleString()} characters</Badge>
                    {rawInput && <Button variant="ghost" size="sm" onClick={() => setRawInput("")} className="h-8 text-xs font-bold text-destructive hover:bg-destructive/5">Clear editor</Button>}
                  </div>
                </div>
                <div className="relative group/textarea">
                  <div className="absolute -inset-1 bg-gradient-to-br from-primary/15 via-transparent to-transparent rounded-3xl blur transition-opacity duration-500 group-focus-within/textarea:opacity-100 opacity-60" />
                  <div className="relative">
                    <Textarea placeholder={`Paste your ${formatInfo[selectedFormat].label} content here...`} className="min-h-[400px] font-mono text-sm leading-relaxed p-8 bg-card border-border/50 rounded-2xl focus:border-primary/40 focus:ring-0 transition-all resize-y shadow-sm" value={rawInput} onChange={(e) => setRawInput(e.target.value)} />
                    <div className="absolute right-6 bottom-6 flex items-center gap-3 pointer-events-none opacity-40 group-focus-within/textarea:opacity-100 transition-opacity"><span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded border shadow-sm">{selectedFormat} Mode</span></div>
                  </div>
                </div>
                <div className="flex items-center justify-center pt-6 pb-20">
                  <Button size="lg" onClick={parseLinks} disabled={!rawInput.trim()} className="h-14 px-10 gap-3 rounded-2xl shadow-xl shadow-primary/25 font-bold text-base transition-all active:scale-95 group overflow-hidden relative">
                    <span className="relative z-10 flex items-center gap-3">Proceed to Review <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="space-y-6">
            <div className="sticky top-0 z-20 space-y-4">
              <Card className="border-border/50 shadow-lg bg-card/80 backdrop-blur-md">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-8">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary shadow-lg shadow-primary/20 flex flex-col items-center justify-center text-primary-foreground">
                          <span className="text-xl font-bold leading-none">{parsedLinks.length}</span>
                          <span className="text-[10px] font-bold opacity-80">Links</span>
                        </div>
                        <div><p className="font-bold text-lg leading-tight">Review Import</p><p className="text-xs text-muted-foreground font-medium">Found in your source data</p></div>
                      </div>
                      <div className="hidden sm:flex items-center gap-6 border-l pl-8">
                        <div className="flex flex-col"><span className="text-xs font-bold text-muted-foreground mb-1">Status</span><div className="flex items-center gap-4"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" /><span className="text-sm font-bold">{validCount} Valid</span></div>{invalidCount > 0 && (<div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]" /><span className="text-sm font-bold text-destructive">{invalidCount} Invalid</span></div>)}</div></div></div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 bg-muted/30 p-2 rounded-2xl border border-border/50">
                    <div className="flex items-center gap-1 bg-background rounded-xl p-1 shadow-sm border">
                      <Button variant="ghost" size="sm" onClick={() => setAllVisibility('public')} className={cn("gap-2 px-3 h-8 text-xs font-bold rounded-lg transition-all", parsedLinks.every(l => l.visibility === 'public') ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}><Globe2 className="w-3.5 h-3.5" /> All Public</Button>
                      <Button variant="ghost" size="sm" onClick={() => setAllVisibility('private')} className={cn("gap-2 px-3 h-8 text-xs font-bold rounded-lg transition-all", parsedLinks.every(l => l.visibility === 'private') ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}><Lock className="w-3.5 h-3.5" /> All Private</Button>
                    </div>
                    <div className="h-6 w-px bg-border/50 mx-1" />
                    <div className="flex items-center gap-2">
                      {applications && applications.length > 0 && (
                        <Select onValueChange={(val: string | null) => setAllApplication(val === 'none' || val === null ? null : val)}>
                          <SelectTrigger className="w-[200px] h-10 text-xs font-bold bg-background border-border/50 rounded-xl focus:ring-primary/20"><Box className="w-3.5 h-3.5 mr-2 text-primary" /><SelectValue placeholder="All Applications" /></SelectTrigger>
                          <SelectContent className="rounded-xl min-w-[300px]">
                            <SelectItem value="none" className="text-xs font-semibold">No Application</SelectItem>
                            {applications.map((app) => (<SelectItem key={app.id} value={app.id} className="text-xs font-semibold">{app.applicationName}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      )}
                      {categories && categories.length > 0 && (
                        <Select onValueChange={(val: string | null) => setAllCategory(val === 'none' || val === null ? null : val)}>
                          <SelectTrigger className="w-[180px] h-10 text-xs font-bold bg-background border-border/50 rounded-xl focus:ring-primary/20"><Layers className="w-3.5 h-3.5 mr-2 text-primary" /><SelectValue placeholder="All Categories" /></SelectTrigger>
                          <SelectContent className="rounded-xl min-w-[200px]">
                            <SelectItem value="none" className="text-xs font-semibold">No Category</SelectItem>
                            {categories.map((cat) => (<SelectItem key={cat.id} value={cat.id} className="text-xs font-semibold">{cat.name}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Links List Step */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-lg font-bold flex items-center gap-2"><FileType className="w-5 h-5 text-primary" /> Link Details</h3>
                <p className="text-xs text-muted-foreground font-medium bg-muted/50 px-3 py-1 rounded-full border border-border/50">{parsedLinks.length} items found</p>
              </div>
              <ScrollArea className="h-[650px] pr-4 -mr-4">
                <div className="space-y-4">
                  {parsedLinks.map((link, index) => (
                    <motion.div key={link.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.05, 0.5) }} className={cn("group relative border rounded-2xl transition-all duration-300 overflow-hidden", link.id === expandedLinkId ? "ring-2 ring-primary/20 border-primary" : "border-border/50 bg-card hover:border-primary/30", !link.isValid && "border-destructive/50 bg-destructive/[0.02]")}>
                      <div className={cn("absolute left-0 top-0 bottom-0 w-1", link.isValid ? "bg-primary/20" : "bg-destructive transition-all group-hover:w-1.5")} />
                      <div className="p-5 cursor-pointer select-none" onClick={() => setExpandedLinkId(expandedLinkId === link.id ? null : link.id)}>
                        <div className="flex items-start gap-5">
                          <div className="flex flex-col items-center gap-3 pt-1">
                            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black shadow-sm transition-all duration-300", link.isValid ? link.id === expandedLinkId ? "bg-primary text-primary-foreground rotate-12" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary" : "bg-destructive text-destructive-foreground animate-pulse")}>
                              {link.isValid ? index + 1 : <AlertCircle className="w-5 h-5" />}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 space-y-3">
                            <div className="flex flex-col gap-1">
                              <Input value={link.title} onClick={(e) => e.stopPropagation()} onChange={(e) => updateLink(link.id, { title: e.target.value })} className="font-bold text-lg bg-transparent border-none focus:ring-0 p-0 h-auto placeholder:text-muted-foreground/50 transition-all hover:translate-x-1" placeholder="Link title" />
                              <div className="flex items-center gap-2 group/url">
                                <div className="p-1 px-2 rounded-lg bg-muted/50 border border-border/50 flex-1 flex items-center gap-2 transition-all hover:bg-muted group-focus-within/url:bg-background group-focus-within/url:border-primary/50 group-focus-within/url:shadow-sm">
                                  <Globe2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                  <Input value={link.url} onClick={(e) => e.stopPropagation()} onChange={(e) => updateLink(link.id, { url: e.target.value })} className={cn("font-mono text-xs bg-transparent border-none p-0 h-6 h-auto focus:ring-0 text-muted-foreground/80 placeholder:text-muted-foreground/30", !link.isValid && "text-destructive")} placeholder="https://example.com" />
                                  <a href={link.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-all text-muted-foreground shrink-0"><ExternalLink className="w-3.5 h-3.5" /></a>
                                </div>
                              </div>
                            </div>
                            {!link.isValid && link.error && (<motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold border border-destructive/20 shadow-sm"><XCircle className="w-3 h-3" /> {link.error}</motion.div>)}
                            <div className="flex items-center gap-2 flex-wrap pt-1">
                              <Badge variant="outline" className={cn("gap-1.5 px-3 py-1 text-[10px] font-bold rounded-full transition-all border-dashed", link.visibility === 'public' ? "bg-blue-500/[0.03] text-blue-600 border-blue-500/30 hover:bg-blue-500/10" : "bg-amber-500/[0.03] text-amber-600 border-amber-500/30 hover:bg-amber-500/10")}>{link.visibility === 'public' ? <Globe2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />} <span className="capitalize">{link.visibility}</span></Badge>
                              {link.applicationId && applications?.find(a => a.id === link.applicationId) && (<Badge variant="secondary" className="gap-1.5 px-3 py-1 text-[10px] font-bold rounded-full bg-primary/5 text-primary border border-primary/20 hover:bg-primary/10 transition-all"><Box className="w-3 h-3" />{applications.find(a => a.id === link.applicationId)?.applicationName}</Badge>)}
                              {link.categoryId && categories?.find(c => c.id === link.categoryId) && (<Badge variant="secondary" className="gap-1.5 px-3 py-1 text-[10px] font-bold rounded-full bg-purple-500/5 text-purple-600 border border-purple-500/20 hover:bg-purple-500/10 transition-all"><Layers className="w-3 h-3" />{categories.find(c => c.id === link.categoryId)?.name}</Badge>)}
                              {link.tags && link.tags.length > 0 && (<div className="flex items-center gap-1.5 ml-1">{link.tags.slice(0, 3).map(tag => (<div key={tag} className="px-2 py-0.5 rounded-lg bg-muted text-[10px] font-medium text-muted-foreground border border-border shadow-xs">#{tag}</div>))}{link.tags.length > 3 && (<span className="text-[10px] font-black text-muted-foreground/60 ml-1">+{link.tags.length - 3}</span>)}</div>)}
                            </div>
                          </div>
                          <div className={cn("flex flex-col gap-1.5 transition-all duration-300", link.id !== expandedLinkId && "opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0")}>
                            <div className="bg-muted/50 p-1 rounded-2xl flex flex-col gap-1 border border-border/50">
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-background hover:shadow-sm" onClick={(e) => { e.stopPropagation(); updateLink(link.id, { visibility: link.visibility === 'public' ? 'private' : 'public' }) }}>{link.visibility === 'public' ? <Globe2 className="w-4 h-4 text-blue-500" /> : <Lock className="w-4 h-4 text-amber-500" />}</Button>
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-background hover:shadow-sm" onClick={(e) => { e.stopPropagation(); duplicateLink(link.id) }}><Copy className="w-4 h-4 text-muted-foreground" /></Button>
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10 hover:shadow-sm" onClick={(e) => { e.stopPropagation(); removeLink(link.id) }}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                            <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-xl transition-all", link.id === expandedLinkId ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 rotate-180" : "bg-muted/50 border border-border/50 hover:bg-background")} onClick={(e) => { e.stopPropagation(); setExpandedLinkId(expandedLinkId === link.id ? null : link.id) }}><ChevronDown className="w-5 h-5" /></Button>
                          </div>
                        </div>
                      </div>
                      <AnimatePresence>
                        {expandedLinkId === link.id && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "circOut" }} className="bg-muted/[0.03] border-t border-dashed border-border overflow-hidden">
                            <div className="p-8 space-y-8 bg-gradient-to-b from-primary/[0.02] to-transparent">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                <div className="space-y-3 md:col-span-2">
                                  <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center"><FileText className="w-3 h-3 text-primary" /></div><Label className="text-[10px] font-bold text-muted-foreground">Detailed Description</Label></div>
                                  <Textarea value={link.description || ''} onChange={(e) => updateLink(link.id, { description: e.target.value })} placeholder="Add context about why this link is useful..." className="resize-none h-24 bg-background border-border/50 rounded-2xl p-4 text-sm focus:border-primary focus:ring-primary/20 transition-all font-medium leading-relaxed shadow-inner" />
                                </div>
                                <div className="space-y-3"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center"><Box className="w-3 h-3 text-blue-500" /></div><Label className="text-[10px] font-bold text-muted-foreground">Linked Application</Label></div><Select value={link.applicationId || 'none'} onValueChange={(val) => updateLink(link.id, { applicationId: val === 'none' ? null : val })}><SelectTrigger className="bg-background border-border/50 h-10 rounded-xl focus:border-primary transition-all text-xs font-semibold"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl min-w-[300px]"><SelectItem value="none" className="italic opacity-60 text-xs">No Application Associated</SelectItem>{applications?.map((app) => (<SelectItem key={app.id} value={app.id} className="text-xs font-semibold">{app.applicationName}</SelectItem>))}</SelectContent></Select></div>
                                <div className="space-y-3"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-lg bg-orange-500/10 flex items-center justify-center"><Layers className="w-3 h-3 text-orange-500" /></div><Label className="text-[10px] font-bold text-muted-foreground">Link Category</Label></div><Select value={link.categoryId || 'none'} onValueChange={(val) => updateLink(link.id, { categoryId: val === 'none' ? null : val })}><SelectTrigger className="bg-background border-border/50 h-10 rounded-xl focus:border-primary transition-all text-xs font-semibold"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl min-w-[200px]"><SelectItem value="none" className="italic opacity-60 text-xs">General (Uncategorized)</SelectItem>{categories?.map((cat) => (<SelectItem key={cat.id} value={cat.id} className="text-xs font-semibold">{cat.name}</SelectItem>))}</SelectContent></Select></div>
                                <div className="space-y-3 md:col-span-2">
                                  <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center"><Tag className="w-3 h-3 text-purple-500" /></div><Label className="text-[10px] font-bold text-muted-foreground">Taxonomy & Tags</Label></div>
                                  <div className="relative group/tags overflow-hidden"><div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl blur opacity-0 group-focus-within/tags:opacity-100 transition duration-500" /><div className="relative flex flex-wrap gap-2 p-4 bg-background border border-border/50 rounded-2xl min-h-[60px] shadow-inner focus-within:border-primary/50 transition-all">{link.tags?.map((tag) => (<Badge key={tag} variant="secondary" className="gap-2 pr-2 py-1.5 pl-3 h-8 rounded-xl bg-muted border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all group/badge"><span className="font-bold text-xs">#{tag}</span><button onClick={() => updateLink(link.id, { tags: link.tags?.filter(t => t !== tag) })} className="ml-1 opacity-50 group-hover/badge:opacity-100 transition-opacity"><X className="w-3.5 h-3.5" /></button></Badge>))}<input type="text" placeholder="Add descriptive tag..." className="flex-1 min-w-[150px] bg-transparent border-none outline-none text-sm font-semibold placeholder:text-muted-foreground/40 placeholder:font-normal" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); const input = e.currentTarget; const tag = input.value.trim().replace(/^#/, ''); if (tag && !link.tags?.includes(tag)) { updateLink(link.id, { tags: [...(link.tags || []), tag] }); input.value = ''; } } }} /></div></div>
                                  <p className="text-[10px] text-muted-foreground font-medium italic">Press Enter or type a comma to instantly create a new tag.</p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
              <CardFooter className="flex justify-between border-t p-8 bg-muted/[0.02]">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" onClick={() => setStep('input')} className="gap-2 font-bold rounded-2xl hover:bg-destructive/5 hover:text-destructive">
                    <RotateCcw className="w-4 h-4" /> Start Over
                  </Button>
                </div>
                <Button
                  onClick={handleImport}
                  disabled={validCount === 0 || mutation.isPending}
                  className="px-10 h-14 rounded-2xl gap-3 shadow-xl shadow-primary/20 font-black text-lg transition-all active:scale-95 group"
                >
                  {mutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <div className="relative">
                      <Upload className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                      <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary-foreground transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                    </div>
                  )}
                  Import {validCount} Secure Links
                </Button>
              </CardFooter>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
