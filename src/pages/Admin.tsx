import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Users } from "lucide-react";

const users = [
  { id: 1, username: "Casian202", status: "approved" },
];

const menuPermissions = [
  { id: "home", label: "home" },
  { id: "instructiuni", label: "Instrucțiuni" },
  { id: "ocr", label: "ocr" },
  { id: "ocr-studio", label: "OCR Studio" },
  { id: "biblioteci", label: "Biblioteci" },
  { id: "preview", label: "preview" },
  { id: "previzualizare", label: "Previzualizare" },
  { id: "word", label: "word" },
  { id: "word-studio", label: "Word Studio" },
  { id: "admin", label: "admin" },
  { id: "admin-console", label: "Consolă Admin" },
];

export default function Admin() {
  const [selectedUser, setSelectedUser] = useState("casian202");
  const [selectedEngine, setSelectedEngine] = useState("docling");

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Consolă administrator</h1>
        <p className="text-muted-foreground mt-1">
          Gestionează cerințe de acces și acordă permisiuni per module pentru fiecare utilizator.
        </p>
      </div>

      <div className="grid gap-6">
        {/* OCR Engine Settings */}
        <Card className="bg-gradient-card shadow-medium border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Setări motor OCR
            </CardTitle>
            <CardDescription>Motorul curent: {selectedEngine === "docling" ? "Docling" : "OCRmyPDF"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ocr-engine">Motor OCR implicit:</Label>
              <Select value={selectedEngine} onValueChange={setSelectedEngine}>
                <SelectTrigger id="ocr-engine">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="docling">Docling</SelectItem>
                  <SelectItem value="ocrmypdf">OCRmyPDF</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Selectează un motorul implicit folosit pentru OCR.
              </p>
            </div>

            <Button className="bg-primary hover:bg-primary/90">
              Salvează setarea
            </Button>
          </CardContent>
        </Card>

        {/* User Management */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Users List */}
          <Card className="bg-gradient-card shadow-medium border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Utilizatori
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUser(user.username.toLowerCase())}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedUser === user.username.toLowerCase()
                        ? "bg-primary/10 border border-primary"
                        : "bg-muted/50 hover:bg-muted"
                    }`}
                  >
                    <span className="font-medium">{user.username}</span>
                    <Badge 
                      variant="secondary"
                      className="bg-green-500/10 text-green-600 hover:bg-green-500/20"
                    >
                      {user.status === "approved" ? "Approved" : user.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Edit User */}
          <Card className="bg-gradient-card shadow-medium border-border/50">
            <CardHeader>
              <CardTitle>Editează: {selectedUser}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-status">Status:</Label>
                <Select defaultValue="approved">
                  <SelectTrigger id="user-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="denied">Denied</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Meniuri disponibile:</Label>
                <div className="border rounded-lg p-3 bg-muted/30 space-y-1 max-h-[200px] overflow-y-auto">
                  {menuPermissions.map((menu) => (
                    <div key={menu.id} className="text-sm py-1">
                      {menu.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-notes">Notes:</Label>
                <Textarea 
                  id="user-notes" 
                  placeholder="Adaugă notițe despre utilizator..." 
                  className="min-h-[100px]"
                />
              </div>

              <Button className="w-full bg-primary hover:bg-primary/90">
                Salvează
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
