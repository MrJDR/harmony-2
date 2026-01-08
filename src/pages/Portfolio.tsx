import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProgramCard } from '@/components/portfolio/ProgramCard';
import { Button } from '@/components/ui/button';
import { mockPortfolio, mockTeamMembers } from '@/data/mockData';
import { WatchButton } from '@/components/watch/WatchButton';

export default function Portfolio() {
  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Portfolio</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your programs and track progress
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Program
          </Button>
        </motion.div>

        {/* Portfolio Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-6 shadow-card"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-card-foreground">
              {mockPortfolio.name}
            </h2>
            <WatchButton 
              id={mockPortfolio.id} 
              type="portfolio" 
              name={mockPortfolio.name}
              variant="outline"
              showLabel
            />
          </div>
          <p className="mt-2 text-muted-foreground">{mockPortfolio.description}</p>
          <div className="mt-4 flex gap-6">
            <div>
              <p className="text-3xl font-semibold text-foreground">
                {mockPortfolio.programs.length}
              </p>
              <p className="text-sm text-muted-foreground">Programs</p>
            </div>
            <div>
              <p className="text-3xl font-semibold text-foreground">
                {mockPortfolio.programs.reduce((acc, p) => acc + p.projects.length, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Projects</p>
            </div>
            <div>
              <p className="text-3xl font-semibold text-foreground">
                {mockPortfolio.programs.reduce(
                  (acc, prog) => acc + prog.projects.reduce((a, p) => a + p.tasks.length, 0),
                  0
                )}
              </p>
              <p className="text-sm text-muted-foreground">Total Tasks</p>
            </div>
          </div>
        </motion.div>

        {/* Programs Grid */}
        <div>
          <h2 className="mb-4 font-display text-xl font-semibold text-foreground">Programs</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {mockPortfolio.programs.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                teamMembers={mockTeamMembers}
              />
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
