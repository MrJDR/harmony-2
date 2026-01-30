/**
 * Resource Conflicts – Masterbook "Guided Flexibility".
 * Shows over-allocated team members with suggested actions (reallocate, extend timeline, reduce scope).
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TeamMember } from '@/types/portfolio';
import type { ResourceConflict } from '@/types/masterbook';
import { cn } from '@/lib/utils';

interface ResourceConflictsCardProps {
  teamMembers: TeamMember[];
  /** Optional: only include members assigned to these project IDs (portfolio scope) */
  projectIds?: string[];
}

function buildConflicts(teamMembers: TeamMember[], projectIds?: string[]): ResourceConflict[] {
  const conflicts: ResourceConflict[] = [];
  const members = teamMembers ?? [];
  for (const m of members) {
    const memberProjectIds = projectIds
      ? (m.projectIds ?? []).filter((id) => projectIds.includes(id))
      : (m.projectIds ?? []);
    if (projectIds && projectIds.length > 0 && memberProjectIds.length === 0) continue;
    const capacity = m.capacity || 100;
    const allocation = m.allocation ?? 0;
    if (allocation <= capacity) continue;
    const overAllocationBy = allocation - capacity;
    conflicts.push({
      memberId: m.id,
      memberName: m.name,
      projectIds: memberProjectIds,
      allocationTotal: allocation,
      capacity,
      overAllocationBy,
      suggestedActions: ['reallocate', 'extend_timeline', 'reduce_scope'],
    });
  }
  return conflicts;
}

export function ResourceConflictsCard({ teamMembers, projectIds }: ResourceConflictsCardProps) {
  const conflicts = useMemo(
    () => buildConflicts(teamMembers, projectIds),
    [teamMembers, projectIds]
  );

  if (conflicts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-border bg-card p-6 shadow-card"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold text-card-foreground">Resource Conflicts</h3>
            <p className="mt-1 text-sm text-muted-foreground">No over-allocation in this scope</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
            <Users className="h-5 w-5 text-success" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-xl border border-warning/30 bg-card p-6 shadow-card"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold text-card-foreground">Resource Conflicts</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {conflicts.length} member{conflicts.length !== 1 ? 's' : ''} over-allocated
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
          <AlertTriangle className="h-5 w-5 text-warning" />
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {conflicts.map((c) => (
          <div
            key={c.memberId}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{c.memberName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {c.allocationTotal}% allocated vs {c.capacity}% capacity (+{c.overAllocationBy}%)
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {c.suggestedActions.map((a) => (
                  <Badge key={a} variant="outline" className="text-xs capitalize">
                    {a.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
