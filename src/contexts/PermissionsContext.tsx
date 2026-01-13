import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { OrgRole, ProjectRole } from '@/types/permissions';
import { defaultOrgRolePermissions, defaultProjectRolePermissions } from '@/types/permissions';
import { useAuth } from '@/contexts/AuthContext';

// Force rebuild v2

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

const mapDatabaseRole = (role: string | null): OrgRole => {
  if (!role) return 'viewer';
  const validRoles: OrgRole[] = ['owner', 'admin', 'manager', 'member', 'viewer'];
  return validRoles.includes(role as OrgRole) ? (role as OrgRole) : 'viewer';
};

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { userRole } = useAuth();

  // Dev mode is a UI testing feature only.
  // IMPORTANT: We intentionally auto-disable it in contexts where the dev UI is hidden
  // (e.g., small screens) so users cannot get "stuck" in a simulated role.
  const [isDevMode, setIsDevMode] = useState(false);
  const [devOrgRole, setDevOrgRole] = useState<OrgRole>('viewer');
  const [currentProjectRole, setCurrentProjectRole] = useState<ProjectRole>('viewer');

  const effectiveUserOrgRole = useMemo(() => mapDatabaseRole(userRole), [userRole]);

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

