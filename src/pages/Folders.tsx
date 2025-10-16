import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, Plus, Search, MoreVertical } from "lucide-react";

const folders = [
  { name: "Facturi 2024", files: 45, color: "bg-blue-500" },
  { name: "Contracte", files: 23, color: "bg-purple-500" },
  { name: "Documente Personale", files: 67, color: "bg-green-500" },
  { name: "Rapoarte", files: 34, color: "bg-orange-500" },
  { name: "Archive", files: 128, color: "bg-gray-500" },
];

export default function Folders() {
  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Folders
          </h1>
          <p className="text-muted-foreground mt-2">
            Organizează și gestionează documentele tale
          </p>
        </div>
        <Button className="bg-gradient-primary shadow-medium hover:shadow-strong transition-all">
          <Plus className="mr-2 h-4 w-4" />
          Folder Nou
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Caută în foldere..."
          className="pl-10 bg-card shadow-soft"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {folders.map((folder, index) => (
          <Card
            key={folder.name}
            className="bg-gradient-card shadow-soft hover:shadow-medium transition-all duration-300 hover:scale-105 border-border/50 group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className={`${folder.color} p-3 rounded-lg shadow-soft`}>
                  <Folder className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">{folder.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{folder.files} fișiere</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Deschide
                </Button>
                <Button variant="ghost" size="sm" className="flex-1">
                  Detalii
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
