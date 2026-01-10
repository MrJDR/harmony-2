import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, Plus, X, Layers, Info, Users, Sparkles, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

interface ProgramsStepProps {
  onComplete: () => void;
  isComplete: boolean;
}

export function ProgramsStep({ onComplete, isComplete }: ProgramsStepProps) {
  const { toast } = useToast();
  const { portfolios, programs, addProgram, removeProgram, updateProgram, teamMembers } = useOnboardingData();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [portfolioId, setPortfolioId] = useState<string>('');
  const [expandedPortfolios, setExpandedPortfolios] = useState<string[]>([]);

  const handleAddProgram = () => {
    if (!name.trim()) {
      toast({ title: 'Please enter a program name', variant: 'destructive' });
      return;
    }

    addProgram({ 
      name: name.trim(), 
      description: description.trim(), 
      portfolioId: portfolioId || null 
    });
    setName('');
    setDescription('');
    setPortfolioId('');
  };

  const handleComplete = () => {
    if (programs.length > 0) {
      toast({
        title: `${programs.length} program(s) created!`,
        description: 'Now assign projects to programs.',
      });
    }
    onComplete();
  };

  const togglePortfolio = (id: string) => {
    setExpandedPortfolios(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      case 'manager': return 'outline';
      default: return 'outline';
    }
  };

  const getPortfolioName = (id: string | null) => {
    if (!id) return null;
    return portfolios.find(p => p.id === id)?.name;
  };

  const unassignedPrograms = programs.filter(p => !p.portfolioId);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
        <Layers className="h-10 w-10 text-primary shrink-0 mt-1" />
        <div>
          <h3 className="font-medium">Group related projects into programs</h3>
          <p className="text-sm text-muted-foreground">
            Programs help you organize related projects that share a common goal or theme.
            Assign each program to a portfolio for better organization.
          </p>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Example:</strong> A "Digital Transformation" program might include projects like
          "CRM Implementation", "Website Redesign", and "Mobile App Launch".
        </AlertDescription>
      </Alert>

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

      {/* Add program form */}
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="programName">Program Name</Label>
            <Input
              id="programName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digital Transformation"
              onKeyDown={(e) => e.key === 'Enter' && handleAddProgram()}
            />
          </div>
          <div>
            <Label htmlFor="portfolioSelect">Assign to Portfolio</Label>
            <Select value={portfolioId} onValueChange={setPortfolioId}>
              <SelectTrigger>
                <SelectValue placeholder="Select portfolio (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">No portfolio</SelectItem>
                {portfolios.map((portfolio) => (
                  <SelectItem key={portfolio.id} value={portfolio.id}>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3 w-3" />
                      {portfolio.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="programDescription">Description (optional)</Label>
          <Textarea
            id="programDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Strategic initiative to modernize our technology stack..."
            rows={2}
          />
        </div>
      </div>
      <Button onClick={handleAddProgram} variant="secondary" className="w-full sm:w-auto">
        <Plus className="h-4 w-4 mr-2" />
        Add Program
      </Button>

      {/* Programs organized by portfolio */}
      {programs.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm text-muted-foreground">
            Programs ({programs.length})
          </Label>
          
          {/* Programs grouped by portfolio */}
          {portfolios.map((portfolio) => {
            const portfolioPrograms = programs.filter(p => p.portfolioId === portfolio.id);
            if (portfolioPrograms.length === 0) return null;
            
            return (
              <Collapsible 
                key={portfolio.id} 
                open={expandedPortfolios.includes(portfolio.id)}
                onOpenChange={() => togglePortfolio(portfolio.id)}
              >
                <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-muted/50 text-left">
                  <ChevronDown className={`h-4 w-4 transition-transform ${expandedPortfolios.includes(portfolio.id) ? '' : '-rotate-90'}`} />
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-medium">{portfolio.name}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {portfolioPrograms.length} program{portfolioPrograms.length !== 1 ? 's' : ''}
                  </Badge>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-6 space-y-2 mt-2">
                  {portfolioPrograms.map((program) => (
                    <div 
                      key={program.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="font-medium">{program.name}</span>
                          {program.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {program.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProgram(program.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          })}

          {/* Unassigned programs */}
          {unassignedPrograms.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Unassigned Programs
              </p>
              {unassignedPrograms.map((program) => (
                <div 
                  key={program.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="font-medium">{program.name}</span>
                      {program.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {program.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select 
                      value="" 
                      onValueChange={(value) => updateProgram(program.id, { portfolioId: value || null })}
                    >
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue placeholder="Assign..." />
                      </SelectTrigger>
                      <SelectContent>
                        {portfolios.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProgram(program.id)}
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
          {programs.length > 0 ? 'Save & Continue' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
