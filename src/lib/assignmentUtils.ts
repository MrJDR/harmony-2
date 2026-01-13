import type { OrgRole, ProjectRole, ProgramRole, PortfolioRole } from '@/types/permissions';
import { 
  defaultOrgRolePermissions, 
  defaultProjectRolePermissions, 
  defaultProgramRolePermissions, 
  defaultPortfolioRolePermissions 
} from '@/types/permissions';

export interface TeamMember {
  id: string;
  name: string;
  role?: string;
  workload?: number; // 0-100 percentage
  availability?: boolean;
}

export interface AssignmentResult {
  success: boolean;
  assignedTo?: TeamMember;
  reason?: string;
}

/**
 * Check if a user can decline an assignment based on their role
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
 * Find the next available team member to assign when someone declines
 * Prioritizes by: availability > lower workload > same role
 */
export function findNextAssignee(
  teamMembers: TeamMember[],
  excludeIds: string[],
  preferredRole?: string
): TeamMember | null {
  // Filter out excluded members and unavailable ones
  const availableMembers = teamMembers.filter(
    member => !excludeIds.includes(member.id) && member.availability !== false
  );

  if (availableMembers.length === 0) {
    return null;
  }

  // Sort by workload (lower is better) and role match
  const sorted = [...availableMembers].sort((a, b) => {
    // Prefer same role
    if (preferredRole) {
      const aRoleMatch = a.role === preferredRole ? 0 : 1;
      const bRoleMatch = b.role === preferredRole ? 0 : 1;
      if (aRoleMatch !== bRoleMatch) return aRoleMatch - bRoleMatch;
    }
    
    // Then by workload
    const aWorkload = a.workload ?? 50;
    const bWorkload = b.workload ?? 50;
    return aWorkload - bWorkload;
  });

  return sorted[0] || null;
}

/**
 * Handle assignment decline and auto-reassign
 */
export function handleAssignmentDecline(
  declinedById: string,
  teamMembers: TeamMember[],
  previousDecliners: string[] = [],
  preferredRole?: string
): AssignmentResult {
  const allExcluded = [...previousDecliners, declinedById];
  const nextAssignee = findNextAssignee(teamMembers, allExcluded, preferredRole);

  if (!nextAssignee) {
    return {
      success: false,
      reason: 'No available team members to reassign',
    };
  }

  return {
    success: true,
    assignedTo: nextAssignee,
  };
}

/**
 * Get reassignment options for a declined assignment
 */
export function getReassignmentOptions(
  teamMembers: TeamMember[],
  excludeIds: string[],
  limit: number = 5
): TeamMember[] {
  const availableMembers = teamMembers.filter(
    member => !excludeIds.includes(member.id) && member.availability !== false
  );

  // Sort by workload
  return [...availableMembers]
    .sort((a, b) => (a.workload ?? 50) - (b.workload ?? 50))
    .slice(0, limit);
}
