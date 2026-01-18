import { useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { format, differenceInDays, addDays, addWeeks, subWeeks, startOfWeek, eachWeekOfInterval, eachDayOfInterval, subDays, isWithinInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Focus, FolderKanban } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
import { Program, Project, Task } from '@/types/portfolio';
import { DateRange } from 'react-day-picker';
import { useToast } from '@/hooks/use-toast';

interface ProgramGanttProps {
  programs: Program[];
  projects: Project[];
  tasks: Task[];
  onProgramClick: (programId: string) => void;
  onProgramUpdate?: (programId: string, updates: Partial<Program & { startDate?: string; endDate?: string }>) => void;
}

const statusColors: Record<string, string> = {
  planning: 'bg-muted-foreground/60',
  active: 'bg-primary',
  'on-hold': 'bg-warning',
  completed: 'bg-success',
};

export function ProgramGantt({ programs, projects, tasks, onProgramClick, onProgramUpdate }: ProgramGanttProps) {
  const { toast } = useToast();
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Drag state
  const [draggingProgram, setDraggingProgram] = useState<Program | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [pendingUpdate, setPendingUpdate] = useState<{ program: Program; newStartDate: string; newEndDate: string } | null>(null);

  // Calculate program stats and date ranges
  const programData = useMemo(() => {
    const data = new Map<string, { projectCount: number; avgProgress: number; startDate?: Date; endDate?: Date }>();
    
    programs.forEach((program) => {
      const programProjects = projects.filter((p) => p.programId === program.id);
      const avgProgress = programProjects.length > 0
        ? Math.round(programProjects.reduce((acc, p) => acc + p.progress, 0) / programProjects.length)
        : 0;

      // Get date range from projects
      const projectDates: Date[] = [];
      programProjects.forEach((p) => {
        if (p.startDate) projectDates.push(new Date(p.startDate));
        if (p.endDate) projectDates.push(new Date(p.endDate));
      });

      const startDate = projectDates.length > 0 ? new Date(Math.min(...projectDates.map((d) => d.getTime()))) : undefined;
      const endDate = projectDates.length > 0 ? new Date(Math.max(...projectDates.map((d) => d.getTime()))) : undefined;

      data.set(program.id, {
        projectCount: programProjects.length,
        avgProgress,
        startDate,
        endDate,
      });
    });

    return data;
  }, [programs, projects]);

  // Calculate initial date range from programs
  const initialRange = useMemo(() => {
    const allDates: Date[] = [];
    programData.forEach((data) => {
      if (data.startDate) allDates.push(data.startDate);
      if (data.endDate) allDates.push(data.endDate);
    });

    if (allDates.length === 0) {
      const today = new Date();
      return {
        start: startOfWeek(subWeeks(today, 1)),
        end: addWeeks(today, 12),
      };
    }

    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

    return {
      start: startOfWeek(subDays(minDate, 14)),
      end: addWeeks(maxDate, 4),
    };
  }, [programData]);

  const [dateRange, setDateRange] = useState(initialRange);

  const handleFocusProgram = (program: Program) => {
    const data = programData.get(program.id);
    if (!data?.startDate && !data?.endDate) return;
    
    const start = data.startDate || (data.endDate ? subDays(data.endDate, 30) : new Date());
    const end = data.endDate || addDays(start, 30);
    
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

  // Generate days for grid lines
  const days = useMemo(() => {
    return eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  }, [dateRange]);

  const totalDays = differenceInDays(dateRange.end, dateRange.start) + 1;
  const dayWidth = 100 / totalDays;

  const getProgramPosition = (program: Program, offset = 0) => {
    const data = programData.get(program.id);
    if (!data?.startDate || !data?.endDate) return null;
    
    const startDate = data.startDate;
    const endDate = data.endDate;
    
    const programStartDiff = differenceInDays(startDate, dateRange.start) + offset;
    const programEndDiff = differenceInDays(endDate, dateRange.start) + offset;
    
    // Program is completely outside visible range
    if (programEndDiff < 0 || programStartDiff > totalDays) {
      return { outOfView: true };
    }
    
    // Clamp to visible range
    const visibleStart = Math.max(0, programStartDiff);
    const visibleEnd = Math.min(totalDays - 1, programEndDiff);
    
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
  const handleDragStart = (e: React.MouseEvent, program: Program) => {
    if (!onProgramUpdate) return;
    e.preventDefault();
    setDraggingProgram(program);
    setDragOffset(0);
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!draggingProgram || !timelineRef.current) return;
    
    const timelineRect = timelineRef.current.getBoundingClientRect();
    const timelineWidth = timelineRect.width;
    const dayWidthPx = timelineWidth / totalDays;
    
    const data = programData.get(draggingProgram.id);
    if (!data?.startDate) return;
    
    const mouseX = e.clientX - timelineRect.left;
    const originalStartDiff = differenceInDays(data.startDate, dateRange.start);
    const originalStartPx = originalStartDiff * dayWidthPx;
    
    const newOffset = Math.round((mouseX - originalStartPx - 30) / dayWidthPx);
    setDragOffset(newOffset);
  };

  const handleDragEnd = () => {
    if (!draggingProgram || dragOffset === 0) {
      setDraggingProgram(null);
      setDragOffset(0);
      return;
    }

    const data = programData.get(draggingProgram.id);
    if (!data?.startDate || !data?.endDate) {
      setDraggingProgram(null);
      setDragOffset(0);
      return;
    }

    const newStartDate = addDays(data.startDate, dragOffset);
    const newEndDate = addDays(data.endDate, dragOffset);

    setPendingUpdate({
      program: draggingProgram,
      newStartDate: format(newStartDate, 'yyyy-MM-dd'),
      newEndDate: format(newEndDate, 'yyyy-MM-dd'),
    });

    setDraggingProgram(null);
    setDragOffset(0);
  };

  const handleConfirmUpdate = () => {
    if (!pendingUpdate || !onProgramUpdate) return;

    onProgramUpdate(pendingUpdate.program.id, {
      startDate: pendingUpdate.newStartDate,
      endDate: pendingUpdate.newEndDate,
    });
    toast({ title: 'Program updated', description: `${pendingUpdate.program.name} dates have been updated.` });
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
        onMouseMove={draggingProgram ? handleDragMove : undefined}
        onMouseUp={draggingProgram ? handleDragEnd : undefined}
        onMouseLeave={draggingProgram ? handleDragEnd : undefined}
      >
        {/* Column Headers - Week view */}
        <div className="border-b border-border bg-muted">
          <div className="flex min-w-[900px]">
            <div className="w-72 shrink-0 border-r border-border px-4 py-2">
              <span className="text-sm font-medium text-foreground">Program</span>
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

        {/* Program Rows */}
        <div className="overflow-x-auto" ref={timelineRef}>
          <div className="min-w-[900px]">
            {programs.length > 0 ? (
              programs.map((program, index) => {
                const data = programData.get(program.id);
                const isDragging = draggingProgram?.id === program.id;
                const position = getProgramPosition(program, isDragging ? dragOffset : 0);

                return (
                  <motion.div
                    key={program.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="group flex border-b border-border hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => onProgramClick(program.id)}
                  >
                    {/* Program Info Column */}
                    <div className="w-72 shrink-0 border-r border-border px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground line-clamp-1">
                          {program.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs h-5", 
                            program.status === 'active' ? 'border-info/50 text-info' :
                            program.status === 'on-hold' ? 'border-warning/50 text-warning' :
                            program.status === 'completed' ? 'border-success/50 text-success' : 
                            'border-muted text-muted-foreground'
                          )}
                        >
                          {program.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {data?.projectCount || 0} projects
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 ml-auto opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFocusProgram(program);
                          }}
                          title="Focus"
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

                      {/* Program Bar */}
                      {position && !position.outOfView ? (
                        <div
                          className={cn(
                            "absolute top-1/2 -translate-y-1/2 h-6 rounded-full flex items-center px-2 text-xs font-medium text-primary-foreground cursor-grab transition-all",
                            statusColors[program.status],
                            isDragging && "cursor-grabbing ring-2 ring-primary ring-offset-2"
                          )}
                          style={{ left: position.left, width: position.width }}
                          onMouseDown={(e) => handleDragStart(e, program)}
                        >
                          <span className="truncate">{program.name}</span>
                          {data && (
                            <span className="ml-auto text-[10px] opacity-80">
                              {data.avgProgress}%
                            </span>
                          )}
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
                No programs to display
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!pendingUpdate} onOpenChange={() => setPendingUpdate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Program Dates?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingUpdate && (
                <>
                  Move "{pendingUpdate.program.name}" to:
                  <br />
                  <strong>{format(new Date(pendingUpdate.newStartDate), 'MMM d, yyyy')}</strong> - <strong>{format(new Date(pendingUpdate.newEndDate), 'MMM d, yyyy')}</strong>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelUpdate}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmUpdate}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}