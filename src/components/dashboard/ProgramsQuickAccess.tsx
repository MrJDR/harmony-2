import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Program, Project, Task } from '@/types/portfolio';

interface ProgramsQuickAccessProps {
  programs: Program[];
  projects: Project[];
  tasks: Task[];
}

export function ProgramsQuickAccess({ programs, projects, tasks }: ProgramsQuickAccessProps) {
  const navigate = useNavigate();

  if (programs.length === 0) {
    return null;
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Programs</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/programs')}
            className="text-xs"
          >
            View All
            <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {programs.slice(0, 6).map((program) => {
            const programProjects = projects.filter(p => p.programId === program.id);
            const programTasks = programProjects.flatMap(p => p.tasks);
            const completedProgramTasks = programTasks.filter(t => t.status === 'done').length;
            const progress = programTasks.length > 0 
              ? Math.round((completedProgramTasks / programTasks.length) * 100) 
              : 0;
            
            return (
              <motion.div
                key={program.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => navigate(`/programs/${program.id}`)}
                className="cursor-pointer rounded-lg border border-border p-4 hover:border-primary/30 hover:bg-accent/30 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-foreground truncate">{program.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {programProjects.length} project{programProjects.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Badge variant={program.status === 'active' ? 'default' : 'secondary'} className="shrink-0">
                    {program.status}
                  </Badge>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
