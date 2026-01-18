import { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, differenceInDays, addDays, addWeeks, subWeeks, startOfWeek, eachWeekOfInterval, subDays, isWithinInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Focus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Project, Program } from '@/types/portfolio';
import { DateRange } from 'react-day-picker';
import { useToast } from '@/hooks/use-toast';

interface ProjectGanttProps {
  projects: Project[];
  programs: Program[];
  onProjectUpdate?: (projectId: string, updates: Partial<Project>) => void;
}

const statusColors: Record<string, string> = {
  planning: 'bg-muted-foreground/60',
  active: 'bg-info',
  'on-hold': 'bg-warning',
  completed: 'bg-success',
};

export function ProjectGantt({ projects, programs, onProjectUpdate }: ProjectGanttProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Drag state
  const [draggingProject, setDraggingProject] = useState<Project | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [pendingUpdate, setPendingUpdate] = useState<{ project: Project; newStartDate: string; newEndDate: string } | null>(null);

  // Calculate initial date range from projects
  const initialRange = useMemo(() => {
    const projectsWithDates = projects.filter((p) => p.startDate || p.endDate);
    if (projectsWithDates.length === 0) {
      const today = new Date();
      return {
        start: startOfWeek(subWeeks(today, 1)),
        end: addWeeks(today, 12),
      };
    }

    const allDates: Date[] = [];
    projectsWithDates.forEach((p) => {
      if (p.startDate) allDates.push(new Date(p.startDate));
      if (p.endDate) allDates.push(new Date(p.endDate));
    });
    
    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

    return {
      start: startOfWeek(subDays(minDate, 14)),
      end: addWeeks(maxDate, 4),
    };
  }, [projects]);

  const [dateRange, setDateRange] = useState(initialRange);

  const getProgramName = (programId: string) => {
    return programs.find((p) => p.id === programId)?.name || 'Unknown';
  };

  const handleFocusProject = (project: Project) => {
    if (!project.startDate && !project.endDate) return;
    
    const start = project.startDate ? new Date(project.startDate) : (project.endDate ? subDays(new Date(project.endDate), 30) : new Date());
    const end = project.endDate ? new Date(project.endDate) : addDays(start, 30);
    
    setDateRange({
      start: startOfWeek(subDays(start, 14)),
      end: addWeeks(end, 4),
    });
  };

  const navigateRange = (direction: 'prev' | 'next') => {
    const weeksToMove = 4;
    setDateRange((prev) => ({
      start: direction === 'prev' ? subWeeks(prev.start, weeksToMove) : addWeeks(prev.start, weeksToMove),
      end: direction === 'prev' ? subWeeks(prev.end, weeksToMove) : addWeeks(prev.end, weeksToMove),
    }));
  };

  const goToToday = () => {
    const today = new Date();
    setDateRange({
      start: startOfWeek(subWeeks(today, 1)),
      end: addWeeks(today, 12),
    });
  };

  // Generate weeks for column headers
  const weeks = useMemo(() => {
    return eachWeekOfInterval({ start: dateRange.start, end: dateRange.end });
  }, [dateRange]);

  const totalDays = differenceInDays(dateRange.end, dateRange.start) + 1;
  const dayWidth = 100 / totalDays;

  const getProjectPosition = (project: Project, offset = 0) => {
    if (!project.startDate && !project.endDate) return null;
    
    const startDate = project.startDate ? new Date(project.startDate) : (project.endDate ? subDays(new Date(project.endDate), 30) : new Date());
    const endDate = project.endDate ? new Date(project.endDate) : addDays(startDate, 30);
    
    const projectStartDiff = differenceInDays(startDate, dateRange.start) + offset;
    const projectEndDiff = differenceInDays(endDate, dateRange.start) + offset;
    
    // Project is completely outside visible range
    if (projectEndDiff < 0 || projectStartDiff > totalDays) {
      return { outOfView: true };
    }
    
    // Clamp to visible range
    const visibleStart = Math.max(0, projectStartDiff);
    const visibleEnd = Math.min(totalDays - 1, projectEndDiff);
    
    return {
      outOfView: false,
      left: `${visibleStart * dayWidth}%`,
      width: `${Math.max(1, (visibleEnd - visibleStart + 1)) * dayWidth}%`,
    };
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  };

  // Drag handlers
  const handleDragStart = (e: React.MouseEvent, project: Project) => {
    if (!onProjectUpdate) return;
    e.preventDefault();
    e.stopPropagation();
    setDraggingProject(project);
    setDragOffset(0);
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!draggingProject || !timelineRef.current) return;
    
    const timelineRect = timelineRef.current.getBoundingClientRect();
    const timelineWidth = timelineRect.width;
    const dayWidthPx = timelineWidth / totalDays;
    
    const startDate = draggingProject.startDate ? new Date(draggingProject.startDate) : new Date();
    
    const mouseX = e.clientX - timelineRect.left;
    const originalStartDiff = differenceInDays(startDate, dateRange.start);
    const originalStartPx = originalStartDiff * dayWidthPx;
    
    const newOffset = Math.round((mouseX - originalStartPx - 30) / dayWidthPx);
    setDragOffset(newOffset);
  };

  const handleDragEnd = () => {
    if (!draggingProject || dragOffset === 0) {
      setDraggingProject(null);
      setDragOffset(0);
      return;
    }

    const startDate = draggingProject.startDate ? new Date(draggingProject.startDate) : new Date();
    const endDate = draggingProject.endDate ? new Date(draggingProject.endDate) : addDays(startDate, 30);

    const newStartDate = addDays(startDate, dragOffset);
    const newEndDate = addDays(endDate, dragOffset);

    setPendingUpdate({
      project: draggingProject,
      newStartDate: format(newStartDate, 'yyyy-MM-dd'),
      newEndDate: format(newEndDate, 'yyyy-MM-dd'),
    });

    setDraggingProject(null);
    setDragOffset(0);
  };

  const handleConfirmUpdate = () => {
    if (!pendingUpdate || !onProjectUpdate) return;

    onProjectUpdate(pendingUpdate.project.id, {
      startDate: pendingUpdate.newStartDate,
      endDate: pendingUpdate.newEndDate,
    });
    toast({ title: 'Project updated', description: `${pendingUpdate.project.name} dates have been updated.` });
    setPendingUpdate(null);
  };

  const handleCancelUpdate = () => {
    setPendingUpdate(null);
  };

  return (
    <div className="space-y-4">
      {/* Date Range Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateRange('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateRange('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-8 gap-2 px-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d, yyyy')}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="range"
                selected={{ from: dateRange.start, to: dateRange.end }}
                onSelect={(range: DateRange | undefined) => {
                  if (range?.from && range?.to) {
                    setDateRange({ start: range.from, end: range.to });
                  } else if (range?.from) {
                    setDateRange({ start: range.from, end: addWeeks(range.from, 12) });
                  }
                }}
                numberOfMonths={2}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday}>
          Today
        </Button>
      </div>

      {/* Gantt Chart */}
      <div 
        className="rounded-lg border border-border bg-card overflow-hidden"
        onMouseMove={draggingProject ? handleDragMove : undefined}
        onMouseUp={draggingProject ? handleDragEnd : undefined}
        onMouseLeave={draggingProject ? handleDragEnd : undefined}
      >
        {/* Column Headers - Week view */}
        <div className="border-b border-border bg-muted">
          <div className="flex min-w-[900px]">
            <div className="w-72 shrink-0 border-r border-border px-4 py-2">
              <span className="text-sm font-medium text-foreground">Project</span>
            </div>
            <div className="flex-1 flex">
              {weeks.map((week, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-1 text-center py-2 text-sm border-r border-border last:border-r-0",
                    isToday(week) ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
                  )}
                >
                  {format(week, 'MMM d')}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Project Rows */}
        <div className="overflow-x-auto" ref={timelineRef}>
          <div className="min-w-[900px]">
            {projects.length > 0 ? (
              projects.map((project, index) => {
                const isDragging = draggingProject?.id === project.id;
                const position = getProjectPosition(project, isDragging ? dragOffset : 0);

                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="group flex border-b border-border hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    {/* Project Info Column */}
                    <div className="w-72 shrink-0 border-r border-border px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground line-clamp-1">
                          {project.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs h-5", 
                            project.status === 'active' ? 'border-info/50 text-info' :
                            project.status === 'on-hold' ? 'border-warning/50 text-warning' :
                            project.status === 'completed' ? 'border-success/50 text-success' : 
                            'border-muted text-muted-foreground'
                          )}
                        >
                          {project.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate">
                          {getProgramName(project.programId)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFocusProject(project);
                          }}
                          title="Focus on project"
                        >
                          <Focus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Timeline Column */}
                    <div className="flex-1 relative py-3 px-1">
                      {/* Week grid lines */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {weeks.map((_, i) => (
                          <div 
                            key={i} 
                            className="flex-1 border-r border-border/30 last:border-r-0"
                          />
                        ))}
                      </div>

                      {/* Today indicator */}
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
                        style={{ 
                          left: `${differenceInDays(new Date(), dateRange.start) * dayWidth}%`,
                          display: isWithinInterval(new Date(), { start: dateRange.start, end: dateRange.end }) ? 'block' : 'none'
                        }}
                      />

                      {/* Project Bar */}
                      {position && !position.outOfView ? (
                        <div
                          className={cn(
                            "absolute top-1/2 -translate-y-1/2 h-6 rounded-full flex items-center px-2 text-xs font-medium text-primary-foreground cursor-grab transition-all",
                            statusColors[project.status],
                            isDragging && "cursor-grabbing ring-2 ring-primary ring-offset-2"
                          )}
                          style={{ left: position.left, width: position.width }}
                          onMouseDown={(e) => handleDragStart(e, project)}
                        >
                          <span className="truncate">{project.name}</span>
                          <span className="ml-auto text-[10px] opacity-80">
                            {project.progress}%
                          </span>
                        </div>
                      ) : position?.outOfView ? (
                        <div className="absolute top-1/2 -translate-y-1/2 left-2 text-xs text-muted-foreground italic">
                          Outside view range
                        </div>
                      ) : (
                        <div className="absolute top-1/2 -translate-y-1/2 left-2 text-xs text-muted-foreground italic">
                          No dates set
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                No projects to display
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!pendingUpdate} onOpenChange={() => setPendingUpdate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Project Dates?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingUpdate && (
                <>
                  Move "{pendingUpdate.project.name}" to:
                  <br />
                  <strong>{format(new Date(pendingUpdate.newStartDate), 'MMM d, yyyy')}</strong> - <strong>{format(new Date(pendingUpdate.newEndDate), 'MMM d, yyyy')}</strong>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelUpdate}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmUpdate}>Update</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
