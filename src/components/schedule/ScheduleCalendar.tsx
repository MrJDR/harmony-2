import { useMemo, useState, useCallback, useEffect } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  setHours,
  setMinutes,
  differenceInMinutes,
  differenceInDays,
  isWithinInterval,
  parseISO,
  startOfDay,
  endOfDay,
  getHours,
  getMinutes,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { ScheduleBlock } from '@/domains/schedule/model';
import type { Task, Project, Milestone, TeamMember } from '@/types/portfolio';

const WEEK_STARTS_ON = 1; // Monday
const HOUR_START = 6;
const HOUR_END = 22;
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
const MIN_HEIGHT = 24;
const ROWS_PER_DAY = HOUR_END - HOUR_START; // 16 rows per lane (one per hour)

export interface CalendarBlock {
  id: string;
  title: string;
  startUtc: string;
  endUtc: string;
  assigneeId: string | null;
  sourceType: 'manual' | 'task' | 'milestone';
  sourceId: string | null;
  items?: { title: string }[];
  isConflict?: boolean;
}

export type ViewMode = 'my-schedule' | 'my-team';

interface ScheduleCalendarProps {
  weekStart: Date;
  onWeekChange: (d: Date) => void;
  blocks: ScheduleBlock[];
  tasks: Task[];
  projects: Project[];
  milestones: Milestone[];
  teamMembers: TeamMember[];
  currentAssigneeId: string | null;
  viewMode: ViewMode;
  onDropFromSidebar?: (item: { type: string; id: string; title: string; assigneeId?: string | null }, date: Date, hour: number) => void;
  onBlockMove?: (blockId: string, newStartUtc: string, newEndUtc: string, oldStartUtc?: string, oldEndUtc?: string) => void;
  onEmptySlotDoubleClick?: (date: Date, hour: number, assigneeId: string | null) => void;
  createBlock?: (payload: { title: string; startUtc: string; endUtc: string; assigneeId: string | null }) => void;
  updateTaskDates?: (taskId: string, startDate: string | null, dueDate: string | null) => void;
  onConflictCountChange?: (count: number) => void;
}

function toLocal(dateUtc: string): Date {
  return parseISO(dateUtc);
}

function toUtc(d: Date): string {
  return d.toISOString();
}

function buildCalendarBlocks(
  blocks: ScheduleBlock[],
  tasks: Task[],
  projects: Project[],
  milestones: Milestone[]
): CalendarBlock[] {
  const result: CalendarBlock[] = [];

  for (const b of blocks) {
    result.push({
      id: b.id,
      title: b.title,
      startUtc: b.start_utc,
      endUtc: b.end_utc,
      assigneeId: b.assignee_id,
      sourceType: b.source_type as 'manual' | 'task' | 'milestone',
      sourceId: b.source_id,
    });
  }

  for (const t of tasks) {
    const start = t.startDate ? parseISO(t.startDate) : t.dueDate ? parseISO(t.dueDate) : null;
    const end = t.dueDate ? parseISO(t.dueDate) : t.startDate ? parseISO(t.startDate) : null;
    if (!start || !end) continue;
    const startUtc = toUtc(start);
    const endUtc = toUtc(end);
    const alreadyHasBlock = blocks.some((x) => x.source_type === 'task' && x.source_id === t.id);
    if (alreadyHasBlock) continue;
    result.push({
      id: `task-${t.id}`,
      title: t.title,
      startUtc,
      endUtc,
      assigneeId: t.assigneeId ?? null,
      sourceType: 'task',
      sourceId: t.id,
    });
  }

  for (const p of projects) {
    const start = p.startDate ? parseISO(p.startDate) : null;
    const end = p.endDate ? parseISO(p.endDate) : null;
    if (!start || !end) continue;
    const startUtc = toUtc(start);
    const endUtc = toUtc(end);
    result.push({
      id: `project-${p.id}`,
      title: p.name,
      startUtc,
      endUtc,
      assigneeId: null,
      sourceType: 'manual',
      sourceId: p.id,
    });
  }

  for (const m of milestones) {
    const day = parseISO(m.dueDate);
    const startUtc = toUtc(setMinutes(setHours(day, 9), 0));
    const endUtc = toUtc(setMinutes(setHours(day, 17), 0));
    const alreadyHasBlock = blocks.some((x) => x.source_type === 'milestone' && x.source_id === m.id);
    if (alreadyHasBlock) continue;
    result.push({
      id: `milestone-${m.id}`,
      title: m.title,
      startUtc,
      endUtc,
      assigneeId: null,
      sourceType: 'milestone',
      sourceId: m.id,
    });
  }

  return result;
}

