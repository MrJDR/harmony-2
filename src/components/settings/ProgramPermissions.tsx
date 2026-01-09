import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, ChevronDown, ChevronRight, Check, UserCog } from 'lucide-react';
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
  ProgramRole,
  programPermissions,
  defaultProgramRolePermissions,
} from '@/types/permissions';
import { mockPortfolio } from '@/data/mockData';

const programRoles: { role: ProgramRole; label: string; description: string }[] = [
  { role: 'program-manager', label: 'Program Manager', description: 'Full program control' },
  { role: 'project-lead', label: 'Project Lead', description: 'Can manage projects within the program' },
  { role: 'contributor', label: 'Contributor', description: 'Can contribute to program activities' },
  { role: 'viewer', label: 'Viewer', description: 'View-only access to program' },
];

const roleColors: Record<ProgramRole, string> = {
  'program-manager': 'bg-primary/10 text-primary border-primary/20',
  'project-lead': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  contributor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  viewer: 'bg-muted text-muted-foreground border-border',
};

// Get all programs from mock data
const allPrograms = mockPortfolio.programs;

export function ProgramPermissions() {
  const [selectedProgramId, setSelectedProgramId] = useState(allPrograms[0]?.id || '');
  const [openRoles, setOpenRoles] = useState<ProgramRole[]>(['project-lead']);
  const [rolePermissions, setRolePermissions] = useState(defaultProgramRolePermissions);

  const selectedProgram = allPrograms.find((p) => p.id === selectedProgramId);

  const toggleRole = (role: ProgramRole) => {
    setOpenRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const togglePermission = (role: ProgramRole, permissionKey: string) => {
    if (role === 'program-manager') return; // Program Manager always has all permissions
    
    setRolePermissions((prev) => ({
      ...prev,
      [role]: prev[role].includes(permissionKey)
        ? prev[role].filter((p) => p !== permissionKey)
        : [...prev[role], permissionKey],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/50">
          <Layers className="h-5 w-5 text-secondary-foreground" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground">Program Permissions</h3>
          <p className="text-sm text-muted-foreground">
            Configure role permissions per program
          </p>
        </div>
      </div>

      {/* Program Selector */}
      <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-muted/30">
        <UserCog className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1">
          <label className="text-sm font-medium text-foreground">Select Program</label>
          <p className="text-xs text-muted-foreground">Choose a program to configure permissions</p>
        </div>
        <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select a program" />
          </SelectTrigger>
          <SelectContent>
            {allPrograms.map((program) => (
              <SelectItem key={program.id} value={program.id}>
                {program.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedProgram && (
        <motion.div
          key={selectedProgramId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2 py-2">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              {selectedProgram.name}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {selectedProgram.projects.length} projects
            </span>
          </div>

          {programRoles.map((roleInfo, index) => (
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
                          <Badge variant="outline" className={roleColors[roleInfo.role]}>
                            {rolePermissions[roleInfo.role].length} permissions
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{roleInfo.description}</p>
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 p-4 rounded-lg border border-border bg-muted/30 space-y-3">
                    {programPermissions.map((permission) => {
                      const isEnabled = rolePermissions[roleInfo.role].includes(permission.key);
                      const isManager = roleInfo.role === 'program-manager';
                      
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
                            disabled={isManager}
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
        <Button>Save Program Permissions</Button>
      </div>
    </div>
  );
}
