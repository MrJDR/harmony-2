import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon } from 'lucide-react';
import { Project, Program } from '@/types/portfolio';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { PermissionGate } from '@/components/permissions/PermissionGate';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Partial<Project>) => void;
  project?: Project | null;
  programs?: Program[];
  defaultProgramId?: string;
  /** Current user's org role for permission checks */
  currentUserOrgRole?: 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
}

export function ProjectModal({ 
  isOpen, 
  onClose, 
  onSave, 
  project,
  programs = [],
  defaultProgramId,
  currentUserOrgRole,
}: ProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Project['status']>('planning');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [programId, setProgramId] = useState('');
  const [errors, setErrors] = useState<{ name?: string; programId?: string }>({});
  const [touched, setTouched] = useState<{ name?: boolean; programId?: boolean }>({});

  // Get the first program id to use as fallback - memoize to avoid reference changes
  const firstProgramId = programs.length > 0 ? programs[0].id : '';

  useEffect(() => {
    if (!isOpen) return;
    
    if (project) {
      setName(project.name);
      setDescription(project.description);
      setStatus(project.status);
      setStartDate(project.startDate ? new Date(project.startDate) : undefined);
      setEndDate(project.endDate ? new Date(project.endDate) : undefined);
      setProgramId(project.programId);
    } else {
      setName('');
      setDescription('');
      setStatus('planning');
      setStartDate(new Date());
      setEndDate(undefined);
      // Set default program
      setProgramId(defaultProgramId || firstProgramId);
    }
    // Reset validation state
    setErrors({});
    setTouched({});
  }, [project?.id, isOpen, defaultProgramId, firstProgramId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: { name?: string; programId?: string } = {};
    if (!name.trim()) newErrors.name = 'Project name is required';
    if (!programId) newErrors.programId = 'Program is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({ name: true, programId: true });
      return;
    }

    onSave({
      id: project?.id,
      name: name.trim(),
      description: description.trim(),
      status,
      startDate: startDate ? format(startDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
      progress: project?.progress || 0,
      programId,
      teamIds: project?.teamIds || [],
      tasks: project?.tasks || [],
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-xl border border-border bg-card shadow-elevated"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-display text-lg font-semibold text-card-foreground">
              {project ? 'Edit Project' : 'New Project'}
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            {/* Program Selection - when editing, only owner/admin can reassign */}
            {programs.length > 0 && (() => {
              const isEditing = !!project;
              const canReassignParent = !isEditing || currentUserOrgRole === 'owner' || currentUserOrgRole === 'admin';
              
              return (
                <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager']}>
                  <div>
                    <Label>Program <span className="text-destructive">*</span></Label>
                    <Select 
                      value={programId} 
                      onValueChange={(v) => {
                        setProgramId(v);
                        if (v) setErrors(prev => ({ ...prev, programId: undefined }));
                      }}
                      disabled={!canReassignParent}
                    >
                      <SelectTrigger className={cn(
                        'mt-1.5',
                        touched.programId && errors.programId ? 'border-destructive' : '',
                        !canReassignParent && 'opacity-60 cursor-not-allowed'
                      )}>
                        <SelectValue placeholder="Select program" />
                      </SelectTrigger>
                      <SelectContent>
                        {programs.map((program) => (
                          <SelectItem key={program.id} value={program.id}>
                            {program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {touched.programId && errors.programId && (
                      <p className="text-xs text-destructive mt-1">{errors.programId}</p>
                    )}
                    {isEditing && !canReassignParent && (
                      <p className="text-xs text-muted-foreground mt-1">Only owners and admins can reassign projects to different programs</p>
                    )}
                  </div>
                </PermissionGate>
              );
            })()}

            <div>
              <Label htmlFor="name">Project Name <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (e.target.value.trim()) setErrors(prev => ({ ...prev, name: undefined }));
                }}
                onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                placeholder="Enter project name"
                className={`mt-1.5 ${touched.name && errors.name ? 'border-destructive' : ''}`}
                required
              />
              {touched.name && errors.name && (
                <p className="text-xs text-destructive mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Project description..."
                className="mt-1.5 min-h-[80px] resize-none"
              />
            </div>

            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Project['status'])}>
                <SelectTrigger className="mt-1.5">
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "mt-1.5 w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "mt-1.5 w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim() || !programId}>
                {project ? 'Save Changes' : 'Create Project'}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
