import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Project } from '@/types/portfolio';
import { cn } from '@/lib/utils';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  differenceInDays,
  addMonths,
  subMonths,
  isWithinInterval,
  isSameMonth,
} from 'date-fns';

interface ProjectTimelineProps {
  projects: Project[];
}

const statusColors: Record<string, string> = {
  planning: 'bg-muted-foreground/60',
  active: 'bg-info',
  'on-hold': 'bg-warning',
  completed: 'bg-success',
};

export function ProjectTimeline({ projects }: ProjectTimelineProps) {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Calculate the visible range (3 months)
  const visibleRange = useMemo(() => {
    const start = startOfMonth(subMonths(currentMonth, 1));
    const end = endOfMonth(addMonths(currentMonth, 1));
    return { start, end };
  }, [currentMonth]);

  // Get all days in the visible range
  const days = useMemo(() => {
    return eachDayOfInterval({ start: visibleRange.start, end: visibleRange.end });
  }, [visibleRange]);

  // Filter projects that have dates within the visible range
  const visibleProjects = useMemo(() => {
    return projects.filter((project) => {
      if (!project.startDate && !project.endDate) return false;
      const start = project.startDate ? new Date(project.startDate) : new Date();
      const end = project.endDate ? new Date(project.endDate) : addMonths(new Date(), 3);
      
      return (
        isWithinInterval(start, visibleRange) ||
        isWithinInterval(end, visibleRange) ||
        (start <= visibleRange.start && end >= visibleRange.end)
      );
    });
  }, [projects, visibleRange]);

  const totalDays = days.length;

  // Calculate position and width for each project bar
  const getProjectBar = (project: Project) => {
    const projectStart = project.startDate ? new Date(project.startDate) : new Date();
    const projectEnd = project.endDate ? new Date(project.endDate) : addMonths(new Date(), 1);

    const startOffset = Math.max(0, differenceInDays(projectStart, visibleRange.start));
    const endOffset = Math.min(totalDays, differenceInDays(projectEnd, visibleRange.start) + 1);

    const left = (startOffset / totalDays) * 100;
    const width = ((endOffset - startOffset) / totalDays) * 100;

    return { left: `${left}%`, width: `${Math.max(width, 2)}%` };
  };

  // Generate month headers
  const months = useMemo(() => {
    const result: Array<{ month: Date; width: number; offset: number }> = [];
    let currentDate = visibleRange.start;

    while (currentDate <= visibleRange.end) {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      
      const startDay = Math.max(0, differenceInDays(monthStart, visibleRange.start));
      const endDay = Math.min(totalDays, differenceInDays(monthEnd, visibleRange.start) + 1);
      
      result.push({
        month: currentDate,
        offset: (startDay / totalDays) * 100,
        width: ((endDay - startDay) / totalDays) * 100,
      });

      currentDate = addMonths(startOfMonth(currentDate), 1);
    }

    return result;
  }, [visibleRange, totalDays]);

  return (
    <Card>
      <CardContent className="p-4">
        {/* Header with navigation */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-sm">Project Timeline</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[100px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Month headers */}
        <div className="relative h-8 mb-2 border-b">
          {months.map((m, i) => (
            <div
              key={i}
              className={cn(
                'absolute top-0 h-full flex items-center justify-center text-xs font-medium border-r',
                isSameMonth(m.month, currentMonth) ? 'bg-accent/30' : 'bg-muted/30'
              )}
              style={{ left: `${m.offset}%`, width: `${m.width}%` }}
            >
              {format(m.month, 'MMM yyyy')}
            </div>
          ))}
        </div>

        {/* Project rows */}
        <div className="space-y-2">
          {visibleProjects.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No projects with dates in this period
            </div>
          ) : (
            visibleProjects.map((project, index) => {
              const bar = getProjectBar(project);
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative h-10 group"
                >
                  {/* Project name on the left (overlay) */}
                  <div className="absolute left-0 top-0 h-full flex items-center z-10 bg-gradient-to-r from-card via-card to-transparent pr-4">
                    <span className="text-xs font-medium truncate max-w-[150px]">
                      {project.name}
                    </span>
                  </div>

                  {/* Timeline bar */}
                  <div className="absolute inset-0">
                    <div
                      className={cn(
                        'absolute top-1/2 -translate-y-1/2 h-6 rounded cursor-pointer',
                        'transition-all hover:h-7 hover:shadow-md',
                        statusColors[project.status] || statusColors.planning
                      )}
                      style={{ left: bar.left, width: bar.width }}
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <div className="h-full flex items-center justify-center px-2">
                        <span className="text-[10px] font-medium text-white truncate">
                          {project.progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t">
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={cn('w-3 h-3 rounded', color)} />
              <span className="text-xs capitalize">{status.replace('-', ' ')}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
