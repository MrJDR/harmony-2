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
import { cn } from '@/lib/utils';
import { Search, Check, FolderKanban, ListTodo } from 'lucide-react';

interface TeamMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: TeamMember | null;
  projects: Project[];
  onSave: (member: Omit<TeamMember, 'id'> & { id?: string }) => void;
}

export function TeamMemberModal({ open, onOpenChange, member, projects, onSave }: TeamMemberModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [capacity, setCapacity] = useState(40);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [projectSearch, setProjectSearch] = useState('');

  // Get all tasks from all projects
  const allTasks = useMemo(() => {
    return projects.flatMap(p => p.tasks);
  }, [projects]);

  // Get tasks assigned to this member (simulated by member id)
  const memberTasks = useMemo(() => {
    if (!member?.id) return [];
    return allTasks.filter(t => t.assigneeId === member.id);
  }, [allTasks, member?.id]);

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
    } else {
      setName('');
      setEmail('');
      setRole('');
      setCapacity(40);
      setSelectedProjects([]);
      setProjectSearch('');
    }
  }, [member, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: member?.id,
      name,
      email,
      role,
      allocation,
      capacity,
      projectIds: selectedProjects,
    });
    onOpenChange(false);
  };

  const toggleProject = (projectId: string) => {
    setSelectedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
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
                <span className="text-xs text-muted-foreground">(max points)</span>
              </div>
              <span className="font-semibold text-foreground">
                {capacity} pts
              </span>
            </div>
            <Slider
              value={[capacity]}
              onValueChange={(values) => setCapacity(values[0])}
              min={10}
              max={100}
              step={5}
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
                <span className="text-xs text-muted-foreground">(from tasks)</span>
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

          {/* Assigned Tasks (read-only) */}
          {member && memberTasks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Assigned Tasks</Label>
                <Badge variant="secondary" className="text-xs">
                  {memberTasks.length} task{memberTasks.length !== 1 && 's'}
                </Badge>
              </div>
              <ScrollArea className="h-32 rounded-md border border-border">
                <div className="p-2 space-y-1">
                  {memberTasks.map(task => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <ListTodo className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate">{task.title}</span>
                      </div>
                      <Badge variant="outline" className="shrink-0 ml-2">
                        {task.weight} pts
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground">
                Allocation is calculated from task weights. Manage tasks in the project view.
              </p>
            </div>
          )}

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
                    onClick={() => setSelectedProjects([])}
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

            <ScrollArea className="h-48 rounded-md border border-border">
              <div className="p-2 space-y-1">
                {filteredProjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                    <FolderKanban className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No projects found</p>
                  </div>
                ) : (
                  filteredProjects.map(project => {
                    const isSelected = selectedProjects.includes(project.id);
                    const projectTasks = project.tasks.filter(t => t.assigneeId === member?.id);
                    const projectPoints = projectTasks.reduce((sum, t) => sum + (t.weight || 0), 0);
                    return (
                      <button
                        key={project.id}
                        type="button"
                        onClick={() => toggleProject(project.id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors",
                          isSelected
                            ? "bg-primary/10 border border-primary/30"
                            : "hover:bg-muted border border-transparent"
                        )}
                      >
                        <div className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/30"
                        )}>
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{project.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {projectTasks.length > 0 
                              ? `${projectTasks.length} task(s) • ${projectPoints} pts`
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
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
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