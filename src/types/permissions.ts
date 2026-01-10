export type OrgRole = 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
export type PortfolioRole = 'portfolio-manager' | 'program-lead' | 'contributor' | 'viewer';
export type ProgramRole = 'program-manager' | 'project-lead' | 'contributor' | 'viewer';
export type ProjectRole = 'project-manager' | 'contributor' | 'viewer';

export interface Permission {
  id: string;
  key: string;
  label: string;
  description: string;
}

export interface RolePermissions {
  role: OrgRole | PortfolioRole | ProgramRole | ProjectRole;
  permissions: string[];
}

export interface UserWithRole {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: OrgRole | PortfolioRole | ProgramRole | ProjectRole;
}

export interface ProjectPermissions {
  projectId: string;
  projectName: string;
  members: UserWithRole[];
}

export const orgPermissions: Permission[] = [
  { id: 'org-1', key: 'manage_members', label: 'Manage Members', description: 'Add, remove, and update organization members' },
  { id: 'org-2', key: 'manage_roles', label: 'Manage Roles', description: 'Assign and modify member roles' },
  { id: 'org-3', key: 'manage_billing', label: 'Manage Billing', description: 'Access billing and subscription settings' },
  { id: 'org-4', key: 'create_projects', label: 'Create Projects', description: 'Create new projects and programs' },
  { id: 'org-5', key: 'delete_projects', label: 'Delete Projects', description: 'Permanently delete projects' },
  { id: 'org-6', key: 'view_analytics', label: 'View Analytics', description: 'Access organization-wide analytics' },
  { id: 'org-7', key: 'manage_integrations', label: 'Manage Integrations', description: 'Configure third-party integrations' },
  { id: 'org-8', key: 'export_data', label: 'Export Data', description: 'Export organization data' },
  { id: 'org-9', key: 'create_org_roles', label: 'Create Org Roles', description: 'Create new organization-level roles' },
  { id: 'org-10', key: 'create_portfolio_roles', label: 'Create Portfolio Roles', description: 'Create new portfolio-level roles' },
  { id: 'org-11', key: 'create_program_roles', label: 'Create Program Roles', description: 'Create new program-level roles' },
  { id: 'org-12', key: 'create_project_roles', label: 'Create Project Roles', description: 'Create new project-level roles' },
];

export const portfolioPermissions: Permission[] = [
  { id: 'port-1', key: 'manage_programs', label: 'Manage Programs', description: 'Create, edit, and delete programs' },
  { id: 'port-2', key: 'manage_members', label: 'Manage Members', description: 'Add or remove portfolio members' },
  { id: 'port-3', key: 'edit_settings', label: 'Edit Settings', description: 'Modify portfolio settings' },
  { id: 'port-4', key: 'view_reports', label: 'View Reports', description: 'Access portfolio reports and metrics' },
  { id: 'port-5', key: 'manage_budget', label: 'Manage Budget', description: 'Allocate and track portfolio budget' },
  { id: 'port-6', key: 'approve_projects', label: 'Approve Projects', description: 'Approve new project requests' },
  { id: 'port-7', key: 'create_portfolio_roles', label: 'Create Portfolio Roles', description: 'Create new portfolio-level roles' },
];

export const programPermissions: Permission[] = [
  { id: 'prog-1', key: 'manage_projects', label: 'Manage Projects', description: 'Create, edit, and delete projects' },
  { id: 'prog-2', key: 'manage_members', label: 'Manage Members', description: 'Add or remove program members' },
  { id: 'prog-3', key: 'edit_settings', label: 'Edit Settings', description: 'Modify program settings' },
  { id: 'prog-4', key: 'view_reports', label: 'View Reports', description: 'Access program reports and metrics' },
  { id: 'prog-5', key: 'manage_resources', label: 'Manage Resources', description: 'Allocate resources across projects' },
  { id: 'prog-6', key: 'manage_timeline', label: 'Manage Timeline', description: 'Set program milestones and deadlines' },
  { id: 'prog-7', key: 'create_program_roles', label: 'Create Program Roles', description: 'Create new program-level roles' },
];

export const projectPermissions: Permission[] = [
  { id: 'proj-1', key: 'manage_tasks', label: 'Manage Tasks', description: 'Create, edit, and delete tasks' },
  { id: 'proj-2', key: 'assign_tasks', label: 'Assign Tasks', description: 'Assign tasks to team members' },
  { id: 'proj-3', key: 'manage_members', label: 'Manage Members', description: 'Add or remove project members' },
  { id: 'proj-4', key: 'edit_settings', label: 'Edit Settings', description: 'Modify project settings' },
  { id: 'proj-5', key: 'view_reports', label: 'View Reports', description: 'Access project reports and metrics' },
  { id: 'proj-6', key: 'manage_files', label: 'Manage Files', description: 'Upload, edit, and delete files' },
  { id: 'proj-7', key: 'comment', label: 'Comment', description: 'Add comments to tasks and discussions' },
  { id: 'proj-8', key: 'create_project_roles', label: 'Create Project Roles', description: 'Create new project-level roles' },
];

export const defaultOrgRolePermissions: Record<OrgRole, string[]> = {
  owner: ['manage_members', 'manage_roles', 'manage_billing', 'create_projects', 'delete_projects', 'view_analytics', 'manage_integrations', 'export_data', 'create_org_roles', 'create_portfolio_roles', 'create_program_roles', 'create_project_roles'],
  admin: ['manage_members', 'manage_roles', 'create_projects', 'delete_projects', 'view_analytics', 'manage_integrations', 'export_data', 'create_portfolio_roles', 'create_program_roles', 'create_project_roles'],
  manager: ['create_projects', 'view_analytics', 'export_data'],
  member: ['view_analytics'],
  viewer: [],
};

export const defaultPortfolioRolePermissions: Record<PortfolioRole, string[]> = {
  'portfolio-manager': ['manage_programs', 'manage_members', 'edit_settings', 'view_reports', 'manage_budget', 'approve_projects', 'create_portfolio_roles'],
  'program-lead': ['manage_programs', 'view_reports', 'manage_budget'],
  contributor: ['view_reports'],
  viewer: ['view_reports'],
};

export const defaultProgramRolePermissions: Record<ProgramRole, string[]> = {
  'program-manager': ['manage_projects', 'manage_members', 'edit_settings', 'view_reports', 'manage_resources', 'manage_timeline', 'create_program_roles'],
  'project-lead': ['manage_projects', 'view_reports', 'manage_resources'],
  contributor: ['view_reports'],
  viewer: ['view_reports'],
};

export const defaultProjectRolePermissions: Record<ProjectRole, string[]> = {
  'project-manager': ['manage_tasks', 'assign_tasks', 'manage_members', 'edit_settings', 'view_reports', 'manage_files', 'comment', 'create_project_roles'],
  contributor: ['manage_tasks', 'assign_tasks', 'view_reports', 'manage_files', 'comment'],
  viewer: ['view_reports', 'comment'],
};
