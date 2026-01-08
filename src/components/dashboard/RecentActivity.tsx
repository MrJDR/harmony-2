import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock, MessageSquare } from 'lucide-react';

const activities = [
  {
    id: 1,
    type: 'completed',
    message: 'User Research completed',
    project: 'Mobile App Redesign',
    time: '2 hours ago',
  },
  {
    id: 2,
    type: 'progress',
    message: 'Design System Update started',
    project: 'Mobile App Redesign',
    time: '4 hours ago',
  },
  {
    id: 3,
    type: 'comment',
    message: 'New feedback on Architecture Design',
    project: 'API Gateway',
    time: '6 hours ago',
  },
  {
    id: 4,
    type: 'assigned',
    message: 'Alex assigned to Frontend Implementation',
    project: 'Mobile App Redesign',
    time: '1 day ago',
  },
];

const iconMap = {
  completed: <CheckCircle2 className="h-4 w-4 text-success" />,
  progress: <Clock className="h-4 w-4 text-info" />,
  comment: <MessageSquare className="h-4 w-4 text-warning" />,
  assigned: <Circle className="h-4 w-4 text-primary" />,
};

export function RecentActivity() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <h3 className="font-display text-lg font-semibold text-card-foreground">Recent Activity</h3>
      <p className="mt-1 text-sm text-muted-foreground">Latest updates across projects</p>

      <div className="mt-6 space-y-4">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex gap-3"
          >
            <div className="mt-0.5">{iconMap[activity.type as keyof typeof iconMap]}</div>
            <div className="flex-1">
              <p className="text-sm text-foreground">{activity.message}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{activity.project}</span>
                <span>•</span>
                <span>{activity.time}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
