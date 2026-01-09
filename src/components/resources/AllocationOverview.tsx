import { motion } from 'framer-motion';
import { TeamMember } from '@/types/portfolio';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface AllocationOverviewProps {
  members: TeamMember[];
}

export function AllocationOverview({ members }: AllocationOverviewProps) {
  const overallocated = members.filter(m => m.allocation >= 100).length;
  const atCapacity = members.filter(m => m.allocation >= 85 && m.allocation < 100).length;
  const balanced = members.filter(m => m.allocation >= 50 && m.allocation < 85).length;
  const available = members.filter(m => m.allocation < 50).length;

  const data = [
    { name: 'Overallocated', value: overallocated, color: 'hsl(var(--destructive))' },
    { name: 'At Capacity', value: atCapacity, color: 'hsl(var(--warning))' },
    { name: 'Balanced', value: balanced, color: 'hsl(var(--info))' },
    { name: 'Available', value: available, color: 'hsl(var(--success))' },
  ].filter(d => d.value > 0);

  const avgAllocation = Math.round(members.reduce((acc, m) => acc + m.allocation, 0) / members.length);
  const totalCapacity = members.length * 100;
  const usedCapacity = members.reduce((acc, m) => acc + Math.min(m.allocation, 100), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-xl border border-border bg-card p-6 shadow-card"
    >
      <h3 className="font-display text-lg font-semibold text-card-foreground">Team Capacity</h3>
      <p className="mt-1 text-sm text-muted-foreground">Overall resource utilization</p>

      <div className="mt-4 h-48">
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
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span style={{ color: 'hsl(var(--foreground))', fontSize: '12px' }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{avgAllocation}%</p>
          <p className="text-xs text-muted-foreground">Avg. Allocation</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-2xl font-bold text-foreground">
            {Math.round((usedCapacity / totalCapacity) * 100)}%
          </p>
          <p className="text-xs text-muted-foreground">Capacity Used</p>
        </div>
      </div>
    </motion.div>
  );
}
