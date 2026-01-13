import { useEffect } from 'react';
import { usePermissions } from '@/contexts/PermissionsContext';
import { OrgRole, ProjectRole } from '@/types/permissions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, FolderKanban, Bug } from 'lucide-react';

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
  const {
    currentOrgRole,
    setCurrentOrgRole,
    currentProjectRole,
    setCurrentProjectRole,
    isDevMode,
    setDevMode,
  } = usePermissions();

  // Safety: if this UI gets hidden/unmounted while dev mode is enabled,
  // automatically disable dev mode so users don't get stuck in a simulated role.
  useEffect(() => {
    return () => {
      if (isDevMode) setDevMode(false);
    };
  }, [isDevMode, setDevMode]);

  return (
    <div className="space-y-4">
      {/* Dev Mode Toggle */}
      <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
        <div className="flex items-center gap-3">
          <Bug className="h-5 w-5 text-amber-500" />
          <div>
            <Label htmlFor="dev-mode" className="font-medium">
              Developer Mode
            </Label>
            <p className="text-sm text-muted-foreground">Test UI with different permission roles</p>
          </div>
        </div>
        <Switch id="dev-mode" checked={isDevMode} onCheckedChange={setDevMode} />
      </div>

      {/* Role Selectors - only show when dev mode is enabled */}
      {isDevMode && (
        <div className="p-4 rounded-lg border border-dashed border-amber-500/50 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-4">
            <Badge
              variant="outline"
              className="bg-amber-500/10 text-amber-600 border-amber-500/30"
            >
              Dev Mode Active
            </Badge>
            <span className="text-xs text-muted-foreground">Switch roles to test permissions</span>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm">Org Role:</Label>
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
              <Label className="text-sm">Project Role:</Label>
              <Select
                value={currentProjectRole}
                onValueChange={(v) => setCurrentProjectRole(v as ProjectRole)}
              >
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
      )}
    </div>
  );
}

