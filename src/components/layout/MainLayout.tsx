import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { PageTourButton } from '@/components/onboarding/PageTourButton';
import { getTourIdForRoute } from '@/contexts/TourContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      {/* Top bar with notifications */}
      <div className="fixed top-0 right-0 left-[240px] z-30 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-full items-center justify-end gap-2 px-6">
          {tourId && <PageTourButton tourId={tourId} />}
          
          {/* Dev Mode Role Switcher - only visible when enabled */}
          {isDevMode && (
            <div className="flex items-center gap-2 mr-2">
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
      <main className="pl-[240px] pt-16 transition-all duration-200">
        <div className="min-h-[calc(100vh-4rem)] p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
