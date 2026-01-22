import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  X,
  Plus,
  Video,
  Phone,
  MessageCircle,
  MessageSquarePlus,
  Bug,
} from 'lucide-react';
import { FeedbackModal } from '@/components/feedback/FeedbackModal';
import { BugReportModal } from '@/components/feedback/BugReportModal';
import { ThankYouModal } from '@/components/feedback/ThankYouModal';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/contexts/PermissionsContext';
import { useAuth } from '@/contexts/AuthContext';
import { OrgRole } from '@/types/permissions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { NewChatDialog } from '@/components/communication/NewChatDialog';

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
  { icon: Briefcase, label: 'Portfolios', path: '/portfolios', requiresPermission: 'view_portfolio' },
  { icon: Layers, label: 'Programs', path: '/programs', requiresPermission: 'view_programs' },
  { icon: FolderKanban, label: 'Projects', path: '/projects', requiresPermission: 'view_projects' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
  { icon: FileBarChart, label: 'Reports', path: '/reports', requiresPermission: 'view_reports' },
  { icon: Users, label: 'CRM', path: '/crm', allowedRoles: ['owner', 'admin', 'manager'] },
  { icon: BarChart3, label: 'Resources', path: '/resources', requiresPermission: 'view_analytics' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

// Tour target IDs for interactive onboarding
const TOUR_TARGETS: Record<string, string> = {
  '/portfolios': 'portfolios-nav',
  '/programs': 'programs-nav',
  '/projects': 'projects-nav',
  '/tasks': 'tasks-nav',
  '/crm': 'crm-nav',
  '/resources': 'resources-nav',
  '/reports': 'reports-nav',
  '/messages': 'messages-nav',
  '/settings': 'settings-nav',
};

interface SidebarProps {
  onNavigate?: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ onNavigate, collapsed: collapsedProp, onCollapsedChange }: SidebarProps) {
  const [collapsedInternal, setCollapsedInternal] = useState(false);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showBugReportModal, setShowBugReportModal] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const collapsed = collapsedProp ?? collapsedInternal;

  const location = useLocation();
  const navigate = useNavigate();
  const { hasOrgPermission } = usePermissions();
  const { profile, organization, signOut, userRole } = useAuth();

  // Use real database role for role-based access (security), 
  // but permissions can be tested via dev mode
  const effectiveOrgRole = (userRole as OrgRole) || 'viewer';

  const visibleNavItems = navItems.filter((item) => {
    // Role-based items use real database role for security
    if (item.allowedRoles && !item.allowedRoles.includes(effectiveOrgRole)) {
      return false;
    }
    // Permission-based items can be tested via dev mode
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

  const handleNavClick = () => {
    onNavigate?.();
  };

  const isMessagesActive = location.pathname === '/messages';

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="h-full w-full border-r border-sidebar-border bg-sidebar"
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <Link to="/" className="flex items-center gap-3">
            {organization?.logo_url ? (
              <img 
                src={organization.logo_url} 
                alt={organization.name} 
                className="h-9 w-9 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Briefcase className="h-5 w-5 text-primary-foreground" />
              </div>
            )}
            {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-display text-lg font-semibold text-foreground truncate"
                >
                  {organization?.name || 'Accord'}
                </motion.span>
            )}
          </Link>
          {onNavigate ? (
            <button
              onClick={onNavigate}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close menu</span>
            </button>
          ) : (
            <button
              onClick={() => {
                const next = !collapsed;
                onCollapsedChange?.(next);
                if (!onCollapsedChange) setCollapsedInternal(next);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
              <span className="sr-only">Toggle sidebar</span>
            </button>
          )}
        </div>


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
                onClick={handleNavClick}
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

          {/* Communication Section */}
          <div className="pt-4 mt-4 border-t border-sidebar-border">
            {!collapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Communication
              </motion.p>
            )}
            
            {/* Quick Action Buttons */}
            <div className={cn(
              "flex gap-1 mb-2",
              collapsed ? "flex-col items-center px-1" : "px-2"
            )}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewChatDialog(true)}
                    className={cn(
                      "flex items-center gap-2 text-sidebar-foreground hover:bg-primary/10 hover:text-primary",
                      collapsed ? "w-10 h-10 p-0 justify-center" : "flex-1 justify-start"
                    )}
                  >
                    <Plus className="h-4 w-4" />
                    {!collapsed && <span className="text-xs">New Chat</span>}
                  </Button>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right">New Chat</TooltipContent>}
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/messages?filter=calls')}
                    className={cn(
                      "flex items-center gap-2 text-sidebar-foreground hover:bg-primary/10 hover:text-primary",
                      collapsed ? "w-10 h-10 p-0 justify-center" : "flex-1 justify-start"
                    )}
                  >
                    <Video className="h-4 w-4" />
                    {!collapsed && <span className="text-xs">Calls</span>}
                  </Button>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right">Active Calls</TooltipContent>}
              </Tooltip>
            </div>

            {/* Messages Link */}
            <Link
              to="/messages"
              data-tour="messages-nav"
              onClick={handleNavClick}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isMessagesActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )}
            >
              <MessageSquare className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  All Messages
                </motion.span>
              )}
            </Link>
          </div>
        </nav>

        <NewChatDialog 
          open={showNewChatDialog} 
          onOpenChange={setShowNewChatDialog} 
        />

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

        {/* Feedback & Bug Report Buttons */}
        <div className="border-t border-sidebar-border px-3 py-2 space-y-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowFeedbackModal(true)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                  'text-sidebar-foreground hover:bg-primary/10 hover:text-primary'
                )}
              >
                <MessageSquarePlus className="h-5 w-5 shrink-0" />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    Suggestions
                  </motion.span>
                )}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Suggestions</TooltipContent>}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowBugReportModal(true)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                  'text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive'
                )}
              >
                <Bug className="h-5 w-5 shrink-0" />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    Report Bug
                  </motion.span>
                )}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Report Bug</TooltipContent>}
          </Tooltip>
        </div>

        {/* App Name & Copyright */}
        <div className="border-t border-sidebar-border px-3 py-3">
          <div className={cn(
            "text-xs text-muted-foreground",
            collapsed ? "text-center" : ""
          )}>
          {!collapsed ? (
              <>
                <p className="font-medium">Accord</p>
                <p className="mt-0.5">© {new Date().getFullYear()} All rights reserved</p>
              </>
            ) : (
              <p className="font-medium">A</p>
            )}
          </div>
        </div>

        <FeedbackModal
          open={showFeedbackModal}
          onOpenChange={setShowFeedbackModal}
          onSuccess={() => setShowThankYouModal(true)}
        />
        <BugReportModal
          open={showBugReportModal}
          onOpenChange={setShowBugReportModal}
          onSuccess={() => setShowThankYouModal(true)}
        />
        <ThankYouModal
          open={showThankYouModal}
          onOpenChange={setShowThankYouModal}
        />
      </div>
    </motion.aside>
  );
}
