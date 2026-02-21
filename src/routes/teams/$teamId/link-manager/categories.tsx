import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  Check,
  Edit2,
  Layers,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  createLinkCategory,
  deleteLinkCategory,
  getLinkCategories,
  updateLinkCategory,
} from '@/app/actions/links'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
} from '@/components/ui/alert-dialog'
import {
  ContentLoading,
  EmptyState,
  LinkManagerPage,
} from '@/components/link-manager/shared'
import { PageHeader } from '@/components/shared'

export const Route = createFileRoute('/teams/$teamId/link-manager/categories')({
  component: CategoriesPage,
})

function CategoriesPage() {
  const { teamId } = Route.useParams()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const { data: categories, isLoading } = useQuery({
    queryKey: ['linkCategories', teamId],
    queryFn: () => getLinkCategories({ data: { teamId } }),
  })

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      createLinkCategory({ data: { teamId, name } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkCategories', teamId] })
      toast.success('Category created')
      setNewName('')
      setIsCreating(false)
    },
    onError: (err: any) =>
      toast.error('Failed to create category: ' + err.message),
  })

  const updateMutation = useMutation({
    mutationFn: (variables: { id: string; name: string }) =>
      updateLinkCategory({ data: variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkCategories', teamId] })
      toast.success('Category updated')
      setEditingId(null)
    },
    onError: (err: any) => toast.error('Update failed: ' + err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLinkCategory({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkCategories', teamId] })
      toast.success('Category deleted')
    },
    onError: (err: any) => toast.error('Deletion failed: ' + err.message),
  })

  const filteredCategories =
    categories?.filter((c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()),
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
    <LinkManagerPage>
      <PageHeader
        title="Categories"
        description="Organize your resources into logical collections for better discoverability."
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Filter categories..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create New Category</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleCreate}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Category Name"
                className="flex-1"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || !newName.trim()}
                >
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <ContentLoading message="Loading Categories" />
      ) : filteredCategories.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No categories found"
          description={
            searchTerm
              ? `No results for "${searchTerm}".`
              : 'Start organizing your links by creating your first category.'
          }
          action={
            !searchTerm ? (
              <Button variant="outline" onClick={() => setIsCreating(true)}>
                Add Category
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((category) => (
            <Card
              key={category.id}
              className={cn(
                'transition-colors hover:bg-muted/50',
                editingId === category.id && 'border-primary',
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base font-medium leading-none">
                      {category.name}
                    </CardTitle>
                  </div>
                  {!editingId && (
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => startEditing(category.id, category.name)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete Category?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. Links in this
                              category will be uncategorized.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(category.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </CardHeader>
              {editingId === category.id && (
                <CardContent className="pt-2">
                  <div className="flex gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8"
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleUpdate(category.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </LinkManagerPage>
  )
}
