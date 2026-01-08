import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Task, TeamMember } from '@/types/portfolio';

interface TaskCalendarProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  onTaskEdit: (task: Task) => void;
}

const priorityDots = {
  high: 'bg-destructive',
  medium: 'bg-warning',
  low: 'bg-muted-foreground',
};

export function TaskCalendar({ tasks, teamMembers, onTaskEdit }: TaskCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const getTasksForDay = (day: Date) => {
    return tasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day));
  };

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-4">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/20">
        {weekDays.map((day) => (
          <div key={day} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          const dayTasks = getTasksForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());

          return (
            <motion.div
              key={day.toISOString()}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.01 }}
              className={cn(
                "min-h-[100px] border-b border-r border-border p-2",
                !isCurrentMonth && "bg-muted/30",
                index % 7 === 0 && "border-l-0",
                index < 7 && "border-t-0"
              )}
            >
              <div className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-sm",
                isToday && "bg-primary text-primary-foreground font-medium",
                !isToday && !isCurrentMonth && "text-muted-foreground",
                !isToday && isCurrentMonth && "text-foreground"
              )}>
                {format(day, 'd')}
              </div>
              
              <div className="mt-1 space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onTaskEdit(task)}
                    className={cn(
                      "group flex items-center gap-1 rounded px-1.5 py-0.5 text-xs cursor-pointer",
                      "hover:bg-accent transition-colors truncate",
                      task.status === 'done' && "opacity-50 line-through"
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", priorityDots[task.priority])} />
                    <span className="truncate text-foreground">{task.title}</span>
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-xs text-muted-foreground px-1.5">
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
