import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Upload } from "lucide-react";

export default function WordStudio() {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
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
        {/* Create New Word Document */}
        <Card className="bg-gradient-card shadow-medium border-border/50">
          <CardHeader>
            <CardTitle>Document Word nou</CardTitle>
            <CardDescription>Titlu document:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input placeholder="Titlu document" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="word-content">Conținut document:</Label>
              <Textarea 
                id="word-content" 
                placeholder="Introdu conținutul documentului..." 
                className="min-h-[200px]"
              />
            </div>

            <Button className="w-full bg-primary hover:bg-primary/90">
              <FileText className="h-4 w-4 mr-2" />
              Generează document
            </Button>
          </CardContent>
        </Card>

        {/* PDF to Word Conversion */}
        <Card className="bg-gradient-card shadow-medium border-border/50">
          <CardHeader>
            <CardTitle>Conversie PDF → Word</CardTitle>
            <CardDescription>Titlu document Word:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input placeholder="Titlu document Word" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pdf-convert">PDF pentru conversie:</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer bg-muted/30">
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium mb-1">Choose File</p>
                <p className="text-xs text-muted-foreground">No file chosen</p>
                <input type="file" className="hidden" accept=".pdf" />
              </div>
            </div>

            <Button className="w-full bg-primary hover:bg-primary/90">
              <FileText className="h-4 w-4 mr-2" />
              Convertește PDF
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Generated Documents List */}
      <Card className="bg-gradient-card shadow-soft border-border/50">
        <CardHeader>
          <CardTitle>Documentele tale Word</CardTitle>
          <CardDescription>Nu există documente Word generate încă.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Creează primul tău document Word pentru a-l vedea aici.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
