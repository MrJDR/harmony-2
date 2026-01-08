import { usePermissions } from '@/contexts/PermissionsContext';
import { OrgRole, ProjectRole } from '@/types/permissions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shield, FolderKanban } from 'lucide-react';

const orgRoles: { value: OrgRole; label: string }[] = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'member', label: 'Member' },
  { value: 'viewer', label: 'Viewer' },
];

const projectRoles: { value: ProjectRole; label: string }[] = [
  { value: 'project-manager', label: 'Project Manager' },
  { value: 'contributor', label: 'Contributor' },
  { value: 'viewer', label: 'Viewer' },
];

export function RoleSwitcher() {
  const { currentOrgRole, setCurrentOrgRole, currentProjectRole, setCurrentProjectRole } = usePermissions();

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg border border-dashed border-amber-500/50 bg-amber-500/5">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
          Dev Mode
        </Badge>
        <span className="text-xs text-muted-foreground">Switch roles to test permissions</span>
      </div>
      
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <Select value={currentOrgRole} onValueChange={(v) => setCurrentOrgRole(v as OrgRole)}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {orgRoles.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <FolderKanban className="h-4 w-4 text-muted-foreground" />
          <Select value={currentProjectRole} onValueChange={(v) => setCurrentProjectRole(v as ProjectRole)}>
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {projectRoles.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
