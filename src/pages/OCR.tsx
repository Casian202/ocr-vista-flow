import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Upload, FileText, CheckCircle, AlertCircle, Search, Trash2, Download, FolderInput, Settings, Languages, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const recentScans = [
  { id: 1, name: "vignieta_ocr.pdf", status: "completed", date: "15.10.2025 16:05", language: "Detectare automată" },
  { id: 2, name: "GRILE_ONCO_FINAL-_rezolvat_8VOhcRM_ocr.pdf", status: "completed", date: "15.10.2025 13:19", language: "Detectare automată" },
  { id: 3, name: "da", status: "in-test", date: "15.10.2025 13:13", language: "Română" },
];

export default function OCR() {
  const [autoDetectLanguage, setAutoDetectLanguage] = useState(true);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredScans = recentScans.filter(scan => 
    scan.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header with OCR Engine Badge */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">OCR Studio</h1>
          <p className="text-muted-foreground mt-1">
            Procesează fișiere PDF folosind motorul <span className="font-medium">Docling</span> selectat de administrator.
          </p>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          <Sparkles className="h-3 w-3 mr-1" />
          Docling
        </Badge>
      </div>

      {/* Processing Status Bar */}
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
        {/* Upload & Configuration */}
        <Card className="bg-gradient-card shadow-medium border-border/50">
          <CardHeader>
            <CardTitle>Configurează o nouă procesare</CardTitle>
            <CardDescription>Document PDF*</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Upload */}
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer bg-muted/30">
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium mb-1">
                Încarcă un PDF pentru procesare cu OCRmyPDF.
              </p>
              <input type="file" className="hidden" accept=".pdf" />
            </div>

            {/* Language Detection Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Detectare automată a limbilor</p>
                </div>
              </div>
              <Switch 
                checked={autoDetectLanguage} 
                onCheckedChange={setAutoDetectLanguage}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            {/* Manual Language Selection - Only visible when auto-detect is OFF */}
            {!autoDetectLanguage && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="language-select">Limbă OCR</Label>
                <Select defaultValue="romanian">
                  <SelectTrigger id="language-select">
                    <SelectValue placeholder="Selectează limba" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="romanian">Română</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="german">German</SelectItem>
                    <SelectItem value="italian">Italian</SelectItem>
                    <SelectItem value="spanish">Spanish</SelectItem>
                    <SelectItem value="hungarian">Hungarian</SelectItem>
                    <SelectItem value="french">French</SelectItem>
                    <SelectItem value="ukrainian">Ukrainian</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Selectează limba recunoscut. Lasă necompletată pentru a activa detectarea automată.
                </p>
              </div>
            )}

            {/* Folder Selection */}
            <div className="space-y-2">
              <Label htmlFor="folder-select">Stochează în folder:</Label>
              <Select defaultValue="default">
                <SelectTrigger id="folder-select">
                  <SelectValue placeholder="Selectează folder" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="default">---------</SelectItem>
                  <SelectItem value="test">test</SelectItem>
                  <SelectItem value="documente">Documente</SelectItem>
                  <SelectItem value="facturi">Facturi</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Salvează în folder din bibliotecă în care să arhivezi documentul procesat.
              </p>
            </div>

            {/* Advanced Settings Button */}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowAdvancedSettings(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Setări avansate
            </Button>

            <Button className="w-full bg-primary hover:bg-primary/90">
              Pornește OCR
            </Button>
          </CardContent>
        </Card>

        {/* Processing History */}
        <Card className="bg-gradient-card shadow-medium border-border/50">
          <CardHeader>
            <CardTitle>Istoric ultimele procesări</CardTitle>
            <CardDescription>Caută în istoricul procesărilor:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Caută procesări..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* History List */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {filteredScans.map((scan) => (
                <div
                  key={scan.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{scan.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Creat {scan.date} · Limbă: {scan.language}
                      </p>
                      {scan.status === "in-test" && (
                        <p className="text-xs text-muted-foreground">Arhivat în: test</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {scan.status === "completed" && (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                        Completed
                      </Badge>
                    )}
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm">
                          Acțiuni
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-2 bg-popover z-50" align="end">
                        <div className="space-y-1">
                          <Button variant="ghost" size="sm" className="w-full justify-start">
                            <Download className="h-4 w-4 mr-2" />
                            Descarcă
                          </Button>
                          <Button variant="ghost" size="sm" className="w-full justify-start">
                            <FolderInput className="h-4 w-4 mr-2" />
                            Salvează în folder
                          </Button>
                          <Button variant="ghost" size="sm" className="w-full justify-start text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Șterge
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Settings Dialog */}
      <Dialog open={showAdvancedSettings} onOpenChange={setShowAdvancedSettings}>
        <DialogContent className="sm:max-w-[500px] bg-card">
          <DialogHeader>
            <DialogTitle>Setări avansate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="deskew">Nivel optimizare</Label>
              <Input id="deskew" type="number" defaultValue="1" className="w-20" min="0" max="3" />
            </div>
            <p className="text-xs text-muted-foreground">
              Valoare între 0 și 3 pentru a îmbunătăți calitatea OCRmyPDF (...comenzi).
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="rotate">Rotește pagini cu orientarea grșită</Label>
                <Switch id="rotate" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="detect-rotation">Detectează automată rotire pagini</Label>
                <Switch id="detect-rotation" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="remove-background">Elimină fundalul</Label>
                <Switch id="remove-background" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="clean-pages">Șari peste paginile care au deja text (skip-text)</Label>
                <Switch id="clean-pages" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="redo">Reface OCR chiar dacă există text</Label>
                <Switch id="redo" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="output-type">Tip fișier rezultat</Label>
              <Select defaultValue="pdfa">
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
