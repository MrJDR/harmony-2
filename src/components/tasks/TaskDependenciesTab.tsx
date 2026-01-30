import { useState } from 'react';
import { Plus, X, Link2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Task } from '@/types/portfolio';

interface TaskDependency {
  taskId: string;
  type: 'blocked-by' | 'blocking';
}

interface TaskDependenciesTabProps {
  task: Task;
  allTasks: Task[];
  dependencies: TaskDependency[];
  onAddDependency: (targetTaskId: string, type: 'blocked-by' | 'blocking') => void;
  onRemoveDependency: (targetTaskId: string, type: 'blocked-by' | 'blocking') => void;
}

const statusColors: Record<string, string> = {
  'todo': 'bg-muted-foreground/20 text-muted-foreground',
  'in-progress': 'bg-primary/20 text-primary',
  'review': 'bg-warning/20 text-warning',
  'done': 'bg-success/20 text-success',
};

export function TaskDependenciesTab({
  task,
  allTasks,
  dependencies,
  onAddDependency,
  onRemoveDependency,
}: TaskDependenciesTabProps) {
  const [addingType, setAddingType] = useState<'blocked-by' | 'blocking' | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  const blockedByTasks = dependencies
    .filter(d => d.type === 'blocked-by')
    .map(d => allTasks.find(t => t.id === d.taskId))
    .filter(Boolean) as Task[];

  const blockingTasks = dependencies
    .filter(d => d.type === 'blocking')
    .map(d => allTasks.find(t => t.id === d.taskId))
    .filter(Boolean) as Task[];

  // Get available tasks (exclude self and already linked tasks)
  const linkedTaskIds = new Set(dependencies.map(d => d.taskId));
  const availableTasks = allTasks.filter(t => 
    t.id !== task.id && !linkedTaskIds.has(t.id)
  );

  const handleAddDependency = () => {
    if (selectedTaskId && addingType) {
      onAddDependency(selectedTaskId, addingType);
      setSelectedTaskId('');
      setAddingType(null);
    }
  };

  const renderTaskItem = (depTask: Task, type: 'blocked-by' | 'blocking') => (
    <div
      key={depTask.id}
      className="flex items-center justify-between gap-2 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors group"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm text-foreground truncate">{depTask.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge 
              variant="secondary" 
              className={cn("text-xs", statusColors[depTask.status])}
            >
              {depTask.status}
            </Badge>
            {depTask.dueDate && (
              <span className="text-xs text-muted-foreground">
                Due {new Date(depTask.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onRemoveDependency(depTask.id, type)}
      >
        <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
      </Button>
    </div>
  );

  const renderAddSection = (type: 'blocked-by' | 'blocking') => {
    if (addingType === type) {
      return (
        <div className="flex items-center gap-2 mt-2">
          <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a task..." />
            </SelectTrigger>
            <SelectContent>
              {availableTasks.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  No available tasks
                </div>
              ) : (
                availableTasks.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    <span className="truncate">{t.title}</span>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleAddDependency} disabled={!selectedTaskId}>
            Add
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAddingType(null)}>
            Cancel
          </Button>
        </div>
      );
    }

    return (
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 text-muted-foreground hover:text-foreground"
        onClick={() => {
          setAddingType(type);
          setSelectedTaskId('');
        }}
      >
        <Plus className="h-4 w-4 mr-1" />
        Add {type === 'blocked-by' ? 'blocker' : 'blocked task'}
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Blocked By Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <ArrowRight className="h-4 w-4 text-destructive rotate-180" />
            Blocked By
          </div>
          <span className="text-xs text-muted-foreground">
            (predecessors that must complete first)
          </span>
        </div>
        
        {blockedByTasks.length > 0 ? (
          <div className="space-y-2">
            {blockedByTasks.map(t => renderTaskItem(t, 'blocked-by'))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">
            No blockers — this task can start immediately
          </p>
        )}
        
        {renderAddSection('blocked-by')}
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Blocking Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <ArrowRight className="h-4 w-4 text-warning" />
            Blocking
          </div>
          <span className="text-xs text-muted-foreground">
            (successors waiting for this task)
          </span>
        </div>
        
        {blockingTasks.length > 0 ? (
          <div className="space-y-2">
            {blockingTasks.map(t => renderTaskItem(t, 'blocking'))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">
            No tasks are waiting on this one
          </p>
        )}
        
        {renderAddSection('blocking')}
      </div>

      {/* Visual Summary */}
      {(blockedByTasks.length > 0 || blockingTasks.length > 0) && (
        <>
          <div className="border-t border-border" />
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Dependency Chain
            </p>
            <div className="flex items-center gap-2 text-sm overflow-x-auto pb-1">
              {blockedByTasks.length > 0 && (
                <>
                  <div className="flex items-center gap-1 shrink-0">
                    {blockedByTasks.map((t, i) => (
                      <span key={t.id}>
                        <Badge variant="outline" className="text-xs">
                          {t.title.length > 15 ? t.title.slice(0, 15) + '...' : t.title}
                        </Badge>
                        {i < blockedByTasks.length - 1 && <span className="mx-1">,</span>}
                      </span>
                    ))}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </>
              )}
              
              <Badge className="shrink-0">{task.title.length > 20 ? task.title.slice(0, 20) + '...' : task.title}</Badge>
              
              {blockingTasks.length > 0 && (
                <>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex items-center gap-1 shrink-0">
                    {blockingTasks.map((t, i) => (
                      <span key={t.id}>
                        <Badge variant="outline" className="text-xs">
                          {t.title.length > 15 ? t.title.slice(0, 15) + '...' : t.title}
                        </Badge>
                        {i < blockingTasks.length - 1 && <span className="mx-1">,</span>}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
