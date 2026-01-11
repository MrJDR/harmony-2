import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  BarChart3,
  MessageSquare,
  Settings,
  ChevronLeft,
  Briefcase,
  Layers,
  CheckSquare,
  FileBarChart,
  LogOut,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/contexts/PermissionsContext';
import { useAuth } from '@/contexts/AuthContext';
import { OrgRole } from '@/types/permissions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  allowedRoles?: OrgRole[];
  requiresPermission?: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Briefcase, label: 'Portfolio', path: '/portfolio', requiresPermission: 'view_portfolio' },
  { icon: Layers, label: 'Programs', path: '/programs', requiresPermission: 'view_programs' },
  { icon: FolderKanban, label: 'Projects', path: '/projects', requiresPermission: 'view_projects' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
  { icon: FileBarChart, label: 'Reports', path: '/reports', requiresPermission: 'view_reports' },
  { icon: Users, label: 'CRM', path: '/crm', allowedRoles: ['owner', 'admin', 'manager'] },
  { icon: BarChart3, label: 'Resources', path: '/resources', requiresPermission: 'view_analytics' },
  { icon: MessageSquare, label: 'Messages', path: '/messages' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

// Tour target IDs for interactive onboarding
const TOUR_TARGETS: Record<string, string> = {
  '/portfolio': 'portfolio-nav',
  '/programs': 'programs-nav',
  '/projects': 'projects-nav',
  '/tasks': 'tasks-nav',
  '/crm': 'crm-nav',
  '/resources': 'resources-nav',
  '/reports': 'reports-nav',
  '/messages': 'messages-nav',
  '/settings': 'settings-nav',
};

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { currentOrgRole, hasOrgPermission } = usePermissions();
  const { profile, organization, signOut } = useAuth();

  const visibleNavItems = navItems.filter((item) => {
    if (item.allowedRoles && !item.allowedRoles.includes(currentOrgRole)) {
      return false;
    }
    if (item.requiresPermission && !hasOrgPermission(item.requiresPermission)) {
      return false;
    }
    return true;
  });

  const userInitials = profile
    ? (profile.first_name?.[0] || '') + (profile.last_name?.[0] || profile.email[0].toUpperCase())
    : '?';

  const userName = profile
    ? profile.first_name && profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile.email
    : 'User';

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar shadow-card"
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Briefcase className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-display text-lg font-semibold text-foreground truncate"
                >
                  {organization?.name || 'PortfolioHub'}
                </motion.span>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <ChevronLeft
              className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')}
            />
          </button>
        </div>

        {/* Organization Badge */}
        {organization && !collapsed && (
          <div className="px-4 py-3 border-b border-sidebar-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span className="truncate font-medium">{organization.name}</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const tourTarget = TOUR_TARGETS[item.path];
            return (
              <Link
                key={item.path}
                to={item.path}
                data-tour={tourTarget}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Menu */}
        <div className="border-t border-sidebar-border p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 text-left truncate"
                  >
                    <p className="truncate">{userName}</p>
                  </motion.div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">{profile?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={signOut}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.aside>
  );
}
