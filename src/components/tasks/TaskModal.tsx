import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Task, TeamMember, Project } from '@/types/portfolio';
import { PermissionGate } from '@/components/permissions/PermissionGate';
import { AssignmentActions } from './AssignmentActions';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Return `false` to keep the modal open (e.g. server-side/parent validation failed).
   */
  onSave: (task: Partial<Task>) => boolean | void;
  onAssigneeChange?: (newAssigneeId: string | undefined) => void;
  task?: Task | null;
  teamMembers: TeamMember[];
  projectId?: string;
  projects?: Project[];
  defaults?: { status?: Task['status']; assigneeId?: string };
  statusOptions?: Array<{ id: Task['status']; label: string }>;
  priorityOptions?: Array<{ id: Task['priority']; label: string }>;
  /** Current user's org role for permission checks */
  currentUserOrgRole?: 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
}

import { usePermissions } from '@/contexts/PermissionsContext';

export function TaskModal({
  isOpen,
  onClose,
  onSave,
  onAssigneeChange,
  task,
  teamMembers,
  projectId: initialProjectId,
  projects = [],
  defaults,
  statusOptions,
  priorityOptions,
  currentUserOrgRole,
}: TaskModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { hasOrgPermission } = usePermissions();
  const canEditBudget = hasOrgPermission('edit_budget');
  const canViewBudget = hasOrgPermission('view_budget');
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Task['status']>('todo');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [weight] = useState(1); // Base weight of 1 point per hour
  const [estimatedHoursStr, setEstimatedHoursStr] = useState('1');
  const [actualCostStr, setActualCostStr] = useState('0');
  const [assigneeId, setAssigneeId] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [errors, setErrors] = useState<{ title?: string; projectId?: string }>({});
  const [touched, setTouched] = useState<{ title?: boolean; projectId?: boolean }>({});

  // Initialize the form when the modal opens or when the task data changes.
  // IMPORTANT: Inline edits can change task fields without changing task.id.
  useEffect(() => {
    if (!isOpen) return;

    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setEstimatedHoursStr(String(task.estimatedHours || 1));
      setActualCostStr(String(task.actualCost || 0));
      setAssigneeId(task.assigneeId);
      setStartDate(task.startDate || '');
      setDueDate(task.dueDate || '');
      setProjectId(task.projectId);
    } else {
      setTitle('');
      setDescription('');
      setStatus(defaults?.status || 'todo');
      setPriority('medium');
      setEstimatedHoursStr('1');
      setActualCostStr('0');
      setAssigneeId(defaults?.assigneeId);
      setStartDate('');
      setDueDate('');

      // Do not depend on `projects` in the effect deps; we will fill a default project in a separate guarded effect.
      setProjectId(initialProjectId || '');
    }

    setErrors({});
    setTouched({});
  }, [isOpen, task, defaults?.status, defaults?.assigneeId, initialProjectId]);

  // If we're creating a task and no project is selected yet, auto-pick the first available project.
  // Guarded so it only runs when `projectId` is empty.
  useEffect(() => {
    if (!isOpen) return;
    if (task) return; // editing: keep the task's project
    if (projectId) return;

    const fallbackProjectId = initialProjectId || projects[0]?.id || '';
    if (fallbackProjectId) setProjectId(fallbackProjectId);
  }, [isOpen, task?.id, projectId, initialProjectId, projects[0]?.id]);

  const validate = () => {
    const newErrors: { title?: string; projectId?: string } = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!projectId) newErrors.projectId = projects.length === 0 && !initialProjectId
      ? 'Create a project first'
      : 'Project is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({ title: true, projectId: true });
      // focus first invalid field
      if (newErrors.title) titleInputRef.current?.focus();
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const parsedHours = parseFloat(estimatedHoursStr) || 1;
    const finalHours = Math.max(0.5, parsedHours);
    const parsedCost = parseFloat(actualCostStr) || 0;

    const result = onSave({
      id: task?.id,
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      weight,
      estimatedHours: finalHours,
      actualCost: parsedCost,
      assigneeId: assigneeId || undefined,
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
      projectId,
    });

    // If parent rejects save (e.g. missing required context), keep modal open.
    if (result === false) return;

    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-xl border border-border bg-card shadow-xl max-h-[90vh] overflow-y-auto"
        >
          <form
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              // Let textarea create new lines
              if (e.target instanceof HTMLElement && e.target.tagName === 'TEXTAREA') return;
              // If required fields missing, don't submit/close; show inline errors.
              if (!title.trim() || !projectId) {
                e.preventDefault();
                validate();
              }
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4 sticky top-0 bg-card">
              <h2 className="font-display text-lg font-semibold text-card-foreground">
                {task ? 'Edit Task' : 'Create Task'}
              </h2>
              <Button type="button" variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Form Content */}
            <div className="space-y-4 p-6">
              {/* Project Selection - show if no fixed projectId and projects are available */}
              {/* When editing, only owner/admin can reassign to a different project */}
              {!initialProjectId && projects.length > 0 && (() => {
                const isEditing = !!task;
                const canReassignParent = !isEditing || currentUserOrgRole === 'owner' || currentUserOrgRole === 'admin';
                
                return (
                  <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager', 'member']}>
                    <div className="space-y-2">
                      <Label>Project <span className="text-destructive">*</span></Label>
                      <Select 
                        value={projectId} 
                        onValueChange={(v) => {
                          setProjectId(v);
                          if (v) setErrors(prev => ({ ...prev, projectId: undefined }));
                        }}
                        disabled={!canReassignParent}
                      >
                        <SelectTrigger className={cn(
                          touched.projectId && errors.projectId ? 'border-destructive' : '',
                          !canReassignParent && 'opacity-60 cursor-not-allowed'
                        )}>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {touched.projectId && errors.projectId && (
                        <p className="text-xs text-destructive">{errors.projectId}</p>
                      )}
                      {isEditing && !canReassignParent && (
                        <p className="text-xs text-muted-foreground">Only owners and admins can reassign tasks to different projects</p>
                      )}
                    </div>
                  </PermissionGate>
                );
              })()}

              <div className="space-y-2">
                <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
                <Input
                  ref={titleInputRef}
                  id="title"
                  placeholder="Task title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (e.target.value.trim()) setErrors(prev => ({ ...prev, title: undefined }));
                  }}
                  onBlur={() => setTouched(prev => ({ ...prev, title: true }))}
                  className={touched.title && errors.title ? 'border-destructive' : ''}
                  autoFocus
                />
                {touched.title && errors.title && (
                  <p className="text-xs text-destructive">{errors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Add a description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as Task['status'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(statusOptions && statusOptions.length > 0
                        ? statusOptions
                        : [
                            { id: 'todo', label: 'To Do' },
                            { id: 'in-progress', label: 'In Progress' },
                            { id: 'review', label: 'Review' },
                            { id: 'done', label: 'Done' },
                          ])
                        .map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as Task['priority'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(priorityOptions && priorityOptions.length > 0
                        ? priorityOptions
                        : [
                            { id: 'high', label: 'High' },
                            { id: 'medium', label: 'Medium' },
                            { id: 'low', label: 'Low' },
                          ])
                        .map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedHours">Estimated Hours</Label>
                  <Input
                    id="estimatedHours"
                    type="text"
                    inputMode="decimal"
                    placeholder="1"
                    value={estimatedHoursStr}
                    onChange={(e) => setEstimatedHoursStr(e.target.value)}
                    onBlur={() => {
                      const parsed = parseFloat(estimatedHoursStr);
                      if (!isNaN(parsed) && parsed >= 0.5) {
                        setEstimatedHoursStr(String(parsed));
                      } else if (estimatedHoursStr.trim() === '' || isNaN(parsed)) {
                        setEstimatedHoursStr('1');
                      } else {
                        setEstimatedHoursStr('0.5');
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">Hours required (affects resource allocation)</p>
                </div>

                {canViewBudget && (
                  <div className="space-y-2">
                    <Label htmlFor="actualCost">Actual Cost ($)</Label>
                    <Input
                      id="actualCost"
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={actualCostStr}
                      onChange={(e) => setActualCostStr(e.target.value)}
                      onBlur={() => {
                        const parsed = parseFloat(actualCostStr);
                        if (!isNaN(parsed) && parsed >= 0) {
                          setActualCostStr(String(parsed));
                        } else {
                          setActualCostStr('0');
                        }
                      }}
                      disabled={!canEditBudget}
                      className={!canEditBudget ? 'opacity-60 cursor-not-allowed' : ''}
                    />
                    <p className="text-xs text-muted-foreground">
                      {canEditBudget ? 'Cost incurred for this task' : 'View only - contact an admin to edit'}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Assignee</Label>
                  <Select value={assigneeId || 'unassigned'} onValueChange={(v) => setAssigneeId(v === 'unassigned' ? undefined : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
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
                  
                  {/* Assignment Actions - show for existing tasks with assignee */}
                  {task && assigneeId && (
                    <AssignmentActions
                      taskId={task.id}
                      taskTitle={task.title}
                      assigneeId={assigneeId}
                      assigneeName={teamMembers.find(m => m.id === assigneeId)?.name}
                      teamMembers={teamMembers}
                      currentUserId={user?.id}
                      onAccept={() => {
                        toast({
                          title: 'Assignment accepted',
                          description: `You've accepted "${task.title}"`,
                        });
                      }}
                      onDecline={(newAssigneeId) => {
                        setAssigneeId(newAssigneeId);
                        if (onAssigneeChange) {
                          onAssigneeChange(newAssigneeId);
                        }
                      }}
                      onReassign={(newAssigneeId) => {
                        setAssigneeId(newAssigneeId);
                        if (onAssigneeChange) {
                          onAssigneeChange(newAssigneeId);
                        }
                      }}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-border px-6 py-4 sticky bottom-0 bg-card">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!title.trim() || !projectId}>
                {task ? 'Save Changes' : 'Create Task'}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
