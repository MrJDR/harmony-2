import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { WatchProvider } from "@/contexts/WatchContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Portfolio from "./pages/Portfolio";
import Programs from "./pages/Programs";
import Projects from "./pages/Projects";
import Resources from "./pages/Resources";
import Email from "./pages/Email";
import CRM from "./pages/CRM";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PermissionsProvider>
        <NotificationsProvider>
          <WatchProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/programs" element={<Programs />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/email" element={<Email />} />
                <Route path="/crm" element={<CRM />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </WatchProvider>
        </NotificationsProvider>
      </PermissionsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
