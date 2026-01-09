import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { WatchProvider } from "@/contexts/WatchContext";
import { PortfolioDataProvider } from "@/contexts/PortfolioDataContext";
import Index from "./pages/Index";
import Portfolio from "./pages/Portfolio";
import Programs from "./pages/Programs";
import ProgramDetail from "./pages/ProgramDetail";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Tasks from "./pages/Tasks";
import CRM from "./pages/CRM";
import ContactDetail from "./pages/ContactDetail";
import Resources from "./pages/Resources";
import Email from "./pages/Email";
import Settings from "./pages/Settings";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <PermissionsProvider>
      <NotificationsProvider>
        <WatchProvider>
          <PortfolioDataProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/portfolio" element={<Portfolio />} />
                  <Route path="/programs" element={<Programs />} />
                  <Route path="/programs/:programId" element={<ProgramDetail />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/projects/:projectId" element={<ProjectDetail />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/crm" element={<CRM />} />
                  <Route path="/crm/:id" element={<ContactDetail />} />
                  <Route path="/resources" element={<Resources />} />
                  <Route path="/email" element={<Email />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/install" element={<Install />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </PortfolioDataProvider>
        </WatchProvider>
      </NotificationsProvider>
    </PermissionsProvider>
  </QueryClientProvider>
);

export default App;
