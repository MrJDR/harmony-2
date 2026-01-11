import { motion } from 'framer-motion';
import { ChevronRight, FolderOpen } from 'lucide-react';
import { Program, TeamMember } from '@/types/portfolio';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { WatchButton } from '@/components/watch/WatchButton';

interface ProgramCardProps {
  program: Program;
  teamMembers: TeamMember[];
  onClick?: () => void;
}

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
      className="group cursor-pointer rounded-xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-elevated"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
            <FolderOpen className="h-6 w-6 text-accent-foreground" />
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold text-card-foreground">
              {program.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{program.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <WatchButton id={program.id} type="program" name={program.name} size="sm" />
          <Badge variant="outline" className={cn('border', statusColors[program.status])}>
            {program.status}
          </Badge>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-muted p-3">
          <p className="text-2xl font-semibold text-foreground">{program.projects.length}</p>
          <p className="text-sm text-muted-foreground">Projects</p>
        </div>
        <div className="rounded-lg bg-muted p-3">
          <p className="text-2xl font-semibold text-foreground">{totalTasks}</p>
          <p className="text-sm text-muted-foreground">Tasks</p>
        </div>
        <div className="rounded-lg bg-muted p-3">
          <p className="text-2xl font-semibold text-foreground">
            {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
          </p>
          <p className="text-sm text-muted-foreground">Complete</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        {owner && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
              {owner.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <span className="text-sm text-muted-foreground">{owner.name}</span>
          </div>
        )}
        <div className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          View Projects
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </motion.div>
  );
}
