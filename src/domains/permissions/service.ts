// Permissions domain: centralized permission checks and role-based policies live here. Do not include UI or API calls.
// Functions in this module were extracted from src/contexts/PermissionsContext.tsx and src/lib/assignmentUtils.ts.

import type {
  OrgRole,
  ProjectRole,
  ProgramRole,
  PortfolioRole,
  PermissionContext,
} from './types';
import {
  defaultOrgRolePermissions,
  defaultProjectRolePermissions,
  defaultProgramRolePermissions,
  defaultPortfolioRolePermissions,
} from './types';

/**
 * Map a raw database role string to a safe OrgRole value.
 * Extracted from src/contexts/PermissionsContext.tsx (mapDatabaseRole).
 */
export function mapDatabaseRole(role: string | null): OrgRole {
  if (!role) return 'viewer';
  const validRoles: OrgRole[] = ['owner', 'admin', 'manager', 'member', 'viewer'];
  return validRoles.includes(role as OrgRole) ? (role as OrgRole) : 'viewer';
}

/**
 * Check whether the current context can manage organization-level settings.
 * Extracted from src/contexts/PermissionsContext.tsx (canManageOrg).
 */
export function canManageOrg(ctx: PermissionContext): boolean {
  return ctx.orgRole === 'owner' || ctx.orgRole === 'admin';
}

/**
 * Check whether the current context can manage projects.
 * Extracted from src/contexts/PermissionsContext.tsx (canManageProjects).
 */
export function canManageProjects(ctx: PermissionContext): boolean {
  return ctx.orgRole !== 'viewer' && ctx.projectRole !== 'viewer';
}

/**
 * Check if a user can decline an assignment based on their role and level.
 * Extracted from src/lib/assignmentUtils.ts (canDeclineAssignment).
 */
export function canDeclineAssignment(
  role: OrgRole | ProjectRole | ProgramRole | PortfolioRole,
  level: 'org' | 'project' | 'program' | 'portfolio'
): boolean {
  const permissionKey = 'decline_assignment';

  switch (level) {
    case 'org':
      return defaultOrgRolePermissions[role as OrgRole]?.includes(permissionKey) ?? false;
    case 'project':
      return defaultProjectRolePermissions[role as ProjectRole]?.includes(permissionKey) ?? false;
    case 'program':
      return defaultProgramRolePermissions[role as ProgramRole]?.includes(permissionKey) ?? false;
    case 'portfolio':
      return defaultPortfolioRolePermissions[role as PortfolioRole]?.includes(permissionKey) ?? false;
    default:
      return false;
  }
}

/**
 * Determine whether a user can manage a given task based on org/project roles and assignment.
 * Extracted from src/pages/Tasks.tsx (canManageTask).
 */
export function canManageTaskForUser(params: {
  orgRole: OrgRole;
  projectRole: ProjectRole;
  currentTeamMemberId?: string;
  taskAssigneeId?: string | null;
}): boolean {
  const { orgRole, projectRole, currentTeamMemberId, taskAssigneeId } = params;

  // User can always manage tasks assigned to them (when we can map them to a team member)
  if (currentTeamMemberId && taskAssigneeId === currentTeamMemberId) return true;

  // Project managers and org managers/admins can manage all tasks
  if (projectRole === 'project-manager') return true;
  if (['owner', 'admin', 'manager'].includes(orgRole)) return true;

  return false;
}

/**
 * Determine whether the current org user can manage organization members.
 * Extracted from src/components/settings/OrgMembersSettings.tsx (canManageMembers).
 */
export function canManageOrgMembers(userRole: OrgRole): boolean {
  return userRole === 'owner' || userRole === 'admin';
}



