import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Check, Plus, X, FolderKanban, Layers, Users, Sparkles, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useOnboardingData } from '@/contexts/OnboardingDataContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface ProjectsStepProps {
  onComplete: () => void;
  isComplete: boolean;
}

export function ProjectsStep({ onComplete, isComplete }: ProjectsStepProps) {
  const { toast } = useToast();
  const { portfolios, programs, projects, addProject, removeProject, updateProject, teamMembers } = useOnboardingData();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('planning');
  const [programId, setProgramId] = useState<string>('');
  const [expandedPrograms, setExpandedPrograms] = useState<string[]>([]);

  const handleAddProject = () => {
    if (!name.trim()) {
      toast({ title: 'Please enter a project name', variant: 'destructive' });
      return;
    }

    addProject({ 
      name: name.trim(), 
      description: description.trim(), 
      status,
      programId: programId || null 
    });
    setName('');
    setDescription('');
    setStatus('planning');
    setProgramId('');
  };

  const handleComplete = () => {
    if (projects.length > 0) {
      toast({
        title: `${projects.length} project(s) created!`,
        description: 'You can manage projects in detail from the Projects page.',
      });
    }
    onComplete();
  };

  const toggleProgram = (id: string) => {
    setExpandedPrograms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
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

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      case 'manager': return 'outline';
      default: return 'outline';
    }
  };

  const getProgramName = (id: string | null) => {
    if (!id) return null;
    return programs.find(p => p.id === id)?.name;
  };

  const getPortfolioForProgram = (programId: string | null) => {
    if (!programId) return null;
    const program = programs.find(p => p.id === programId);
    if (!program?.portfolioId) return null;
    return portfolios.find(p => p.id === program.portfolioId);
  };

  const unassignedProjects = projects.filter(p => !p.programId);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
        <FolderKanban className="h-10 w-10 text-primary shrink-0 mt-1" />
        <div>
          <h3 className="font-medium">Create your projects</h3>
          <p className="text-sm text-muted-foreground">
            Projects are the building blocks of your portfolio. Each project contains tasks,
            has a team, and tracks progress toward a goal. Assign projects to programs for better organization.
          </p>
        </div>
      </div>

      {/* Hierarchy context */}
      {(portfolios.length > 0 || programs.length > 0) && (
        <div className="p-3 rounded-lg border bg-muted/30 text-sm">
          <p className="font-medium mb-2">Your hierarchy so far:</p>
          <div className="space-y-1">
            {portfolios.map((portfolio) => {
              const portfolioPrograms = programs.filter(p => p.portfolioId === portfolio.id);
              return (
                <div key={portfolio.id} className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <span>{portfolio.name}</span>
                    {portfolioPrograms.length > 0 && (
                      <div className="pl-4 mt-1 space-y-1">
                        {portfolioPrograms.map((program) => (
                          <div key={program.id} className="flex items-center gap-2 text-muted-foreground">
                            <Layers className="h-3 w-3" />
                            <span>{program.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {programs.filter(p => !p.portfolioId).length > 0 && (
              <div className="text-muted-foreground">
                + {programs.filter(p => !p.portfolioId).length} unassigned program(s)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Team members context */}
      {teamMembers.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Team available:</span>
          <div className="flex items-center gap-1">
            <TooltipProvider>
              {teamMembers.slice(0, 5).map((member) => (
                <Tooltip key={member.id}>
                  <TooltipTrigger asChild>
                    <Avatar className="h-6 w-6 border-2 border-background -ml-1 first:ml-0">
                      <AvatarFallback className="text-xs">
                        {member.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                    <Badge variant={getRoleBadgeVariant(member.role)} className="mt-1 text-xs">
                      {member.role}
                    </Badge>
                    {member.isPending && (
                      <Badge variant="outline" className="ml-1 text-xs text-amber-600">Pending</Badge>
                    )}
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
            {teamMembers.length > 5 && (
              <span className="text-xs text-muted-foreground ml-1">
                +{teamMembers.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

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
              onKeyDown={(e) => e.key === 'Enter' && handleAddProject()}
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="programSelect">Assign to Program</Label>
            <Select value={programId} onValueChange={setProgramId}>
              <SelectTrigger>
                <SelectValue placeholder="Select program (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">No program</SelectItem>
                {programs.map((program) => {
                  const portfolio = getPortfolioForProgram(program.id);
                  return (
                    <SelectItem key={program.id} value={program.id}>
                      <div className="flex items-center gap-2">
                        <Layers className="h-3 w-3" />
                        {program.name}
                        {portfolio && (
                          <span className="text-xs text-muted-foreground">
                            ({portfolio.name})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="projectDescription">Description (optional)</Label>
            <Textarea
              id="projectDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the project goals..."
              rows={1}
            />
          </div>
        </div>
      </div>
      <Button onClick={handleAddProject} variant="secondary" className="w-full sm:w-auto">
        <Plus className="h-4 w-4 mr-2" />
        Add Project
      </Button>

      {/* Projects organized by program */}
      {projects.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm text-muted-foreground">
            Projects ({projects.length})
          </Label>
          
          {/* Projects grouped by program */}
          {programs.map((program) => {
            const programProjects = projects.filter(p => p.programId === program.id);
            if (programProjects.length === 0) return null;
            
            const portfolio = getPortfolioForProgram(program.id);
            
            return (
              <Collapsible 
                key={program.id} 
                open={expandedPrograms.includes(program.id)}
                onOpenChange={() => toggleProgram(program.id)}
              >
                <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-muted/50 text-left">
                  <ChevronDown className={`h-4 w-4 transition-transform ${expandedPrograms.includes(program.id) ? '' : '-rotate-90'}`} />
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="font-medium">{program.name}</span>
                  {portfolio && (
                    <span className="text-xs text-muted-foreground">
                      in {portfolio.name}
                    </span>
                  )}
                  <Badge variant="secondary" className="ml-auto">
                    {programProjects.length} project{programProjects.length !== 1 ? 's' : ''}
                  </Badge>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-6 space-y-2 mt-2">
                  {programProjects.map((project) => (
                    <div 
                      key={project.id}
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
                        onClick={() => removeProject(project.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          })}

          {/* Unassigned projects */}
          {unassignedProjects.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <FolderKanban className="h-4 w-4" />
                Unassigned Projects
              </p>
              {unassignedProjects.map((project) => (
                <div 
                  key={project.id}
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
                  <div className="flex items-center gap-2">
                    <Select 
                      value="" 
                      onValueChange={(value) => updateProject(project.id, { programId: value || null })}
                    >
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue placeholder="Assign..." />
                      </SelectTrigger>
                      <SelectContent>
                        {programs.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProject(project.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
