import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Users, Database, FolderTree, FileText, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getJSON, postJSON } from "@/lib/api";
import type { OCREngineSetting } from "@/types/settings";
import type { OCRJob } from "@/types/ocr";
import type { Folder } from "@/types/folder";
import type { WordDocument } from "@/types/word";

const users = [
  { id: 1, username: "Casian202", status: "approved" },
];

const menuPermissions = [
  { id: "home", label: "home" },
  { id: "instructiuni", label: "Instrucțiuni" },
  { id: "ocr", label: "ocr" },
  { id: "ocr-studio", label: "OCR Studio" },
  { id: "biblioteci", label: "Biblioteci" },
  { id: "preview", label: "preview" },
  { id: "previzualizare", label: "Previzualizare" },
  { id: "word", label: "word" },
  { id: "word-studio", label: "Word Studio" },
  { id: "admin", label: "admin" },
  { id: "admin-console", label: "Consolă Admin" },
];

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState("casian202");
  const [selectedEngine, setSelectedEngine] = useState<"docling" | "ocrmypdf">("docling");

  const { data: engineSetting, isLoading: isLoadingEngine } = useQuery({
    queryKey: ["ocr-engine"],
    queryFn: () => getJSON<OCREngineSetting>("/settings/ocr-engine"),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["ocr-jobs"],
    queryFn: () => getJSON<OCRJob[]>("/ocr/jobs"),
  });

  const { data: folders = [] } = useQuery({
    queryKey: ["folders"],
    queryFn: () => getJSON<Folder[]>("/folders"),
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["word-documents"],
    queryFn: () => getJSON<WordDocument[]>("/word/documents"),
  });

  useEffect(() => {
    if (engineSetting?.engine) {
      setSelectedEngine(engineSetting.engine);
    }
  }, [engineSetting]);

  const updateEngineMutation = useMutation({
    mutationFn: (engine: "docling" | "ocrmypdf") =>
      postJSON<OCREngineSetting>("/settings/ocr-engine", { engine }),
    onSuccess: (data) => {
      queryClient.setQueryData(["ocr-engine"], data);
      toast({ title: "Setare salvată", description: `Motorul implicit este acum ${data.engine}.` });
    },
    onError: (error: Error) => {
      toast({ title: "Nu s-a putut salva", description: error.message, variant: "destructive" });
    },
  });

  const completedJobs = jobs.filter((j) => j.status === "completed").length;
  const processingJobs = jobs.filter((j) => j.status === "processing" || j.status === "queued").length;
  const failedJobs = jobs.filter((j) => j.status === "failed").length;
  const totalDocuments = folders.reduce((sum, f) => sum + f.document_count, 0);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Consolă administrator</h1>
        <p className="text-muted-foreground mt-1">
          Gestionează setările aplicației și monitorizează activitatea sistemului.
        </p>
      </div>

      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-card shadow-soft border-border/50 hover-lift">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Database className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{jobs.length}</p>
                <p className="text-sm text-muted-foreground">Total OCR Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-soft border-border/50 hover-lift">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <FolderTree className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{folders.length}</p>
                <p className="text-sm text-muted-foreground">Active Folders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-soft border-border/50 hover-lift">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <FileText className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{documents.length}</p>
                <p className="text-sm text-muted-foreground">Word Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-soft border-border/50 hover-lift">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 rounded-lg">
                <Sparkles className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedJobs}</p>
                <p className="text-sm text-muted-foreground">Completed Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Statistics */}
      <Card className="bg-gradient-card shadow-medium border-border/50">
        <CardHeader>
          <CardTitle>Statistici procesări</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Procesări finalizate</span>
                <Badge className="bg-green-500/10 text-green-600 border-none">{completedJobs}</Badge>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all" 
                  style={{ width: jobs.length > 0 ? `${(completedJobs / jobs.length) * 100}%` : '0%' }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">În procesare</span>
                <Badge className="bg-blue-500/10 text-blue-600 border-none">{processingJobs}</Badge>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all" 
                  style={{ width: jobs.length > 0 ? `${(processingJobs / jobs.length) * 100}%` : '0%' }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Eșuate</span>
                <Badge className="bg-red-500/10 text-red-600 border-none">{failedJobs}</Badge>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 transition-all" 
                  style={{ width: jobs.length > 0 ? `${(failedJobs / jobs.length) * 100}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <Card className="bg-gradient-card shadow-medium border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Setări motor OCR
            </CardTitle>
            <CardDescription>
              Motorul curent: {selectedEngine === "docling" ? "Docling" : "OCRmyPDF"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ocr-engine">Motor OCR implicit:</Label>
              <Select value={selectedEngine} onValueChange={(value) => setSelectedEngine(value as "docling" | "ocrmypdf")}>
                <SelectTrigger id="ocr-engine" disabled={isLoadingEngine || updateEngineMutation.isPending}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="docling">Docling</SelectItem>
                  <SelectItem value="ocrmypdf">OCRmyPDF</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Selectează motorul implicit folosit pentru OCR. Modificarea se aplică imediat tuturor procesărilor noi.
              </p>
            </div>

            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={() => updateEngineMutation.mutate(selectedEngine)}
              disabled={updateEngineMutation.isPending}
            >
              {updateEngineMutation.isPending ? "Se salvează..." : "Salvează setarea"}
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-gradient-card shadow-medium border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Utilizatori
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUser(user.username.toLowerCase())}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedUser === user.username.toLowerCase()
                        ? "bg-primary/10 border border-primary"
                        : "bg-muted/50 hover:bg-muted"
                    }`}
                  >
                    <span className="font-medium">{user.username}</span>
                    <Badge
                      variant="secondary"
                      className="bg-green-500/10 text-green-600 hover:bg-green-500/20"
                    >
                      {user.status === "approved" ? "Approved" : user.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-medium border-border/50">
            <CardHeader>
              <CardTitle>Editează: {selectedUser}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-status">Status:</Label>
                <Select defaultValue="approved">
                  <SelectTrigger id="user-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="denied">Denied</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Meniuri disponibile:</Label>
                <div className="border rounded-lg p-3 bg-muted/30 space-y-1 max-h-[200px] overflow-y-auto">
                  {menuPermissions.map((menu) => (
                    <div key={menu.id} className="text-sm py-1">
                      {menu.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-notes">Notes:</Label>
                <Textarea
                  id="user-notes"
                  placeholder="Adaugă notițe despre utilizator..."
                  className="min-h-[100px]"
                />
              </div>

              <Button className="w-full bg-primary hover:bg-primary/90">Salvează</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
