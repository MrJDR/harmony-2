import { motion } from 'framer-motion';
import { TeamMember } from '@/types/portfolio';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { type TimeFrame, getTimeFrameLabel } from '@/lib/timeFrameFilter';

interface AllocationOverviewProps {
  members: (TeamMember & { pointsPerWeek?: number })[];
  timeFrame?: TimeFrame;
}

export function AllocationOverview({ members, timeFrame = 'current-week' }: AllocationOverviewProps) {
  // Use pointsPerWeek if available, otherwise calculate percentage from allocation
  const getMemberRatio = (m: TeamMember & { pointsPerWeek?: number }) => {
    if (m.pointsPerWeek !== undefined) {
      return (m.pointsPerWeek / m.capacity) * 100;
    }
    return (m.allocation / m.capacity) * 100;
  };

  const overallocated = members.filter(m => getMemberRatio(m) >= 100).length;
  const atCapacity = members.filter(m => {
    const ratio = getMemberRatio(m);
    return ratio >= 85 && ratio < 100;
  }).length;
  const balanced = members.filter(m => {
    const ratio = getMemberRatio(m);
    return ratio >= 50 && ratio < 85;
  }).length;
  const available = members.filter(m => getMemberRatio(m) < 50).length;

  const data = [
    { name: 'Overallocated', value: overallocated, color: 'hsl(var(--destructive))' },
    { name: 'At Capacity', value: atCapacity, color: 'hsl(var(--warning))' },
    { name: 'Balanced', value: balanced, color: 'hsl(var(--info))' },
    { name: 'Available', value: available, color: 'hsl(var(--success))' },
  ].filter(d => d.value > 0);

  const avgAllocation = members.length > 0 
    ? Math.round(members.reduce((acc, m) => acc + getMemberRatio(m), 0) / members.length)
    : 0;
  const totalCapacity = members.length * 100;
  const usedCapacity = members.reduce((acc, m) => acc + Math.min(getMemberRatio(m), 100), 0);
  const timeFrameLabel = getTimeFrameLabel(timeFrame);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-xl border border-border bg-card p-6 shadow-card"
    >
      <h3 className="font-display text-lg font-semibold text-card-foreground">Team Capacity</h3>
      <p className="mt-1 text-sm text-muted-foreground">Workload for {timeFrameLabel.toLowerCase()} (total points, includes unscheduled tasks)</p>

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
        <div className="rounded-lg bg-muted p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{avgAllocation}%</p>
          <p className="text-xs text-muted-foreground">Avg. Allocation</p>
        </div>
        <div className="rounded-lg bg-muted p-3 text-center">
          <p className="text-2xl font-bold text-foreground">
            {Math.round((usedCapacity / totalCapacity) * 100)}%
          </p>
          <p className="text-xs text-muted-foreground">Capacity Used</p>
        </div>
      </div>
    </motion.div>
  );
}
