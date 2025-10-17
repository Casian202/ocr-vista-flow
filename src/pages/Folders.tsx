import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Folder, Plus, Upload, FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const folders = [
  { id: 1, name: "test", description: "descriere test", color: "bg-green-500", documents: 3 },
];

const folderColors = [
  { value: "green", label: "Mint Green", class: "bg-green-500" },
  { value: "blue", label: "Sky Blue", class: "bg-blue-500" },
  { value: "purple", label: "Purple", class: "bg-purple-500" },
  { value: "orange", label: "Orange", class: "bg-orange-500" },
  { value: "pink", label: "Pink", class: "bg-pink-500" },
  { value: "yellow", label: "Yellow", class: "bg-yellow-500" },
];

export default function Folders() {
  const [selectedColor, setSelectedColor] = useState("green");

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Biblioteci de documente</h1>
        <p className="text-muted-foreground mt-1">
          Organizează documentele procesate în foldere colorate și accesează rapid istoricul fiecărei colecții.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Create Folder */}
        <Card className="bg-gradient-card shadow-medium border-border/50">
          <CardHeader>
            <CardTitle>Creează un folder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Nume:</Label>
              <Input id="folder-name" placeholder="Nume folder" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="folder-description">Descrition:</Label>
              <Textarea id="folder-description" placeholder="Descriere (opțional)" className="min-h-[80px]" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="folder-color">Color:</Label>
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
              <Label htmlFor="folder-parent">Parent:</Label>
              <Select defaultValue="none">
                <SelectTrigger id="folder-parent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="none">---------</SelectItem>
                  <SelectItem value="test">test</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Salvează folder
            </Button>
          </CardContent>
        </Card>

        {/* Upload Document */}
        <Card className="bg-gradient-card shadow-medium border-border/50">
          <CardHeader>
            <CardTitle>Încarcă un document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="upload-folder">Folder:</Label>
              <Select defaultValue="none">
                <SelectTrigger id="upload-folder">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="none">---------</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.name}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="document-title">Title:</Label>
              <Input id="document-title" placeholder="Titlu document" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document-description">Description:</Label>
              <Textarea id="document-description" placeholder="Descriere (opțional)" className="min-h-[80px]" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pdf-upload">PDF în bibliotecă:</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer bg-muted/30">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Choose File · No file chosen</p>
                <input type="file" className="hidden" accept=".pdf" />
              </div>
              <Button variant="outline" className="w-full">
                Încarcă PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Folders List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {folders.map((folder) => (
          <Card 
            key={folder.id} 
            className="bg-gradient-card shadow-soft border-border/50 hover:shadow-medium transition-all cursor-pointer group"
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`${folder.color} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                  <Folder className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1">{folder.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{folder.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    <span>{folder.documents} documente</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
