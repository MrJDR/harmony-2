import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ChevronDown,
  ChevronRight,
  Check,
  Plus,
  Trash2,
  Building2,
  Briefcase,
  Layers,
  FolderKanban,
  Search,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  OrgRole,
  PortfolioRole,
  ProgramRole,
  ProjectRole,
  Permission,
  orgPermissions,
  portfolioPermissions,
  programPermissions,
  projectPermissions,
  defaultOrgRolePermissions,
  defaultPortfolioRolePermissions,
  defaultProgramRolePermissions,
  defaultProjectRolePermissions,
} from '@/types/permissions';
import { usePermissions } from '@/contexts/PermissionsContext';
import { toast } from 'sonner';

// Storage keys
const STORAGE_KEYS = {
  org: { permissions: 'org_role_permissions', roles: 'org_custom_roles' },
  portfolio: { permissions: 'portfolio_role_permissions', roles: 'portfolio_custom_roles' },
  program: { permissions: 'program_role_permissions', roles: 'program_custom_roles' },
  project: { permissions: 'project_role_permissions', roles: 'project_custom_roles' },
} as const;

type RoleLevel = 'org' | 'portfolio' | 'program' | 'project';

interface CustomRole {
  role: string;
  label: string;
  description: string;
  level: RoleLevel;
  isCustom: true;
}

interface DefaultRole {
  role: string;
  label: string;
  description: string;
  level: RoleLevel;
  isCustom?: false;
  isProtected?: boolean; // Owner, portfolio-manager, program-manager, project-manager
}

type RoleInfo = DefaultRole | CustomRole;

