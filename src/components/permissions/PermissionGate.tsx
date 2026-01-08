import { ReactNode } from 'react';
import { usePermissions } from '@/contexts/PermissionsContext';
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
}

export function PermissionGate({
  children,
  allowedOrgRoles,
  allowedProjectRoles,
  orgPermission,
  projectPermission,
  fallback = null,
}: PermissionGateProps) {
  const { currentOrgRole, currentProjectRole, hasOrgPermission, hasProjectPermission } = usePermissions();

  // Check org role
  if (allowedOrgRoles && !allowedOrgRoles.includes(currentOrgRole)) {
    return <>{fallback}</>;
  }

  // Check project role
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
