import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { OrgRole, ProjectRole } from '@/types/permissions';
import { defaultOrgRolePermissions, defaultProjectRolePermissions } from '@/types/permissions';
import { useAuth } from '@/contexts/AuthContext';

/**
 * SECURITY NOTE: This context controls UI visibility only.
 * All actual authorization is enforced server-side via RLS policies.
 * Never rely on this context for security decisions.
 */

interface PermissionsContextType {
  currentOrgRole: OrgRole;
  setCurrentOrgRole: (role: OrgRole) => void;
  currentProjectRole: ProjectRole;
  setCurrentProjectRole: (role: ProjectRole) => void;
  hasOrgPermission: (permission: string) => boolean;
  hasProjectPermission: (permission: string) => boolean;
  canManageOrg: boolean;
  canManageProjects: boolean;
  isDevMode: boolean;
  setDevMode: (enabled: boolean) => void;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { userRole } = useAuth();
  const [isDevMode, setDevMode] = useState(false);
  const [devOrgRole, setDevOrgRole] = useState<OrgRole>('viewer');
  const [currentProjectRole, setCurrentProjectRole] = useState<ProjectRole>('viewer');

  // Map database role to permissions OrgRole
  const mapDatabaseRole = (role: string | null): OrgRole => {
    if (!role) return 'viewer';
    const validRoles: OrgRole[] = ['owner', 'admin', 'manager', 'member', 'viewer'];
    return validRoles.includes(role as OrgRole) ? (role as OrgRole) : 'viewer';
  };

  // Sync with actual user role from auth when not in dev mode
  useEffect(() => {
    if (!isDevMode && userRole) {
      setDevOrgRole(mapDatabaseRole(userRole));
    }
  }, [userRole, isDevMode]);

  // Use dev role in dev mode, otherwise use actual role from auth
  const currentOrgRole = isDevMode ? devOrgRole : mapDatabaseRole(userRole);

  const setCurrentOrgRole = (role: OrgRole) => {
    if (isDevMode) {
      setDevOrgRole(role);
    }
  };

  const hasOrgPermission = (permission: string) => {
    return defaultOrgRolePermissions[currentOrgRole]?.includes(permission) ?? false;
  };

  const hasProjectPermission = (permission: string) => {
    return defaultProjectRolePermissions[currentProjectRole]?.includes(permission) ?? false;
  };

  const canManageOrg = ['owner', 'admin'].includes(currentOrgRole);
  const canManageProjects = currentOrgRole !== 'viewer' && currentProjectRole !== 'viewer';

  return (
    <PermissionsContext.Provider
      value={{
        currentOrgRole,
        setCurrentOrgRole,
        currentProjectRole,
        setCurrentProjectRole,
        hasOrgPermission,
        hasProjectPermission,
        canManageOrg,
        canManageProjects,
        isDevMode,
        setDevMode,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}
