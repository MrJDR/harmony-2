import { motion } from 'framer-motion';
import { Users, AlertCircle } from 'lucide-react';
import { TeamMember } from '@/types/portfolio';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ResourceUtilizationProps {
  teamMembers: TeamMember[];
}

function getAllocationColor(allocation: number): string {
  if (allocation >= 100) return 'text-destructive';
  if (allocation >= 85) return 'text-warning';
  return 'text-success';
}

function getAllocationBg(allocation: number): string {
  if (allocation >= 100) return 'bg-destructive';
  if (allocation >= 85) return 'bg-warning';
  return 'bg-success';
}

export function ResourceUtilization({ teamMembers }: ResourceUtilizationProps) {
  const avgUtilization = Math.round(
    teamMembers.reduce((acc, m) => acc + m.allocation, 0) / teamMembers.length
  );
  const overallocated = teamMembers.filter(m => m.allocation >= 100).length;
  const highUtilization = teamMembers.filter(m => m.allocation >= 85 && m.allocation < 100).length;

  const sortedMembers = [...teamMembers].sort((a, b) => b.allocation - a.allocation);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-xl border border-border bg-card p-6 shadow-card"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold text-card-foreground">Resource Utilization</h3>
          <p className="mt-1 text-sm text-muted-foreground">Team capacity and allocation overview</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
          <Users className="h-5 w-5 text-info" />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{avgUtilization}%</p>
          <p className="text-xs text-muted-foreground">Avg. Utilization</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className={cn('text-2xl font-bold', overallocated > 0 ? 'text-destructive' : 'text-foreground')}>
            {overallocated}
          </p>
          <p className="text-xs text-muted-foreground">Overallocated</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className={cn('text-2xl font-bold', highUtilization > 0 ? 'text-warning' : 'text-foreground')}>
            {highUtilization}
          </p>
          <p className="text-xs text-muted-foreground">High Utilization</p>
        </div>
      </div>

      {/* Team List */}
      <div className="mt-4 space-y-3">
        {sortedMembers.map((member) => (
          <div key={member.id} className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-accent text-xs">
                {member.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground truncate">{member.name}</span>
                <div className="flex items-center gap-1">
                  {member.allocation >= 100 && (
                    <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                  )}
                  <span className={cn('text-sm font-medium', getAllocationColor(member.allocation))}>
                    {member.allocation}%
                  </span>
                </div>
              </div>
              <Progress 
                value={Math.min(member.allocation, 100)} 
                className={cn('mt-1 h-1.5', getAllocationBg(member.allocation))}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
