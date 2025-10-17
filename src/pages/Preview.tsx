import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Eye, Download } from "lucide-react";

const documents = [
  { id: 1, name: "vignieta_ocr.pdf", folder: "test", updated: "15.10.2025 16:05", hasOcr: true },
  { id: 2, name: "GRILE_ONCO_FINAL-_rezolvat_8VOhcRM_ocr.pdf", folder: "test", updated: "15.10.2025 13:19", hasOcr: true },
  { id: 3, name: "da", folder: "test", updated: "15.10.2025 13:13", hasOcr: false },
];

export default function Preview() {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Previzualizare documente</h1>
        <p className="text-muted-foreground mt-1">
          Selectează un document procesat pentru a-l vizualiza rapid în browser.
        </p>
      </div>

      {/* Documents List */}
      <Card className="bg-gradient-card shadow-medium border-border/50">
        <CardHeader>
          <CardTitle>Documentele tale</CardTitle>
          <CardDescription>Vizualizează și descarcă documentele procesate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Folder: {doc.folder} · Actualizat {doc.updated}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button variant="secondary" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Previzualizează
                  </Button>
                  {doc.hasOcr && (
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Descarcă PDF
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
