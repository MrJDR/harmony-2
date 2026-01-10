import { useState } from 'react';
import { motion } from 'framer-motion';
import { FolderKanban, ChevronDown, ChevronRight, Check, UserCog, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ProjectRole,
  projectPermissions,
  defaultProjectRolePermissions,
} from '@/types/permissions';
import { AddRoleModal } from './AddRoleModal';
import { usePermissions } from '@/contexts/PermissionsContext';
import { usePortfolioData } from '@/contexts/PortfolioDataContext';
import { toast } from 'sonner';

interface CustomRole {
  role: string;
  label: string;
  description: string;
  isCustom: true;
}

type RoleInfo = { role: ProjectRole; label: string; description: string; isCustom?: false } | CustomRole;

const defaultProjectRoles: RoleInfo[] = [
  { role: 'project-manager', label: 'Project Manager', description: 'Full project control' },
  { role: 'contributor', label: 'Contributor', description: 'Can create and manage tasks' },
  { role: 'viewer', label: 'Viewer', description: 'View-only access to project' },
];

const roleColors: Record<string, string> = {
  'project-manager': 'bg-primary/10 text-primary border-primary/20',
  contributor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  viewer: 'bg-muted text-muted-foreground border-border',
  custom: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
};

export function ProjectPermissions() {
  const { hasOrgPermission } = usePermissions();
  const { projects } = usePortfolioData();
  const allProjects = projects;
  const [selectedProjectId, setSelectedProjectId] = useState(allProjects[0]?.id || '');
  const [openRoles, setOpenRoles] = useState<string[]>(['contributor']);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>(defaultProjectRolePermissions);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);

  const selectedProject = allProjects.find((p) => p.id === selectedProjectId);
  
  // Can create project roles if org-level permission
  const canCreateRoles = hasOrgPermission('create_project_roles');

  const allRoles: RoleInfo[] = [...defaultProjectRoles, ...customRoles];

  const toggleRole = (role: string) => {
    setOpenRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const togglePermission = (role: string, permissionKey: string) => {
    if (role === 'project-manager') return; // PM always has all permissions
    
    setRolePermissions((prev) => ({
      ...prev,
      [role]: (prev[role] || []).includes(permissionKey)
        ? (prev[role] || []).filter((p) => p !== permissionKey)
        : [...(prev[role] || []), permissionKey],
    }));
  };

  const handleAddRole = (newRole: { id: string; label: string; description: string; permissions: string[] }) => {
    const customRole: CustomRole = {
      role: newRole.id,
      label: newRole.label,
      description: newRole.description,
      isCustom: true,
    };
    setCustomRoles((prev) => [...prev, customRole]);
    setRolePermissions((prev) => ({
      ...prev,
      [newRole.id]: newRole.permissions,
    }));
    toast.success(`Role "${newRole.label}" created successfully`);
  };

  const handleDeleteRole = (roleId: string) => {
    setCustomRoles((prev) => prev.filter((r) => r.role !== roleId));
    setRolePermissions((prev) => {
      const updated = { ...prev };
      delete updated[roleId];
      return updated;
    });
    toast.success('Role deleted successfully');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/50">
            <FolderKanban className="h-5 w-5 text-secondary-foreground" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">Project Permissions</h3>
            <p className="text-sm text-muted-foreground">
              Configure role permissions per project
            </p>
          </div>
        </div>
        {canCreateRoles && (
          <Button onClick={() => setShowAddRoleModal(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Role
          </Button>
        )}
      </div>

      {/* Project Selector */}
      <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-muted/30">
        <UserCog className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1">
          <label className="text-sm font-medium text-foreground">Select Project</label>
          <p className="text-xs text-muted-foreground">Choose a project to configure permissions</p>
        </div>
        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {allProjects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedProject && (
        <motion.div
          key={selectedProjectId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2 py-2">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              {selectedProject.name}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {selectedProject.teamIds.length} team members
            </span>
          </div>

          {allRoles.map((roleInfo, index) => (
            <motion.div
              key={roleInfo.role}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Collapsible
                open={openRoles.includes(roleInfo.role)}
                onOpenChange={() => toggleRole(roleInfo.role)}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      {openRoles.includes(roleInfo.role) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{roleInfo.label}</span>
                          <Badge variant="outline" className={roleInfo.isCustom ? roleColors.custom : roleColors[roleInfo.role] || roleColors.custom}>
                            {(rolePermissions[roleInfo.role] || []).length} permissions
                          </Badge>
                          {roleInfo.isCustom && (
                            <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">
                              Custom
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{roleInfo.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {roleInfo.isCustom && canCreateRoles && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRole(roleInfo.role);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 p-4 rounded-lg border border-border bg-muted/30 space-y-3">
                    {projectPermissions.map((permission) => {
                      const isEnabled = (rolePermissions[roleInfo.role] || []).includes(permission.key);
                      const isPM = roleInfo.role === 'project-manager';
                      
                      return (
                        <div
                          key={permission.id}
                          className="flex items-center justify-between py-2"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-6 w-6 rounded flex items-center justify-center ${isEnabled ? 'bg-primary/10' : 'bg-muted'}`}>
                              {isEnabled && <Check className="h-4 w-4 text-primary" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{permission.label}</p>
                              <p className="text-xs text-muted-foreground">{permission.description}</p>
                            </div>
                          </div>
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={() => togglePermission(roleInfo.role, permission.key)}
                            disabled={isPM}
                          />
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </motion.div>
          ))}
        </motion.div>
      )}

      <div className="flex justify-end pt-4">
        <Button>Save Project Permissions</Button>
      </div>

      <AddRoleModal
        open={showAddRoleModal}
        onOpenChange={setShowAddRoleModal}
        roleType="project"
        availablePermissions={projectPermissions}
        onAddRole={handleAddRole}
      />
    </div>
  );
}
