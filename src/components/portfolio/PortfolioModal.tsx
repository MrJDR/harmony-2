import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FolderPlus } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
}

interface PortfolioData {
  id?: string;
  name: string;
  description: string;
}

interface PortfolioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolio?: PortfolioData | null;
  teamMembers?: TeamMember[];
  onSave: (data: { 
    id?: string; 
    name: string; 
    description: string;
    createProgram?: {
      name: string;
      description: string;
      status: string;
      ownerId?: string;
    };
  }) => void;
}

export function PortfolioModal({
  open,
  onOpenChange,
  portfolio,
  teamMembers = [],
  onSave,
}: PortfolioModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  // Program creation fields
  const [createProgram, setCreateProgram] = useState(false);
  const [programName, setProgramName] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [programStatus, setProgramStatus] = useState('planning');
  const [programOwnerId, setProgramOwnerId] = useState('');

  const isEditing = !!portfolio;

  useEffect(() => {
    if (portfolio) {
      setName(portfolio.name);
      setDescription(portfolio.description || '');
      // Reset program fields when editing
      setCreateProgram(false);
      setProgramName('');
      setProgramDescription('');
      setProgramStatus('planning');
      setProgramOwnerId('');
    } else {
      setName('');
      setDescription('');
      setCreateProgram(false);
      setProgramName('');
      setProgramDescription('');
      setProgramStatus('planning');
      setProgramOwnerId('');
    }
  }, [portfolio, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    const saveData: Parameters<typeof onSave>[0] = {
      id: portfolio?.id,
      name: name.trim(),
      description: description.trim(),
    };

    if (createProgram && programName.trim()) {
      saveData.createProgram = {
        name: programName.trim(),
        description: programDescription.trim(),
        status: programStatus,
        ownerId: programOwnerId || undefined,
      };
    }
    
    onSave(saveData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {portfolio ? 'Edit Portfolio' : 'Create New Portfolio'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Portfolio Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter portfolio name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the portfolio purpose and scope"
              rows={3}
            />
          </div>

          {/* Create Program Option - Only shown when creating new portfolio */}
          {!isEditing && (
            <>
              <Separator className="my-4" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderPlus className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="create-program" className="text-sm font-medium">
                    Create initial program
                  </Label>
                </div>
                <Switch
                  id="create-program"
                  checked={createProgram}
                  onCheckedChange={setCreateProgram}
                />
              </div>

              {createProgram && (
                <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                  <div className="space-y-2">
                    <Label htmlFor="program-name">Program Name</Label>
                    <Input
                      id="program-name"
                      value={programName}
                      onChange={(e) => setProgramName(e.target.value)}
                      placeholder="Enter program name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="program-description">Program Description</Label>
                    <Textarea
                      id="program-description"
                      value={programDescription}
                      onChange={(e) => setProgramDescription(e.target.value)}
                      placeholder="Describe the program"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="program-status">Status</Label>
                      <Select value={programStatus} onValueChange={setProgramStatus}>
                        <SelectTrigger id="program-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planning">Planning</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="on-hold">On Hold</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="program-owner">Owner</Label>
                      <Select value={programOwnerId} onValueChange={setProgramOwnerId}>
                        <SelectTrigger id="program-owner">
                          <SelectValue placeholder="Select owner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">No owner</SelectItem>
                          {teamMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || (createProgram && !programName.trim())}>
              {portfolio ? 'Save Changes' : 'Create Portfolio'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
