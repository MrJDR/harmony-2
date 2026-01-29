import { motion } from 'framer-motion';
import { ProgressRing } from './ProgressRing';

interface DashboardHeaderProps {
  overallProgress: number;
}

export function DashboardHeader({ overallProgress }: DashboardHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm sm:text-base text-muted-foreground">
          High-level overview of your portfolio
        </p>
      </div>
      <div className="self-end sm:self-auto">
        <ProgressRing progress={overallProgress} size={80} strokeWidth={5} />
      </div>
    </motion.div>
  );
}
