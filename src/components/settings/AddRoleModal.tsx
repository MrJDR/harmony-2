import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Permission } from '@/types/permissions';

interface AddRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleType: 'organization' | 'portfolio' | 'program' | 'project';
  availablePermissions: Permission[];
  onAddRole: (role: { id: string; label: string; description: string; permissions: string[] }) => void;
}

export function AddRoleModal({
  open,
  onOpenChange,
  roleType,
  availablePermissions,
  onAddRole,
}: AddRoleModalProps) {
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const togglePermission = (permissionKey: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionKey)
        ? prev.filter((p) => p !== permissionKey)
        : [...prev, permissionKey]
    );
  };

  const handleSubmit = () => {
    if (!roleName.trim()) return;

    const roleId = roleName.toLowerCase().replace(/\s+/g, '-');
    onAddRole({
      id: roleId,
      label: roleName,
      description: roleDescription,
      permissions: selectedPermissions,
    });

    // Reset form
    setRoleName('');
    setRoleDescription('');
    setSelectedPermissions([]);
    onOpenChange(false);
  };

  const roleTypeLabels = {
    organization: 'Organization',
    portfolio: 'Portfolio',
    program: 'Program',
    project: 'Project',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Add {roleTypeLabels[roleType]} Role
          </DialogTitle>
          <DialogDescription>
            Create a new custom role with specific permissions for this {roleType}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Role Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Role Name</label>
            <Input
              placeholder="e.g., Team Lead, Approver, Analyst"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
            />
          </div>

          {/* Role Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Description</label>
            <Textarea
              placeholder="Describe what this role is responsible for..."
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Permissions Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Permissions</label>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {selectedPermissions.length} selected
              </Badge>
            </div>
            
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2 max-h-[250px] overflow-y-auto">
              {availablePermissions.map((permission) => {
                const isSelected = selectedPermissions.includes(permission.key);
                
                return (
                  <motion.div
                    key={permission.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 pr-4">
                      <p className="text-sm font-medium text-foreground">{permission.label}</p>
                      <p className="text-xs text-muted-foreground">{permission.description}</p>
                    </div>
                    <Switch
                      checked={isSelected}
                      onCheckedChange={() => togglePermission(permission.key)}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!roleName.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
