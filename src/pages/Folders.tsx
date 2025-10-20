import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Folder, Plus, FileText, Download, Trash2, Edit, MoreVertical } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { getJSON, postJSON, patchJSON, deleteRequest } from "@/lib/api";
import type { Folder as FolderType, FolderCreate, FolderUpdate } from "@/types/folder";
import { useToast } from "@/hooks/use-toast";

const folderColors = [
  { value: "green", label: "Mint Green", class: "bg-green-500" },
  { value: "blue", label: "Sky Blue", class: "bg-blue-500" },
  { value: "purple", label: "Purple", class: "bg-purple-500" },
  { value: "orange", label: "Orange", class: "bg-orange-500" },
  { value: "pink", label: "Pink", class: "bg-pink-500" },
  { value: "yellow", label: "Yellow", class: "bg-yellow-500" },
  { value: "red", label: "Red", class: "bg-red-500" },
  { value: "indigo", label: "Indigo", class: "bg-indigo-500" },
];

export default function Folders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [folderName, setFolderName] = useState("");
  const [folderDescription, setFolderDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState("green");
  const [parentFolderId, setParentFolderId] = useState<number | undefined>();
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { data: folders = [], isLoading } = useQuery({
    queryKey: ["folders"],
    queryFn: () => getJSON<FolderType[]>("/folders"),
  });

  const createFolderMutation = useMutation({
    mutationFn: (data: FolderCreate) => postJSON<FolderType>("/folders", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      setFolderName("");
      setFolderDescription("");
      setSelectedColor("green");
      setParentFolderId(undefined);
      toast({
        title: "Folder creat",
        description: "Folderul a fost creat cu succes.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare la creare",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FolderUpdate }) =>
      patchJSON<FolderType>(`/folders/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      setShowEditDialog(false);
      setEditingFolder(null);
      toast({
        title: "Folder actualizat",
        description: "Folderul a fost actualizat cu succes.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare la actualizare",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id: number) => deleteRequest(`/folders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      toast({
        title: "Folder șters",
        description: "Folderul a fost șters cu succes.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare la ștergere",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateFolder = () => {
    if (!folderName.trim()) {
      toast({
        title: "Nume lipsă",
        description: "Te rugăm să introduci un nume pentru folder.",
        variant: "destructive",
      });
      return;
    }

    createFolderMutation.mutate({
      name: folderName,
      description: folderDescription || undefined,
      color: selectedColor,
      parent_id: parentFolderId,
    });
  };

  const handleEditFolder = () => {
    if (!editingFolder) return;

    updateFolderMutation.mutate({
      id: editingFolder.id,
      data: {
        name: editingFolder.name,
        description: editingFolder.description || undefined,
        color: editingFolder.color,
        parent_id: editingFolder.parent_id || undefined,
      },
    });
  };

  const handleDownloadFolder = (folderId: number, folderName: string) => {
    window.open(`/api/folders/${folderId}/download`, "_blank");
    toast({
      title: "Descărcare pornită",
      description: `Folderul "${folderName}" se descarcă...`,
    });
  };

  const getColorClass = (color: string) => {
    const colorObj = folderColors.find((c) => c.value === color);
    return colorObj?.class || "bg-green-500";
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Biblioteci de documente</h1>
        <p className="text-muted-foreground mt-1">
          Organizează documentele procesate în foldere colorate și accesează rapid istoricul fiecărei colecții.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        {/* Create Folder */}
        <Card className="bg-gradient-card shadow-medium border-border/50">
          <CardHeader>
            <CardTitle>Creează un folder nou</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="folder-name">Nume*</Label>
                <Input
                  id="folder-name"
                  placeholder="Nume folder"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="folder-color">Culoare</Label>
                <Select value={selectedColor} onValueChange={setSelectedColor}>
                  <SelectTrigger id="folder-color">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {folderColors.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${color.class}`} />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="folder-parent">Folder părinte</Label>
                <Select
                  value={parentFolderId?.toString() || "none"}
                  onValueChange={(value) => setParentFolderId(value === "none" ? undefined : Number(value))}
                >
                  <SelectTrigger id="folder-parent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="none">Niciun părinte</SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id.toString()}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="folder-description">Descriere</Label>
                <Input
                  id="folder-description"
                  placeholder="Descriere (opțional)"
                  value={folderDescription}
                  onChange={(e) => setFolderDescription(e.target.value)}
                />
              </div>
            </div>

            <Button
              className="w-full mt-4 bg-primary hover:bg-primary/90"
              onClick={handleCreateFolder}
              disabled={createFolderMutation.isPending}
            >
              <Plus className="h-4 w-4 mr-2" />
              {createFolderMutation.isPending ? "Se creează..." : "Creează folder"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Folders List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Folderele tale</h2>
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">Se încarcă folderele...</div>
        ) : folders.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Nu există foldere. Creează primul folder de mai sus.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {folders.map((folder) => (
              <Card
                key={folder.id}
                className="bg-gradient-card shadow-soft border-border/50 hover:shadow-medium transition-all group"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div
                        className={`${getColorClass(folder.color)} p-3 rounded-lg group-hover:scale-110 transition-transform`}
                      >
                        <Folder className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1 truncate">{folder.name}</h3>
                        {folder.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {folder.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          <span>{folder.document_count} documente</span>
                        </div>
                      </div>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-44 p-2 bg-popover z-50" align="end">
                        <div className="space-y-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => {
                              setEditingFolder(folder);
                              setShowEditDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editează
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => handleDownloadFolder(folder.id, folder.name)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Descarcă
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-destructive hover:text-destructive"
                            onClick={() => deleteFolderMutation.mutate(folder.id)}
                            disabled={deleteFolderMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Șterge
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Folder Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px] bg-card">
          <DialogHeader>
            <DialogTitle>Editează folder</DialogTitle>
          </DialogHeader>
          {editingFolder && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-folder-name">Nume</Label>
                <Input
                  id="edit-folder-name"
                  value={editingFolder.name}
                  onChange={(e) => setEditingFolder({ ...editingFolder, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-folder-description">Descriere</Label>
                <Textarea
                  id="edit-folder-description"
                  value={editingFolder.description || ""}
                  onChange={(e) => setEditingFolder({ ...editingFolder, description: e.target.value })}
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-folder-color">Culoare</Label>
                <Select
                  value={editingFolder.color}
                  onValueChange={(value) => setEditingFolder({ ...editingFolder, color: value })}
                >
                  <SelectTrigger id="edit-folder-color">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {folderColors.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${color.class}`} />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-folder-parent">Folder părinte</Label>
                <Select
                  value={editingFolder.parent_id?.toString() || "none"}
                  onValueChange={(value) =>
                    setEditingFolder({ ...editingFolder, parent_id: value === "none" ? null : Number(value) })
                  }
                >
                  <SelectTrigger id="edit-folder-parent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="none">Niciun părinte</SelectItem>
                    {folders
                      .filter((f) => f.id !== editingFolder.id)
                      .map((folder) => (
                        <SelectItem key={folder.id} value={folder.id.toString()}>
                          {folder.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                onClick={handleEditFolder}
                disabled={updateFolderMutation.isPending}
              >
                {updateFolderMutation.isPending ? "Se actualizează..." : "Salvează modificările"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
