import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, Target } from 'lucide-react';

interface AlertsBannerProps {
  overdueTasks: number;
  highPriorityTasks: number;
}

export function AlertsBanner({ overdueTasks, highPriorityTasks }: AlertsBannerProps) {
  const navigate = useNavigate();

  if (overdueTasks === 0 && highPriorityTasks === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-destructive/30 bg-destructive/5 p-4"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-destructive">Attention Required</h3>
          <div className="mt-2 flex flex-wrap gap-3 text-sm">
            {overdueTasks > 0 && (
              <button 
                onClick={() => navigate('/tasks')}
                className="flex items-center gap-1 text-destructive hover:underline"
              >
                <Clock className="h-4 w-4" />
                {overdueTasks} overdue task{overdueTasks > 1 ? 's' : ''}
              </button>
            )}
            {highPriorityTasks > 0 && (
              <button 
                onClick={() => navigate('/tasks')}
                className="flex items-center gap-1 text-warning hover:underline"
              >
                <Target className="h-4 w-4" />
                {highPriorityTasks} high priority task{highPriorityTasks > 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
