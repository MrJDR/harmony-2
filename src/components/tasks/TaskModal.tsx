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
}

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
}: TaskModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Task['status']>('todo');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [weight] = useState(1); // Base weight of 1 point per hour
  const [assigneeId, setAssigneeId] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [errors, setErrors] = useState<{ title?: string; projectId?: string }>({});
  const [touched, setTouched] = useState<{ title?: boolean; projectId?: boolean }>({});

  useEffect(() => {
    if (!isOpen) return;

    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      // weight stays at base 1
      setAssigneeId(task.assigneeId);
      setStartDate(task.startDate || '');
      setDueDate(task.dueDate || '');
      setProjectId(task.projectId);
    } else {
      setTitle('');
      setDescription('');
      setStatus(defaults?.status || 'todo');
      setPriority('medium');
      // weight stays at base 1
      setAssigneeId(defaults?.assigneeId);
      setStartDate('');
      setDueDate('');

      // Choose a stable default project id without depending on an unstable `projects` array reference.
      const defaultProjectId = initialProjectId || projects[0]?.id || '';
      setProjectId(defaultProjectId);
    }

    // Reset validation state
    setErrors({});
    setTouched({});
  }, [
    isOpen,
    task?.id,
    initialProjectId,
    projects.length,
    projects[0]?.id,
    defaults?.status,
    defaults?.assigneeId,
  ]);

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

    const result = onSave({
      id: task?.id,
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      weight,
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
              {!initialProjectId && projects.length > 0 && (
                <PermissionGate allowedOrgRoles={['owner', 'admin', 'manager', 'member']}>
                  <div className="space-y-2">
                    <Label>Project <span className="text-destructive">*</span></Label>
                    <Select 
                      value={projectId} 
                      onValueChange={(v) => {
                        setProjectId(v);
                        if (v) setErrors(prev => ({ ...prev, projectId: undefined }));
                      }}
                    >
                      <SelectTrigger className={touched.projectId && errors.projectId ? 'border-destructive' : ''}>
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
                  </div>
                </PermissionGate>
              )}

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
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
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
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
