import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { OrgRole, ProjectRole, PermissionContext } from '@/domains/permissions/types';
import { defaultOrgRolePermissions, defaultProjectRolePermissions } from '@/domains/permissions/types';
import { mapDatabaseRole, canManageOrg as domainCanManageOrg, canManageProjects as domainCanManageProjects } from '@/domains/permissions/service';
import { useAuth } from '@/contexts/AuthContext';

// Storage keys for saved permissions
const ORG_PERMISSIONS_KEY = 'org_role_permissions';
const PROJECT_PERMISSIONS_KEY = 'project_role_permissions';

/**
 * SECURITY NOTE: This context controls UI visibility only.
 * All actual authorization is enforced server-side via RLS policies.
 * 
 * IMPORTANT: For destructive or security-sensitive actions (like deleting an org),
 * components should use `userRole` from `useAuth()` instead of `currentOrgRole` 
 * from this context, or use `PermissionGate` with `useRealRole={true}`.
 * 
 * Dev mode is intended for UI testing only and should never grant actual permissions.
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

  // Dev mode is a UI testing feature only - persisted to localStorage for navigation
  const [isDevMode, setIsDevMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('devMode') === 'true';
  });
  const [devOrgRole, setDevOrgRole] = useState<OrgRole>(() => {
    if (typeof window === 'undefined') return 'viewer';
    return (localStorage.getItem('devOrgRole') as OrgRole) || 'viewer';
  });
  const [currentProjectRole, setCurrentProjectRole] = useState<ProjectRole>(() => {
    if (typeof window === 'undefined') return 'viewer';
    return (localStorage.getItem('devProjectRole') as ProjectRole) || 'viewer';
  });

  // Bump this value to force consumers to re-render after permissions are saved.
  const [permissionsVersion, setPermissionsVersion] = useState(0);

  const effectiveUserOrgRole = useMemo(() => mapDatabaseRole(userRole), [userRole]);

  // Persist dev mode state to localStorage
  useEffect(() => {
    localStorage.setItem('devMode', isDevMode.toString());
    localStorage.setItem('devOrgRole', devOrgRole);
    localStorage.setItem('devProjectRole', currentProjectRole);
  }, [isDevMode, devOrgRole, currentProjectRole]);

  // Re-render permission consumers when permissions are saved (same tab) or changed (other tabs)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const bump = () => setPermissionsVersion((v) => v + 1);

    const onStorage = (e: StorageEvent) => {
      if (e.key === ORG_PERMISSIONS_KEY || e.key === PROJECT_PERMISSIONS_KEY) bump();
    };

    window.addEventListener('lovable:permissions-updated', bump);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('lovable:permissions-updated', bump);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const setDevMode = (enabled: boolean) => {
    // Turning dev mode OFF should always snap back to the real role.
    if (!enabled) {
      setIsDevMode(false);
      setDevOrgRole(effectiveUserOrgRole);
      setCurrentProjectRole('viewer');
      return;
    }

    // Turning dev mode ON starts from the real role for a predictable baseline.
    setDevOrgRole(effectiveUserOrgRole);
    setIsDevMode(true);
    setPermissionsVersion((v) => v + 1);
  };

  // If dev mode is enabled and the dev UI is likely hidden (mobile / small screen), disable it.
  // This directly addresses "my permissions didn't go back once I hid dev mode".
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mq = window.matchMedia('(min-width: 1024px)');

    const sync = () => {
      if (!mq.matches && isDevMode) {
        setDevMode(false);
      }
    };

    sync();

    // Safari < 14 fallback
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const add = (mq as any).addEventListener ? 'addEventListener' : 'addListener';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const remove = (mq as any).removeEventListener ? 'removeEventListener' : 'removeListener';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mq as any)[add]('change', sync);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return () => (mq as any)[remove]('change', sync);
  }, [isDevMode, effectiveUserOrgRole]);

  // Use dev role in dev mode, otherwise use actual role from auth
  const currentOrgRole = isDevMode ? devOrgRole : effectiveUserOrgRole;

  const setCurrentOrgRole = (role: OrgRole) => {
    if (isDevMode) setDevOrgRole(role);
  };

  // Get saved permissions from localStorage or fall back to defaults
  const getSavedOrgPermissions = (): Record<string, string[]> => {
    if (typeof window === 'undefined') return defaultOrgRolePermissions;
    const saved = localStorage.getItem(ORG_PERMISSIONS_KEY);
    if (!saved) return defaultOrgRolePermissions;

    try {
      const parsed = JSON.parse(saved) as Record<string, string[]>;
      // Ensure we always have a full baseline so missing roles don't break checks.
      return { ...defaultOrgRolePermissions, ...parsed };
    } catch {
      return defaultOrgRolePermissions;
    }
  };

  const getSavedProjectPermissions = (): Record<string, string[]> => {
    if (typeof window === 'undefined') return defaultProjectRolePermissions;
    const saved = localStorage.getItem(PROJECT_PERMISSIONS_KEY);
    if (!saved) return defaultProjectRolePermissions;

    try {
      const parsed = JSON.parse(saved) as Record<string, string[]>;
      return { ...defaultProjectRolePermissions, ...parsed };
    } catch {
      return defaultProjectRolePermissions;
    }
  };

  const hasOrgPermission = (permission: string) => {
    // Depend on permissionsVersion so changes apply immediately after saving.
    void permissionsVersion;
    const permissions = getSavedOrgPermissions();
    return permissions[currentOrgRole]?.includes(permission) ?? false;
  };

  const hasProjectPermission = (permission: string) => {
    void permissionsVersion;
    const permissions = getSavedProjectPermissions();
    return permissions[currentProjectRole]?.includes(permission) ?? false;
  };

  const permissionContext: PermissionContext = {
    orgRole: currentOrgRole,
    projectRole: currentProjectRole,
  };

  const canManageOrg = domainCanManageOrg(permissionContext);
  const canManageProjects = domainCanManageProjects(permissionContext);

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

