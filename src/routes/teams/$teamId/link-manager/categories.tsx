import { createFileRoute, Link as RouterLink } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getLinkCategories, createLinkCategory, updateLinkCategory, deleteLinkCategory } from '@/app/actions/links'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChevronLeft, Plus, Trash2, Edit2, Check, X, Loader2, Layers, Search } from 'lucide-react'
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
    onError: (err: any) => toast.error("Failed to update category: " + err.message)
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLinkCategory({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkCategories', teamId] })
      toast.success("Category deleted")
    },
    onError: (err: any) => toast.error("Failed to delete category: " + err.message)
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
    <div className="container mx-auto p-8 max-w-4xl space-y-8">
      <div className="flex items-center gap-4">
        <RouterLink to="/teams/$teamId/link-manager" params={{ teamId }}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </RouterLink>
        <div>
          <h1 className="text-3xl font-black tracking-tight">Link Categories</h1>
          <p className="text-muted-foreground">Organize your team links into custom collections.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-muted/30 border-transparent focus:bg-background transition-all"
          />
        </div>
        <Button onClick={() => setIsCreating(true)} className="w-full md:w-auto gap-2 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> Add Category
        </Button>
      </div>

      {isCreating && (
        <Card className="border-primary/20 bg-primary/5 shadow-sm animate-in fade-in slide-in-from-top-2">
          <CardHeader className="p-4">
            <form onSubmit={handleCreate} className="flex gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter category name..."
                className="bg-background border-primary/20"
                autoFocus
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending || !newName.trim()}>
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-20 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium">Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <Card className="border-dashed py-20 bg-muted/10">
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
              <Layers className="w-12 h-12 opacity-20" />
              <p className="font-medium">{searchTerm ? "No categories match your search." : "No categories created yet."}</p>
              {!searchTerm && (
                <Button variant="outline" size="sm" onClick={() => setIsCreating(true)}>
                  Get started by creating your first category
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filteredCategories.map((category) => (
              <Card
                key={category.id}
                className={cn(
                  "group transition-all duration-200 border-border/50",
                  editingId === category.id ? "ring-2 ring-primary bg-primary/5" : "hover:border-primary/30 hover:shadow-md"
                )}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  {editingId === category.id ? (
                    <div className="flex items-center gap-3 w-full">
                      <Layers className="w-5 h-5 text-primary" />
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-9 bg-background focus-visible:ring-1"
                        autoFocus
                        onKeyDown={(e: React.KeyboardEvent) => {
                          if (e.key === 'Enter') handleUpdate(category.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                      />
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleUpdate(category.id)}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:bg-muted" onClick={() => setEditingId(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <Layers className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-lg">{category.name}</span>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => startEditing(category.id, category.name)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger >
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove the "{category.name}" category. Any links currently using this category will be changed to "No Category". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(category.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
