import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getJSON, postFormData, postJSON } from "@/lib/api";
import type { WordDocument } from "@/types/word";

export default function WordStudio() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const [wordTitle, setWordTitle] = useState("");
  const [wordContent, setWordContent] = useState("");
  const [convertTitle, setConvertTitle] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const { data: documents = [] } = useQuery({
    queryKey: ["word-documents"],
    queryFn: () => getJSON<WordDocument[]>("/word/documents"),
    refetchInterval: 8000,
  });

  const generateDocumentMutation = useMutation({
    mutationFn: () => postJSON<{ document: WordDocument }>("/word/generate", {
      title: wordTitle,
      content: wordContent,
    }),
    onSuccess: ({ document }) => {
      queryClient.invalidateQueries({ queryKey: ["word-documents"] });
      toast({ title: "Document creat", description: `Documentul ${document.title} a fost generat.` });
      setWordContent("");
      setWordTitle("");
    },
    onError: (error: Error) => {
      toast({ title: "Nu s-a putut genera documentul", description: error.message, variant: "destructive" });
    },
  });

  const convertDocumentMutation = useMutation({
    mutationFn: (formData: FormData) => postFormData<{ document: WordDocument }>("/word/convert", formData),
    onSuccess: ({ document }) => {
      queryClient.invalidateQueries({ queryKey: ["word-documents"] });
      toast({ title: "Conversie reușită", description: `Documentul ${document.title} este gata de descărcare.` });
      setPdfFile(null);
      setConvertTitle("");
      if (uploadInputRef.current) {
        uploadInputRef.current.value = "";
      }
    },
    onError: (error: Error) => {
      toast({ title: "Conversie eșuată", description: error.message, variant: "destructive" });
    },
  });

  const handleGenerateDocument = () => {
    if (!wordContent.trim()) {
      toast({ title: "Conținut necesar", description: "Introdu conținutul documentului înainte de generare." });
      return;
    }
    generateDocumentMutation.mutate();
  };

  const handleConvertDocument = () => {
    if (!pdfFile) {
      toast({ title: "Selectează un fișier", description: "Încarcă un PDF pentru a-l converti." });
      return;
    }
    const formData = new FormData();
    formData.append("file", pdfFile);
    formData.append("title", convertTitle);
    convertDocumentMutation.mutate(formData);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Word Studio</h1>
        <p className="text-muted-foreground mt-1">
          Creează documente .docx sau convertește PDF-uri procesate în fișiere Word editabile.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Conversiile folosesc motorul <span className="font-medium">Docling</span> selectat în consola de administrare.
        </p>
        <p className="text-sm text-muted-foreground">
          Textul extras poate fi diferit față de OCRmyPDF, iar formatările complexe pot fi simplificate.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-gradient-card shadow-medium border-border/50">
          <CardHeader>
            <CardTitle>Document Word nou</CardTitle>
            <CardDescription>Titlu document:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input placeholder="Titlu document" value={wordTitle} onChange={(event) => setWordTitle(event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="word-content">Conținut document:</Label>
              <Textarea
                id="word-content"
                placeholder="Introdu conținutul documentului..."
                className="min-h-[200px]"
                value={wordContent}
                onChange={(event) => setWordContent(event.target.value)}
              />
            </div>

            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={handleGenerateDocument}
              disabled={generateDocumentMutation.isPending}
            >
              <FileText className="h-4 w-4 mr-2" />
              {generateDocumentMutation.isPending ? "Se generează..." : "Generează document"}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-medium border-border/50">
          <CardHeader>
            <CardTitle>Conversie PDF → Word</CardTitle>
            <CardDescription>Titlu document Word:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Titlu document Word"
                value={convertTitle}
                onChange={(event) => setConvertTitle(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pdf-convert">PDF pentru conversie:</Label>
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer bg-muted/30"
                onClick={() => uploadInputRef.current?.click()}
              >
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium mb-1">{pdfFile ? pdfFile.name : "Alege fișier"}</p>
                <input
                  ref={uploadInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setPdfFile(file);
                  }}
                />
              </div>
            </div>

            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={handleConvertDocument}
              disabled={convertDocumentMutation.isPending}
            >
              <FileText className="h-4 w-4 mr-2" />
              {convertDocumentMutation.isPending ? "Se convertește..." : "Convertește PDF"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-card shadow-soft border-border/50">
        <CardHeader>
          <CardTitle>Documentele tale Word</CardTitle>
          <CardDescription>
            {documents.length === 0
              ? "Nu există documente Word generate încă."
              : "Descărcă documentele generate recent."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Creează primul tău document Word pentru a-l vedea aici.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="flex items-start justify-between border border-border/60 rounded-lg p-4 bg-background"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{document.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Creat {new Date(document.created_at).toLocaleString()} · Sursa: {document.source}
                    </p>
                    {document.summary && (
                      <p className="text-xs text-muted-foreground mt-1">Rezumat: {document.summary}</p>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => window.open(document.download_url, "_blank", "noopener")}
                  >
                    Descarcă
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
