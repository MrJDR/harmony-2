/**
 * Allocation Calculator
 * 
 * Calculates weighted task allocation for team members.
 * Base formula: estimated_hours × 1 (base weight) × multipliers
 * 
 * Multipliers are applied based on:
 * - Priority (high/medium/low)
 * - Urgency (based on due date proximity)
 * - Status (in-progress/todo/blocked)
 */

import { differenceInDays } from 'date-fns';

export interface AllocationWeights {
  priority: {
    high: number;
    medium: number;
    low: number;
  };
  urgency: {
    overdue: number;
    dueSoon: number; // within 7 days
    dueModerate: number; // 7-30 days
    dueLater: number; // 30+ days
    noDueDate: number; // no due date set
  };
  status: {
    'in-progress': number;
    todo: number;
    review: number;
    blocked: number;
  };
}

export const defaultAllocationWeights: AllocationWeights = {
  priority: {
    high: 1.5,
    medium: 1.0,
    low: 0.75,
  },
  urgency: {
    overdue: 2.0,
    dueSoon: 1.5,
    dueModerate: 1.0,
    dueLater: 0.5,
    noDueDate: 1.0,
  },
  status: {
    'in-progress': 1.25,
    todo: 1.0,
    review: 1.0,
    blocked: 0.5, // blocked tasks don't consume active capacity
  },
};

export interface TaskForAllocation {
  id: string;
  assignee_id: string | null;
  estimated_hours: number;
  priority: string;
  status: string;
  due_date: string | null;
}

/**
 * Get the urgency category based on due date
 */
export function getUrgencyCategory(dueDate: string | null): keyof AllocationWeights['urgency'] {
  if (!dueDate) return 'noDueDate';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  const daysUntilDue = differenceInDays(due, today);
  
  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= 7) return 'dueSoon';
  if (daysUntilDue <= 30) return 'dueModerate';
  return 'dueLater';
}

/**
 * Calculate the weighted allocation points for a single task
 */
export function calculateTaskAllocation(
  task: TaskForAllocation,
  weights: AllocationWeights = defaultAllocationWeights
): number {
  // Base: estimated hours × 1 point per hour
  const basePoints = task.estimated_hours || 1;
  
  // Get multipliers
  const priorityKey = task.priority as keyof AllocationWeights['priority'];
  const priorityMultiplier = weights.priority[priorityKey] ?? 1.0;
  
  const statusKey = task.status as keyof AllocationWeights['status'];
  const statusMultiplier = weights.status[statusKey] ?? 1.0;
  
  const urgencyCategory = getUrgencyCategory(task.due_date);
  const urgencyMultiplier = weights.urgency[urgencyCategory] ?? 1.0;
  
  // Calculate weighted points
  // Formula: hours × priority × urgency × status
  const weightedPoints = basePoints * priorityMultiplier * urgencyMultiplier * statusMultiplier;
  
  return Math.round(weightedPoints * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate total allocation for a team member from their assigned tasks
 */
export function calculateMemberAllocation(
  memberId: string,
  tasks: TaskForAllocation[],
  weights: AllocationWeights = defaultAllocationWeights
): number {
  const memberTasks = tasks.filter(
    (t) => t.assignee_id === memberId && !['done', 'cancelled'].includes(t.status)
  );
  
  const totalPoints = memberTasks.reduce(
    (sum, task) => sum + calculateTaskAllocation(task, weights),
    0
  );
  
  return Math.round(totalPoints * 100) / 100;
}

/**
 * Calculate allocation percentage relative to capacity
 */
export function calculateAllocationPercentage(
  allocation: number,
  capacity: number
): number {
  if (capacity <= 0) return 0;
  return Math.round((allocation / capacity) * 100);
}

/**
 * Get allocation weights from localStorage or return defaults
 */
export function getStoredWeights(): AllocationWeights {
  try {
    const stored = localStorage.getItem('allocationWeights');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all keys exist
      return {
        priority: { ...defaultAllocationWeights.priority, ...parsed.priority },
        urgency: { ...defaultAllocationWeights.urgency, ...parsed.urgency },
        status: { ...defaultAllocationWeights.status, ...parsed.status },
      };
    }
  } catch {
    // Ignore parse errors
  }
  return defaultAllocationWeights;
}

/**
 * Save allocation weights to localStorage
 */
export function saveWeights(weights: AllocationWeights): void {
  localStorage.setItem('allocationWeights', JSON.stringify(weights));
}
