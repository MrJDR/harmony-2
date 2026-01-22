import { ReactNode } from 'react';
import { usePermissions } from '@/contexts/PermissionsContext';
import { useAuth } from '@/contexts/AuthContext';
import { OrgRole, ProjectRole } from '@/types/permissions';

interface PermissionGateProps {
  children: ReactNode;
  /** Org roles that can see this content */
  allowedOrgRoles?: OrgRole[];
  /** Project roles that can see this content */
  allowedProjectRoles?: ProjectRole[];
  /** Specific org permission required */
  orgPermission?: string;
  /** Specific project permission required */
  projectPermission?: string;
  /** Fallback content when access denied */
  fallback?: ReactNode;
  /** 
   * Use the real database role instead of dev mode role.
   * IMPORTANT: Use this for destructive actions like delete, 
   * security-sensitive features, and admin-only functionality.
   */
  useRealRole?: boolean;
}

export function PermissionGate({
  children,
  allowedOrgRoles,
  allowedProjectRoles,
  orgPermission,
  projectPermission,
  fallback = null,
  useRealRole = false,
}: PermissionGateProps) {
  const { currentOrgRole, currentProjectRole, hasOrgPermission, hasProjectPermission } = usePermissions();
  const { userRole } = useAuth();

  // For critical actions, always use the real database role, not dev mode
  const effectiveOrgRole: OrgRole = useRealRole 
    ? (userRole as OrgRole || 'viewer') 
    : currentOrgRole;

  // Check org role
  if (allowedOrgRoles && !allowedOrgRoles.includes(effectiveOrgRole)) {
    return <>{fallback}</>;
  }

  // Check project role (project roles don't have a "real" equivalent in auth context)
  if (allowedProjectRoles && !allowedProjectRoles.includes(currentProjectRole)) {
    return <>{fallback}</>;
  }

  // Check specific org permission
  if (orgPermission && !hasOrgPermission(orgPermission)) {
    return <>{fallback}</>;
  }

  // Check specific project permission
  if (projectPermission && !hasProjectPermission(projectPermission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
