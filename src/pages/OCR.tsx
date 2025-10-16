import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const recentScans = [
  { name: "Invoice_2024_01.pdf", status: "success", accuracy: 98 },
  { name: "Contract_Draft.pdf", status: "success", accuracy: 95 },
  { name: "Receipt_Store.jpg", status: "processing", accuracy: 0 },
  { name: "Document_Scan.png", status: "error", accuracy: 0 },
];

export default function OCR() {
  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          OCR Processing
        </h1>
        <p className="text-muted-foreground mt-2">
          Procesează și convertește documente în text editabil
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-gradient-card shadow-medium border-border/50">
          <CardHeader>
            <CardTitle>Încarcă Document</CardTitle>
            <CardDescription>Suportă PDF, JPG, PNG (max 10MB)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer bg-muted/30">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm font-medium mb-2">
                Trage și plasează fișiere aici
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                sau apasă pentru a selecta
              </p>
              <Button>Selectează Fișier</Button>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Procesare document...</span>
                <span className="font-medium">65%</span>
              </div>
              <Progress value={65} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-medium border-border/50">
          <CardHeader>
            <CardTitle>Setări OCR</CardTitle>
            <CardDescription>Configurează procesarea</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">Detectare Automată Limbă</p>
                  <p className="text-xs text-muted-foreground">Română, Engleză, etc.</p>
                </div>
                <Button variant="outline" size="sm">Activat</Button>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">Optimizare Calitate</p>
                  <p className="text-xs text-muted-foreground">Îmbunătățește imaginea</p>
                </div>
                <Button variant="outline" size="sm">Activat</Button>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">Export Format</p>
                  <p className="text-xs text-muted-foreground">TXT, DOCX, PDF</p>
                </div>
                <Button variant="outline" size="sm">TXT</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-card shadow-soft border-border/50">
        <CardHeader>
          <CardTitle>Istoric Procesare</CardTitle>
          <CardDescription>Ultimele documente procesate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentScans.map((scan, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-4">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{scan.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {scan.status === "success" && `Acuratețe: ${scan.accuracy}%`}
                      {scan.status === "processing" && "În procesare..."}
                      {scan.status === "error" && "Eroare procesare"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {scan.status === "success" && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {scan.status === "processing" && (
                    <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                  {scan.status === "error" && (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                  <Button variant="ghost" size="sm">
                    {scan.status === "success" ? "Download" : "Detalii"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
