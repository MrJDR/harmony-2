export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer';
export type ProjectRole = 'project-manager' | 'team-lead' | 'contributor' | 'viewer';

export const defaultOrgRolePermissions: Record<OrgRole, string[]> = {
  owner: [
    'manage-org',
    'manage-billing',
    'manage-members',
    'create-projects',
    'delete-projects',
    'view-all-projects',
    'manage-settings',
  ],
  admin: [
    'manage-members',
    'create-projects',
    'delete-projects',
    'view-all-projects',
    'manage-settings',
  ],
  member: [
    'create-projects',
    'view-all-projects',
  ],
  viewer: [
    'view-all-projects',
  ],
};

export const defaultProjectRolePermissions: Record<ProjectRole, string[]> = {
  'project-manager': [
    'manage-project',
    'manage-tasks',
    'manage-team',
    'view-project',
    'create-tasks',
    'edit-tasks',
    'delete-tasks',
    'assign-tasks',
  ],
  'team-lead': [
    'manage-tasks',
    'view-project',
    'create-tasks',
    'edit-tasks',
    'assign-tasks',
  ],
  contributor: [
    'view-project',
    'create-tasks',
    'edit-tasks',
  ],
  viewer: [
    'view-project',
  ],
};
