import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Search,
  Trash2,
  Download,
  FolderInput,
  Settings,
  Languages,
  Sparkles,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getJSON, postFormData, deleteRequest, patchJSON } from "@/lib/api";
import type { OCRJob, OCRJobDetail } from "@/types/ocr";
import type { OCREngineSetting } from "@/types/settings";
import { useToast } from "@/hooks/use-toast";

interface AdvancedOptionsState {
  optimizationLevel: number;
  rotatePages: boolean;
  detectRotation: boolean;
  removeBackground: boolean;
  skipText: boolean;
  redoOcr: boolean;
  outputType: "pdfa" | "pdf" | "txt";
}

const languageOptions = [
  { label: "Română", value: "romanian" },
  { label: "English", value: "english" },
  { label: "German", value: "german" },
  { label: "Italian", value: "italian" },
  { label: "Spanish", value: "spanish" },
  { label: "Hungarian", value: "hungarian" },
  { label: "French", value: "french" },
  { label: "Ukrainian", value: "ukrainian" },
];

const statusConfig: Record<
  OCRJob["status"],
  { label: string; icon: typeof CheckCircle; variant: string }
> = {
  completed: { label: "Procesat", icon: CheckCircle, variant: "bg-green-500/10 text-green-600" },
  processing: { label: "În procesare", icon: Sparkles, variant: "bg-blue-500/10 text-blue-600" },
  queued: { label: "În coadă", icon: Sparkles, variant: "bg-amber-500/10 text-amber-600" },
  failed: { label: "Eroare", icon: AlertCircle, variant: "bg-red-500/10 text-red-600" },
};

const emptyAdvancedOptions: AdvancedOptionsState = {
  optimizationLevel: 1,
  rotatePages: true,
  detectRotation: true,
  removeBackground: false,
  skipText: true,
  redoOcr: false,
  outputType: "pdfa",
};

