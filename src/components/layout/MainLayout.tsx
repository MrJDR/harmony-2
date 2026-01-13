import { ReactNode, useState } from 'react';
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { OrgRole, ProjectRole } from '@/types/permissions';

interface MainLayoutProps {
  children: ReactNode;
}

const orgRoles: OrgRole[] = ['owner', 'admin', 'manager', 'member', 'viewer'];
const projectRoles: ProjectRole[] = ['project-manager', 'contributor', 'viewer'];

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const tourId = getTourIdForRoute(location.pathname);
  const { isDevMode, currentOrgRole, setCurrentOrgRole, currentProjectRole, setCurrentProjectRole } = usePermissions();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Top bar */}
      <div className="fixed top-0 right-0 left-0 md:left-[240px] z-30 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-full items-center justify-between gap-2 px-4 md:px-6">
          {/* Mobile menu button */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[280px]">
                <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>

          {/* Right side items */}
          <div className="flex items-center gap-2 ml-auto">
            {tourId && <PageTourButton tourId={tourId} />}
            
            {/* Dev Mode Role Switcher - only visible when enabled, hidden on mobile */}
            {isDevMode && (
              <div className="hidden sm:flex items-center gap-2 mr-2">
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
      </div>
      
      {/* Main content - no left padding on mobile */}
      <main className="md:pl-[240px] pt-16 transition-all duration-200">
        <div className="min-h-[calc(100vh-4rem)] p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}