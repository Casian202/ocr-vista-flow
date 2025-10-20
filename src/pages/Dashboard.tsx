import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Folder, ScanText, FileText, TrendingUp, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getJSON } from "@/lib/api";
import type { OCRJob } from "@/types/ocr";
import type { Folder as FolderType } from "@/types/folder";
import type { WordDocument } from "@/types/word";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { data: jobs = [] } = useQuery({
    queryKey: ["ocr-jobs"],
    queryFn: () => getJSON<OCRJob[]>("/ocr/jobs"),
  });

  const { data: folders = [] } = useQuery({
    queryKey: ["folders"],
    queryFn: () => getJSON<FolderType[]>("/folders"),
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["word-documents"],
    queryFn: () => getJSON<WordDocument[]>("/word/documents"),
  });

  const completedJobs = jobs.filter((j) => j.status === "completed").length;
  const successRate = jobs.length > 0 ? ((completedJobs / jobs.length) * 100).toFixed(1) : "0";
  const recentJobs = jobs.slice(0, 5);

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Bine ai venit la OCR Vista Flow
        </h1>
        <p className="text-muted-foreground mt-2">
          Monitorizează activitatea aplicației tale de procesare OCR
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-card shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1 border-border/50 animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Documente
            </CardTitle>
            <FileText className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{jobs.length + documents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {jobs.length} OCR + {documents.length} Word
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1 border-border/50 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Foldere Active
            </CardTitle>
            <Folder className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{folders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {folders.reduce((sum, f) => sum + f.document_count, 0)} documente organizate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1 border-border/50 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Procesări OCR
            </CardTitle>
            <ScanText className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{jobs.length}</div>
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              {completedJobs} finalizate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1 border-border/50 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rată de Succes
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Bazat pe {jobs.length} procesări
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-gradient-card shadow-medium border-border/50 animate-slide-in-left">
          <CardHeader>
            <CardTitle>Activitate Recentă</CardTitle>
            <CardDescription>Ultimele procesări OCR</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentJobs.length > 0 ? (
              recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all hover:scale-[1.02]"
                >
                  <div className={`p-2 rounded-lg ${
                    job.status === "completed" ? "bg-green-500/10" :
                    job.status === "processing" ? "bg-blue-500/10" :
                    job.status === "failed" ? "bg-red-500/10" :
                    "bg-amber-500/10"
                  }`}>
                    {job.status === "completed" ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : job.status === "failed" ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{job.original_filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(job.created_at).toLocaleDateString()} · {job.engine}
                    </p>
                  </div>
                  {job.download_url && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={job.download_url} target="_blank" rel="noopener noreferrer">
                        Vezi
                      </a>
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nu există procesări recente. Începe prin a încărca un document!
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-strong border-0 animate-slide-in-right overflow-hidden relative">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
          <CardHeader className="relative">
            <CardTitle className="text-2xl">Începe Procesare OCR</CardTitle>
            <CardDescription className="text-primary-foreground/90">
              Procesează documentele tale rapid și eficient cu tehnologie de ultimă generație
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 relative">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/20 rounded-lg mt-1">
                  <ScanText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">OCR Avansat</p>
                  <p className="text-xs text-primary-foreground/80">
                    Docling și OCRmyPDF pentru recunoaștere text precisă
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/20 rounded-lg mt-1">
                  <Folder className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Organizare Inteligentă</p>
                  <p className="text-xs text-primary-foreground/80">
                    Gestionează documentele în foldere colorate personalizabile
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/20 rounded-lg mt-1">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Conversie la Word</p>
                  <p className="text-xs text-primary-foreground/80">
                    Transformă PDF-uri în documente Word editabile
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" asChild>
                <Link to="/ocr">Începe Procesare</Link>
              </Button>
              <Button variant="outline" className="flex-1 bg-white/10 hover:bg-white/20 border-white/20" asChild>
                <Link to="/folders">Gestionează Foldere</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
