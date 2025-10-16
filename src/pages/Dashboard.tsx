import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Folder, ScanText, FileText, TrendingUp } from "lucide-react";

const stats = [
  { title: "Total Documents", value: "1,247", icon: FileText, trend: "+12%" },
  { title: "Folders", value: "45", icon: Folder, trend: "+3%" },
  { title: "OCR Processed", value: "892", icon: ScanText, trend: "+18%" },
  { title: "Success Rate", value: "98.5%", icon: TrendingUp, trend: "+2.1%" },
];

export default function Dashboard() {
  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Monitorizează activitatea aplicației tale OCR
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card 
            key={stat.title} 
            className="bg-gradient-card shadow-soft hover:shadow-medium transition-all duration-300 hover:scale-105 border-border/50"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-primary mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {stat.trend} față de luna trecută
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-gradient-card shadow-medium border-border/50">
          <CardHeader>
            <CardTitle>Activitate Recentă</CardTitle>
            <CardDescription>Ultimele 5 documente procesate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <FileText className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Document_{item}.pdf</p>
                  <p className="text-xs text-muted-foreground">Procesat acum {item}h</p>
                </div>
                <Button variant="ghost" size="sm">
                  Vezi
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-gradient-primary text-primary-foreground shadow-strong border-0">
          <CardHeader>
            <CardTitle>Începe Procesare OCR</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Procesează documentele tale rapid și eficient
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-primary-foreground/90">
              Încarcă documente noi și folosește tehnologia OCR pentru a extrage text automat.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1">
                Încarcă Document
              </Button>
              <Button variant="outline" className="flex-1 bg-white/10 hover:bg-white/20 border-white/20">
                Vezi Ghid
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
