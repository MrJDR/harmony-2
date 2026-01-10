import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Check, Plus, X, Sparkles, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PortfoliosStepProps {
  onComplete: () => void;
  isComplete: boolean;
}

interface Portfolio {
  name: string;
  description: string;
}

export function PortfoliosStep({ onComplete, isComplete }: PortfoliosStepProps) {
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);

  const addPortfolio = () => {
    if (!name.trim()) {
      toast({ title: 'Please enter a portfolio name', variant: 'destructive' });
      return;
    }

    setPortfolios([...portfolios, { name: name.trim(), description: description.trim() }]);
    setName('');
    setDescription('');
  };

  const removePortfolio = (index: number) => {
    setPortfolios(portfolios.filter((_, i) => i !== index));
  };

  const handleComplete = () => {
    if (portfolios.length > 0) {
      toast({
        title: `${portfolios.length} portfolio(s) created!`,
        description: 'You can organize programs and projects within portfolios.',
      });
    }
    onComplete();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
        <Sparkles className="h-10 w-10 text-primary shrink-0 mt-1" />
        <div>
          <h3 className="font-medium">Organize at the highest level with portfolios</h3>
          <p className="text-sm text-muted-foreground">
            Portfolios represent your organization's strategic initiatives. They contain programs
            and standalone projects, providing executive-level visibility into all work.
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

      {/* Add portfolio form */}
      <div className="grid gap-4">
        <div>
          <Label htmlFor="portfolioName">Portfolio Name</Label>
          <Input
            id="portfolioName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Product Development"
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
      <Button onClick={addPortfolio} variant="secondary" className="w-full sm:w-auto">
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
            {portfolios.map((portfolio, index) => (
              <div 
                key={index}
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
                  onClick={() => removePortfolio(index)}
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
          {portfolios.length > 0 ? 'Finish Setup' : 'Finish'}
        </Button>
      </div>
    </div>
  );
}
