import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2, Edit, ZoomIn, ZoomOut } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Preview() {
  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Preview Document
          </h1>
          <p className="text-muted-foreground mt-2">
            Vizualizează și editează rezultatele OCR
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline">
            <Share2 className="mr-2 h-4 w-4" />
            Distribuie
          </Button>
          <Button className="bg-gradient-primary">
            <Download className="mr-2 h-4 w-4" />
            Descarcă
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-gradient-card shadow-medium border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Document Original</CardTitle>
                <Button variant="ghost" size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  Editează
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center border-2 border-border">
                <p className="text-muted-foreground">Preview Imagine Document</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-soft border-border/50">
            <CardHeader>
              <CardTitle>Text Extras</CardTitle>
              <CardDescription>Rezultat procesare OCR</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="text" className="w-full">
                <TabsList className="bg-muted">
                  <TabsTrigger value="text">Text</TabsTrigger>
                  <TabsTrigger value="formatted">Formatat</TabsTrigger>
                  <TabsTrigger value="json">JSON</TabsTrigger>
                </TabsList>
                <TabsContent value="text" className="mt-4">
                  <div className="p-4 bg-muted/50 rounded-lg font-mono text-sm min-h-[200px]">
                    <p className="leading-relaxed">
                      FACTURĂ FISCALĂ
                      <br />
                      Nr. 2024/0001
                      <br />
                      Data: 15.01.2024
                      <br />
                      <br />
                      Furnizor: SC EXAMPLE SRL
                      <br />
                      CUI: RO12345678
                      <br />
                      <br />
                      Client: SC CLIENT SRL
                      <br />
                      <br />
                      Descriere servicii:
                      <br />
                      - Servicii consultanță IT
                      <br />
                      - Suport tehnic lunar
                      <br />
                      <br />
                      Total: 5,000 RON
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="formatted" className="mt-4">
                  <div className="p-4 bg-muted/50 rounded-lg min-h-[200px]">
                    <h3 className="font-bold text-lg mb-2">FACTURĂ FISCALĂ</h3>
                    <p className="text-sm mb-4">Nr. 2024/0001 | Data: 15.01.2024</p>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Furnizor</p>
                        <p className="font-medium">SC EXAMPLE SRL</p>
                        <p className="text-sm">CUI: RO12345678</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Client</p>
                        <p className="font-medium">SC CLIENT SRL</p>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <p className="text-lg font-bold">Total: 5,000 RON</p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="json" className="mt-4">
                  <div className="p-4 bg-muted/50 rounded-lg font-mono text-xs min-h-[200px] overflow-auto">
                    <pre>{`{
  "type": "invoice",
  "number": "2024/0001",
  "date": "2024-01-15",
  "supplier": {
    "name": "SC EXAMPLE SRL",
    "cui": "RO12345678"
  },
  "client": {
    "name": "SC CLIENT SRL"
  },
  "total": 5000,
  "currency": "RON"
}`}</pre>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-gradient-card shadow-soft border-border/50">
            <CardHeader>
              <CardTitle>Informații Document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Nume fișier:</span>
                <span className="font-medium">Invoice_2024.pdf</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Dimensiune:</span>
                <span className="font-medium">2.4 MB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pagini:</span>
                <span className="font-medium">1</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Limbă:</span>
                <span className="font-medium">Română</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Acuratețe:</span>
                <span className="font-medium text-green-600">98%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Data procesare:</span>
                <span className="font-medium">15.01.2024</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-primary text-primary-foreground shadow-strong border-0">
            <CardHeader>
              <CardTitle>Acțiuni Rapide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="secondary" className="w-full justify-start">
                <Download className="mr-2 h-4 w-4" />
                Descarcă TXT
              </Button>
              <Button variant="secondary" className="w-full justify-start">
                <Download className="mr-2 h-4 w-4" />
                Descarcă DOCX
              </Button>
              <Button variant="outline" className="w-full justify-start bg-white/10 hover:bg-white/20 border-white/20">
                <Share2 className="mr-2 h-4 w-4" />
                Trimite Email
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
