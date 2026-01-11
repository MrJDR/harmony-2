import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useActivityLogs, useCreateActivityLog, type ActivityLogWithUser } from '@/hooks/useActivityLogs';

export type ActivityType = 
  | 'task_created'
  | 'task_updated'
  | 'task_deleted'
  | 'task_completed'
  | 'task_assigned'
  | 'subtask_added'
  | 'subtask_completed'
  | 'subtask_deleted'
  | 'project_created'
  | 'project_updated'
  | 'project_deleted'
  | 'program_created'
  | 'program_updated'
  | 'team_member_added'
  | 'team_member_removed'
  | 'contact_created'
  | 'contact_updated'
  | 'contact_deleted'
  | 'email_sent'
  | 'permission_changed'
  | 'role_assigned'
  | 'settings_updated'
  | 'report_exported'
  | 'login'
  | 'logout';

export type ActivityCategory = 'tasks' | 'projects' | 'programs' | 'team' | 'contacts' | 'email' | 'settings' | 'auth' | 'reports';

export interface ActivityLogEntry {
  id: string;
  type: ActivityType;
  category: ActivityCategory;
  title: string;
  description: string;
  userId: string;
  userName: string;
  entityId?: string;
  entityName?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

interface ActivityLogContextType {
  logs: ActivityLogEntry[];
  isLoading: boolean;
  addLog: (entry: Omit<ActivityLogEntry, 'id' | 'timestamp' | 'userId' | 'userName'>) => void;
  clearLogs: () => void;
  getLogsByCategory: (category: ActivityCategory) => ActivityLogEntry[];
  getLogsByType: (type: ActivityType) => ActivityLogEntry[];
  getRecentLogs: (count: number) => ActivityLogEntry[];
}

const ActivityLogContext = createContext<ActivityLogContextType | null>(null);

export function ActivityLogProvider({ children }: { children: ReactNode }) {
  const { data: dbLogs = [], isLoading } = useActivityLogs(100);
  const createLog = useCreateActivityLog();

  // Convert database logs to legacy format
  const logs: ActivityLogEntry[] = dbLogs.map(log => ({
    id: log.id,
    type: log.type as ActivityType,
    category: log.category as ActivityCategory,
    title: log.title,
    description: log.description || '',
    userId: log.user_id || '',
    userName: log.profiles 
      ? `${log.profiles.first_name || ''} ${log.profiles.last_name || ''}`.trim() || log.profiles.email
      : 'System',
    entityId: log.entity_id || undefined,
    entityName: undefined,
    timestamp: new Date(log.created_at),
  }));

  const addLog = useCallback((entry: Omit<ActivityLogEntry, 'id' | 'timestamp' | 'userId' | 'userName'>) => {
    createLog.mutate({
      type: entry.type,
      category: entry.category,
      title: entry.title,
      description: entry.description,
      entity_id: entry.entityId,
      entity_type: entry.category,
    });
  }, [createLog]);

  const clearLogs = useCallback(() => {
    // Not implemented for database - logs are persistent
  }, []);

  const getLogsByCategory = useCallback((category: ActivityCategory) => {
    return logs.filter(log => log.category === category);
  }, [logs]);

  const getLogsByType = useCallback((type: ActivityType) => {
    return logs.filter(log => log.type === type);
  }, [logs]);

  const getRecentLogs = useCallback((count: number) => {
    return logs.slice(0, count);
  }, [logs]);

  return (
    <ActivityLogContext.Provider value={{ logs, isLoading, addLog, clearLogs, getLogsByCategory, getLogsByType, getRecentLogs }}>
      {children}
    </ActivityLogContext.Provider>
  );
}

export function useActivityLog() {
  const ctx = useContext(ActivityLogContext);
  if (!ctx) throw new Error('useActivityLog must be used within an ActivityLogProvider');
  return ctx;
}
