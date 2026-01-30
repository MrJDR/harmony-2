import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, MoreVertical, Trash2, HelpCircle, ExternalLink } from 'lucide-react';
import { TeamMember, Project } from '@/types/portfolio';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/contexts/PermissionsContext';
import { type TimeFrame, getTimeFrameLabel } from '@/lib/timeFrameFilter';

interface TeamMemberCardProps {
  member: TeamMember;
  projects: Project[];
  timeFrame?: TimeFrame;
  totalCapacity?: number;
  onDelete?: (member: TeamMember) => void;
  onClick?: (member: TeamMember) => void;
}

function getAllocationColor(allocation: number, capacity: number = 40): string {
  const ratio = (allocation / capacity) * 100;
  if (ratio >= 100) return 'text-destructive';
  if (ratio >= 85) return 'text-warning';
  return 'text-success';
}

function getAllocationBg(allocation: number, capacity: number = 40): string {
  const ratio = (allocation / capacity) * 100;
  if (ratio >= 100) return 'bg-destructive';
  if (ratio >= 85) return 'bg-warning';
  return 'bg-success';
}

function getStatusLabel(allocation: number, capacity: number = 40): string {
  const ratio = (allocation / capacity) * 100;
  if (ratio >= 100) return 'Overallocated';
  if (ratio >= 85) return 'At Capacity';
  if (ratio < 50) return 'Available';
  return 'Allocated';
}

export function TeamMemberCard({ member, projects, timeFrame = 'current-week', totalCapacity, onDelete, onClick }: TeamMemberCardProps) {
  const navigate = useNavigate();
  const { hasOrgPermission } = usePermissions();
  const canViewEmails = hasOrgPermission('view_contact_emails');
  const memberProjects = projects.filter(p => member.projectIds.includes(p.id));
  
  // Use totalCapacity if provided, otherwise fall back to weekly capacity
  const displayCapacity = totalCapacity !== undefined ? totalCapacity : member.capacity;
  const displayAllocation = member.allocation;
  const timeFrameLabel = getTimeFrameLabel(timeFrame);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="rounded-xl border border-border bg-card p-5 shadow-card cursor-pointer transition-shadow hover:shadow-lg"
      onClick={() => onClick?.(member)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-accent text-sm font-medium">
              {member.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-foreground">{member.name}</h3>
            <p className="text-sm text-muted-foreground">{member.role}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/crm/${member.contactId}`); }}>
              <ExternalLink className="mr-2 h-4 w-4" />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete?.(member); }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {canViewEmails && member.email && (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span className="truncate">{member.email}</span>
        </div>
      )}

      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">Workload ({timeFrameLabel})</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Total points from assigned tasks in {timeFrameLabel.toLowerCase()} vs total capacity for the period. Includes tasks without dates (unscheduled work). 1 point = ~1 hour of estimated work.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn('text-xs', getAllocationColor(displayAllocation, displayCapacity))}>
              {getStatusLabel(displayAllocation, displayCapacity)}
            </Badge>
            <span className={cn('font-semibold', getAllocationColor(displayAllocation, displayCapacity))}>
              {displayAllocation.toFixed(1)}/{displayCapacity.toFixed(0)} pts
            </span>
          </div>
        </div>
        <Progress 
          value={Math.min((displayAllocation / displayCapacity) * 100, 100)} 
          className={cn('h-2', getAllocationBg(displayAllocation, displayCapacity))}
        />
      </div>

      {memberProjects.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Assigned Projects</p>
          <div className="flex flex-wrap gap-1.5">
            {memberProjects.slice(0, 3).map(project => (
              <Badge key={project.id} variant="secondary" className="text-xs">
                {project.name}
              </Badge>
            ))}
            {memberProjects.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{memberProjects.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
