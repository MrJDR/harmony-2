import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { WatchProvider } from "@/contexts/WatchContext";
import { PortfolioDataProvider } from "@/contexts/PortfolioDataContext";
import { MasterbookProvider } from "@/contexts/MasterbookContext";
import { ActivityLogProvider } from "@/contexts/ActivityLogContext";
import { TourProvider } from "@/contexts/TourContext";
import { StreamProvider } from "@/contexts/StreamContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { TourOverlay } from "@/components/onboarding/TourOverlay";
import { AppErrorBoundary } from "@/components/shared/AppErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminSetup from "./pages/AdminSetup";
import NoOrganization from "./pages/NoOrganization";
import Onboarding from "./pages/Onboarding";
import Portfolios from "./pages/Portfolios";
import PortfolioDetail from "./pages/PortfolioDetail";
import Programs from "./pages/Programs";
import ProgramDetail from "./pages/ProgramDetail";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Tasks from "./pages/Tasks";
import Schedule from "./pages/Schedule";
import CRM from "./pages/CRM";
import ContactDetail from "./pages/ContactDetail";
import Resources from "./pages/Resources";
import Reports from "./pages/Reports";
import Messages from "./pages/Messages";
import Settings from "./pages/Settings";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <PermissionsProvider>
          <NotificationsProvider>
            <WatchProvider>
              <PortfolioDataProvider>
                <MasterbookProvider>
                <ActivityLogProvider>
                  <StreamProvider>
                    <TooltipProvider>
                      <Toaster />
                      <Sonner />
                      <AppErrorBoundary>
                        <BrowserRouter>
                          <TourProvider>
                            <TourOverlay />
                            <Routes>
                        {/* Public routes */}
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/no-organization" element={<NoOrganization />} />
                        <Route path="/admin-setup" element={<AdminSetup />} />
                        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                        
                        {/* Protected routes */}
                        <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                        <Route path="/portfolios" element={<ProtectedRoute><Portfolios /></ProtectedRoute>} />
                        <Route path="/portfolios/:portfolioId" element={<ProtectedRoute><PortfolioDetail /></ProtectedRoute>} />
                        <Route path="/programs" element={<ProtectedRoute><Programs /></ProtectedRoute>} />
                        <Route path="/programs/:programId" element={<ProtectedRoute><ProgramDetail /></ProtectedRoute>} />
                        <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
                        <Route path="/projects/:projectId" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
                        <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
                        <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
                        <Route path="/crm" element={<ProtectedRoute><CRM /></ProtectedRoute>} />
                        <Route path="/crm/:id" element={<ProtectedRoute><ContactDetail /></ProtectedRoute>} />
                        <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
                        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                        <Route path="/install" element={<Install />} />
                          <Route path="*" element={<NotFound />} />
                            </Routes>
                          </TourProvider>
                        </BrowserRouter>
                      </AppErrorBoundary>
                    </TooltipProvider>
                  </StreamProvider>
                </ActivityLogProvider>
                </MasterbookProvider>
              </PortfolioDataProvider>
            </WatchProvider>
          </NotificationsProvider>
        </PermissionsProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
