import { createContext, useContext, useState, type ReactNode } from 'react';
import type { OrgRole, ProjectRole } from '@/types/permissions';
import { defaultOrgRolePermissions, defaultProjectRolePermissions } from '@/types/permissions';

// Context for managing user permissions across the app - v3

interface PermissionsContextType {
  currentOrgRole: OrgRole;
  setCurrentOrgRole: (role: OrgRole) => void;
  currentProjectRole: ProjectRole;
  setCurrentProjectRole: (role: ProjectRole) => void;
  hasOrgPermission: (permission: string) => boolean;
  hasProjectPermission: (permission: string) => boolean;
  canManageOrg: boolean;
  canManageProjects: boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [currentOrgRole, setCurrentOrgRole] = useState<OrgRole>('admin');
  const [currentProjectRole, setCurrentProjectRole] = useState<ProjectRole>('project-manager');

  const hasOrgPermission = (permission: string) => {
    return defaultOrgRolePermissions[currentOrgRole].includes(permission);
  };

  const hasProjectPermission = (permission: string) => {
    return defaultProjectRolePermissions[currentProjectRole].includes(permission);
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
