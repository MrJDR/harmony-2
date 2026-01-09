import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Task } from '@/types/portfolio';

interface TaskDistributionChartProps {
  tasks: Task[];
}

const statusLabels = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  review: 'In Review',
  done: 'Done',
};

const statusColors = {
  todo: 'hsl(var(--muted-foreground))',
  'in-progress': 'hsl(var(--info))',
  review: 'hsl(var(--warning))',
  done: 'hsl(var(--success))',
};

export function TaskDistributionChart({ tasks }: TaskDistributionChartProps) {
  const statusCounts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(statusCounts).map(([status, count]) => ({
    name: statusLabels[status as keyof typeof statusLabels] || status,
    value: count,
    status,
  }));

  const totalTasks = tasks.length;
  const completedTasks = statusCounts['done'] || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="rounded-xl border border-border bg-card p-6 shadow-card"
    >
      <h3 className="font-display text-lg font-semibold text-card-foreground">Task Distribution</h3>
      <p className="mt-1 text-sm text-muted-foreground">Overview of all tasks by status</p>

      <div className="mt-4 flex items-center justify-center">
        <div className="relative h-48 w-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry) => (
                  <Cell 
                    key={entry.status} 
                    fill={statusColors[entry.status as keyof typeof statusColors]} 
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-foreground">{completionRate}%</span>
            <span className="text-xs text-muted-foreground">Complete</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {data.map((item) => (
          <div key={item.status} className="flex items-center gap-2">
            <div 
              className="h-3 w-3 rounded-full" 
              style={{ backgroundColor: statusColors[item.status as keyof typeof statusColors] }}
            />
            <span className="text-xs text-muted-foreground">{item.name}</span>
            <span className="ml-auto text-xs font-medium text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
