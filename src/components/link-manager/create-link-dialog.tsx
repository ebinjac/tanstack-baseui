import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import {
  Box,
  Check,
  Globe2,
  Layers,
  Link as LinkIcon,
  Loader2,
  Lock,
  Plus,
  Tag,
  Type,
  X,
} from 'lucide-react'
import type { z } from 'zod'
import type { LinkWithRelations } from '@/db/schema/links'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CreateLinkSchema } from '@/lib/zod/links.schema'
import {
  createLink,
  createLinkCategory,
  getLinkCategories,
  updateLink,
} from '@/app/actions/links'
import { getTeamApplications } from '@/app/actions/applications'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface CreateLinkDialogProps {
  teamId: string
  trigger?: React.ReactNode
  link?: LinkWithRelations
  mode?: 'create' | 'edit' | 'view'
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CreateLinkDialog({
  teamId,
  trigger,
  link,
  mode = 'create',
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: CreateLinkDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = setControlledOpen ?? setInternalOpen
  const [tagInput, setTagInput] = useState('')
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const queryClient = useQueryClient()

  const form = useForm<z.infer<typeof CreateLinkSchema>>({
    resolver: zodResolver(CreateLinkSchema) as any,
    defaultValues: {
      teamId: teamId,
      visibility: link?.visibility || 'private',
      title: link?.title || '',
      url: link?.url || '',
      description: link?.description || '',
      tags: link?.tags || [],
      categoryId: link?.categoryId || null,
      applicationId: link?.applicationId || null,
    },
  })

  // Update form when dialog opens or link changes
  useEffect(() => {
    if (open && link) {
      form.reset({
                teamId,
                visibility: link.visibility,
                title: link.title,
                url: link.url,
                tags: link.tags || [],
                categoryId: link.categoryId || null,
                applicationId: link.applicationId || null,
              }).describe(link.description || '')
    }
  }, [open, link, form, teamId])

  const { data: categories } = useQuery({
    queryKey: ['linkCategories', teamId],
    queryFn: () => getLinkCategories({ data: { teamId } }),
    enabled: open,
  })

  const { data: applications } = useQuery({
    queryKey: ['teamApplications', teamId],
    queryFn: () => getTeamApplications({ data: { teamId } }),
    enabled: open,
  })

  // Create Mutation
  const mutation = useMutation({
    mutationFn: (variables: { data: z.infer<typeof CreateLinkSchema> }) =>
      createLink(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links', teamId] })
      toast.success('Link added successfully')
      setOpen(false)
      form.reset()
      setTagInput('')
    },
    onError: (err) => {
      toast.error('Failed to add link: ' + err.message)
    },
  })

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (variables: {
      data: { id: string } & Partial<z.infer<typeof CreateLinkSchema>>
    }) => updateLink(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links', teamId] })
      toast.success('Link updated successfully')
      setOpen(false)
    },
    onError: (err) => {
      toast.error('Failed to update link: ' + err.message)
    },
  })

  // Create Category Mutation
  const createCategoryMutation = useMutation({
    mutationFn: (name: string) =>
      createLinkCategory({ data: { teamId, name } }),
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: ['linkCategories', teamId] })
      toast.success('Category created')
      setIsCreatingCategory(false)
      setNewCategoryName('')
      form.setValue('categoryId', newCategory.id)
    },
    onError: (err) => {
      toast.error('Failed to create category: ' + err.message)
    },
  })

  const onSubmit = (formData: z.infer<typeof CreateLinkSchema>) => {
    // Explicitly set nulls for 'none' strings if they slipped through
    const cleanedData = {
      ...formData,
      categoryId:
        formData.categoryId === 'none' ? null : formData.categoryId || null,
      applicationId:
        formData.applicationId === 'none'
          ? null
          : formData.applicationId || null,
    }

    if (mode === 'edit' && link) {
      updateMutation.mutate({ data: { id: link.id, ...cleanedData } })
    } else {
      mutation.mutate({ data: cleanedData })
    }
  }

  const onError = (errors: any) => {
    console.error('Form errors:', errors)
    toast.error('Please check the form for errors')
  }

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const tag = tagInput.trim()
      if (tag && !form.getValues('tags')?.includes(tag)) {
        const currentTags = form.getValues('tags') || []
        form.setValue('tags', [...currentTags, tag])
        setTagInput('')
      }
    }
  }

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags') || []
    form.setValue(
      'tags',
      currentTags.filter((tag: string) => tag !== tagToRemove),
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {(trigger || mode === 'create') && (
        <DialogTrigger
          render={
            (trigger as any) || (
              <Button>
                <Plus className="w-4 h-4" /> Add Link
              </Button>
            )
          }
        />
      )}
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto p-0 gap-0 bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-xl">
            {mode === 'view'
              ? 'Link Details'
              : mode === 'edit'
                ? 'Edit Link'
                : 'You are now adding a link'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'view'
              ? 'Information about this shared resource.'
              : 'Share a resource with your team.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit as any, onError)}
          className="space-y-6 p-6"
        >
          {/* Basic Info Group */}
          <div className="space-y-4">
            <div className="grid gap-2 relative">
              <Label
                htmlFor="url"
                className="text-xs font-semibold text-muted-foreground ml-1"
              >
                Destination URL
              </Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="url"
                  placeholder="https://example.com/resource"
                  {...form.register('url')}
                  disabled={mode === 'view'}
                  className={cn(
                    'pl-9 bg-muted/30 border-muted-foreground/20 focus:bg-background transition-all',
                    form.formState.errors.url &&
                      'border-destructive ring-destructive/20',
                  )}
                />
              </div>
              {form.formState.errors.url && (
                <span className="text-xs text-destructive ml-1">
                  {form.formState.errors.url.message as string}
                </span>
              )}
            </div>

            <div className="grid gap-2">
              <Label
                htmlFor="title"
                className="text-xs font-semibold text-muted-foreground ml-1"
              >
                Display Title
              </Label>
              <div className="relative">
                <Type className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="title"
                  placeholder="e.g. Engineering Dashboard"
                  {...form.register('title')}
                  disabled={mode === 'view'}
                  className={cn(
                    'pl-9 bg-muted/30 border-muted-foreground/20 focus:bg-background transition-all',
                    form.formState.errors.title &&
                      'border-destructive ring-destructive/20',
                  )}
                />
              </div>
              {form.formState.errors.title && (
                <span className="text-xs text-destructive ml-1">
                  {form.formState.errors.title.message as string}
                </span>
              )}
            </div>
          </div>

          {/* Visibility - Redesigned */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground ml-1">
              Visibility
            </Label>
            <Controller
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                  disabled={mode === 'view'}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="relative">
                    <RadioGroupItem
                      value="private"
                      id="private"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="private"
                      className={cn(
                        'cursor-pointer flex flex-row items-center gap-4 rounded-xl border-2 p-3 transition-all duration-200',
                        field.value === 'private'
                          ? 'border-primary bg-primary/5'
                          : 'border-muted bg-popover/50 hover:bg-accent hover:text-accent-foreground',
                      )}
                    >
                      <div
                        className={cn(
                          'p-2 rounded-full border',
                          field.value === 'private'
                            ? 'bg-background'
                            : 'bg-background',
                        )}
                      >
                        <Lock
                          className={cn(
                            'h-5 w-5',
                            field.value === 'private'
                              ? 'text-primary'
                              : 'text-muted-foreground',
                          )}
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">Private</span>
                        <span className="text-[11px] text-muted-foreground">
                          Only visible to you
                        </span>
                      </div>
                    </Label>
                  </div>
                  <div className="relative">
                    <RadioGroupItem
                      value="public"
                      id="public"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="public"
                      className={cn(
                        'cursor-pointer flex flex-row items-center gap-4 rounded-xl border-2 p-3 transition-all duration-200',
                        field.value === 'public'
                          ? 'border-primary bg-primary/5'
                          : 'border-muted bg-popover/50 hover:bg-accent hover:text-accent-foreground',
                      )}
                    >
                      <div
                        className={cn(
                          'p-2 rounded-full border shadow-sm',
                          field.value === 'public'
                            ? 'bg-background'
                            : 'bg-background',
                        )}
                      >
                        <Globe2
                          className={cn(
                            'h-5 w-5',
                            field.value === 'public'
                              ? 'text-primary'
                              : 'text-muted-foreground',
                          )}
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">Public</span>
                        <span className="text-[11px] text-muted-foreground">
                          Visible to everyone
                        </span>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Application Select */}
            <div className="grid gap-2">
              <Label className="text-xs font-semibold text-muted-foreground ml-1 flex items-center gap-1">
                <Box className="w-3 h-3" /> Application
              </Label>
              <Controller
                control={form.control}
                name="applicationId"
                render={({ field }) => (
                  <Select
                    onValueChange={(val) =>
                      field.onChange(val === 'none' ? null : val)
                    }
                    value={field.value || 'none'}
                    disabled={mode === 'view'}
                  >
                    <SelectTrigger className="bg-muted/30 border-muted-foreground/20 w-full">
                      <SelectValue>
                        {field.value && field.value !== 'none'
                          ? applications?.find((app) => app.id === field.value)
                              ?.applicationName || 'Select Application'
                          : 'Select Application'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl min-w-[300px] max-h-[400px]">
                      <SelectItem
                        value="none"
                        className="text-muted-foreground font-semibold"
                      >
                        No Application
                      </SelectItem>
                      {applications?.map((app) => (
                        <SelectItem
                          key={app.id}
                          value={app.id}
                          className="font-semibold"
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-primary/60 shrink-0">
                              {app.applicationName}
                            </span>
                            <span className="text-muted-foreground/30 shrink-0">
                              •
                            </span>
                            <span className="text-[10px] tracking-wider opacity-50">
                              {app.tla}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-muted-foreground ml-1 flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Category
                </Label>
                {!isCreatingCategory && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-5 px-2 text-[11px] text-muted-foreground hover:text-primary"
                    onClick={() => setIsCreatingCategory(true)}
                  >
                    <Plus className="w-3 h-3 mr-1" /> New
                  </Button>
                )}
              </div>

              {isCreatingCategory ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New Category Name"
                    className="h-9 text-sm bg-muted/30"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (newCategoryName.trim())
                          createCategoryMutation.mutate(newCategoryName)
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    disabled={
                      !newCategoryName.trim() ||
                      createCategoryMutation.isPending
                    }
                    onClick={() =>
                      createCategoryMutation.mutate(newCategoryName)
                    }
                  >
                    {createCategoryMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => {
                      setIsCreatingCategory(false)
                      setNewCategoryName('')
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Controller
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select
                      onValueChange={(val) =>
                        field.onChange(val === 'none' ? null : val)
                      }
                      value={field.value || 'none'}
                      disabled={mode === 'view'}
                    >
                      <SelectTrigger className="bg-muted/30 border-muted-foreground/20 w-full">
                        <SelectValue>
                          {field.value && field.value !== 'none'
                            ? categories?.find((cat) => cat.id === field.value)
                                ?.name || 'Select Category'
                            : 'Select Category'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl min-w-[240px]">
                        <SelectItem
                          value="none"
                          className="text-muted-foreground font-semibold"
                        >
                          No Category
                        </SelectItem>
                        {categories?.map((cat) => (
                          <SelectItem
                            key={cat.id}
                            value={cat.id}
                            className="font-semibold"
                          >
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="grid gap-2">
            <Label className="text-xs font-semibold text-muted-foreground ml-1 flex items-center gap-1">
              <Tag className="w-3 h-3" /> Tags
            </Label>
            <div className="bg-muted/30 border border-muted-foreground/20 rounded-md p-2 focus-within:ring-1 focus-within:ring-ring focus-within:border-ring transition-all">
              <div className="flex flex-wrap gap-2 mb-2">
                {(form.watch('tags') as Array<string>)?.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-1 pr-1 pl-2 py-0.5 text-xs bg-background border shadow-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:bg-destructive/10 hover:text-destructive rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  className="flex-1 bg-transparent border-none outline-none h-6 text-sm min-w-[120px] disabled:opacity-50"
                  placeholder={
                    mode === 'view'
                      ? ''
                      : form.getValues('tags')?.length
                        ? ''
                        : 'Type tag and press Enter...'
                  }
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={addTag}
                  disabled={mode === 'view'}
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground ml-1">
              Press Enter or Comma to add a tag
            </p>
          </div>

          {/* Optional Details */}
          <div className="grid gap-2">
            <Label
              htmlFor="description"
              className="text-xs font-semibold text-muted-foreground ml-1"
            >
              Notes
            </Label>
            <Textarea
              id="description"
              placeholder="Add any helpful context..."
              className="resize-none bg-muted/30 border-muted-foreground/20 min-h-[80px]"
              {...form.register('description')}
              disabled={mode === 'view'}
            />
          </div>

          <DialogFooter className="pt-4 border-t gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              {mode === 'view' ? 'Close' : 'Cancel'}
            </Button>
            {mode !== 'view' && (
              <Button
                type="submit"
                disabled={mutation.isPending || updateMutation.isPending}
              >
                {mutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : mode === 'edit' ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                {mode === 'edit' ? 'Update Link' : 'Save Link'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
