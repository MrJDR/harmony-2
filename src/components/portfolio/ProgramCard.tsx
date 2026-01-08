import { motion } from 'framer-motion';
import { FolderKanban, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Program, TeamMember } from '@/types/portfolio';
import { WatchButton } from '@/components/watch/WatchButton';
import { cn } from '@/lib/utils';

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
  const navigate = useNavigate();

  const totalTasks = program.projects.reduce((acc, p) => acc + p.tasks.length, 0);
  const completedTasks = program.projects.reduce(
    (acc, p) => acc + p.tasks.filter((t) => t.status === 'done').length,
    0
  );
  const owner = teamMembers.find((m) => m.id === program.ownerId);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/programs/${program.id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="group cursor-pointer rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:border-primary/20 hover:shadow-lg"
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg font-semibold text-card-foreground truncate">
            {program.name}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {program.description}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-2">
          <WatchButton 
            id={program.id} 
            type="program" 
            name={program.name}
          />
          <Badge variant="outline" className={cn('border', statusColors[program.status])}>
            {program.status}
          </Badge>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <FolderKanban className="h-4 w-4" />
          <span>{program.projects.length} projects</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <CheckCircle2 className="h-4 w-4" />
          <span>{completedTasks}/{totalTasks} tasks</span>
        </div>
      </div>

      {owner && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
              {owner.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <span className="text-sm text-muted-foreground">{owner.name}</span>
          </div>
          <div className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-sm">View Projects</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      )}
    </motion.div>
  );
}
