import { useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays, addDays, addWeeks, subWeeks, startOfWeek, eachWeekOfInterval, eachDayOfInterval, subDays, isWithinInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, ChevronDown, Calendar, Focus } from 'lucide-react';
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
  
  // Expanded programs for showing projects
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());
  
  // Drag state
  const [draggingProgram, setDraggingProgram] = useState<Program | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [pendingUpdate, setPendingUpdate] = useState<{ program: Program; newStartDate: string; newEndDate: string } | null>(null);

  const toggleExpanded = (programId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedPrograms(prev => {
      const next = new Set(prev);
      if (next.has(programId)) {
        next.delete(programId);
      } else {
        next.add(programId);
      }
      return next;
    });
  };

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
        end: addWeeks(today, 8),
      };
    }

    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

    return {
      start: startOfWeek(subDays(minDate, 7)),
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
      start: startOfWeek(subDays(start, 7)),
      end: addWeeks(end, 2),
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
      end: addWeeks(today, 8),
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

  const getProjectPosition = (project: Project) => {
    if (!project.startDate && !project.endDate) return null;
    
    const startDate = project.startDate ? new Date(project.startDate) : (project.endDate ? subDays(new Date(project.endDate), 30) : new Date());
    const endDate = project.endDate ? new Date(project.endDate) : addDays(startDate, 30);
    
    const projectStartDiff = differenceInDays(startDate, dateRange.start);
    const projectEndDiff = differenceInDays(endDate, dateRange.start);
    
    if (projectEndDiff < 0 || projectStartDiff > totalDays) {
      return { outOfView: true };
    }
    
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
  const handleDragStart = (e: React.MouseEvent, program: Program) => {
    if (!onProgramUpdate) return;
    e.preventDefault();
    e.stopPropagation();
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
            <PopoverContent className="w-auto p-0 bg-popover border border-border shadow-lg z-50" align="start">
              <CalendarComponent
                mode="range"
                selected={{ from: dateRange.start, to: dateRange.end }}
                onSelect={(range: DateRange | undefined) => {
                  if (range?.from && range?.to) {
                    setDateRange({ start: range.from, end: range.to });
                  } else if (range?.from) {
                    setDateRange({ start: range.from, end: addWeeks(range.from, 8) });
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
            <div className="w-80 shrink-0 border-r border-border px-4 py-2">
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

        {/* Day Headers - Shows when dragging */}
        {draggingProgram && (
          <div className="border-b border-border bg-primary/5">
            <div className="flex min-w-[900px]">
              <div className="w-80 shrink-0 border-r border-border px-4 py-1">
                <span className="text-xs text-primary font-medium">Dragging: {draggingProgram.name}</span>
              </div>
              <div className="flex-1 flex">
                {days.map((day, i) => (
                  <div
                    key={i}
                    className={cn(
                      "text-center py-1 text-[10px] border-r border-border/30 last:border-r-0",
                      isToday(day) ? "bg-primary/20 text-primary font-bold" : 
                      day.getDay() === 0 || day.getDay() === 6 ? "bg-muted text-muted-foreground" : "text-muted-foreground"
                    )}
                    style={{ width: `${dayWidth}%` }}
                  >
                    {format(day, 'd')}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Program Rows */}
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {programs.length > 0 ? (
              programs.map((program, index) => {
                const data = programData.get(program.id);
                const isDragging = draggingProgram?.id === program.id;
                const position = getProgramPosition(program, isDragging ? dragOffset : 0);
                const isExpanded = expandedPrograms.has(program.id);
                const programProjects = projects.filter(p => p.programId === program.id);

                return (
                  <div key={program.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="group flex border-b border-border hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => onProgramClick(program.id)}
                    >
                      {/* Expand/Collapse Button */}
                      <div className="w-8 shrink-0 flex items-center justify-center border-r border-border">
                        {programProjects.length > 0 ? (
                          <button
                            onClick={(e) => toggleExpanded(program.id, e)}
                            className="p-1 hover:bg-muted rounded transition-colors"
                          >
                            <ChevronDown 
                              className={cn(
                                "h-4 w-4 text-muted-foreground transition-transform",
                                !isExpanded && "-rotate-90"
                              )} 
                            />
                          </button>
                        ) : (
                          <div className="w-4" />
                        )}
                      </div>

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
                          {programProjects.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {programProjects.length} project{programProjects.length !== 1 ? 's' : ''}
                            </span>
                          )}
                          {(data?.startDate || data?.endDate) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFocusProgram(program);
                              }}
                              title="Focus on this program's date range"
                            >
                              <Focus className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Timeline Column */}
                      <div ref={index === 0 ? timelineRef : undefined} className="flex-1 relative py-3 px-2">
                        {/* Day grid lines */}
                        <div className="absolute inset-0 flex pointer-events-none">
                          {days.map((day, i) => (
                            <div 
                              key={i} 
                              className={cn(
                                "border-r last:border-r-0",
                                day.getDay() === 0 ? "border-border" : "border-border/20",
                                day.getDay() === 0 || day.getDay() === 6 ? "bg-muted" : "",
                                isToday(day) ? "bg-primary/10" : ""
                              )}
                              style={{ width: `${dayWidth}%` }}
                            />
                          ))}
                        </div>

                        {/* Program Bar */}
                        {position && !position.outOfView ? (
                          <div
                            className={cn(
                              "absolute top-1/2 -translate-y-1/2 h-7 rounded",
                              "flex items-center justify-center text-xs font-medium text-white px-2",
                              "select-none",
                              statusColors[program.status],
                              isDragging 
                                ? "opacity-80 shadow-lg cursor-grabbing z-10 ring-2 ring-primary ring-offset-2" 
                                : onProgramUpdate 
                                  ? "cursor-grab hover:h-9 hover:shadow-md transition-all" 
                                  : "cursor-pointer hover:h-9 hover:shadow-md transition-all"
                            )}
                            style={{ left: position.left, width: position.width, minWidth: '60px' }}
                            onMouseDown={(e) => onProgramUpdate ? handleDragStart(e, program) : undefined}
                            onClick={(e) => {
                              if (!onProgramUpdate) {
                                e.stopPropagation();
                                onProgramClick(program.id);
                              }
                            }}
                            title={onProgramUpdate ? "Drag to reschedule" : `${program.name}`}
                          >
                            <span className="truncate">{program.name}</span>
                            {data && (
                              <span className="ml-auto text-[10px] opacity-80 pl-1">
                                {data.avgProgress}%
                              </span>
                            )}
                          </div>
                        ) : position?.outOfView ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs text-muted-foreground italic">Out of view</span>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs text-muted-foreground italic">No dates set</span>
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* Expanded Projects */}
                    <AnimatePresence>
                      {isExpanded && programProjects.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="bg-muted/50"
                        >
                          {programProjects.map((project) => {
                            const projectPosition = getProjectPosition(project);
                            return (
                              <div
                                key={project.id}
                                className="flex border-b border-border/50 hover:bg-muted/80 transition-colors"
                              >
                                {/* Indent space */}
                                <div className="w-8 shrink-0 border-r border-border/50" />
                                
                                {/* Project Info */}
                                <div className="w-72 shrink-0 border-r border-border/50 px-3 py-2 pl-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                                    <span className="text-sm text-muted-foreground line-clamp-1">
                                      {project.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5 ml-3.5">
                                    <Badge 
                                      variant="outline" 
                                      className={cn("text-[10px] h-4", 
                                        project.status === 'active' ? 'border-info/50 text-info' :
                                        project.status === 'on-hold' ? 'border-warning/50 text-warning' :
                                        project.status === 'completed' ? 'border-success/50 text-success' : 
                                        'border-muted text-muted-foreground'
                                      )}
                                    >
                                      {project.status}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground">
                                      {project.progress}%
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Project Timeline */}
                                <div className="flex-1 relative py-2 px-2">
                                  {/* Day grid lines */}
                                  <div className="absolute inset-0 flex pointer-events-none">
                                    {days.map((day, i) => (
                                      <div 
                                        key={i} 
                                        className={cn(
                                          "border-r last:border-r-0",
                                          day.getDay() === 0 ? "border-border/50" : "border-border/10",
                                          day.getDay() === 0 || day.getDay() === 6 ? "bg-muted/50" : "",
                                          isToday(day) ? "bg-primary/5" : ""
                                        )}
                                        style={{ width: `${dayWidth}%` }}
                                      />
                                    ))}
                                  </div>

                                  {/* Project Bar */}
                                  {projectPosition && !projectPosition.outOfView ? (
                                    <div
                                      className={cn(
                                        "absolute top-1/2 -translate-y-1/2 h-5 rounded",
                                        "flex items-center text-[10px] font-medium text-white px-1.5",
                                        statusColors[project.status],
                                        "opacity-70"
                                      )}
                                      style={{ left: projectPosition.left, width: projectPosition.width, minWidth: '40px' }}
                                    >
                                      <span className="truncate">{project.name}</span>
                                    </div>
                                  ) : projectPosition?.outOfView ? (
                                    <div className="absolute inset-0 flex items-center">
                                      <span className="text-[10px] text-muted-foreground italic ml-2">Out of view</span>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                No programs to display
              </div>
            )}
          </div>
        </div>

        {/* Status Legend */}
        <div className="border-t border-border px-4 py-3 bg-muted">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-muted-foreground font-medium">Status:</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-muted-foreground/60" />
              <span className="text-muted-foreground">Planning</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-primary" />
              <span className="text-muted-foreground">Active</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-warning" />
              <span className="text-muted-foreground">On Hold</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-success" />
              <span className="text-muted-foreground">Completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!pendingUpdate} onOpenChange={(open) => !open && handleCancelUpdate()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reschedule Program</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {pendingUpdate && (
                  <>
                    <span>Move <strong>"{pendingUpdate.program.name}"</strong> to:</span>
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-muted-foreground">Start Date:</span>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="w-[160px] justify-start text-left font-normal">
                              <Calendar className="mr-2 h-4 w-4" />
                              {format(new Date(pendingUpdate.newStartDate), 'MMM d, yyyy')}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-popover border border-border shadow-lg z-50" align="end">
                            <CalendarComponent
                              mode="single"
                              selected={new Date(pendingUpdate.newStartDate)}
                              onSelect={(date) => {
                                if (date) {
                                  setPendingUpdate(prev => prev ? { ...prev, newStartDate: format(date, 'yyyy-MM-dd') } : null);
                                }
                              }}
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-muted-foreground">End Date:</span>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="w-[160px] justify-start text-left font-normal">
                              <Calendar className="mr-2 h-4 w-4" />
                              {format(new Date(pendingUpdate.newEndDate), 'MMM d, yyyy')}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-popover border border-border shadow-lg z-50" align="end">
                            <CalendarComponent
                              mode="single"
                              selected={new Date(pendingUpdate.newEndDate)}
                              onSelect={(date) => {
                                if (date) {
                                  setPendingUpdate(prev => prev ? { ...prev, newEndDate: format(date, 'yyyy-MM-dd') } : null);
                                }
                              }}
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmUpdate}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
