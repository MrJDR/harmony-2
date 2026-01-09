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

export function TeamMemberModal({ open, onOpenChange, member, projects, onSave }: TeamMemberModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [allocation, setAllocation] = useState(50);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  useEffect(() => {
    if (member) {
      setName(member.name);
      setEmail(member.email);
      setRole(member.role);
      setAllocation(member.allocation);
      setSelectedProjects(member.projectIds);
    } else {
      setName('');
      setEmail('');
      setRole('');
      setAllocation(50);
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

  const getAllocationColor = (value: number) => {
    if (value >= 100) return 'text-destructive';
    if (value >= 85) return 'text-warning';
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
              <Label>Allocation</Label>
              <span className={cn('font-semibold', getAllocationColor(allocation))}>
                {allocation}%
              </span>
            </div>
            <Slider
              value={[allocation]}
              onValueChange={(values) => setAllocation(values[0])}
              max={150}
              step={5}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              {allocation < 50 && 'Available for new assignments'}
              {allocation >= 50 && allocation < 85 && 'Balanced workload'}
              {allocation >= 85 && allocation < 100 && 'Near capacity'}
              {allocation >= 100 && 'Overallocated - consider redistributing'}
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
