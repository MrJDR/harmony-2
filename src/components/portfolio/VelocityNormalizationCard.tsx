/**
 * Velocity normalization – Masterbook portfolio view.
 * Shows normalized completion/velocity across projects (completion rate; optional future: story points).
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Project } from '@/types/portfolio';

interface VelocityNormalizationCardProps {
  projects: Project[];
}

export function VelocityNormalizationCard({ projects }: VelocityNormalizationCardProps) {
  const { avgCompletion, totalTasks, completedTasks } = useMemo(() => {
    const safeProjects = projects ?? [];
    const total = safeProjects.reduce((acc, p) => acc + (p.tasks?.length ?? 0), 0);
    const completed = safeProjects.reduce(
      (acc, p) => acc + (p.tasks ?? []).filter((t) => t.status === 'done').length,
      0
    );
    const avg = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { avgCompletion: avg, totalTasks: total, completedTasks: completed };
  }, [projects]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="rounded-xl border border-border bg-card p-6 shadow-card"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold text-card-foreground">Velocity (normalized)</h3>
          <p className="mt-1 text-sm text-muted-foreground">Portfolio-wide completion across projects</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-foreground">{avgCompletion}%</span>
        <span className="text-sm text-muted-foreground">
          {completedTasks}/{totalTasks} tasks
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Average completion rate across {(projects ?? []).length} project{(projects ?? []).length !== 1 ? 's' : ''}.
      </p>
    </motion.div>
  );
}
