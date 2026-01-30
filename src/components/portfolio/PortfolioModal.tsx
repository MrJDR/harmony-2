import { useState, useEffect, useMemo } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FolderPlus, Link, X } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
}

// Org member type for owner selection
interface OrgMember {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

interface Program {
  id: string;
  name: string;
  status: string;
  portfolioId?: string;
}

interface PortfolioData {
  id?: string;
  name: string;
  description: string;
  ownerId?: string;
}

interface PortfolioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolio?: PortfolioData | null;
  teamMembers?: TeamMember[];
  orgMembers?: OrgMember[];
  programs?: Program[];
  onSave: (data: { 
    id?: string; 
    name: string; 
    description: string;
    ownerId?: string;
    addExistingProgramIds?: string[];
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
  orgMembers = [],
  programs = [],
  onSave,
}: PortfolioModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ownerId, setOwnerId] = useState('');
  
  // Add existing programs
  const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>([]);
  
  // Program creation fields
  const [createProgram, setCreateProgram] = useState(false);
  const [programName, setProgramName] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [programStatus, setProgramStatus] = useState('planning');
  const [programOwnerId, setProgramOwnerId] = useState('');

  // Validation
  const [errors, setErrors] = useState<{ name?: string; programName?: string }>({});
  const [touched, setTouched] = useState<{ name?: boolean; programName?: boolean }>({});

  const isEditing = !!portfolio;

  // Get programs that can be added (not already in this portfolio)
  const availablePrograms = useMemo(() => {
    if (!portfolio?.id) {
      // When creating new portfolio, show programs without a portfolio or all programs
      return programs.filter(p => !p.portfolioId || p.portfolioId === '');
    }
    // When editing, show programs not in this portfolio
    return programs.filter(p => p.portfolioId !== portfolio.id);
  }, [programs, portfolio?.id]);

  // Get programs currently in this portfolio (for editing)
  const currentPrograms = useMemo(() => {
    if (!portfolio?.id) return [];
    return programs.filter(p => p.portfolioId === portfolio.id);
  }, [programs, portfolio?.id]);

  useEffect(() => {
    if (!open) return;
    
    if (portfolio) {
      setName(portfolio.name);
      setDescription(portfolio.description || '');
      setOwnerId(portfolio.ownerId || '');
    } else {
      setName('');
      setDescription('');
      setOwnerId('');
    }
    // Reset selection fields
    setSelectedProgramIds([]);
    setCreateProgram(false);
    setProgramName('');
    setProgramDescription('');
    setProgramStatus('planning');
    setProgramOwnerId('');
    // Reset validation
    setErrors({});
    setTouched({});
  }, [portfolio, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: { name?: string; programName?: string } = {};
    if (!name.trim()) newErrors.name = 'Portfolio name is required';
    if (createProgram && !programName.trim()) newErrors.programName = 'Program name is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({ name: true, programName: createProgram });
      return;
    }
    
    const saveData: Parameters<typeof onSave>[0] = {
      id: portfolio?.id,
      name: name.trim(),
      description: description.trim(),
      ownerId: ownerId || undefined,
    };

    if (selectedProgramIds.length > 0) {
      saveData.addExistingProgramIds = selectedProgramIds;
    }

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

  const toggleProgramSelection = (programId: string) => {
    setSelectedProgramIds(prev => 
      prev.includes(programId) 
        ? prev.filter(id => id !== programId)
        : [...prev, programId]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success border-success/30';
      case 'completed': return 'bg-info/10 text-info border-info/30';
      case 'on-hold': return 'bg-warning/10 text-warning border-warning/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {portfolio ? 'Edit Portfolio' : 'Create New Portfolio'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Portfolio Name <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value.trim()) setErrors(prev => ({ ...prev, name: undefined }));
              }}
              onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
              placeholder="Enter portfolio name"
              className={touched.name && errors.name ? 'border-destructive' : ''}
              required
            />
            {touched.name && errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
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

          <div className="space-y-2">
            <Label htmlFor="owner">Portfolio Owner</Label>
            <Select value={ownerId || 'unassigned'} onValueChange={(v) => setOwnerId(v === 'unassigned' ? '' : v)}>
              <SelectTrigger id="owner">
                <SelectValue placeholder="Select owner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {orgMembers.map((member) => {
                  const displayName = [member.first_name, member.last_name].filter(Boolean).join(' ') || member.email;
                  return (
                    <SelectItem key={member.id} value={member.id}>
                      {displayName}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Current Programs (when editing) */}
          {isEditing && currentPrograms.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="space-y-2">
                <Label className="text-sm font-medium">Current Programs</Label>
                <div className="flex flex-wrap gap-2">
                  {currentPrograms.map(program => (
                    <Badge key={program.id} variant="secondary" className="gap-1">
                      {program.name}
                      <span className={`text-xs px-1 rounded ${getStatusColor(program.status)}`}>
                        {program.status}
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Add Existing Programs */}
          {availablePrograms.length > 0 && (
            <>
              <Separator className="my-4" />
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Link className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Add Existing Programs</Label>
                </div>
                
                {selectedProgramIds.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedProgramIds.map(id => {
                      const program = availablePrograms.find(p => p.id === id);
                      if (!program) return null;
                      return (
                        <Badge key={id} variant="outline" className="gap-1 pr-1">
                          {program.name}
                          <button
                            type="button"
                            onClick={() => toggleProgramSelection(id)}
                            className="ml-1 rounded-full p-0.5 hover:bg-muted"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
                
                <ScrollArea className="h-32 rounded-md border border-border">
                  <div className="p-2 space-y-1">
                    {availablePrograms.map(program => (
                      <div
                        key={program.id}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleProgramSelection(program.id)}
                      >
                        <Checkbox
                          checked={selectedProgramIds.includes(program.id)}
                          onCheckedChange={() => toggleProgramSelection(program.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate">{program.name}</span>
                        </div>
                        <Badge variant="outline" className={`text-xs ${getStatusColor(program.status)}`}>
                          {program.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}

          {/* Create New Program Option */}
          <>
            <Separator className="my-4" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderPlus className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="create-program" className="text-sm font-medium">
                  Create new program
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
                  <Label htmlFor="program-name">Program Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="program-name"
                    value={programName}
                    onChange={(e) => {
                      setProgramName(e.target.value);
                      if (e.target.value.trim()) setErrors(prev => ({ ...prev, programName: undefined }));
                    }}
                    onBlur={() => setTouched(prev => ({ ...prev, programName: true }))}
                    placeholder="Enter program name"
                    className={touched.programName && errors.programName ? 'border-destructive' : ''}
                  />
                  {touched.programName && errors.programName && (
                    <p className="text-xs text-destructive">{errors.programName}</p>
                  )}
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
                        {orgMembers.map((member) => {
                          const displayName = [member.first_name, member.last_name].filter(Boolean).join(' ') || member.email;
                          return (
                            <SelectItem key={member.id} value={member.id}>
                              {displayName}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </>

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
