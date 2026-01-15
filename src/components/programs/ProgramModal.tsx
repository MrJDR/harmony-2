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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Program, TeamMember, Portfolio } from '@/types/portfolio';
import { PermissionGate } from '@/components/permissions/PermissionGate';

interface ProgramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program?: Program | null;
  teamMembers: TeamMember[];
  portfolios?: Portfolio[];
  defaultPortfolioId?: string;
  onSave: (program: Partial<Program>) => void;
}

export function ProgramModal({
  open,
  onOpenChange,
  program,
  teamMembers,
  portfolios = [],
  defaultPortfolioId,
  onSave,
}: ProgramModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Program['status']>('planning');
  const [ownerId, setOwnerId] = useState('');
  const [portfolioId, setPortfolioId] = useState('');
  const [errors, setErrors] = useState<{ name?: string; portfolioId?: string }>({});
  const [touched, setTouched] = useState<{ name?: boolean; portfolioId?: boolean }>({});

  useEffect(() => {
    if (program) {
      setName(program.name);
      setDescription(program.description);
      setStatus(program.status);
      setOwnerId(program.ownerId);
      setPortfolioId(program.portfolioId);
    } else {
      setName('');
      setDescription('');
      setStatus('planning');
      setOwnerId('');
      // Set default portfolio
      setPortfolioId(defaultPortfolioId || (portfolios.length > 0 ? portfolios[0].id : ''));
    }
    // Reset validation state
    setErrors({});
    setTouched({});
  }, [program, open, defaultPortfolioId, portfolios]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: { name?: string; portfolioId?: string } = {};
    if (!name.trim()) newErrors.name = 'Program name is required';
    if (!portfolioId) newErrors.portfolioId = 'Portfolio is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({ name: true, portfolioId: true });
      return;
    }
    
    onSave({
      id: program?.id,
      name: name.trim(),
      description: description.trim(),
      status,
      ownerId,
      portfolioId,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {program ? 'Edit Program' : 'Create New Program'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Portfolio Selection - only show if multiple portfolios exist */}
          {portfolios.length > 0 && (
            <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
              <div className="space-y-2">
                <Label>Portfolio <span className="text-destructive">*</span></Label>
                <Select 
                  value={portfolioId} 
                  onValueChange={(v) => {
                    setPortfolioId(v);
                    if (v) setErrors(prev => ({ ...prev, portfolioId: undefined }));
                  }}
                >
                  <SelectTrigger className={touched.portfolioId && errors.portfolioId ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select portfolio" />
                  </SelectTrigger>
                  <SelectContent>
                    {portfolios.map((portfolio) => (
                      <SelectItem key={portfolio.id} value={portfolio.id}>
                        {portfolio.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {touched.portfolioId && errors.portfolioId && (
                  <p className="text-xs text-destructive">{errors.portfolioId}</p>
                )}
              </div>
            </PermissionGate>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Program Name <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value.trim()) setErrors(prev => ({ ...prev, name: undefined }));
              }}
              onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
              placeholder="Enter program name"
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
              placeholder="Describe the program objectives"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Program['status'])}>
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

            <div className="space-y-2">
              <Label>Program Owner</Label>
              <Select value={ownerId || 'unassigned'} onValueChange={(v) => setOwnerId(v === 'unassigned' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || !portfolioId}>
              {program ? 'Save Changes' : 'Create Program'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
