import { ReactNode, useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { PageTourButton } from '@/components/onboarding/PageTourButton';
import { getTourIdForRoute } from '@/contexts/TourContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { OrgRole, ProjectRole } from '@/types/permissions';

interface MainLayoutProps {
  children: ReactNode;
}

const orgRoles: OrgRole[] = ['owner', 'admin', 'manager', 'member', 'viewer'];
const projectRoles: ProjectRole[] = ['project-manager', 'contributor', 'viewer'];

const SIDEBAR_WIDTH_EXPANDED = 240;
const SIDEBAR_WIDTH_COLLAPSED = 72;

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const tourId = getTourIdForRoute(location.pathname);
  const { isDevMode, currentOrgRole, setCurrentOrgRole, currentProjectRole, setCurrentProjectRole } = usePermissions();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Track screen size for responsive sidebar padding
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const sidebarWidth = sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Desktop Sidebar - fixed position, hidden on mobile */}
      <aside
        className="hidden md:flex md:flex-shrink-0 md:fixed md:inset-y-0 md:left-0 md:z-40"
        style={{ width: sidebarWidth }}
      >
        <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
      </aside>

      {/* Main content wrapper - full width on mobile, offset on desktop */}
      <div
        className="flex-1 flex flex-col min-h-screen w-full"
        style={{ paddingLeft: isMobile ? 0 : sidebarWidth }}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-full items-center justify-between gap-2 px-4">
            {/* Mobile menu button */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="p-0 w-[280px] bg-transparent shadow-none border-0"
                  onPointerDownOutside={() => setMobileMenuOpen(false)}
                  onEscapeKeyDown={() => setMobileMenuOpen(false)}
                >
                  <SheetTitle className="sr-only">Navigation menu</SheetTitle>
                  <SheetDescription className="sr-only">
                    Primary navigation for the application
                  </SheetDescription>
                  <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
                </SheetContent>
              </Sheet>
            </div>

            {/* Spacer for desktop */}
            <div className="hidden md:block" />

            {/* Right side items */}
            <div className="flex items-center gap-2 ml-auto">
              {tourId && <PageTourButton tourId={tourId} />}
              
              {/* Dev Mode Role Switcher - hidden on mobile */}
              {isDevMode && (
                <div className="hidden lg:flex items-center gap-2 mr-2">
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs">
                    Dev
                  </Badge>
                  <Select value={currentOrgRole} onValueChange={(v) => setCurrentOrgRole(v as OrgRole)}>
                    <SelectTrigger className="w-[100px] h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {orgRoles.map((role) => (
                        <SelectItem key={role} value={role} className="text-xs capitalize">
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={currentProjectRole} onValueChange={(v) => setCurrentProjectRole(v as ProjectRole)}>
                    <SelectTrigger className="w-[120px] h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {projectRoles.map((role) => (
                        <SelectItem key={role} value={role} className="text-xs capitalize">
                          {role.replace('-', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <NotificationDropdown />
            </div>
          </div>
        </header>
        
        {/* Main content - proper padding and full width */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
