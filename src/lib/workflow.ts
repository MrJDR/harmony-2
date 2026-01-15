import type { Project, ProjectStatus, TaskPriority, TaskStatus } from "@/types/portfolio";

export type WorkflowColor = "muted" | "info" | "success" | "warning" | "destructive";

const badgeByColor: Record<WorkflowColor, string> = {
  muted: "bg-muted text-muted-foreground border-muted",
  info: "bg-info/10 text-info border-info/20",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
};

const dotByColor: Record<WorkflowColor, string> = {
  muted: "bg-muted-foreground",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
};

const columnBgByColor: Record<WorkflowColor, string> = {
  muted: "bg-muted",
  info: "bg-info/20",
  success: "bg-success/20",
  warning: "bg-warning/20",
  destructive: "bg-destructive/20",
};

const columnBorderByColor: Record<WorkflowColor, string> = {
  muted: "border-l-muted-foreground",
  info: "border-l-info",
  success: "border-l-success",
  warning: "border-l-warning",
  destructive: "border-l-destructive",
};

export const defaultProjectStatuses: ProjectStatus[] = [
  { id: "planning", label: "Planning", color: "muted" },
  { id: "active", label: "Active", color: "info" },
  { id: "on-hold", label: "On Hold", color: "warning" },
  { id: "completed", label: "Completed", color: "success" },
];

export const defaultTaskStatuses: TaskStatus[] = [
  { id: "todo", label: "To Do", color: "muted" },
  { id: "in-progress", label: "In Progress", color: "info" },
  { id: "review", label: "Review", color: "warning" },
  { id: "done", label: "Done", color: "success" },
];

export const defaultTaskPriorities: TaskPriority[] = [
  { id: "low", label: "Low", color: "muted" },
  { id: "medium", label: "Medium", color: "warning" },
  { id: "high", label: "High", color: "destructive" },
];

export function workflowBadgeClass(color: WorkflowColor | undefined) {
  return badgeByColor[color || "muted"];
}

export function workflowDotClass(color: WorkflowColor | undefined) {
  return dotByColor[color || "muted"];
}

export function workflowColumnBgClass(color: WorkflowColor | undefined) {
  return columnBgByColor[color || "muted"];
}

export function workflowColumnBorderClass(color: WorkflowColor | undefined) {
  return columnBorderByColor[color || "muted"];
}

export function getProjectStatusOptions(project?: Project | null): ProjectStatus[] {
  return project?.customStatuses && project.customStatuses.length > 0
    ? project.customStatuses
    : defaultProjectStatuses;
}

export function getTaskStatusOptions(project?: Project | null): TaskStatus[] {
  return project?.customTaskStatuses && project.customTaskStatuses.length > 0
    ? project.customTaskStatuses
    : defaultTaskStatuses;
}

export function getTaskPriorityOptions(project?: Project | null): TaskPriority[] {
  return project?.customTaskPriorities && project.customTaskPriorities.length > 0
    ? project.customTaskPriorities
    : defaultTaskPriorities;
}

export function projectStatusMeta(project: Project | null | undefined, statusId: string) {
  const status = getProjectStatusOptions(project).find((s) => s.id === statusId);
  return {
    label: status?.label ?? statusId,
    badgeClass: workflowBadgeClass(status?.color),
  };
}

// Programs use the same default project statuses (no custom per-program statuses yet)
export function programStatusMeta(statusId: string) {
  const status = defaultProjectStatuses.find((s) => s.id === statusId);
  return {
    label: status?.label ?? statusId,
    badgeClass: workflowBadgeClass(status?.color),
  };
}

export function taskStatusMeta(statusId: string, options?: TaskStatus[] | null) {
  const statusList = options && options.length > 0 ? options : defaultTaskStatuses;
  const status = statusList.find((s) => s.id === statusId);
  return {
    label: status?.label ?? statusId,
    color: status?.color ?? "muted",
  };
}

export function taskPriorityMeta(priorityId: string, options?: TaskPriority[] | null) {
  const priorityList = options && options.length > 0 ? options : defaultTaskPriorities;
  const priority = priorityList.find((p) => p.id === priorityId);
  return {
    label: priority?.label ?? priorityId,
    badgeClass: workflowBadgeClass(priority?.color),
    color: priority?.color ?? "muted",
  };
}
