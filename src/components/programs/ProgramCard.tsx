import { motion } from 'framer-motion';
import { ChevronRight, FolderOpen } from 'lucide-react';
import { Program, TeamMember } from '@/types/portfolio';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { WatchButton } from '@/components/watch/WatchButton';
import { programStatusMeta } from '@/lib/workflow';

interface ProgramCardProps {
  program: Program;
  teamMembers: TeamMember[];
  onClick?: () => void;
}

// Legacy fallback colors (kept for safety; UI uses workflow config when present)
const statusColors = {
  planning: 'bg-info/10 text-info border-info/20',
  active: 'bg-success/10 text-success border-success/20',
  'on-hold': 'bg-warning/10 text-warning border-warning/20',
  completed: 'bg-muted text-muted-foreground border-muted',
};

export function ProgramCard({ program, teamMembers, onClick }: ProgramCardProps) {
  const totalTasks = program.projects.reduce((acc, p) => acc + p.tasks.length, 0);
  const completedTasks = program.projects.reduce(
    (acc, p) => acc + p.tasks.filter((t) => t.status === 'done').length,
    0
  );

  const owner = teamMembers.find((m) => m.id === program.ownerId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="group cursor-pointer rounded-xl border border-border bg-card p-4 sm:p-6 shadow-card transition-shadow hover:shadow-elevated"
    >
      {/* Header: icon, title, status badge */}
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg bg-accent">
          <FolderOpen className="h-5 w-5 sm:h-6 sm:w-6 text-accent-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-base sm:text-xl font-semibold text-card-foreground line-clamp-2">
              {program.name}
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              <WatchButton id={program.id} type="program" name={program.name} size="sm" />
              {(() => {
                const meta = programStatusMeta(program.status, program.customStatuses);
                return (
                  <Badge variant="outline" className={cn('border whitespace-nowrap text-xs', meta.badgeClass || statusColors[program.status])}>
                    {meta.label}
                  </Badge>
                );
              })()}
            </div>
          </div>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{program.description}</p>
        </div>
      </div>

      {/* Stats grid - responsive */}
      <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-2 sm:gap-4">
        <div className="rounded-lg bg-muted p-2 sm:p-3 text-center">
          <p className="text-lg sm:text-2xl font-semibold text-foreground">{program.projects.length}</p>
          <p className="text-xs sm:text-sm text-muted-foreground">Projects</p>
        </div>
        <div className="rounded-lg bg-muted p-2 sm:p-3 text-center">
          <p className="text-lg sm:text-2xl font-semibold text-foreground">{totalTasks}</p>
          <p className="text-xs sm:text-sm text-muted-foreground">Tasks</p>
        </div>
        <div className="rounded-lg bg-muted p-2 sm:p-3 text-center">
          <p className="text-lg sm:text-2xl font-semibold text-foreground">
            {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">Complete</p>
        </div>
      </div>

      {/* Owner and action */}
      <div className="mt-4 sm:mt-6 flex items-center justify-between gap-2">
        {owner ? (
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
              {owner.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground truncate">{owner.name}</span>
          </div>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-1 text-xs sm:text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          View Projects
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </motion.div>
  );
}
