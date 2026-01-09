import { motion } from 'framer-motion';
import { Mail, MoreVertical, User, Briefcase, Clock, Edit, Trash2, HelpCircle } from 'lucide-react';
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

interface TeamMemberCardProps {
  member: TeamMember;
  projects: Project[];
  onEdit?: (member: TeamMember) => void;
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

export function TeamMemberCard({ member, projects, onEdit, onDelete, onClick }: TeamMemberCardProps) {
  const memberProjects = projects.filter(p => member.projectIds.includes(p.id));

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
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(member); }}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
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

      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Mail className="h-4 w-4" />
        <span className="truncate">{member.email}</span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">Allocation</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Points from assigned tasks vs capacity. 1 point = ~1 hour of estimated work.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn('text-xs', getAllocationColor(member.allocation, member.capacity))}>
              {getStatusLabel(member.allocation, member.capacity)}
            </Badge>
            <span className={cn('font-semibold', getAllocationColor(member.allocation, member.capacity))}>
              {member.allocation}/{member.capacity} pts
            </span>
          </div>
        </div>
        <Progress 
          value={Math.min((member.allocation / member.capacity) * 100, 100)} 
          className={cn('h-2', getAllocationBg(member.allocation, member.capacity))}
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
