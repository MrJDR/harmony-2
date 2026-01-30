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
import { Milestone, Project } from '@/types/portfolio';
import { cn } from '@/lib/utils';

interface MilestoneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestone: Milestone | null;
  programId: string;
  projects: Project[];
  onSave: (data: Omit<Milestone, 'id'>) => void;
  onUpdate: (id: string, data: Partial<Milestone>) => void;
}

export function MilestoneModal({
  open,
  onOpenChange,
  milestone,
  programId,
  projects,
  onSave,
  onUpdate,
}: MilestoneModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [errors, setErrors] = useState<{ title?: string; dueDate?: string; projectId?: string }>({});
  const [touched, setTouched] = useState<{ title?: boolean; dueDate?: boolean; projectId?: boolean }>({});

  useEffect(() => {
    if (!open) return;
    if (milestone) {
      setTitle(milestone.title);
      setDescription(milestone.description ?? '');
      setDueDate(milestone.dueDate.slice(0, 10));
      setProjectId(milestone.projectId);
    } else {
      setTitle('');
      setDescription('');
      setDueDate('');
      setProjectId(projects[0]?.id ?? '');
    }
    setErrors({});
    setTouched({});
  }, [open, milestone, projects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { title?: string; dueDate?: string; projectId?: string } = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!dueDate) newErrors.dueDate = 'Due date is required';
    if (!milestone && !projectId) newErrors.projectId = 'Project is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({ title: true, dueDate: true, projectId: true });
      return;
    }
    if (milestone) {
      onUpdate(milestone.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate,
        projectId: projectId || undefined,
      });
    } else {
      onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate,
        projectId,
        programId,
      });
    }
    onOpenChange(false);
  };

  const isEdit = !!milestone;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]" aria-labelledby="milestone-dialog-title">
        <DialogHeader>
          <DialogTitle id="milestone-dialog-title">
            {isEdit ? 'Edit milestone' : 'Add milestone'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="milestone-title">Title</Label>
            <Input
              id="milestone-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (e.target.value.trim()) setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, title: true }))}
              placeholder="e.g. Phase 1 complete"
              className={cn(touched.title && errors.title && 'border-destructive')}
              aria-invalid={!!(touched.title && errors.title)}
              aria-describedby={touched.title && errors.title ? 'milestone-title-error' : undefined}
            />
            {touched.title && errors.title && (
              <p id="milestone-title-error" className="text-xs text-destructive">
                {errors.title}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="milestone-due">Due date</Label>
            <Input
              id="milestone-due"
              type="date"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                if (e.target.value) setErrors((prev) => ({ ...prev, dueDate: undefined }));
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, dueDate: true }))}
              className={cn(touched.dueDate && errors.dueDate && 'border-destructive')}
              aria-invalid={!!(touched.dueDate && errors.dueDate)}
            />
            {touched.dueDate && errors.dueDate && (
              <p className="text-xs text-destructive">{errors.dueDate}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="milestone-project">Project</Label>
            <Select
              value={projectId}
              onValueChange={(v) => {
                setProjectId(v);
                if (v) setErrors((prev) => ({ ...prev, projectId: undefined }));
              }}
              disabled={isEdit && projects.length <= 1}
            >
              <SelectTrigger
                id="milestone-project"
                className={cn(touched.projectId && errors.projectId && 'border-destructive')}
                aria-invalid={!!(touched.projectId && errors.projectId)}
              >
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {touched.projectId && errors.projectId && (
              <p className="text-xs text-destructive">{errors.projectId}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="milestone-desc">Description (optional)</Label>
            <Textarea
              id="milestone-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
              rows={2}
              className="resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || !dueDate || (!isEdit && !projectId)}>
              {isEdit ? 'Save changes' : 'Create milestone'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
