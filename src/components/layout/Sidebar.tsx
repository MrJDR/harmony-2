import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  BarChart3,
  Mail,
  Settings,
  ChevronLeft,
  Briefcase,
  Layers,
  CheckSquare,
  FileBarChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/contexts/PermissionsContext';
import { OrgRole } from '@/types/permissions';

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
  { icon: Mail, label: 'Email', path: '/email' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { currentOrgRole, hasOrgPermission } = usePermissions();

  const visibleNavItems = navItems.filter((item) => {
    if (item.allowedRoles && !item.allowedRoles.includes(currentOrgRole)) {
      return false;
    }
    if (item.requiresPermission && !hasOrgPermission(item.requiresPermission)) {
      return false;
    }
    return true;
  });

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
                className="font-display text-lg font-semibold text-foreground"
              >
                PortfolioHub
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

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {visibleNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
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
      </div>
    </motion.aside>
  );
}
