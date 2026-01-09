import { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface TeamMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: TeamMember | null;
  projects: Project[];
  onSave: (member: Omit<TeamMember, 'id'> & { id?: string }) => void;
}

// Base allocation per project (can be customized per project in future)
const BASE_ALLOCATION_PER_PROJECT = 25;

export function TeamMemberModal({ open, onOpenChange, member, projects, onSave }: TeamMemberModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [capacity, setCapacity] = useState(100);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  // Calculate allocation dynamically based on selected projects
  const allocation = selectedProjects.length * BASE_ALLOCATION_PER_PROJECT;

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
      setCapacity(100);
      setSelectedProjects([]);
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
              <Label>Calculated Allocation</Label>
              <span className={cn('font-semibold', getAllocationColor(allocation, capacity))}>
                {allocation}% / {capacity}%
              </span>
            </div>
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
              {selectedProjects.length === 0 && 'No projects assigned'}
              {selectedProjects.length > 0 && allocation < capacity * 0.5 && `${selectedProjects.length} project(s) - Available for more`}
              {selectedProjects.length > 0 && allocation >= capacity * 0.5 && allocation < capacity * 0.85 && `${selectedProjects.length} project(s) - Balanced workload`}
              {selectedProjects.length > 0 && allocation >= capacity * 0.85 && allocation < capacity && `${selectedProjects.length} project(s) - Near capacity`}
              {selectedProjects.length > 0 && allocation >= capacity && `${selectedProjects.length} project(s) - Overallocated`}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Project Assignments</Label>
            <ScrollArea className="h-40 rounded-md border border-border p-3">
              <div className="space-y-2">
                {projects.map(project => (
                  <div key={project.id} className="flex items-center gap-3">
                    <Checkbox
                      id={project.id}
                      checked={selectedProjects.includes(project.id)}
                      onCheckedChange={() => toggleProject(project.id)}
                    />
                    <label htmlFor={project.id} className="flex-1 cursor-pointer text-sm">
                      {project.name}
                    </label>
                    <Badge variant="outline" className="text-xs">
                      {project.status}
                    </Badge>
                  </div>
                ))}
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
