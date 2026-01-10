import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Check, Plus, X, Briefcase, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ResourcesStepProps {
  onComplete: () => void;
  isComplete: boolean;
}

interface Resource {
  name: string;
  role: string;
  capacity: number;
}

const ROLE_OPTIONS = [
  'Developer',
  'Designer',
  'Project Manager',
  'Product Owner',
  'QA Engineer',
  'DevOps',
  'Business Analyst',
  'Other',
];

export function ResourcesStep({ onComplete, isComplete }: ResourcesStepProps) {
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [role, setRole] = useState('Developer');
  const [capacity, setCapacity] = useState(100);
  const [resources, setResources] = useState<Resource[]>([]);

  const addResource = () => {
    if (!name.trim()) {
      toast({ title: 'Please enter a name', variant: 'destructive' });
      return;
    }

    setResources([...resources, { name: name.trim(), role, capacity }]);
    setName('');
    setRole('Developer');
    setCapacity(100);
  };

  const removeResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const handleComplete = () => {
    // In a real implementation, you'd save these resources to the database
    // For now, we'll just mark the step as complete
    if (resources.length > 0) {
      toast({
        title: `${resources.length} resource(s) defined!`,
        description: 'You can manage resources in detail from the Resources page.',
      });
    }
    onComplete();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
        <Briefcase className="h-10 w-10 text-primary shrink-0 mt-1" />
        <div>
          <h3 className="font-medium">Define your team capacity</h3>
          <p className="text-sm text-muted-foreground">
            Add team members as resources to track workload and allocation across projects.
            This helps you understand capacity and prevent overallocation.
          </p>
        </div>
      </div>

      {/* Add resource form */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <Label htmlFor="resourceName">Name</Label>
          <Input
            id="resourceName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
          />
        </div>
        <div>
          <Label htmlFor="resourceRole">Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="capacity">Capacity %</Label>
          <Input
            id="capacity"
            type="number"
            min={0}
            max={100}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
          />
        </div>
      </div>
      <Button onClick={addResource} variant="secondary" className="w-full sm:w-auto">
        <Plus className="h-4 w-4 mr-2" />
        Add Resource
      </Button>

      {/* Resources list */}
      {resources.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Resources ({resources.length})
          </Label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {resources.map((resource, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{resource.name}</span>
                  <Badge variant="secondary">{resource.role}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {resource.capacity}% capacity
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeResource(index)}
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
          {resources.length > 0 ? 'Save & Continue' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
