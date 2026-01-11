import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ChevronDown, ChevronRight, Check, Users, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  OrgRole,
  orgPermissions,
  defaultOrgRolePermissions,
} from '@/types/permissions';
import { AddRoleModal } from './AddRoleModal';
import { usePermissions } from '@/contexts/PermissionsContext';
import { toast } from 'sonner';

interface CustomRole {
  role: string;
  label: string;
  description: string;
  isCustom: true;
}

type RoleInfo = { role: OrgRole; label: string; description: string; isCustom?: false } | CustomRole;

const defaultOrgRoles: RoleInfo[] = [
  { role: 'owner', label: 'Owner', description: 'Full access to everything' },
  { role: 'admin', label: 'Admin', description: 'Manage organization settings and members' },
  { role: 'manager', label: 'Manager', description: 'Create and manage projects' },
  { role: 'member', label: 'Member', description: 'Participate in projects' },
  { role: 'viewer', label: 'Viewer', description: 'View-only access' },
];

const roleColors: Record<string, string> = {
  owner: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  admin: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  manager: 'bg-primary/10 text-primary border-primary/20',
  member: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  viewer: 'bg-muted text-muted-foreground border-border',
  custom: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
};

export function OrgPermissions() {
  const { hasOrgPermission } = usePermissions();
  const [openRoles, setOpenRoles] = useState<string[]>(['admin']);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>(defaultOrgRolePermissions);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);

  const canCreateRoles = hasOrgPermission('create_org_roles');

  const allRoles: RoleInfo[] = [...defaultOrgRoles, ...customRoles];

  const toggleRole = (role: string) => {
    setOpenRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const togglePermission = (role: string, permissionKey: string) => {
    if (role === 'owner') return; // Owner always has all permissions
    
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">Organization Roles</h3>
            <p className="text-sm text-muted-foreground">
              Define what each role can do at the organization level
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

      <div className="space-y-3">
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
                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted cursor-pointer transition-colors">
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
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 p-4 rounded-lg border border-border bg-muted/30 space-y-3">
                  {orgPermissions.map((permission) => {
                    const isEnabled = (rolePermissions[roleInfo.role] || []).includes(permission.key);
                    const isOwner = roleInfo.role === 'owner';
                    
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
                          disabled={isOwner}
                        />
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <Button>Save Changes</Button>
      </div>

      <AddRoleModal
        open={showAddRoleModal}
        onOpenChange={setShowAddRoleModal}
        roleType="organization"
        availablePermissions={orgPermissions}
        onAddRole={handleAddRole}
      />
    </div>
  );
}
