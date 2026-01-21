import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { TeamMember } from '@/types/portfolio';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ResourceChartProps {
  members: TeamMember[];
}

export function ResourceChart({ members }: ResourceChartProps) {
  const navigate = useNavigate();
  
  const getBarColor = (allocation: number) => {
    if (allocation >= 90) return 'bg-destructive';
    if (allocation >= 70) return 'bg-warning';
    return 'bg-primary';
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold text-card-foreground">
            Resource Allocation
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">Team workload overview</p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/resources')}
          className="text-xs"
        >
          View All
          <ChevronRight className="ml-1 h-3 w-3" />
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        {members.slice(0, 5).map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            onClick={() => navigate('/resources')}
            className="cursor-pointer rounded-lg p-2 -mx-2 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
                  {member.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <p className="font-medium text-foreground">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                </div>
              </div>
              <span
                className={cn(
                  'font-medium',
                  member.allocation >= 90
                    ? 'text-destructive'
                    : member.allocation >= 70
                    ? 'text-warning'
                    : 'text-foreground'
                )}
              >
                {member.allocation}%
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${member.allocation}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className={cn('h-full rounded-full', getBarColor(member.allocation))}
              />
            </div>
          </motion.div>
        ))}
        {members.length === 0 && (
          <p className="text-center py-4 text-sm text-muted-foreground">
            No team members yet
          </p>
        )}
      </div>
    </div>
  );
}
