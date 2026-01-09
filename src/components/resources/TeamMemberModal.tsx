import { useState, useEffect, useMemo } from 'react';
import { TeamMember, Project, Task } from '@/types/portfolio';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Search, Check, FolderKanban, ListTodo, HelpCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationsContext';

interface TeamMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: TeamMember | null;
  projects: Project[];
  onSave: (
    member: Omit<TeamMember, 'id'> & { id?: string }, 
    unassignedTasks?: Task[],
    newlyAssignedTaskIds?: string[]
  ) => void;
}

export function TeamMemberModal({ open, onOpenChange, member, projects, onSave }: TeamMemberModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [capacity, setCapacity] = useState(40);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
  const [assignedTaskIds, setAssignedTaskIds] = useState<string[]>([]);
  const [projectSearch, setProjectSearch] = useState('');
  const { addNotification } = useNotifications();

  // Get all tasks from all projects
  const allTasks = useMemo(() => {
    return projects.flatMap(p => p.tasks);
  }, [projects]);

  // Get initial tasks assigned to this member
  const initialMemberTaskIds = useMemo(() => {
    if (!member?.id) return [];
    return allTasks.filter(t => t.assigneeId === member.id).map(t => t.id);
  }, [allTasks, member?.id]);

  // Get tasks that are currently assigned (based on local state)
  const memberTasks = useMemo(() => {
    return allTasks.filter(t => assignedTaskIds.includes(t.id));
  }, [allTasks, assignedTaskIds]);

  // Calculate allocation from task weights
  const allocation = useMemo(() => {
    return memberTasks.reduce((sum, task) => sum + (task.weight || 0), 0);
  }, [memberTasks]);

  // Filter projects by search term
  const filteredProjects = useMemo(() => {
    if (!projectSearch.trim()) return projects;
    const search = projectSearch.toLowerCase();
    return projects.filter(p => 
      p.name.toLowerCase().includes(search) || 
      p.status.toLowerCase().includes(search)
    );
  }, [projects, projectSearch]);

  useEffect(() => {
    if (member) {
      setName(member.name);
      setEmail(member.email);
      setRole(member.role);
      setCapacity(member.capacity);
      setSelectedProjects(member.projectIds);
      setAssignedTaskIds(initialMemberTaskIds);
      setExpandedProjects([]);
    } else {
      setName('');
      setEmail('');
      setRole('');
      setCapacity(40);
      setSelectedProjects([]);
      setAssignedTaskIds([]);
      setExpandedProjects([]);
      setProjectSearch('');
    }
  }, [member, open, initialMemberTaskIds]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Find tasks that were unassigned (were in initial but not in current)
    const unassignedTasks = allTasks.filter(
      t => initialMemberTaskIds.includes(t.id) && !assignedTaskIds.includes(t.id)
    );

    // Find tasks that were newly assigned (not in initial but in current)
    const newlyAssignedTaskIds = assignedTaskIds.filter(
      id => !initialMemberTaskIds.includes(id)
    );
    
    // Send notifications for unassigned tasks grouped by project
    if (unassignedTasks.length > 0) {
      const tasksByProject = unassignedTasks.reduce((acc, task) => {
        const project = projects.find(p => p.tasks.some(t => t.id === task.id));
        if (project) {
          if (!acc[project.id]) {
            acc[project.id] = { project, tasks: [] };
          }
          acc[project.id].tasks.push(task);
        }
        return acc;
      }, {} as Record<string, { project: Project; tasks: Task[] }>);

      Object.values(tasksByProject).forEach(({ project, tasks }) => {
        addNotification({
          type: 'warning',
          title: 'Tasks Need Reassignment',
          message: `${tasks.length} task(s) in "${project.name}" were unassigned from ${name} and need to be reassigned.`,
          link: `/projects/${project.id}`,
          projectId: project.id,
        });
      });
    }

    onSave({
      id: member?.id,
      name,
      email,
      role,
      allocation,
      capacity,
      projectIds: selectedProjects,
    }, unassignedTasks, newlyAssignedTaskIds);
    onOpenChange(false);
  };

  const toggleProject = (projectId: string) => {
    const isRemoving = selectedProjects.includes(projectId);
    
    if (isRemoving) {
      // When unchecking a project, also unassign all tasks from that project
      const projectTaskIds = projects
        .find(p => p.id === projectId)
        ?.tasks.map(t => t.id) || [];
      setAssignedTaskIds(prev => prev.filter(id => !projectTaskIds.includes(id)));
      setExpandedProjects(prev => prev.filter(id => id !== projectId));
    }
    
    setSelectedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const toggleProjectExpanded = (projectId: string) => {
    setExpandedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const toggleTaskAssignment = (taskId: string) => {
    setAssignedTaskIds(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const getAllocationColor = (value: number, max: number = 40) => {
    const ratio = (value / max) * 100;
    if (ratio >= 100) return 'text-destructive';
    if (ratio >= 85) return 'text-warning';
    return 'text-success';
  };

  const getAllocationBg = (value: number, max: number = 40) => {
    const ratio = (value / max) * 100;
    if (ratio >= 100) return 'bg-destructive';
    if (ratio >= 85) return 'bg-warning';
    return 'bg-success';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{member ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@company.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Senior Developer, Project Manager"
              required
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>Capacity</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs z-[100]">
                      <p>The maximum number of points this team member can handle. 1 point = ~1 hour of estimated work.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={capacity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setCapacity(Math.max(1, Math.min(100, val)));
                  }}
                  className="w-16 h-7 text-right font-semibold px-2"
                  min={1}
                  max={100}
                />
                <span className="text-sm text-muted-foreground">pts</span>
              </div>
            </div>
            <Slider
              value={[capacity]}
              onValueChange={(values) => setCapacity(values[0])}
              min={1}
              max={100}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              {capacity <= 20 && 'Part-time or reduced capacity'}
              {capacity > 20 && capacity <= 40 && 'Standard capacity'}
              {capacity > 40 && 'Extended capacity (can handle more work)'}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>Current Allocation</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs z-[100]">
                      <p>Total points from assigned tasks. 1 point = ~1 hour of estimated work. Calculated automatically from task weights.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className={cn('font-semibold', getAllocationColor(allocation, capacity))}>
                {allocation} / {capacity} pts
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div 
                className={cn(
                  "h-full rounded-full transition-all",
                  getAllocationBg(allocation, capacity)
                )}
                style={{ width: `${Math.min((allocation / capacity) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {allocation === 0 && 'No tasks assigned'}
              {allocation > 0 && allocation < capacity * 0.5 && 'Available for more work'}
              {allocation >= capacity * 0.5 && allocation < capacity * 0.85 && 'Balanced workload'}
              {allocation >= capacity * 0.85 && allocation < capacity && 'Near capacity'}
              {allocation >= capacity && 'Overallocated'}
            </p>
          </div>

          {/* Project Assignments - Now above tasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Project Assignments</Label>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {selectedProjects.length} selected
                </Badge>
                {selectedProjects.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      // Also clear all task assignments when clearing projects
                      setAssignedTaskIds([]);
                      setSelectedProjects([]);
                      setExpandedProjects([]);
                    }}
                  >
                    Clear all
                  </Button>
                )}
              </div>
            </div>
            
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>

            <ScrollArea className="h-64 rounded-md border border-border">
              <div className="p-2 space-y-1">
                {filteredProjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                    <FolderKanban className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No projects found</p>
                  </div>
                ) : (
                  filteredProjects.map(project => {
                    const isSelected = selectedProjects.includes(project.id);
                    const isExpanded = expandedProjects.includes(project.id);
                    const projectTasks = project.tasks;
                    const assignedProjectTasks = projectTasks.filter(t => assignedTaskIds.includes(t.id));
                    const projectPoints = assignedProjectTasks.reduce((sum, t) => sum + (t.weight || 0), 0);
                    
                    return (
                      <div key={project.id}>
                        <div
                          className={cn(
                            "w-full flex items-center gap-2 p-2 rounded-md text-left transition-colors",
                            isSelected
                              ? "bg-primary/10 border border-primary/30"
                              : "hover:bg-muted border border-transparent"
                          )}
                        >
                          {/* Expand/Collapse button - only show if project is selected */}
                          {isSelected && projectTasks.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => toggleProjectExpanded(project.id)}
                              className="p-0.5 hover:bg-muted rounded"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </button>
                          ) : (
                            <div className="w-5" />
                          )}
                          
                          {/* Project checkbox */}
                          <button
                            type="button"
                            onClick={() => toggleProject(project.id)}
                            className={cn(
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                              isSelected
                                ? "bg-primary border-primary text-primary-foreground"
                                : "border-muted-foreground/30 hover:border-muted-foreground/50"
                            )}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5" />}
                          </button>
                          
                          <div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => toggleProject(project.id)}
                          >
                            <p className="text-sm font-medium truncate">{project.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {assignedProjectTasks.length > 0 
                                ? `${assignedProjectTasks.length} task(s) assigned • ${projectPoints} pts`
                                : isSelected 
                                  ? `${projectTasks.length} tasks available`
                                  : `${project.progress}% complete`
                              }
                            </p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs shrink-0",
                              project.status === 'active' && "border-success/50 text-success",
                              project.status === 'planning' && "border-info/50 text-info",
                              project.status === 'on-hold' && "border-warning/50 text-warning",
                              project.status === 'completed' && "border-muted-foreground/50 text-muted-foreground"
                            )}
                          >
                            {project.status}
                          </Badge>
                        </div>
                        
                        {/* Task list - only show when project is selected and expanded */}
                        {isSelected && isExpanded && projectTasks.length > 0 && (
                          <div className="ml-7 mt-1 space-y-1 pb-2">
                            {projectTasks.map(task => {
                              const isTaskAssigned = assignedTaskIds.includes(task.id);
                              return (
                                <div
                                  key={task.id}
                                  className={cn(
                                    "flex items-center gap-2 p-2 rounded-md transition-colors",
                                    isTaskAssigned ? "bg-muted/70" : "hover:bg-muted/50"
                                  )}
                                >
                                  <Checkbox
                                    checked={isTaskAssigned}
                                    onCheckedChange={() => toggleTaskAssignment(task.id)}
                                    className="shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm truncate">{task.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {task.status} • {task.priority}
                                    </p>
                                  </div>
                                  <Badge variant="outline" className="shrink-0 text-xs">
                                    {task.weight} pts
                                  </Badge>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
            <p className="text-xs text-muted-foreground">
              Select projects to assign, then expand to assign specific tasks. Unassigning a project will unassign all its tasks.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {member ? 'Save Changes' : 'Add Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}