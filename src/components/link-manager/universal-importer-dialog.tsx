import { Button, buttonVariants } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useState } from 'react'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { bulkCreateLinks } from '@/app/actions/links'
import { toast } from 'sonner'
import { Loader2, Upload, Globe2, Lock, Trash2 } from 'lucide-react'
import { CreateLinkSchema } from '@/lib/zod/links.schema'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface UniversalImporterDialogProps {
  teamId: string
}

type ParsedLink = z.infer<typeof CreateLinkSchema> & {
  id: string
  isValid: boolean
  error?: string
}

export function UniversalImporterDialog({
  teamId,
}: UniversalImporterDialogProps) {
  const [open, setOpen] = useState(false)
  const [rawInput, setRawInput] = useState('')
  const [parsedLinks, setParsedLinks] = useState<ParsedLink[]>([])
  const [step, setStep] = useState<'input' | 'review'>('input')

  const queryClient = useQueryClient()

  const parseLinks = () => {
    // Simple heuristic parser: Extract URLs from text
    // Splits by newline, looks for http/https
    const lines = rawInput.split(/\n+/)
    const links: ParsedLink[] = []

    const urlRegex = /(https?:\/\/[^\s]+)/g

    lines.forEach((line) => {
      const match = line.match(urlRegex)
      if (match) {
        match.forEach((url) => {
          // Attempt to extract a title from the line by removing the URL
          let title = line.replace(url, '').trim()
          // If title is empty or just special chars, use domain as title
          if (!title || /^[-:;>]+$/.test(title)) {
            try {
              title = new URL(url).hostname
            } catch {
              title = 'Untitled Link'
            }
          }

          // Clean up title
          title = title.replace(/^[-:;>]+/, '').trim()

          links.push({
            id: crypto.randomUUID(),
            teamId, // Will be ignored by schema omit but needed for type
            title,
            url: url,
            description: '',
            visibility: 'private', // Default to private for safety
            tags: [],
            isValid: true,
          })
        })
      }
    })

    if (links.length === 0) {
      toast.error('No valid links found in text')
      return
    }

    setParsedLinks(links)
    setStep('review')
  }

  const mutation = useMutation({
    mutationFn: (data: { teamId: string; links: any[] }) =>
      bulkCreateLinks({ data }),
    onSuccess: (data) => {
      toast.success(`Successfully imported ${data.count} links`)
      queryClient.invalidateQueries({ queryKey: ['links', teamId] })
      setOpen(false)
      setRawInput('')
      setParsedLinks([])
      setStep('input')
    },
    onError: (err) => {
      toast.error('Import failed: ' + err.message)
    },
  })

  const handleImport = () => {
    const validLinks = parsedLinks.filter((l) => l.isValid)
    if (validLinks.length === 0) return

    // Strip UI-only fields
    const payload = validLinks.map(
      ({ id, isValid, error, teamId: _, ...rest }) => rest,
    )

    mutation.mutate({
      teamId,
      links: payload,
    })
  }

  const removeLink = (id: string) => {
    setParsedLinks((prev) => prev.filter((l) => l.id !== id))
  }

  const updateLink = (id: string, updates: Partial<ParsedLink>) => {
    setParsedLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    )
  }

  const setAllVisibility = (vis: 'public' | 'private') => {
    setParsedLinks((prev) => prev.map((l) => ({ ...l, visibility: vis })))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(buttonVariants({ variant: 'outline' }), 'gap-2')}
      >
        <Upload className="w-4 h-4" /> Import
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Universal Link Importer</DialogTitle>
          <DialogDescription>
            {step === 'input'
              ? "Paste text containing URLs (emails, chat logs, lists). We'll extract and organize them."
              : 'Review and refine your links before importing.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden min-h-0 pt-4">
          {step === 'input' ? (
            <Textarea
              placeholder="Paste your links here...
Example:
Check out this design resource: https://dribbble.com/shots/123
Also relevant: https://github.com/shadcn/ui - Component library
"
              className="h-full font-mono text-sm resize-none"
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
            />
          ) : (
            <div className="flex flex-col h-full gap-4">
              <div className="flex justify-between items-center px-1">
                <div className="flex gap-2 text-sm text-muted-foreground">
                  <span>{parsedLinks.length} links found</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAllVisibility('public')}
                    className="text-xs h-7"
                  >
                    Set all Public
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAllVisibility('private')}
                    className="text-xs h-7"
                  >
                    Set all Private
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1 border rounded-md p-4">
                <div className="space-y-4">
                  {parsedLinks.map((link) => (
                    <div
                      key={link.id}
                      className="flex gap-4 items-start p-3 bg-muted/30 rounded-lg group hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={link.title}
                            onChange={(e) =>
                              updateLink(link.id, { title: e.target.value })
                            }
                            className="h-8 font-bold bg-transparent border-transparent hover:border-input focus:bg-background"
                          />
                          <div className="flex shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                'h-8 px-2',
                                link.visibility === 'public'
                                  ? 'text-blue-500'
                                  : 'text-amber-500',
                              )}
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
                                <Globe2 className="w-4 h-4" />
                              ) : (
                                <Lock className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 text-destructive opacity-50 group-hover:opacity-100"
                              onClick={() => removeLink(link.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex gap-2 items-center px-3">
                          <span className="text-xs text-muted-foreground font-mono truncate max-w-[500px]">
                            {link.url}
                          </span>
                        </div>
                        <Input
                          placeholder="Description (optional)"
                          value={link.description || ''}
                          onChange={(e) =>
                            updateLink(link.id, { description: e.target.value })
                          }
                          className="h-7 text-xs bg-transparent border-transparent hover:border-input focus:bg-background"
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
          {step === 'review' && (
            <Button variant="outline" onClick={() => setStep('input')}>
              Back to Paste
            </Button>
          )}

          {step === 'input' ? (
            <Button onClick={parseLinks} disabled={!rawInput.trim()}>
              Review Links
            </Button>
          ) : (
            <Button
              onClick={handleImport}
              disabled={parsedLinks.length === 0 || mutation.isPending}
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
  )
}
