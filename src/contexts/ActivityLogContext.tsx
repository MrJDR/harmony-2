import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

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
  addLog: (entry: Omit<ActivityLogEntry, 'id' | 'timestamp' | 'userId' | 'userName'>) => void;
  clearLogs: () => void;
  getLogsByCategory: (category: ActivityCategory) => ActivityLogEntry[];
  getLogsByType: (type: ActivityType) => ActivityLogEntry[];
  getRecentLogs: (count: number) => ActivityLogEntry[];
}

const ActivityLogContext = createContext<ActivityLogContextType | null>(null);

// Mock initial logs for demonstration
const initialLogs: ActivityLogEntry[] = [
  {
    id: 'log-1',
    type: 'task_completed',
    category: 'tasks',
    title: 'Task Completed',
    description: 'Marked "Design Homepage Mockups" as done',
    userId: 't1',
    userName: 'Sarah Chen',
    entityId: 'task-1',
    entityName: 'Design Homepage Mockups',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
  },
  {
    id: 'log-2',
    type: 'task_assigned',
    category: 'tasks',
    title: 'Task Assigned',
    description: 'Assigned "Implement Navigation Component" to Sarah Chen',
    userId: 't4',
    userName: 'David Kim',
    entityId: 'task-2',
    entityName: 'Implement Navigation Component',
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
  },
  {
    id: 'log-3',
    type: 'project_updated',
    category: 'projects',
    title: 'Project Updated',
    description: 'Updated project "Website Redesign" progress to 65%',
    userId: 't2',
    userName: 'Marcus Johnson',
    entityId: 'p1',
    entityName: 'Website Redesign',
    timestamp: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
  },
  {
    id: 'log-4',
    type: 'subtask_added',
    category: 'tasks',
    title: 'Subtask Added',
    description: 'Added subtask to "Set Up React Native Project"',
    userId: 't3',
    userName: 'Emily Rodriguez',
    entityId: 'task-4',
    entityName: 'Set Up React Native Project',
    timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
  },
  {
    id: 'log-5',
    type: 'team_member_added',
    category: 'team',
    title: 'Team Member Added',
    description: 'Added Emily Rodriguez to "Mobile App Development"',
    userId: 't4',
    userName: 'David Kim',
    entityId: 't3',
    entityName: 'Emily Rodriguez',
    timestamp: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
  },
  {
    id: 'log-6',
    type: 'email_sent',
    category: 'email',
    title: 'Email Sent',
    description: 'Sent project update email to stakeholders',
    userId: 't1',
    userName: 'Sarah Chen',
    timestamp: new Date(Date.now() - 1000 * 60 * 240), // 4 hours ago
  },
  {
    id: 'log-7',
    type: 'contact_created',
    category: 'contacts',
    title: 'Contact Created',
    description: 'Added new contact "John Smith"',
    userId: 't4',
    userName: 'David Kim',
    entityId: 'c5',
    entityName: 'John Smith',
    timestamp: new Date(Date.now() - 1000 * 60 * 300), // 5 hours ago
  },
  {
    id: 'log-8',
    type: 'settings_updated',
    category: 'settings',
    title: 'Settings Updated',
    description: 'Updated notification preferences',
    userId: 't2',
    userName: 'Marcus Johnson',
    timestamp: new Date(Date.now() - 1000 * 60 * 360), // 6 hours ago
  },
  {
    id: 'log-9',
    type: 'permission_changed',
    category: 'settings',
    title: 'Permission Changed',
    description: 'Updated role permissions for "contributor"',
    userId: 't4',
    userName: 'David Kim',
    timestamp: new Date(Date.now() - 1000 * 60 * 420), // 7 hours ago
  },
  {
    id: 'log-10',
    type: 'task_created',
    category: 'tasks',
    title: 'Task Created',
    description: 'Created task "API documentation complete"',
    userId: 't3',
    userName: 'Emily Rodriguez',
    entityId: 'task-15',
    entityName: 'API documentation complete',
    timestamp: new Date(Date.now() - 1000 * 60 * 480), // 8 hours ago
  },
  {
    id: 'log-11',
    type: 'program_updated',
    category: 'programs',
    title: 'Program Updated',
    description: 'Updated "Customer Experience Enhancement" description',
    userId: 't4',
    userName: 'David Kim',
    entityId: 'prog-1',
    entityName: 'Customer Experience Enhancement',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  },
  {
    id: 'log-12',
    type: 'report_exported',
    category: 'reports',
    title: 'Report Exported',
    description: 'Exported executive summary report as PDF',
    userId: 't4',
    userName: 'David Kim',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
  },
];

export function ActivityLogProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<ActivityLogEntry[]>(initialLogs);

  const addLog = useCallback((entry: Omit<ActivityLogEntry, 'id' | 'timestamp' | 'userId' | 'userName'>) => {
    const newLog: ActivityLogEntry = {
      ...entry,
      id: `log-${Date.now()}`,
      userId: 't4', // Mock current user
      userName: 'David Kim', // Mock current user name
      timestamp: new Date(),
    };
    setLogs(prev => [newLog, ...prev]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
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
    <ActivityLogContext.Provider value={{ logs, addLog, clearLogs, getLogsByCategory, getLogsByType, getRecentLogs }}>
      {children}
    </ActivityLogContext.Provider>
  );
}

export function useActivityLog() {
  const ctx = useContext(ActivityLogContext);
  if (!ctx) throw new Error('useActivityLog must be used within an ActivityLogProvider');
  return ctx;
}