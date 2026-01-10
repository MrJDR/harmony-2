import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Check, Plus, X, Layers, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProgramsStepProps {
  onComplete: () => void;
  isComplete: boolean;
}

interface Program {
  name: string;
  description: string;
  projectCount: number;
}

export function ProgramsStep({ onComplete, isComplete }: ProgramsStepProps) {
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [programs, setPrograms] = useState<Program[]>([]);

  const addProgram = () => {
    if (!name.trim()) {
      toast({ title: 'Please enter a program name', variant: 'destructive' });
      return;
    }

    setPrograms([...programs, { name: name.trim(), description: description.trim(), projectCount: 0 }]);
    setName('');
    setDescription('');
  };

  const removeProgram = (index: number) => {
    setPrograms(programs.filter((_, i) => i !== index));
  };

  const handleComplete = () => {
    if (programs.length > 0) {
      toast({
        title: `${programs.length} program(s) created!`,
        description: 'You can add projects to programs from the Programs page.',
      });
    }
    onComplete();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
        <Layers className="h-10 w-10 text-primary shrink-0 mt-1" />
        <div>
          <h3 className="font-medium">Group related projects into programs</h3>
          <p className="text-sm text-muted-foreground">
            Programs help you organize related projects that share a common goal or theme.
            They provide a mid-level view between individual projects and the full portfolio.
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

      {/* Add program form */}
      <div className="grid gap-4">
        <div>
          <Label htmlFor="programName">Program Name</Label>
          <Input
            id="programName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Digital Transformation"
          />
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
      <Button onClick={addProgram} variant="secondary" className="w-full sm:w-auto">
        <Plus className="h-4 w-4 mr-2" />
        Add Program
      </Button>

      {/* Programs list */}
      {programs.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Programs ({programs.length})
          </Label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {programs.map((program, index) => (
              <div 
                key={index}
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
                  <Badge variant="outline" className="text-xs">
                    0 projects
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeProgram(index)}
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
          {programs.length > 0 ? 'Save & Continue' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
