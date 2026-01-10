import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Check, Plus, X, FolderKanban, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProjectsStepProps {
  onComplete: () => void;
  isComplete: boolean;
}

interface Project {
  name: string;
  description: string;
  status: string;
}

export function ProjectsStep({ onComplete, isComplete }: ProjectsStepProps) {
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('planning');
  const [projects, setProjects] = useState<Project[]>([]);

  const addProject = () => {
    if (!name.trim()) {
      toast({ title: 'Please enter a project name', variant: 'destructive' });
      return;
    }

    setProjects([...projects, { name: name.trim(), description: description.trim(), status }]);
    setName('');
    setDescription('');
    setStatus('planning');
  };

  const removeProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  const handleComplete = () => {
    // In a real implementation, you'd save these projects to the database
    if (projects.length > 0) {
      toast({
        title: `${projects.length} project(s) created!`,
        description: 'You can manage projects in detail from the Projects page.',
      });
    }
    onComplete();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-yellow-500';
      case 'active': return 'bg-green-500';
      case 'on-hold': return 'bg-orange-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
        <FolderKanban className="h-10 w-10 text-primary shrink-0 mt-1" />
        <div>
          <h3 className="font-medium">Create your first project</h3>
          <p className="text-sm text-muted-foreground">
            Projects are the building blocks of your portfolio. Each project contains tasks,
            has a team, and tracks progress toward a goal.
          </p>
        </div>
      </div>

      {/* Add project form */}
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Website Redesign"
            />
          </div>
          <div>
            <Label htmlFor="projectStatus">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="projectDescription">Description (optional)</Label>
          <Textarea
            id="projectDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the project goals..."
            rows={2}
          />
        </div>
      </div>
      <Button onClick={addProject} variant="secondary" className="w-full sm:w-auto">
        <Plus className="h-4 w-4 mr-2" />
        Add Project
      </Button>

      {/* Projects list */}
      {projects.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Projects ({projects.length})
          </Label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {projects.map((project, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <FolderKanban className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="font-medium">{project.name}</span>
                    {project.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {project.description}
                      </p>
                    )}
                  </div>
                  <Badge className={`${getStatusColor(project.status)} text-white text-xs`}>
                    {project.status}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeProject(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <Button onClick={handleComplete}>
          {isComplete ? (
            <Check className="h-4 w-4 mr-2" />
          ) : null}
          {projects.length > 0 ? 'Save & Continue' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
