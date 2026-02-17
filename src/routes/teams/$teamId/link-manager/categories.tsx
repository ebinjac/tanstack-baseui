import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getLinkCategories, createLinkCategory, updateLinkCategory, deleteLinkCategory } from '@/app/actions/links'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Edit2, Check, X, Loader2, Layers } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { motion } from 'framer-motion'
import { SubPageHeader, SearchInput, ContentLoading, EmptyState } from '@/components/link-manager/shared'

export const Route = createFileRoute('/teams/$teamId/link-manager/categories')({
  component: CategoriesPage,
})

function CategoriesPage() {
  const { teamId } = Route.useParams()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  const { data: categories, isLoading } = useQuery({
    queryKey: ['linkCategories', teamId],
    queryFn: () => getLinkCategories({ data: { teamId } }),
  })

  const createMutation = useMutation({
    mutationFn: (name: string) => createLinkCategory({ data: { teamId, name } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkCategories', teamId] })
      toast.success("Category created")
      setNewName("")
      setIsCreating(false)
    },
    onError: (err: any) => toast.error("Failed to create category: " + err.message)
  })

  const updateMutation = useMutation({
    mutationFn: (variables: { id: string, name: string }) => updateLinkCategory({ data: variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkCategories', teamId] })
      toast.success("Category updated")
      setEditingId(null)
    },
    onError: (err: any) => toast.error("Update failed: " + err.message)
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLinkCategory({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkCategories', teamId] })
      toast.success("Category deleted")
    },
    onError: (err: any) => toast.error("Deletion failed: " + err.message)
  })

  const filteredCategories = categories?.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    createMutation.mutate(newName)
  }

  const startEditing = (id: string, name: string) => {
    setEditingId(id)
    setEditName(name)
  }

  const handleUpdate = (id: string) => {
    if (!editName.trim()) return
    updateMutation.mutate({ id, name: editName })
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 min-h-screen bg-background pb-32">
      <SubPageHeader
        teamId={teamId}
        parentLabel="Link Manager"
        sectionLabel="Collections"
        title="Categories"
      />

      <div className="max-w-5xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Filter collections..."
          />
          <Button
            onClick={() => setIsCreating(true)}
            className="h-12 px-6 gap-2 font-bold text-xs rounded-2xl shadow-xl shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" /> Add Collection
          </Button>
        </div>

        {isCreating && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="border border-primary/20 bg-primary/[0.02] shadow-2xl shadow-primary/5 rounded-3xl overflow-hidden backdrop-blur-sm">
              <CardContent className="p-8">
                <form onSubmit={handleCreate} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">New Collection Name</label>
                    <div className="relative">
                      <Layers className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40" />
                      <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. Documentation, Analytics, Infrastructure..."
                        className="h-14 pl-12 bg-background border-primary/10 rounded-2xl text-base font-bold focus:ring-primary/20 shadow-sm"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending || !newName.trim()}>
                      {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                      Create Collection
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid gap-4">
          {isLoading ? (
            <ContentLoading message="Syncing Categories" />
          ) : filteredCategories.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No categories found"
              description={searchTerm ? `No results for "${searchTerm}".` : "Start organizing your links by creating your first category."}
              action={!searchTerm ? (
                <Button variant="outline" size="sm" onClick={() => setIsCreating(true)} className="h-9 px-4 rounded-lg font-bold text-xs">
                  Add Category
                </Button>
              ) : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCategories.map((category, i) => (
                <motion.div key={category.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <CategoryCard
                    category={category}
                    isEditing={editingId === category.id}
                    editName={editName}
                    onEditNameChange={setEditName}
                    onStartEdit={() => startEditing(category.id, category.name)}
                    onSaveEdit={() => handleUpdate(category.id)}
                    onCancelEdit={() => setEditingId(null)}
                    onDelete={() => deleteMutation.mutate(category.id)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Category Card Component
// ============================================================================
interface CategoryCardProps {
  category: { id: string; name: string }
  isEditing: boolean
  editName: string
  onEditNameChange: (name: string) => void
  onStartEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDelete: () => void
}

function CategoryCard({ category, isEditing, editName, onEditNameChange, onStartEdit, onSaveEdit, onCancelEdit, onDelete }: CategoryCardProps) {
  return (
    <Card className={cn(
      "group relative transition-all duration-200 border border-border bg-card rounded-2xl overflow-hidden",
      isEditing ? "ring-1 ring-primary border-primary/20 bg-primary/[0.01]" : "hover:border-primary/20"
    )}>
      <CardContent className="p-5 flex items-center justify-between">
        {isEditing ? (
          <div className="flex flex-col gap-3 w-full">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <Layers className="h-4 w-4 text-primary" />
              </div>
              <Input
                value={editName}
                onChange={(e) => onEditNameChange(e.target.value)}
                className="h-10 bg-background focus:ring-primary/20 rounded-lg text-sm font-bold flex-1"
                autoFocus
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter') onSaveEdit()
                  if (e.key === 'Escape') onCancelEdit()
                }}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" onClick={onSaveEdit}>
                <Check className="h-4 w-4" /> Save
              </Button>
              <Button size="sm" variant="ghost" onClick={onCancelEdit}>
                <X className="h-4 w-4" /> Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-5">
              <div className="h-12 w-12 rounded-2xl bg-muted/40 border border-border/50 text-muted-foreground flex items-center justify-center group-hover:bg-primary/5 group-hover:text-primary group-hover:border-primary/20 transition-all duration-300">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-lg tracking-tight leading-none text-foreground/80 group-hover:text-foreground transition-colors">{category.name}</p>
                <p className="text-[10px] font-black text-muted-foreground/30 mt-2 uppercase tracking-widest">Collection</p>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all" onClick={onStartEdit}>
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger >
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl p-8 max-w-sm">
                  <AlertDialogHeader className="space-y-3">
                    <AlertDialogTitle className="text-xl font-bold tracking-tight">Delete Category?</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm font-medium text-muted-foreground/70 leading-relaxed">
                      This will remove <span className="text-foreground font-bold">"{category.name}"</span>. Associated links will remain but will be uncategorized.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-6 gap-2">
                    <AlertDialogCancel className="h-10 px-6 rounded-xl font-bold text-xs border-border">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="h-10 px-4 rounded-xl font-bold text-xs bg-destructive hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
