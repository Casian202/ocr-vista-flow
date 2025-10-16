import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Settings, Shield, Database } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const users = [
  { name: "Ion Popescu", email: "ion@example.com", role: "Admin", status: "active" },
  { name: "Maria Ionescu", email: "maria@example.com", role: "User", status: "active" },
  { name: "Andrei Dumitrescu", email: "andrei@example.com", role: "User", status: "inactive" },
];

export default function Admin() {
  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Administrare
        </h1>
        <p className="text-muted-foreground mt-2">
          Gestionează utilizatori și setări ale sistemului
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {[
          { title: "Total Utilizatori", value: "48", icon: Users },
          { title: "Setări Active", value: "12", icon: Settings },
          { title: "Nivel Securitate", value: "High", icon: Shield },
          { title: "Stocare Folosită", value: "45GB", icon: Database },
        ].map((stat, index) => (
          <Card
            key={stat.title}
            className="bg-gradient-card shadow-soft hover:shadow-medium transition-all duration-300 border-border/50"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="pb-2">
              <stat.icon className="h-5 w-5 text-primary mb-2" />
              <CardTitle className="text-2xl font-bold">{stat.value}</CardTitle>
              <CardDescription>{stat.title}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="users">Utilizatori</TabsTrigger>
          <TabsTrigger value="settings">Setări</TabsTrigger>
          <TabsTrigger value="security">Securitate</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card className="bg-gradient-card shadow-medium border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gestionare Utilizatori</CardTitle>
                  <CardDescription>Administrează accesul utilizatorilor</CardDescription>
                </div>
                <Button className="bg-gradient-primary">
                  Adaugă Utilizator
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((user, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {user.role}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          user.status === "active"
                            ? "bg-green-500/10 text-green-600"
                            : "bg-gray-500/10 text-gray-600"
                        }`}
                      >
                        {user.status}
                      </span>
                      <Button variant="ghost" size="sm">
                        Editează
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="bg-gradient-card shadow-medium border-border/50">
            <CardHeader>
              <CardTitle>Setări Sistem</CardTitle>
              <CardDescription>Configurează comportamentul aplicației</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Nume Organizație", value: "OCR Solutions SRL" },
                { label: "Email Contact", value: "contact@ocr.ro" },
                { label: "Limită Upload", value: "10 MB" },
                { label: "Limită Stocare", value: "100 GB" },
              ].map((setting) => (
                <div key={setting.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">{setting.label}</span>
                  <Input
                    defaultValue={setting.value}
                    className="w-48 bg-background"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card className="bg-gradient-card shadow-medium border-border/50">
            <CardHeader>
              <CardTitle>Setări Securitate</CardTitle>
              <CardDescription>Configurează opțiunile de securitate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Autentificare 2FA", enabled: true },
                { label: "Criptare Fișiere", enabled: true },
                { label: "Backup Automat", enabled: false },
                { label: "Audit Logging", enabled: true },
              ].map((option) => (
                <div key={option.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">{option.label}</span>
                  <Button
                    variant={option.enabled ? "default" : "outline"}
                    size="sm"
                  >
                    {option.enabled ? "Activat" : "Dezactivat"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