export default function OCR() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [autoDetectLanguage, setAutoDetectLanguage] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("romanian");
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [advancedOptions, setAdvancedOptions] = useState<AdvancedOptionsState>(emptyAdvancedOptions);
  const [searchQuery, setSearchQuery] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedEngine, setSelectedEngine] = useState<"docling" | "ocrmypdf">("docling");
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const { data: engineSetting } = useQuery({
    queryKey: ["ocr-engine"],
    queryFn: () => getJSON<OCREngineSetting>("/settings/ocr-engine"),
  });

  const { data: folders = [] } = useQuery({
    queryKey: ["folders"],
    queryFn: () => getJSON<Array<{ id: number; name: string; color: string }>>("/folders"),
  });

  useEffect(() => {
    if (engineSetting?.engine) {
      setSelectedEngine(engineSetting.engine);
    }
  }, [engineSetting]);

  const {
    data: jobs = [],
    isFetching: jobsLoading,
  } = useQuery({
    queryKey: ["ocr-jobs"],
    queryFn: () => getJSON<OCRJob[]>("/ocr/jobs"),
    refetchInterval: 5000,
  });

  const { data: activeJob } = useQuery({
    queryKey: ["ocr-job", activeJobId],
    queryFn: () => getJSON<OCRJobDetail>(`/ocr/jobs/${activeJobId}`),
    enabled: Boolean(activeJobId),
    refetchInterval: activeJobId ? 2000 : false,
  });

  useEffect(() => {
    if (activeJob) {
      setProcessingProgress(activeJob.progress);
      if (activeJob.status === "completed" || activeJob.status === "failed") {
        setIsProcessing(false);
        setActiveJobId(null);
        queryClient.invalidateQueries({ queryKey: ["ocr-jobs"] });
        if (activeJob.status === "completed") {
          toast({
            title: "Procesare finalizată",
            description: `Documentul ${activeJob.original_filename} a fost procesat cu succes.`,
          });
        } else {
          toast({
            title: "Procesare eșuată",
            description: activeJob.error || "A apărut o problemă la procesare.",
            variant: "destructive",
          });
        }
      } else {
        setIsProcessing(true);
      }
    }
  }, [activeJob, queryClient, toast]);

  useEffect(() => {
    const runningJob = jobs.find((job) => job.status === "processing" || job.status === "queued");
    if (runningJob) {
      setIsProcessing(true);
      setProcessingProgress(runningJob.progress);
      setActiveJobId((current) => current ?? runningJob.id);
    } else if (!activeJobId) {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  }, [jobs, activeJobId]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) =>
      job.original_filename.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [jobs, searchQuery]);

  const startOcrMutation = useMutation({
    mutationFn: (formData: FormData) => postFormData<OCRJob>("/ocr/jobs", formData),
    onSuccess: (job) => {
      setActiveJobId(job.id);
      setProcessingProgress(job.progress);
      setIsProcessing(true);
      setUploadedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      queryClient.invalidateQueries({ queryKey: ["ocr-jobs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Nu s-a putut porni OCR",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: (jobId: number) => deleteRequest(`/ocr/jobs/${jobId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ocr-jobs"] });
    },
    onError: (error: Error) => {
      toast({ title: "Eroare la ștergere", description: error.message, variant: "destructive" });
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: ({ jobId, folder_id }: { jobId: number; folder_id: number | null }) =>
      patchJSON<OCRJob>(`/ocr/jobs/${jobId}`, { folder_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ocr-jobs"] });
      toast({ title: "Document actualizat", description: "Folderul a fost modificat." });
    },
    onError: (error: Error) => {
      toast({ title: "Eroare la salvare", description: error.message, variant: "destructive" });
    },
  });

  const handleStartOCR = () => {
    if (!uploadedFile) {
      toast({ title: "Selectează un fișier", description: "Te rugăm să încarci un PDF pentru procesare." });
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadedFile);
    formData.append("auto_detect", String(autoDetectLanguage));
    if (!autoDetectLanguage && selectedLanguage) {
      formData.append("language", selectedLanguage);
    }
    if (selectedFolder) {
      formData.append("folder_id", String(selectedFolder));
    }
    formData.append("engine_override", selectedEngine);

    const optionsPayload = {
      optimizationLevel: advancedOptions.optimizationLevel,
      rotatePages: advancedOptions.rotatePages,
      detectRotation: advancedOptions.detectRotation,
      removeBackground: advancedOptions.removeBackground,
      skipText: advancedOptions.skipText,
      redoOcr: advancedOptions.redoOcr,
      deskew: advancedOptions.optimizationLevel > 0,
      outputType: advancedOptions.outputType,
    };

    formData.append("options", JSON.stringify(optionsPayload));

    startOcrMutation.mutate(formData);
  };

  const handleDeleteJob = (jobId: number) => {
    deleteJobMutation.mutate(jobId);
  };

  const handleAssignFolder = (jobId: number) => {
    updateFolderMutation.mutate({ jobId, folder_id: selectedFolder });
  };

  const handleDownload = (job: OCRJob) => {
    if (!job.download_url) {
      toast({
        title: "Fișier indisponibil",
        description: "Documentul nu este gata pentru descărcare încă.",
        variant: "destructive",
      });
      return;
    }
    window.open(job.download_url, "_blank", "noopener");
  };

  const engineLabel = selectedEngine === "ocrmypdf" ? "OCRmyPDF" : "Docling";

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">OCR Studio</h1>
          <p className="text-muted-foreground mt-1">
            Procesează fișiere PDF folosind motorul <span className="font-medium">{engineLabel}</span> selectat de administrator.
          </p>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          <Sparkles className="h-3 w-3 mr-1" />
          {engineLabel}
        </Badge>
      </div>

      {isProcessing && (
        <Card className="bg-gradient-card shadow-soft border-border/50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Procesare document...</span>
                <span className="font-medium">{processingProgress}%</span>
              </div>
              <Progress value={processingProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-gradient-card shadow-medium border-border/50">
          <CardHeader>
            <CardTitle>Configurează o nouă procesare</CardTitle>
            <CardDescription>Document PDF*</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer bg-muted/30"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium mb-1">
                {uploadedFile ? uploadedFile.name : "Încarcă un PDF pentru procesare"}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setUploadedFile(file ?? null);
                }}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Detectare automată a limbilor</p>
                </div>
              </div>
              <Switch checked={autoDetectLanguage} onCheckedChange={setAutoDetectLanguage} className="data-[state=checked]:bg-primary" />
            </div>

            {!autoDetectLanguage && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="language-select">Limbă OCR</Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger id="language-select">
                    <SelectValue placeholder="Selectează limba" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {languageOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Selectează limba recunoscută. Lasă detectarea automată activă dacă nu ești sigur.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="folder-select">Stochează în folder:</Label>
              <Select value={selectedFolder?.toString() || "none"} onValueChange={(val) => setSelectedFolder(val === "none" ? null : Number(val))}>
                <SelectTrigger id="folder-select">
                  <SelectValue placeholder="Selectează folder" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="none">Fără folder</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id.toString()}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Salvează în folderul din bibliotecă în care să arhivezi documentul procesat.
              </p>
            </div>

            <Button variant="outline" className="w-full" onClick={() => setShowAdvancedSettings(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Setări avansate
            </Button>

            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={handleStartOCR}
              disabled={startOcrMutation.isPending || jobsLoading}
            >
              {startOcrMutation.isPending ? "Se pornește..." : "Pornește OCR"}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-medium border-border/50">
          <CardHeader>
            <CardTitle>Istoric ultimele procesări</CardTitle>
            <CardDescription>Caută în istoricul procesărilor:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Caută procesări..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-9"
              />
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {filteredJobs.map((job) => {
                const config = statusConfig[job.status];
                const StatusIcon = config.icon;
                return (
                  <div
                    key={job.id}
                    className="flex items-start justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{job.original_filename}</p>
                          <Badge className={`${config.variant} border-none flex items-center gap-1`}>
                            <StatusIcon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Creat {new Date(job.created_at).toLocaleString()} · Motor: {job.engine}
                        </p>
                        {job.folder_id && (
                          <p className="text-xs text-muted-foreground">
                            Arhivat în: {folders.find(f => f.id === job.folder_id)?.name || "necunoscut"}
                          </p>
                        )}
                        {job.folder && !job.folder_id && (
                          <p className="text-xs text-muted-foreground">Arhivat în: {job.folder}</p>
                        )}
                        {job.summary && (
                          <p className="text-xs text-muted-foreground mt-1">Rezumat: {job.summary}</p>
                        )}
                        {job.error && (
                          <p className="text-xs text-destructive mt-1">Eroare: {job.error}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Acțiuni
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-52 p-2 bg-popover z-50" align="end">
                          <div className="space-y-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => handleDownload(job)}
                              disabled={!job.download_url}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Descarcă
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => handleAssignFolder(job.id)}
                              disabled={updateFolderMutation.isPending}
                            >
                              <FolderInput className="h-4 w-4 mr-2" />
                              Salvează în folder ({selectedFolder ? folders.find(f => f.id === selectedFolder)?.name || "necunoscut" : "fără folder"})
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-destructive hover:text-destructive"
                              onClick={() => handleDeleteJob(job.id)}
                              disabled={deleteJobMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Șterge
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                );
              })}
              {!jobsLoading && filteredJobs.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-6">
                  Nu există procesări care să corespundă filtrului.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAdvancedSettings} onOpenChange={setShowAdvancedSettings}>
        <DialogContent className="sm:max-w-[520px] bg-card">
          <DialogHeader>
            <DialogTitle>Setări avansate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="optimization">Nivel optimizare</Label>
              <Input
                id="optimization"
                type="number"
                value={advancedOptions.optimizationLevel}
                onChange={(event) =>
                  setAdvancedOptions((previous) => ({
                    ...previous,
                    optimizationLevel: Math.min(3, Math.max(0, Number(event.target.value))),
                  }))
                }
                className="w-20"
                min={0}
                max={3}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Valoare între 0 și 3 pentru a îmbunătăți calitatea OCRmyPDF. Valoarea 0 dezactivează optimizările.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="rotate">Rotește pagini cu orientarea greșită</Label>
                <Switch
                  id="rotate"
                  checked={advancedOptions.rotatePages}
                  onCheckedChange={(value) =>
                    setAdvancedOptions((previous) => ({ ...previous, rotatePages: value }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="detect-rotation">Detectează automat rotirea paginilor</Label>
                <Switch
                  id="detect-rotation"
                  checked={advancedOptions.detectRotation}
                  onCheckedChange={(value) =>
                    setAdvancedOptions((previous) => ({ ...previous, detectRotation: value }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="remove-background">Elimină fundalul</Label>
                <Switch
                  id="remove-background"
                  checked={advancedOptions.removeBackground}
                  onCheckedChange={(value) =>
                    setAdvancedOptions((previous) => ({ ...previous, removeBackground: value }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="skip-text">Sari peste paginile care au deja text</Label>
                <Switch
                  id="skip-text"
                  checked={advancedOptions.skipText}
                  onCheckedChange={(value) =>
                    setAdvancedOptions((previous) => ({ ...previous, skipText: value }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="redo-ocr">Reface OCR chiar dacă există text</Label>
                <Switch
                  id="redo-ocr"
                  checked={advancedOptions.redoOcr}
                  onCheckedChange={(value) =>
                    setAdvancedOptions((previous) => ({ ...previous, redoOcr: value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="output-type">Tip fișier rezultat</Label>
              <Select
                value={advancedOptions.outputType}
                onValueChange={(value: AdvancedOptionsState["outputType"]) =>
                  setAdvancedOptions((previous) => ({ ...previous, outputType: value }))
                }
              >
                <SelectTrigger id="output-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="pdfa">PDF/A (implicit)</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="txt">TXT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
