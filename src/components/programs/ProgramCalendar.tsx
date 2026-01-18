import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Focus, FolderKanban, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Program, Project, Task } from '@/types/portfolio';
import { useNavigate } from 'react-router-dom';

interface ProgramCalendarProps {
  programs: Program[];
  projects: Project[];
  tasks: Task[];
  onProgramClick: (programId: string) => void;
}

const statusConfig: Record<string, { label: string; color: string; textColor: string }> = {
  'planning': { label: 'Planning', color: 'bg-muted-foreground', textColor: 'text-muted-foreground' },
  'active': { label: 'Active', color: 'bg-info', textColor: 'text-info' },
  'on-hold': { label: 'On Hold', color: 'bg-warning', textColor: 'text-warning' },
  'completed': { label: 'Completed', color: 'bg-success', textColor: 'text-success' },
};

export function ProgramCalendar({ programs, projects, tasks, onProgramClick }: ProgramCalendarProps) {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [focusedProgramId, setFocusedProgramId] = useState<string | null>(null);

  // Calculate program stats
  const programStats = useMemo(() => {
    const stats = new Map<string, { projectCount: number; taskCount: number; completedTasks: number; avgProgress: number }>();
    
    programs.forEach((program) => {
      const programProjects = projects.filter((p) => p.programId === program.id);
      const programTasks = tasks.filter((t) => programProjects.some((p) => p.id === t.projectId));
      const completedTasks = programTasks.filter((t) => t.status === 'done').length;
      const avgProgress = programProjects.length > 0
        ? Math.round(programProjects.reduce((acc, p) => acc + p.progress, 0) / programProjects.length)
        : 0;

      stats.set(program.id, {
        projectCount: programProjects.length,
        taskCount: programTasks.length,
        completedTasks,
        avgProgress,
      });
    });

    return stats;
  }, [programs, projects, tasks]);

  const focusProgram = (program: Program) => {
    // Programs don't have dates by default, so use the earliest/latest project dates
    const programProjects = projects.filter((p) => p.programId === program.id);
    const projectDates = programProjects
      .flatMap((p) => [p.startDate, p.endDate])
      .filter(Boolean)
      .map((d) => new Date(d as string));
    
    if (projectDates.length > 0) {
      const earliest = new Date(Math.min(...projectDates.map((d) => d.getTime())));
      setCurrentMonth(earliest);
      setFocusedProgramId(program.id);
    }
  };

  const clearFocus = () => {
    setFocusedProgramId(null);
  };

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Get programs that have projects with due dates on a specific day
  const getProgramsForDay = (day: Date) => {
    return programs.filter((program) => {
      const programProjects = projects.filter((p) => p.programId === program.id);
      return programProjects.some((p) => p.endDate && isSameDay(new Date(p.endDate), day));
    });
  };

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="flex gap-4">
      {/* Left Sidebar - Program List */}
      <div className="w-72 flex-shrink-0 rounded-lg border border-border bg-card overflow-visible">
        <div className="border-b border-border p-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground">All Programs</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{programs.length} programs</p>
        </div>
        <ScrollArea className="h-[500px]">
          <div className="p-2 space-y-1">
            {programs.map((program) => {
              const stats = programStats.get(program.id);
              const isFocused = focusedProgramId === program.id;
              
              return (
                <div
                  key={program.id}
                  onClick={() => onProgramClick(program.id)}
                  className={cn(
                    "group rounded-lg p-2 hover:bg-muted cursor-pointer transition-colors hover:ring-1 hover:ring-primary/30",
                    isFocused && "ring-1 ring-primary bg-primary/5"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", statusConfig[program.status]?.color)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {program.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "text-[10px] px-1.5 py-0",
                            statusConfig[program.status]?.textColor
                          )}
                        >
                          {statusConfig[program.status]?.label}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {stats?.projectCount || 0} projects
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        focusProgram(program);
                      }}
                      title="Focus on calendar"
                    >
                      <Focus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Right Side - Calendar */}
      <div className="flex-1 rounded-lg border border-border bg-card overflow-hidden" onClick={clearFocus}>
        {/* Calendar Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <h2 className="font-display text-lg font-semibold text-foreground ml-2">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
          </div>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>

        {/* Week day headers */}
        <div className="grid grid-cols-7 border-b border-border bg-muted">
          {weekDays.map((day) => (
            <div key={day} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dayPrograms = getProgramsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[90px] border-b border-r border-border p-1.5",
                  !isCurrentMonth && "bg-muted",
                  index % 7 === 6 && "border-r-0"
                )}
              >
                <div className="flex items-center justify-end gap-1 mb-1">
                  {isToday && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary">
                      Today
                    </Badge>
                  )}
                  <span className={cn(
                    "text-sm",
                    isToday && "flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium",
                    !isToday && !isCurrentMonth && "text-muted-foreground",
                    !isToday && isCurrentMonth && "text-foreground"
                  )}>
                    {format(day, 'd')}
                  </span>
                </div>
                
                <div className="space-y-0.5">
                  {dayPrograms.slice(0, 2).map((program) => {
                    const stats = programStats.get(program.id);
                    
                    return (
                      <div
                        key={program.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onProgramClick(program.id);
                        }}
                        className={cn(
                          "group flex items-center gap-1 rounded px-1.5 py-0.5 text-xs cursor-pointer transition-all",
                          "hover:ring-1 hover:ring-primary/50",
                          focusedProgramId === program.id && "ring-1 ring-primary bg-primary/10",
                          statusConfig[program.status]?.color.replace('bg-', 'bg-') + '/20'
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", statusConfig[program.status]?.color)} />
                        <span className="truncate font-medium">{program.name}</span>
                      </div>
                    );
                  })}
                  {dayPrograms.length > 2 && (
                    <div className="text-[10px] text-muted-foreground px-1.5">
                      +{dayPrograms.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}