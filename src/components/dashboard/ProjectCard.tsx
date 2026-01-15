import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Users } from 'lucide-react';
import { Project, TeamMember } from '@/types/portfolio';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { WatchButton } from '@/components/watch/WatchButton';

interface ProjectCardProps {
  project: Project;
  teamMembers: TeamMember[];
  onClick?: () => void;
}

import { projectStatusMeta } from '@/lib/workflow';

// Legacy fallback colors (kept for safety; UI uses workflow config when present)
const statusColors = {
  planning: 'bg-info/10 text-info border-info/20',
  active: 'bg-success/10 text-success border-success/20',
  'on-hold': 'bg-warning/10 text-warning border-warning/20',
  completed: 'bg-muted text-muted-foreground border-muted',
};

export function ProjectCard({ project, teamMembers, onClick }: ProjectCardProps) {
  const navigate = useNavigate();
  const assignedMembers = teamMembers.filter((m) => project.teamIds.includes(m.id));

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/projects/${project.id}`);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={handleClick}
      className="cursor-pointer rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card transition-shadow hover:shadow-elevated"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base sm:text-lg font-semibold text-card-foreground line-clamp-2 sm:truncate">
            {project.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <WatchButton id={project.id} type="project" name={project.name} size="sm" />
          {(() => {
            const meta = projectStatusMeta(project, project.status);
            return (
              <Badge
                variant="outline"
                className={cn('border whitespace-nowrap', meta.badgeClass || statusColors[project.status])}
              >
                {meta.label}
              </Badge>
            );
          })()}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium text-foreground">{project.progress}%</span>
        </div>
        <Progress value={project.progress} className="mt-2 h-2" />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 shrink-0" />
          <span className="truncate">{new Date(project.startDate).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex -space-x-2">
            {assignedMembers.slice(0, 3).map((member) => (
              <div
                key={member.id}
                className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border-2 border-card bg-accent text-xs font-medium text-accent-foreground"
                title={member.name}
              >
                {member.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
            ))}
            {assignedMembers.length > 3 && (
              <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-medium text-muted-foreground">
                +{assignedMembers.length - 3}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