function markConflicts(blocks: CalendarBlock[]): CalendarBlock[] {
  const out = blocks.map((b) => ({ ...b }));
  const byAssignee = new Map<string, CalendarBlock[]>();
  for (const b of out) {
    const key = b.assigneeId ?? '__unassigned__';
    if (!byAssignee.has(key)) byAssignee.set(key, []);
    byAssignee.get(key)!.push(b);
  }
  for (const list of byAssignee.values()) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        const aStart = new Date(a.startUtc).getTime();
        const aEnd = new Date(a.endUtc).getTime();
        const bStart = new Date(b.startUtc).getTime();
        const bEnd = new Date(b.endUtc).getTime();
        if (aStart < bEnd && aEnd > bStart) {
          a.isConflict = true;
          b.isConflict = true;
        }
      }
    }
  }
  return out;
}

/** Grid placement for a block in the week grid (7 cols × 16 rows). 1-based for CSS grid. Multi-day = one bar across columns. */
function blockToGridPlacement(
  block: CalendarBlock,
  weekStart: Date
): { colStart: number; colSpan: number; rowStart: number; rowSpan: number } | null {
  const start = toLocal(block.startUtc);
  const end = toLocal(block.endUtc);
  const startDayIndex = differenceInDays(start, weekStart);
  const endDayIndex = differenceInDays(end, weekStart);
  if (startDayIndex < 0 || endDayIndex >= 7) return null;
  const startCol = Math.max(0, startDayIndex) + 1;
  const endCol = Math.min(6, endDayIndex) + 1;
  const colSpan = endCol - startCol + 1;
  const startHour = getHours(start) + getMinutes(start) / 60;
  const endHour = getHours(end) + getMinutes(end) / 60;
  const startRow0 = Math.max(0, startHour - HOUR_START);
  const endRow0 = Math.min(ROWS_PER_DAY, endHour - HOUR_START);
  const rowStart = Math.max(1, Math.floor(startRow0) + 1);
  const rowSpan = Math.max(1, Math.ceil(endRow0) - Math.floor(startRow0));
  return { colStart: startCol, colSpan, rowStart, rowSpan };
}

function groupOverlapping(blocks: CalendarBlock[], dayStart: Date, dayEnd: Date): CalendarBlock[][] {
  const inDay = blocks.filter((b) => {
    const s = toLocal(b.startUtc);
    const e = toLocal(b.endUtc);
    return (
      isWithinInterval(s, { start: dayStart, end: dayEnd }) ||
      isWithinInterval(e, { start: dayStart, end: dayEnd }) ||
      (s <= dayStart && e >= dayEnd)
    );
  });
  inDay.sort((a, b) => toLocal(a.startUtc).getTime() - toLocal(b.startUtc).getTime());
  const groups: CalendarBlock[][] = [];
  let current: CalendarBlock[] = [];
  let lastEnd = 0;
  for (const b of inDay) {
    const start = toLocal(b.startUtc).getTime();
    if (current.length > 0 && start >= lastEnd) {
      groups.push([...current]);
      current = [];
    }
    current.push(b);
    lastEnd = Math.max(lastEnd, toLocal(b.endUtc).getTime());
  }
  if (current.length > 0) groups.push(current);
  return groups;
}

