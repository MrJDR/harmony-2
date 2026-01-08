import { motion } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import { ResourceChart } from '@/components/dashboard/ResourceChart';
import { mockTeamMembers, mockPortfolio } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function Resources() {
  const allProjects = mockPortfolio.programs.flatMap((p) => p.projects);

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-3xl font-bold text-foreground">Resources</h1>
          <p className="mt-1 text-muted-foreground">
            Team workload and allocation overview
          </p>
        </motion.div>

        {/* Summary Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-5 shadow-card"
          >
            <p className="text-3xl font-semibold text-foreground">{mockTeamMembers.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">Team Members</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-border bg-card p-5 shadow-card"
          >
            <p className="text-3xl font-semibold text-foreground">
              {Math.round(mockTeamMembers.reduce((acc, m) => acc + m.allocation, 0) / mockTeamMembers.length)}%
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Avg. Allocation</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-border bg-card p-5 shadow-card"
          >
            <p className="text-3xl font-semibold text-foreground">
              {mockTeamMembers.filter((m) => m.allocation >= 90).length}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">At Capacity</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-xl border border-border bg-card p-5 shadow-card"
          >
            <p className="text-3xl font-semibold text-foreground">
              {mockTeamMembers.filter((m) => m.allocation < 50).length}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Available</p>
          </motion.div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Resource Chart */}
          <ResourceChart members={mockTeamMembers} />

          {/* Project Assignments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-border bg-card p-6 shadow-card"
          >
            <h3 className="font-display text-lg font-semibold text-card-foreground">
              Project Assignments
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">Resource distribution by project</p>

            <div className="mt-6 space-y-4">
              {allProjects.map((project) => {
                const assignedMembers = mockTeamMembers.filter((m) =>
                  project.teamIds.includes(m.id)
                );
                return (
                  <div key={project.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{project.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {assignedMembers.length} members assigned
                      </p>
                    </div>
                    <div className="flex -space-x-2">
                      {assignedMembers.slice(0, 4).map((member) => (
                        <div
                          key={member.id}
                          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-accent text-xs font-medium text-accent-foreground"
                          title={member.name}
                        >
                          {member.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                      ))}
                      {assignedMembers.length > 4 && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-medium text-muted-foreground">
                          +{assignedMembers.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Team Member Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-border bg-card shadow-card overflow-hidden"
        >
          <div className="border-b border-border p-6">
            <h3 className="font-display text-lg font-semibold text-card-foreground">
              Team Details
            </h3>
          </div>
          <div className="divide-y divide-border">
            {mockTeamMembers.map((member) => {
              const memberProjects = allProjects.filter((p) =>
                p.teamIds.includes(member.id)
              );
              return (
                <div key={member.id} className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-foreground">
                    {member.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {memberProjects.map((project) => (
                      <span
                        key={project.id}
                        className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground"
                      >
                        {project.name}
                      </span>
                    ))}
                  </div>
                  <div
                    className={cn(
                      'text-right font-medium',
                      member.allocation >= 90
                        ? 'text-destructive'
                        : member.allocation >= 70
                        ? 'text-warning'
                        : 'text-foreground'
                    )}
                  >
                    {member.allocation}%
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
