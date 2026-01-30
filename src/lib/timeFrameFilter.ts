import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import type { Task } from '@/types/portfolio';

export type TimeFrame = 'current-week' | 'this-month' | 'this-quarter' | 'this-year' | 'all-time';

export interface TimeFrameRange {
  start: Date;
  end: Date;
}

/**
 * Get the date range for a given time frame
 */
export function getTimeFrameRange(timeFrame: TimeFrame): TimeFrameRange {
  const now = new Date();
  
  switch (timeFrame) {
    case 'current-week':
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }), // Monday
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case 'this-month':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
    case 'this-quarter':
      return {
        start: startOfQuarter(now),
        end: endOfQuarter(now),
      };
    case 'this-year':
      return {
        start: startOfYear(now),
        end: endOfYear(now),
      };
    case 'all-time':
      return {
        start: new Date(0), // Beginning of time
        end: new Date('2100-01-01'), // Far future
      };
    default:
      return getTimeFrameRange('current-week');
  }
}

/**
 * Check if a task falls within the given time frame
 * A task is included if:
 * - It has a due_date within the range, OR
 * - It has a start_date within the range, OR
 * - It has both dates and the range overlaps with the task period, OR
 * - It has no dates (included in all time frames - represents unscheduled work)
 */
export function isTaskInTimeFrame(task: Task, timeFrame: TimeFrame): boolean {
  const range = getTimeFrameRange(timeFrame);
  
  // If no dates, include in all time frames (represents unscheduled work that needs to be done)
  // This ensures tasks without dates are counted in current workload
  if (!task.startDate && !task.dueDate) {
    return true;
  }
  
  // Parse dates
  const startDate = task.startDate ? new Date(task.startDate) : null;
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  
  // If only due date, check if it's in range
  if (!startDate && dueDate) {
    return isWithinInterval(dueDate, range);
  }
  
  // If only start date, check if it's in range
  if (startDate && !dueDate) {
    return isWithinInterval(startDate, range);
  }
  
  // If both dates, check if the task period overlaps with the range
  if (startDate && dueDate) {
    // Task overlaps if:
    // - Task starts before range ends AND task ends after range starts
    return startDate <= range.end && dueDate >= range.start;
  }
  
  return false;
}

/**
 * Filter tasks by time frame
 * 
 * This function filters tasks BEFORE weighted allocation calculation.
 * Only tasks returned by this function will have their weighted points counted.
 * 
 * Tasks without dates are included in all time frames (represents unscheduled work).
 * Tasks with dates are included only if they fall within the time frame range.
 */
export function filterTasksByTimeFrame(tasks: Task[], timeFrame: TimeFrame): Task[] {
  if (timeFrame === 'all-time') {
    return tasks;
  }
  
  return tasks.filter(task => isTaskInTimeFrame(task, timeFrame));
}

/**
 * Get a human-readable label for a time frame
 */
export function getTimeFrameLabel(timeFrame: TimeFrame): string {
  switch (timeFrame) {
    case 'current-week':
      return 'Current Week';
    case 'this-month':
      return 'This Month';
    case 'this-quarter':
      return 'This Quarter';
    case 'this-year':
      return 'This Year';
    case 'all-time':
      return 'All Time';
    default:
      return 'Current Week';
  }
}

/**
 * Calculate points per week for a given time frame
 * This normalizes the allocation to a weekly rate
 * For "all-time", returns the allocation as-is (not normalized)
 * 
 * Note: Tasks without dates are included in all time frames and represent
 * unscheduled work that needs to be accounted for in current capacity planning.
 */
export function calculatePointsPerWeek(allocation: number, timeFrame: TimeFrame): number {
  // For all-time, don't normalize - just return the total allocation
  if (timeFrame === 'all-time') {
    return allocation;
  }
  
  const range = getTimeFrameRange(timeFrame);
  const daysInRange = Math.ceil((range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24));
  const weeksInRange = daysInRange / 7;
  
  if (weeksInRange <= 0) return allocation;
  
  return Math.round((allocation / weeksInRange) * 100) / 100;
}

/**
 * Calculate the total capacity for a time frame based on weekly capacity
 * Returns the total capacity points for the entire time period
 */
export function calculateCapacityForTimeFrame(weeklyCapacity: number, timeFrame: TimeFrame): number {
  if (timeFrame === 'all-time') {
    // For all-time, return a very large number or just use weekly capacity
    // Since we can't calculate infinite capacity, we'll use a large multiplier
    return weeklyCapacity * 52; // Approximate year capacity
  }
  
  const range = getTimeFrameRange(timeFrame);
  const daysInRange = Math.ceil((range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24));
  const weeksInRange = daysInRange / 7;
  
  return Math.round(weeklyCapacity * weeksInRange * 100) / 100;
}