export function ScheduleCalendar({
  weekStart,
  onWeekChange,
  blocks,
  tasks,
  projects,
  milestones,
  teamMembers,
  currentAssigneeId,
  viewMode,
  onDropFromSidebar,
  onBlockMove,
  onEmptySlotDoubleClick,
  createBlock,
  updateTaskDates,
  onConflictCountChange,
}: ScheduleCalendarProps) {
  const weekStartNorm = useMemo(
    () => startOfWeek(weekStart, { weekStartsOn: WEEK_STARTS_ON }),
    [weekStart]
  );
  const weekEnd = useMemo(
    () => endOfWeek(weekStartNorm, { weekStartsOn: WEEK_STARTS_ON }),
    [weekStartNorm]
  );
  const days = useMemo(
    () => eachDayOfInterval({ start: weekStartNorm, end: weekEnd }),
    [weekStartNorm, weekEnd]
  );

  const allBlocks = useMemo(() => {
    const raw = buildCalendarBlocks(blocks, tasks, projects, milestones);
    return markConflicts(raw);
  }, [blocks, tasks, projects, milestones]);

  const conflictCount = useMemo(
    () => allBlocks.filter((b) => b.isConflict).length,
    [allBlocks]
  );

  useEffect(() => {
    onConflictCountChange?.(conflictCount);
  }, [conflictCount, onConflictCountChange]);

  const lanes = useMemo(() => {
    if (viewMode === 'my-schedule') {
      const me = currentAssigneeId ? teamMembers.find((m) => m.id === currentAssigneeId) : null;
      return me ? [{ id: me.id, name: me.name }] : [{ id: '', name: 'Unassigned' }];
    }
    return teamMembers.map((m) => ({ id: m.id, name: m.name }));
  }, [viewMode, currentAssigneeId, teamMembers]);

  const blocksByLane = useMemo(() => {
    const byLane = new Map<string, CalendarBlock[]>();
    for (const lane of lanes) {
      const list = allBlocks.filter((b) => (b.assigneeId ?? '') === (lane.id ?? ''));
      byLane.set(lane.id, list);
    }
    return byLane;
  }, [lanes, allBlocks]);

  const goPrev = () => onWeekChange(subWeeks(weekStartNorm, 1));
  const goNext = () => onWeekChange(addWeeks(weekStartNorm, 1));
  const goToday = () => onWeekChange(startOfWeek(new Date(), { weekStartsOn: WEEK_STARTS_ON }));

  const [draggingBlock, setDraggingBlock] = useState<CalendarBlock | null>(null);
  const [dropTarget, setDropTarget] = useState<{ date: Date; hour: number; laneId: string } | null>(null);

  const handleDragOver = useCallback(
    (e: React.DragEvent, date: Date, hour: number, laneId: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDropTarget({ date, hour, laneId });
    },
    []
  );
  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);
  const handleDrop = useCallback(
    (e: React.DragEvent, date: Date, hour: number, laneId: string) => {
      e.preventDefault();
      setDropTarget(null);
      try {
        const raw = e.dataTransfer.getData('application/json');
        if (raw) {
          const item = JSON.parse(raw) as { type: string; id: string; title: string; assigneeId?: string | null };
          onDropFromSidebar?.(item, date, hour);
          return;
        }
      } catch {
        // ignore
      }
      if (draggingBlock) {
        const start = setMinutes(setHours(date, hour), 0);
        const end = setMinutes(setHours(date, hour + 1), 0);
        const duration = differenceInMinutes(toLocal(draggingBlock.endUtc), toLocal(draggingBlock.startUtc));
        const newEnd = new Date(start.getTime() + duration * 60 * 1000);
        onBlockMove?.(draggingBlock.id, toUtc(start), toUtc(newEnd), draggingBlock.startUtc, draggingBlock.endUtc);
      }
      setDraggingBlock(null);
    },
    [draggingBlock, onDropFromSidebar, onBlockMove, updateTaskDates]
  );

  const handleSlotDoubleClick = useCallback(
    (date: Date, hour: number, laneId: string) => {
      const assigneeId = laneId || null;
      onEmptySlotDoubleClick?.(date, hour, assigneeId);
      if (createBlock) {
        const start = setMinutes(setHours(date, hour), 0);
        const end = setMinutes(setHours(date, hour + 1), 0);
        createBlock({
          title: 'New block',
          startUtc: toUtc(start),
          endUtc: toUtc(end),
          assigneeId,
        });
      }
    },
    [onEmptySlotDoubleClick, createBlock]
  );

  return (
    <div className="flex flex-col rounded-lg border border-border/80 bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/80 px-3 py-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goPrev} aria-label="Previous week">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goNext} aria-label="Next week">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToday} className="text-muted-foreground">
            Today
          </Button>
        </div>
        <span className="text-sm font-medium text-foreground">
          {format(weekStartNorm, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
        </span>
      </div>
      <ScrollArea className="flex-1">
        <div className="min-w-[800px] p-3">
          <div className="grid gap-px bg-border/60 rounded-md overflow-hidden mb-2" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
            {days.map((day) => (
              <div key={day.toISOString()} className="bg-muted/30 p-2 text-xs font-medium text-muted-foreground text-center">
                {format(day, 'EEE')}
                <span className="block text-[10px] font-normal">{format(day, 'd MMM')}</span>
              </div>
            ))}
          </div>
          <div className="grid gap-3">
            {lanes.map((lane) => {
              const laneBlocks = blocksByLane.get(lane.id) ?? [];
              return (
                <div key={lane.id || 'unassigned'} className="rounded-md border border-border/60 bg-muted/20 overflow-hidden">
                  <div className="border-b border-border/60 px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    {lane.name || 'Unassigned'}
                  </div>
                  <div
                    className="grid gap-px bg-border/60"
                    style={{
                      gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
                      gridTemplateRows: `repeat(${ROWS_PER_DAY}, ${MIN_HEIGHT}px)`,
                    }}
                  >
                    {days.map((day) =>
                      HOURS.map((hour) => {
                        const slotStart = setMinutes(setHours(day, hour), 0);
                        const isDropTarget =
                          dropTarget?.date.getTime() === day.getTime() &&
                          dropTarget?.hour === hour &&
                          dropTarget?.laneId === lane.id;
                        const dayIndex = days.findIndex((d) => d.getTime() === day.getTime());
                        const hourIndex = hour - HOUR_START;
                        return (
                          <div
                            key={`${day.toISOString()}-${hour}`}
                            className={cn(
                              'border-b border-border/40 cursor-cell bg-background/80',
                              isDropTarget && 'bg-primary/10 ring-1 ring-primary/30'
                            )}
                            style={{
                              gridColumn: dayIndex + 1,
                              gridRow: hourIndex + 1,
                            }}
                            onDragOver={(e) => handleDragOver(e, day, hour, lane.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, day, hour, lane.id)}
                            onDoubleClick={() => handleSlotDoubleClick(day, hour, lane.id)}
                          >
                            {hour === HOUR_START && (
                              <span className="text-[10px] text-muted-foreground pl-0.5">
                                {format(slotStart, 'HH:mm')}
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                    {laneBlocks.map((block) => {
                      const placement = blockToGridPlacement(block, weekStartNorm);
                      if (!placement) return null;
                      const { colStart, colSpan, rowStart, rowSpan } = placement;
                      return (
                        <div
                          key={block.id}
                          className={cn(
                            'rounded border border-border/80 bg-card shadow-sm overflow-hidden pointer-events-auto flex flex-col justify-center px-1 min-h-0',
                            block.isConflict && 'border-l-4 border-l-destructive'
                          )}
                          style={{
                            gridColumn: `${colStart} / span ${colSpan}`,
                            gridRow: `${rowStart} / span ${rowSpan}`,
                            minHeight: 20,
                          }}
                          draggable={!!onBlockMove}
                          onDragStart={() => setDraggingBlock(block)}
                          onDragEnd={() => setDraggingBlock(null)}
                        >
                          <div className="p-0.5 text-xs truncate text-foreground font-medium">
                            {block.title}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
