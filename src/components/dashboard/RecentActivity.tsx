import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock, MessageSquare, FileText, Users, FolderOpen, AlertCircle, Loader2 } from 'lucide-react';
import { useActivityLogs } from '@/hooks/useActivityLogs';
import { formatDistanceToNow } from 'date-fns';

const iconMap: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="h-4 w-4 text-success" />,
  progress: <Clock className="h-4 w-4 text-info" />,
  comment: <MessageSquare className="h-4 w-4 text-warning" />,
  assigned: <Circle className="h-4 w-4 text-primary" />,
  created: <FileText className="h-4 w-4 text-primary" />,
  updated: <Clock className="h-4 w-4 text-info" />,
  deleted: <AlertCircle className="h-4 w-4 text-destructive" />,
  member: <Users className="h-4 w-4 text-success" />,
  project: <FolderOpen className="h-4 w-4 text-primary" />,
};

export function RecentActivity() {
  const { data: activities, isLoading } = useActivityLogs(10);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <h3 className="font-display text-lg font-semibold text-card-foreground">Recent Activity</h3>
        <p className="mt-1 text-sm text-muted-foreground">Latest updates across projects</p>
        <div className="mt-6 flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <h3 className="font-display text-lg font-semibold text-card-foreground">Recent Activity</h3>
      <p className="mt-1 text-sm text-muted-foreground">Latest updates across projects</p>

      <div className="mt-6 space-y-4">
        {(!activities || activities.length === 0) ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
        ) : (
          activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex gap-3"
            >
              <div className="mt-0.5">
                {iconMap[activity.type] || iconMap[activity.category] || <Circle className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">{activity.title}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  {activity.profiles_safe && (
                    <>
                      <span>
                        {activity.profiles_safe.first_name || 'User'}
                      </span>
                      <span>•</span>
                    </>
                  )}
                  <span>{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
