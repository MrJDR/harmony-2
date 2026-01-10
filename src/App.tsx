import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { WatchProvider } from "@/contexts/WatchContext";
import { PortfolioDataProvider } from "@/contexts/PortfolioDataContext";
import { ActivityLogProvider } from "@/contexts/ActivityLogContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminSetup from "./pages/AdminSetup";
import NoOrganization from "./pages/NoOrganization";
import Portfolio from "./pages/Portfolio";
import Programs from "./pages/Programs";
import ProgramDetail from "./pages/ProgramDetail";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Tasks from "./pages/Tasks";
import CRM from "./pages/CRM";
import ContactDetail from "./pages/ContactDetail";
import Resources from "./pages/Resources";
import Reports from "./pages/Reports";
import Email from "./pages/Email";
import Settings from "./pages/Settings";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <PermissionsProvider>
        <NotificationsProvider>
          <WatchProvider>
            <PortfolioDataProvider>
              <ActivityLogProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <Routes>
                      {/* Public routes */}
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/no-organization" element={<NoOrganization />} />
                      <Route path="/admin-setup" element={<AdminSetup />} />
                      
                      {/* Protected routes */}
                      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                      <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
                      <Route path="/programs" element={<ProtectedRoute><Programs /></ProtectedRoute>} />
                      <Route path="/programs/:programId" element={<ProtectedRoute><ProgramDetail /></ProtectedRoute>} />
                      <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
                      <Route path="/projects/:projectId" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
                      <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
                      <Route path="/crm" element={<ProtectedRoute><CRM /></ProtectedRoute>} />
                      <Route path="/crm/:id" element={<ProtectedRoute><ContactDetail /></ProtectedRoute>} />
                      <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
                      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                      <Route path="/email" element={<ProtectedRoute><Email /></ProtectedRoute>} />
                      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                      <Route path="/install" element={<Install />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                </TooltipProvider>
              </ActivityLogProvider>
            </PortfolioDataProvider>
          </WatchProvider>
        </NotificationsProvider>
      </PermissionsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
