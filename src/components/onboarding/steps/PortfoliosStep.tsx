import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Check, Plus, X, Sparkles, Info, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useOnboardingData } from '@/contexts/OnboardingDataContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PortfoliosStepProps {
  onComplete: () => void;
  isComplete: boolean;
}

export function PortfoliosStep({ onComplete, isComplete }: PortfoliosStepProps) {
  const { toast } = useToast();
  const { portfolios, addPortfolio, removePortfolio, teamMembers } = useOnboardingData();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleAddPortfolio = () => {
    if (!name.trim()) {
      toast({ title: 'Please enter a portfolio name', variant: 'destructive' });
      return;
    }

    addPortfolio({ name: name.trim(), description: description.trim() });
    setName('');
    setDescription('');
  };

  const handleComplete = () => {
    if (portfolios.length > 0) {
      toast({
        title: `${portfolios.length} portfolio(s) created!`,
        description: 'Now assign programs to organize your work.',
      });
    }
    onComplete();
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      case 'manager': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
        <Sparkles className="h-10 w-10 text-primary shrink-0 mt-1" />
        <div>
          <h3 className="font-medium">Start with portfolios — your strategic initiatives</h3>
          <p className="text-sm text-muted-foreground">
            Portfolios represent your organization's major focus areas. They contain programs
            which in turn contain projects, providing executive-level visibility into all work.
          </p>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Example:</strong> You might have separate portfolios for "Product Development",
          "Infrastructure", and "Client Services" — each containing related programs and projects.
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

      {/* Add portfolio form */}
      <div className="grid gap-4">
        <div>
          <Label htmlFor="portfolioName">Portfolio Name</Label>
          <Input
            id="portfolioName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Product Development"
            onKeyDown={(e) => e.key === 'Enter' && handleAddPortfolio()}
          />
        </div>
        <div>
          <Label htmlFor="portfolioDescription">Description (optional)</Label>
          <Textarea
            id="portfolioDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="All initiatives related to product innovation and enhancement..."
            rows={2}
          />
        </div>
      </div>
      <Button onClick={handleAddPortfolio} variant="secondary" className="w-full sm:w-auto">
        <Plus className="h-4 w-4 mr-2" />
        Add Portfolio
      </Button>

      {/* Portfolios list */}
      {portfolios.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Portfolios ({portfolios.length})
          </Label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {portfolios.map((portfolio) => (
              <div 
                key={portfolio.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="font-medium">{portfolio.name}</span>
                    {portfolio.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {portfolio.description}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePortfolio(portfolio.id)}
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
          {portfolios.length > 0 ? 'Save & Continue' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
