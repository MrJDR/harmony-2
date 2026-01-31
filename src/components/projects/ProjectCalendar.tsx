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
import { parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Focus, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Project, TeamMember } from '@/types/portfolio';
import { useNavigate } from 'react-router-dom';
import { useWatch } from '@/contexts/WatchContext';
import type { ScheduleBlock } from '@/domains/schedule/model';

interface ProjectCalendarProps {
  projects: Project[];
  teamMembers: TeamMember[];
  scheduleBlocks?: ScheduleBlock[];
  programs?: Array<{ id: string; name: string }>;
}

const statusConfig: Record<string, { label: string; color: string; textColor: string }> = {
  'planning': { label: 'Planning', color: 'bg-muted-foreground', textColor: 'text-muted-foreground' },
  'active': { label: 'Active', color: 'bg-info', textColor: 'text-info' },
  'on-hold': { label: 'On Hold', color: 'bg-warning', textColor: 'text-warning' },
  'completed': { label: 'Completed', color: 'bg-success', textColor: 'text-success' },
};

export function ProjectCalendar({ projects, teamMembers, scheduleBlocks = [], programs = [] }: ProjectCalendarProps) {
  const navigate = useNavigate();
  const { isWatching } = useWatch();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [focusedProjectId, setFocusedProjectId] = useState<string | null>(null);

  const focusProject = (project: Project) => {
    const targetDate = project.startDate || project.endDate;
    if (targetDate) {
      setCurrentMonth(new Date(targetDate));
      setFocusedProjectId(project.id);
    }
  };

  const clearFocus = () => {
    setFocusedProjectId(null);
  };

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const getProjectsForDay = (day: Date) => {
    return projects.filter((p) => p.endDate && isSameDay(new Date(p.endDate), day));
  };

  const getBlocksForDay = (day: Date) => {
    return scheduleBlocks.filter((b) => {
      const start = parseISO(b.start_utc);
      const end = parseISO(b.end_utc);
      return isSameDay(start, day) || isSameDay(end, day) || (start <= day && end >= day);
    });
  };

  const getProgramName = (programId: string) => {
    return programs.find((p) => p.id === programId)?.name || '';
  };

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="flex gap-4">
      {/* Left Sidebar - Project List */}
      <div className="w-72 flex-shrink-0 rounded-lg border border-border bg-card overflow-visible">
        <div className="border-b border-border p-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground">All Projects</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{projects.length} projects</p>
        </div>
        <ScrollArea className="h-[500px]">
          <div className="p-2 space-y-1">
            {projects.map((project) => {
              const watching = isWatching(project.id, 'project');
              const isFocused = focusedProjectId === project.id;
              
              return (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className={cn(
                    "group rounded-lg p-2 hover:bg-muted cursor-pointer transition-colors hover:ring-1 hover:ring-primary/30",
                    isFocused && "ring-1 ring-primary bg-primary/5"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", statusConfig[project.status]?.color)} />
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium text-foreground truncate",
                        project.status === 'completed' && "line-through text-muted-foreground"
                      )}>
                        {project.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "text-[10px] px-1.5 py-0",
                            statusConfig[project.status]?.textColor
                          )}
                        >
                          {statusConfig[project.status]?.label}
                        </Badge>
                        {project.endDate && (
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(project.endDate), 'MMM d')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {(project.startDate || project.endDate) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-muted-foreground hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            focusProject(project);
                          }}
                          title="Focus on calendar"
                        >
                          <Focus className="h-3 w-3" />
                        </Button>
                      )}
                      {watching && (
                        <Eye className="h-3 w-3 text-primary" />
                      )}
                    </div>
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
            const dayProjects = getProjectsForDay(day);
            const dayBlocks = getBlocksForDay(day);
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
                  {dayBlocks.slice(0, 2).map((b) => (
                    <div
                      key={b.id}
                      className="rounded px-1.5 py-0.5 text-xs bg-muted/80 text-muted-foreground truncate"
                      title={b.title}
                    >
                      {b.title}
                    </div>
                  ))}
                  {dayBlocks.length > 2 && (
                    <div className="text-[10px] text-muted-foreground px-1.5">+{dayBlocks.length - 2} blocks</div>
                  )}
                  {dayProjects.slice(0, 2).map((project) => {
                    const isOverdue = project.endDate && new Date(project.endDate) < new Date() && project.status !== 'completed';
                    
                    return (
                      <div
                        key={project.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/projects/${project.id}`);
                        }}
                        className={cn(
                          "group flex items-center gap-1 rounded px-1.5 py-0.5 text-xs cursor-pointer transition-all",
                          "hover:ring-1 hover:ring-primary/50",
                          focusedProjectId === project.id && "ring-1 ring-primary bg-primary/10",
                          isOverdue ? "bg-destructive/10" : statusConfig[project.status]?.color.replace('bg-', 'bg-') + '/20'
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", isOverdue ? "bg-destructive" : statusConfig[project.status]?.color)} />
                        <span className="truncate font-medium">{project.name}</span>
                      </div>
                    );
                  })}
                  {dayProjects.length > 2 && (
                    <div className="text-[10px] text-muted-foreground px-1.5">
                      +{dayProjects.length - 2} more
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