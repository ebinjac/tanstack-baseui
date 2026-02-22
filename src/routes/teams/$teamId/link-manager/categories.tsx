import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  Edit2,
  Layers,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  createLinkCategory,
  deleteLinkCategory,
  getLinkCategories,
  updateLinkCategory,
} from "@/app/actions/links";
import {
  ContentLoading,
  EmptyState,
  LinkManagerPage,
} from "@/components/link-manager/shared";
import { PageHeader } from "@/components/shared";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/teams/$teamId/link-manager/categories")({
  component: CategoriesPage,
});

function CategoriesPage() {
  const { teamId } = Route.useParams();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const { data: categories, isLoading } = useQuery({
    queryKey: ["linkCategories", teamId],
    queryFn: () => getLinkCategories({ data: { teamId } }),
  });

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      createLinkCategory({ data: { teamId, name } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["linkCategories", teamId] });
      toast.success("Category created");
      setNewName("");
      setIsCreating(false);
    },
    onError: (err: Error) =>
      toast.error(`Failed to create category: ${err.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: (variables: { id: string; name: string }) =>
      updateLinkCategory({ data: variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["linkCategories", teamId] });
      toast.success("Category updated");
      setEditingId(null);
    },
    onError: (err: Error) => toast.error(`Update failed: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLinkCategory({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["linkCategories", teamId] });
      toast.success("Category deleted");
    },
    onError: (err: Error) => toast.error(`Deletion failed: ${err.message}`),
  });

  const filteredCategories =
    categories?.filter((c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      return;
    }
    createMutation.mutate(newName);
  };

  const startEditing = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const handleUpdate = (id: string) => {
    if (!editName.trim()) {
      return;
    }
    updateMutation.mutate({ id, name: editName });
  };

  return (
    <LinkManagerPage>
      <PageHeader
        description="Organize your resources into logical collections for better discoverability."
        title="Categories"
      />

      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="relative w-full max-w-sm">
          <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter categories..."
            type="search"
            value={searchTerm}
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
              className="flex flex-col gap-4 sm:flex-row"
              onSubmit={handleCreate}
            >
              <Input
                autoFocus
                className="flex-1"
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Category Name"
                value={newName}
              />
              <div className="flex gap-2">
                <Button
                  disabled={createMutation.isPending || !newName.trim()}
                  type="submit"
                >
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create
                </Button>
                <Button
                  onClick={() => setIsCreating(false)}
                  type="button"
                  variant="ghost"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading && <ContentLoading message="Loading Categories" />}
      {!isLoading && filteredCategories.length === 0 && (
        <EmptyState
          action={
            searchTerm ? undefined : (
              <Button onClick={() => setIsCreating(true)} variant="outline">
                Add Category
              </Button>
            )
          }
          description={
            searchTerm
              ? `No results for "${searchTerm}".`
              : "Start organizing your links by creating your first category."
          }
          icon={Layers}
          title="No categories found"
        />
      )}
      {!isLoading && filteredCategories.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((category) => (
            <Card
              className={cn(
                "transition-colors hover:bg-muted/50",
                editingId === category.id && "border-primary"
              )}
              key={category.id}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="font-medium text-base leading-none">
                      {category.name}
                    </CardTitle>
                  </div>
                  {!editingId && (
                    <div className="flex items-center gap-1">
                      <Button
                        className="h-8 w-8"
                        onClick={() => startEditing(category.id, category.name)}
                        size="icon"
                        variant="ghost"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <Button
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              size="icon"
                              variant="ghost"
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
                              className="bg-destructive hover:bg-destructive/90"
                              onClick={() => deleteMutation.mutate(category.id)}
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
                      className="h-8"
                      onChange={(e) => setEditName(e.target.value)}
                      value={editName}
                    />
                    <Button
                      className="h-8 w-8"
                      onClick={() => handleUpdate(category.id)}
                      size="icon"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      className="h-8 w-8"
                      onClick={() => setEditingId(null)}
                      size="icon"
                      variant="ghost"
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
  );
}
