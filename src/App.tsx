import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PageHeader } from "@/components/PageHeader";
import Dashboard from "./pages/Dashboard";
import Folders from "./pages/Folders";
import OCR from "./pages/OCR";
import Admin from "./pages/Admin";
import Preview from "./pages/Preview";
import WordStudio from "./pages/WordStudio";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider defaultOpen={true}>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            <div className="flex-1 flex flex-col">
              <PageHeader />
              <main className="flex-1 p-8 bg-gradient-subtle">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/folders" element={<Folders />} />
                  <Route path="/ocr" element={<OCR />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/preview" element={<Preview />} />
                  <Route path="/word-studio" element={<WordStudio />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
