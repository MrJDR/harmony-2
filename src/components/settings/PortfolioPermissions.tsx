import { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  PortfolioRole,
  portfolioPermissions,
  defaultPortfolioRolePermissions,
} from '@/types/permissions';

const portfolioRoles: { role: PortfolioRole; label: string; description: string }[] = [
  { role: 'portfolio-manager', label: 'Portfolio Manager', description: 'Full portfolio control' },
  { role: 'program-lead', label: 'Program Lead', description: 'Can manage programs within the portfolio' },
  { role: 'contributor', label: 'Contributor', description: 'Can contribute to portfolio activities' },
  { role: 'viewer', label: 'Viewer', description: 'View-only access to portfolio' },
];

const roleColors: Record<PortfolioRole, string> = {
  'portfolio-manager': 'bg-primary/10 text-primary border-primary/20',
  'program-lead': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  contributor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  viewer: 'bg-muted text-muted-foreground border-border',
};

export function PortfolioPermissions() {
  const [openRoles, setOpenRoles] = useState<PortfolioRole[]>(['program-lead']);
  const [rolePermissions, setRolePermissions] = useState(defaultPortfolioRolePermissions);

  const toggleRole = (role: PortfolioRole) => {
    setOpenRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const togglePermission = (role: PortfolioRole, permissionKey: string) => {
    if (role === 'portfolio-manager') return; // Portfolio Manager always has all permissions
    
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
          <Briefcase className="h-5 w-5 text-secondary-foreground" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground">Portfolio Permissions</h3>
          <p className="text-sm text-muted-foreground">
            Configure role permissions for portfolios
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {portfolioRoles.map((roleInfo, index) => (
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
                  {portfolioPermissions.map((permission) => {
                    const isEnabled = rolePermissions[roleInfo.role].includes(permission.key);
                    const isManager = roleInfo.role === 'portfolio-manager';
                    
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
      </div>

      <div className="flex justify-end pt-4">
        <Button>Save Portfolio Permissions</Button>
      </div>
    </div>
  );
}
