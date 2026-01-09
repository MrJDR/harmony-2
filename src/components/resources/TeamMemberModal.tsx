import { useState, useEffect, useMemo } from 'react';
import { TeamMember, Project } from '@/types/portfolio';
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
import { Search, X, Check, FolderKanban } from 'lucide-react';

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
  const [allocation, setAllocation] = useState(0);
  const [capacity, setCapacity] = useState(100);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [projectSearch, setProjectSearch] = useState('');

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
      setAllocation(member.allocation);
      setCapacity(member.capacity);
      setSelectedProjects(member.projectIds);
    } else {
      setName('');
      setEmail('');
      setRole('');
      setAllocation(0);
      setCapacity(100);
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

  const getAllocationColor = (value: number, max: number = 100) => {
    const ratio = (value / max) * 100;
    if (ratio >= 100) return 'text-destructive';
    if (ratio >= 85) return 'text-warning';
    return 'text-success';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
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
                <Label>Capacity Limit</Label>
                <span className="text-xs text-muted-foreground">(max hours/workload)</span>
              </div>
              <span className="font-semibold text-foreground">
                {capacity}%
              </span>
            </div>
            <Slider
              value={[capacity]}
              onValueChange={(values) => setCapacity(values[0])}
              min={20}
              max={150}
              step={5}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              {capacity < 100 && 'Part-time or reduced capacity'}
              {capacity === 100 && 'Standard full-time capacity'}
              {capacity > 100 && 'Extended capacity (can handle overtime)'}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>Current Allocation</Label>
                <span className="text-xs text-muted-foreground">(workload %)</span>
              </div>
              <span className={cn('font-semibold', getAllocationColor(allocation, capacity))}>
                {allocation}% / {capacity}%
              </span>
            </div>
            <Slider
              value={[allocation]}
              onValueChange={(values) => setAllocation(values[0])}
              min={0}
              max={200}
              step={5}
              className="w-full"
            />
            <div className="h-2 w-full rounded-full bg-muted">
              <div 
                className={cn(
                  "h-full rounded-full transition-all",
                  allocation >= capacity ? "bg-destructive" : allocation >= capacity * 0.85 ? "bg-warning" : "bg-success"
                )}
                style={{ width: `${Math.min((allocation / capacity) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {allocation === 0 && 'No workload assigned'}
              {allocation > 0 && allocation < capacity * 0.5 && 'Available for more work'}
              {allocation >= capacity * 0.5 && allocation < capacity * 0.85 && 'Balanced workload'}
              {allocation >= capacity * 0.85 && allocation < capacity && 'Near capacity'}
              {allocation >= capacity && 'Overallocated'}
            </p>
          </div>

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
                            {project.progress}% complete
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
