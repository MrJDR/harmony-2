import { useMemo, useState } from 'react';
import { Search, Layers, FolderKanban, CheckSquare, Flag, ChevronRight, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Program, Project, Task, Milestone } from '@/types/portfolio';

export type ScheduleItemType = 'program' | 'project' | 'task' | 'milestone';

export interface ScheduleSidebarItem {
  type: ScheduleItemType;
  id: string;
  title: string;
  assigneeId?: string | null;
  parentId?: string;
}

export interface ScheduleSidebarProps {
  programs: Program[];
  projects: Project[];
  tasks: Task[];
  milestones: Milestone[];
  onDragStart?: (item: ScheduleSidebarItem) => void;
  onDragEnd?: () => void;
}

function normalize(s: string) {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

function matchesQuery(item: { title: string }, q: string) {
  if (!q) return true;
  return normalize(item.title).includes(normalize(q));
}

export function ScheduleSidebar({
  programs,
  projects,
  tasks,
  milestones,
  onDragStart,
  onDragEnd,
}: ScheduleSidebarProps) {
  const [search, setSearch] = useState('');
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const toggleProgram = (id: string) => {
    setExpandedPrograms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleProject = (id: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) {
      return { programs, projects, tasks, milestones };
    }
    const programIds = new Set(programs.filter((p) => matchesQuery({ title: p.name }, q)).map((p) => p.id));
    const projectIds = new Set(
      projects.filter((p) => programIds.has(p.programId) || matchesQuery({ title: p.name }, q)).map((p) => p.id)
    );
    const taskIds = new Set(
      tasks.filter((t) => projectIds.has(t.projectId) || matchesQuery(t, q)).map((t) => t.id)
    );
    const milestoneIds = new Set(
      milestones.filter((m) => projectIds.has(m.projectId) || matchesQuery(m, q)).map((m) => m.id)
    );
    return {
      programs: programs.filter((p) => programIds.has(p.id)),
      projects: projects.filter((p) => projectIds.has(p.id)),
      tasks: tasks.filter((t) => taskIds.has(t.id)),
      milestones: milestones.filter((m) => milestoneIds.has(m.id)),
    };
  }, [search, programs, projects, tasks, milestones]);

  const handleDragStart = (e: React.DragEvent, item: ScheduleSidebarItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart?.(item);
  };

  const handleDragEnd = () => {
    onDragEnd?.();
  };

  const renderItem = (item: ScheduleSidebarItem, icon: React.ReactNode) => (
    <div
      key={`${item.type}-${item.id}`}
      draggable
      onDragStart={(e) => handleDragStart(e, item)}
      onDragEnd={handleDragEnd}
      className={cn(
        'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-grab active:cursor-grabbing',
        'border border-transparent hover:border-border hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'text-foreground flex-1 min-w-0'
      )}
      aria-label={`Drag ${item.type} ${item.title} onto calendar`}
    >
      {icon}
      <span className="flex-1 truncate text-muted-foreground font-normal">{item.title}</span>
    </div>
  );

  return (
    <div className="flex h-full flex-col rounded-lg border border-border/80 bg-card overflow-hidden">
      <div className="flex-shrink-0 border-b border-border/80 p-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search programs, projects, tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-sm border-border/60 bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Search schedule items"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {filtered.programs.map((program) => {
            const programProjects = filtered.projects.filter((p) => p.programId === program.id);
            const isExpanded = expandedPrograms.has(program.id) || search.length > 0;
            return (
              <div key={program.id}>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleProgram(program.id)}
                    className="p-0.5 rounded hover:bg-muted/50 text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={isExpanded ? 'Collapse program' : 'Expand program'}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </button>
                  {renderItem(
                    { type: 'program', id: program.id, title: program.name },
                    <Layers className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
                {isExpanded &&
                  programProjects.map((project) => {
                    const projectTasks = filtered.tasks.filter((t) => t.projectId === project.id);
                    const projectMilestones = filtered.milestones.filter((m) => m.projectId === project.id);
                    const projExpanded = expandedProjects.has(project.id) || search.length > 0;
                    return (
                      <div key={project.id} className="ml-4">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggleProject(project.id)}
                            className="p-0.5 rounded hover:bg-muted/50 text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label={projExpanded ? 'Collapse project' : 'Expand project'}
                          >
                            {projExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </button>
                          {renderItem(
                            { type: 'project', id: project.id, title: project.name },
                            <FolderKanban className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                        {projExpanded && (
                          <div className="ml-6 space-y-0.5">
                            {projectTasks.map((task) =>
                              renderItem(
                                {
                                  type: 'task',
                                  id: task.id,
                                  title: task.title,
                                  assigneeId: task.assigneeId,
                                },
                                <CheckSquare className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                              )
                            )}
                            {projectMilestones.map((m) =>
                              renderItem(
                                { type: 'milestone', id: m.id, title: m.title },
                                <Flag className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                              )
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
