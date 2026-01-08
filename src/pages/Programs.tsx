import { MainLayout } from '@/components/layout/MainLayout';
import { ProgramCard } from '@/components/portfolio/ProgramCard';
import { mockPortfolio, mockTeamMembers } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { PermissionGate } from '@/components/permissions/PermissionGate';
import { motion } from 'framer-motion';

export default function Programs() {
  const programs = mockPortfolio.programs;
  const teamMembers = mockTeamMembers;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Programs</h1>
            <p className="text-muted-foreground">
              Manage programs and their associated projects
            </p>
          </div>
          <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Program
            </Button>
          </PermissionGate>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {programs.map((program, index) => (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <ProgramCard program={program} teamMembers={teamMembers} />
            </motion.div>
          ))}
        </motion.div>

        {programs.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">No programs yet</p>
            <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
              <Button variant="outline" className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create your first program
              </Button>
            </PermissionGate>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