const levelConfig: Record<RoleLevel, { icon: React.ElementType; label: string; color: string }> = {
  org: { icon: Building2, label: 'Organization', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  portfolio: { icon: Briefcase, label: 'Portfolio', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  program: { icon: Layers, label: 'Program', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  project: { icon: FolderKanban, label: 'Project', color: 'bg-teal-500/10 text-teal-600 border-teal-500/20' },
};

const allPermissions: Record<RoleLevel, Permission[]> = {
  org: orgPermissions,
  portfolio: portfolioPermissions,
  program: programPermissions,
  project: projectPermissions,
};

const defaultRoles: DefaultRole[] = [
  // Org roles
  { role: 'owner', label: 'Owner', description: 'Full access to everything', level: 'org', isProtected: true },
  { role: 'admin', label: 'Admin', description: 'Manage organization settings and members', level: 'org' },
  { role: 'manager', label: 'Manager', description: 'Create and manage projects', level: 'org' },
  { role: 'member', label: 'Member', description: 'Participate in projects', level: 'org' },
  { role: 'viewer', label: 'Viewer', description: 'View-only access', level: 'org' },
  // Portfolio roles
  { role: 'portfolio-manager', label: 'Portfolio Manager', description: 'Full portfolio control', level: 'portfolio', isProtected: true },
  { role: 'program-lead', label: 'Program Lead', description: 'Can manage programs within the portfolio', level: 'portfolio' },
  { role: 'portfolio-contributor', label: 'Contributor', description: 'Can contribute to portfolio activities', level: 'portfolio' },
  { role: 'portfolio-viewer', label: 'Viewer', description: 'View-only access to portfolio', level: 'portfolio' },
  // Program roles
  { role: 'program-manager', label: 'Program Manager', description: 'Full program control', level: 'program', isProtected: true },
  { role: 'project-lead', label: 'Project Lead', description: 'Can manage projects within the program', level: 'program' },
  { role: 'program-contributor', label: 'Contributor', description: 'Can contribute to program activities', level: 'program' },
  { role: 'program-viewer', label: 'Viewer', description: 'View-only access to program', level: 'program' },
  // Project roles
  { role: 'project-manager', label: 'Project Manager', description: 'Full project control', level: 'project', isProtected: true },
  { role: 'contributor', label: 'Contributor', description: 'Can create and manage tasks', level: 'project' },
  { role: 'project-viewer', label: 'Viewer', description: 'View-only access to project', level: 'project' },
];

// Map the old role keys to new storage format
const getDefaultPermissionsForLevel = (level: RoleLevel): Record<string, string[]> => {
  switch (level) {
    case 'org':
      return defaultOrgRolePermissions;
    case 'portfolio':
      return {
        'portfolio-manager': defaultPortfolioRolePermissions['portfolio-manager'],
        'program-lead': defaultPortfolioRolePermissions['program-lead'],
        'portfolio-contributor': defaultPortfolioRolePermissions['contributor'],
        'portfolio-viewer': defaultPortfolioRolePermissions['viewer'],
      };
    case 'program':
      return {
        'program-manager': defaultProgramRolePermissions['program-manager'],
        'project-lead': defaultProgramRolePermissions['project-lead'],
        'program-contributor': defaultProgramRolePermissions['contributor'],
        'program-viewer': defaultProgramRolePermissions['viewer'],
      };
    case 'project':
      return {
        'project-manager': defaultProjectRolePermissions['project-manager'],
        'contributor': defaultProjectRolePermissions['contributor'],
        'project-viewer': defaultProjectRolePermissions['viewer'],
      };
  }
};

const loadPermissions = (level: RoleLevel): Record<string, string[]> => {
  const saved = localStorage.getItem(STORAGE_KEYS[level].permissions);
  if (saved) {
    try {
      return { ...getDefaultPermissionsForLevel(level), ...JSON.parse(saved) };
    } catch {
      return getDefaultPermissionsForLevel(level);
    }
  }
  return getDefaultPermissionsForLevel(level);
};

const loadCustomRoles = (level: RoleLevel): CustomRole[] => {
  const saved = localStorage.getItem(STORAGE_KEYS[level].roles);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [];
};

export function UnifiedRolesManager() {
  const { hasOrgPermission } = usePermissions();

  // Unified state
  const [permissions, setPermissions] = useState<Record<RoleLevel, Record<string, string[]>>>({
    org: loadPermissions('org'),
    portfolio: loadPermissions('portfolio'),
    program: loadPermissions('program'),
    project: loadPermissions('project'),
  });

  const [customRoles, setCustomRoles] = useState<CustomRole[]>(() => {
    return [
      ...loadCustomRoles('org'),
      ...loadCustomRoles('portfolio'),
      ...loadCustomRoles('program'),
      ...loadCustomRoles('project'),
    ];
  });

  const [openRoles, setOpenRoles] = useState<string[]>([]);
  const [filterLevel, setFilterLevel] = useState<RoleLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // New role modal
  const [showNewRoleModal, setShowNewRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRoleLevel, setNewRoleLevel] = useState<RoleLevel>('org');
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>([]);

  // Permission to create roles
  const canCreateAllRoles = hasOrgPermission('create_roles');
  const canCreateOrgRoles = canCreateAllRoles || hasOrgPermission('create_org_roles');
  const canCreatePortfolioRoles = canCreateAllRoles || hasOrgPermission('create_portfolio_roles');
  const canCreateProgramRoles = canCreateAllRoles || hasOrgPermission('create_program_roles');
  const canCreateProjectRoles = canCreateAllRoles || hasOrgPermission('create_project_roles');

  const canCreateRoles = canCreateOrgRoles || canCreatePortfolioRoles || canCreateProgramRoles || canCreateProjectRoles;

  const canCreateRoleForLevel = (level: RoleLevel): boolean => {
    switch (level) {
      case 'org': return canCreateOrgRoles;
      case 'portfolio': return canCreatePortfolioRoles;
      case 'program': return canCreateProgramRoles;
      case 'project': return canCreateProjectRoles;
    }
  };

  // Combine default and custom roles
  const allRoles: RoleInfo[] = useMemo(() => {
    return [...defaultRoles, ...customRoles];
  }, [customRoles]);

  // Filter roles
  const filteredRoles = useMemo(() => {
    return allRoles.filter((role) => {
      const matchesLevel = filterLevel === 'all' || role.level === filterLevel;
      const matchesSearch =
        !searchQuery ||
        role.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesLevel && matchesSearch;
    });
  }, [allRoles, filterLevel, searchQuery]);

  // Group roles by level
  const groupedRoles = useMemo(() => {
    const groups: Record<RoleLevel, RoleInfo[]> = {
      org: [],
      portfolio: [],
      program: [],
      project: [],
    };
    filteredRoles.forEach((role) => {
      groups[role.level].push(role);
    });
    return groups;
  }, [filteredRoles]);

  const toggleRole = (roleId: string) => {
    setOpenRoles((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]
    );
  };

  const togglePermission = (level: RoleLevel, role: string, permissionKey: string) => {
    setPermissions((prev) => {
      const levelPerms = { ...prev[level] };
      const rolePerms = levelPerms[role] || [];

      if (rolePerms.includes(permissionKey)) {
        levelPerms[role] = rolePerms.filter((p) => p !== permissionKey);
      } else {
        levelPerms[role] = [...rolePerms, permissionKey];
      }

      return { ...prev, [level]: levelPerms };
    });
    setHasUnsavedChanges(true);
  };

  const handleSaveChanges = () => {
    // Save each level separately
    (['org', 'portfolio', 'program', 'project'] as RoleLevel[]).forEach((level) => {
      localStorage.setItem(STORAGE_KEYS[level].permissions, JSON.stringify(permissions[level]));

      const levelCustomRoles = customRoles.filter((r) => r.level === level);
      localStorage.setItem(STORAGE_KEYS[level].roles, JSON.stringify(levelCustomRoles));
    });

    window.dispatchEvent(new Event('lovable:permissions-updated'));
    setHasUnsavedChanges(false);
    toast.success('All role permissions saved successfully');
  };

  const handleCreateRole = () => {
    if (!newRoleName.trim()) return;

    const roleId = newRoleName.toLowerCase().replace(/\s+/g, '-');

    // Check if role already exists
    if (allRoles.some((r) => r.role === roleId)) {
      toast.error('A role with this name already exists');
      return;
    }

    const newRole: CustomRole = {
      role: roleId,
      label: newRoleName,
      description: newRoleDescription,
      level: newRoleLevel,
      isCustom: true,
    };

    setCustomRoles((prev) => [...prev, newRole]);
    setPermissions((prev) => ({
      ...prev,
      [newRoleLevel]: {
        ...prev[newRoleLevel],
        [roleId]: newRolePermissions,
      },
    }));

    setHasUnsavedChanges(true);
    toast.success(`Role "${newRoleName}" created successfully`);

    // Reset modal
    setNewRoleName('');
    setNewRoleDescription('');
    setNewRolePermissions([]);
    setShowNewRoleModal(false);
  };

  const handleDeleteRole = (roleId: string, level: RoleLevel) => {
    setCustomRoles((prev) => prev.filter((r) => r.role !== roleId));
    setPermissions((prev) => {
      const levelPerms = { ...prev[level] };
      delete levelPerms[roleId];
      return { ...prev, [level]: levelPerms };
    });
    setHasUnsavedChanges(true);
    toast.success('Role deleted successfully');
  };

  const toggleNewRolePermission = (permissionKey: string) => {
    setNewRolePermissions((prev) =>
      prev.includes(permissionKey) ? prev.filter((p) => p !== permissionKey) : [...prev, permissionKey]
    );
  };

  const getRolePermissions = (role: RoleInfo): string[] => {
    return permissions[role.level][role.role] || [];
  };

  const renderRoleGroup = (level: RoleLevel, roles: RoleInfo[]) => {
    if (roles.length === 0) return null;

    const config = levelConfig[level];
    const Icon = config.icon;

    return (
      <div key={level} className="space-y-3">
        <div className="flex items-center gap-2 py-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm text-foreground">{config.label} Roles</span>
          <Badge variant="outline" className={config.color}>
            {roles.length} roles
          </Badge>
        </div>

        {roles.map((roleInfo, index) => {
          const rolePerms = getRolePermissions(roleInfo);
          const isOpen = openRoles.includes(roleInfo.role);
          const isProtected = 'isProtected' in roleInfo && roleInfo.isProtected;

          return (
            <motion.div
              key={roleInfo.role}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Collapsible open={isOpen} onOpenChange={() => toggleRole(roleInfo.role)}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground">{roleInfo.label}</span>
                          <Badge variant="outline" className={config.color}>
                            {rolePerms.length} permissions
                          </Badge>
                          {roleInfo.isCustom && (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                              Custom
                            </Badge>
                          )}
                          {isProtected && (
                            <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">
                              Protected
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{roleInfo.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {roleInfo.isCustom && canCreateRoleForLevel(roleInfo.level) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRole(roleInfo.role, roleInfo.level);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 p-4 rounded-lg border border-border bg-muted space-y-3">
                    {allPermissions[roleInfo.level].map((permission) => {
                      const isEnabled = rolePerms.includes(permission.key);

                      return (
                        <div key={permission.id} className="flex items-center justify-between py-2">
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-6 w-6 rounded flex items-center justify-center ${
                                isEnabled ? 'bg-primary/10' : 'bg-background'
                              }`}
                            >
                              {isEnabled && <Check className="h-4 w-4 text-primary" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{permission.label}</p>
                              <p className="text-xs text-muted-foreground">{permission.description}</p>
                            </div>
                          </div>
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={() => togglePermission(roleInfo.level, roleInfo.role, permission.key)}
                            disabled={isProtected}
                          />
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">Role Management</h3>
            <p className="text-sm text-muted-foreground">
              Manage all roles and permissions across your organization
            </p>
          </div>
        </div>
        {canCreateRoles && (
          <Button onClick={() => setShowNewRoleModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Role
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterLevel} onValueChange={(v) => setFilterLevel(v as RoleLevel | 'all')}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="org">Organization</SelectItem>
            <SelectItem value="portfolio">Portfolio</SelectItem>
            <SelectItem value="program">Program</SelectItem>
            <SelectItem value="project">Project</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Role Groups */}
      <div className="space-y-6">
        {filterLevel === 'all' ? (
          <>
            {renderRoleGroup('org', groupedRoles.org)}
            {groupedRoles.org.length > 0 && groupedRoles.portfolio.length > 0 && <Separator />}
            {renderRoleGroup('portfolio', groupedRoles.portfolio)}
            {groupedRoles.portfolio.length > 0 && groupedRoles.program.length > 0 && <Separator />}
            {renderRoleGroup('program', groupedRoles.program)}
            {groupedRoles.program.length > 0 && groupedRoles.project.length > 0 && <Separator />}
            {renderRoleGroup('project', groupedRoles.project)}
          </>
        ) : (
          renderRoleGroup(filterLevel, groupedRoles[filterLevel])
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 gap-2 border-t border-border">
        {hasUnsavedChanges && (
          <span className="text-sm text-muted-foreground self-center">Unsaved changes</span>
        )}
        <Button onClick={handleSaveChanges} disabled={!hasUnsavedChanges}>
          Save All Changes
        </Button>
      </div>

      {/* New Role Modal */}
      <Dialog open={showNewRoleModal} onOpenChange={setShowNewRoleModal}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Create New Role
            </DialogTitle>
            <DialogDescription>
              Create a custom role with specific permissions. This role can be assigned to team members.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 flex-1 overflow-hidden flex flex-col">
            {/* Role Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Role Name</label>
              <Input
                placeholder="e.g., Team Lead, Approver, Analyst"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
              />
            </div>

            {/* Role Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea
                placeholder="Describe what this role is responsible for..."
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Role Level */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Role Level</label>
              <Select
                value={newRoleLevel}
                onValueChange={(v) => {
                  setNewRoleLevel(v as RoleLevel);
                  setNewRolePermissions([]);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {canCreateOrgRoles && <SelectItem value="org">Organization</SelectItem>}
                  {canCreatePortfolioRoles && <SelectItem value="portfolio">Portfolio</SelectItem>}
                  {canCreateProgramRoles && <SelectItem value="program">Program</SelectItem>}
                  {canCreateProjectRoles && <SelectItem value="project">Project</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            {/* Permissions Selection */}
            <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Permissions</label>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  {newRolePermissions.length} selected
                </Badge>
              </div>

              <ScrollArea className="flex-1 rounded-lg border border-border bg-muted p-3">
                <div className="space-y-2">
                  {allPermissions[newRoleLevel].map((permission) => {
                    const isSelected = newRolePermissions.includes(permission.key);

                    return (
                      <div
                        key={permission.id}
                        className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-accent transition-colors"
                      >
                        <div className="flex-1 pr-4">
                          <p className="text-sm font-medium text-foreground">{permission.label}</p>
                          <p className="text-xs text-muted-foreground">{permission.description}</p>
                        </div>
                        <Switch checked={isSelected} onCheckedChange={() => toggleNewRolePermission(permission.key)} />
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewRoleModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRole} disabled={!newRoleName.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
