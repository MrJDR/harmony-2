import React, { createContext, useContext, ReactNode } from 'react';
import { 
  useDbNotifications, 
  useMarkNotificationRead, 
  useMarkAllNotificationsRead, 
  useDeleteNotification, 
  useClearAllNotifications,
  DbNotification 
} from '@/hooks/useNotifications';

// Map DB notification to UI notification format
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
  projectId?: string;
  taskId?: string;
  link?: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  isLoading: boolean;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

function mapDbNotification(db: DbNotification): Notification {
  return {
    id: db.id,
    title: db.title,
    message: db.message,
    type: db.type,
    read: db.read,
    createdAt: new Date(db.created_at),
    projectId: db.project_id || undefined,
    taskId: db.task_id || undefined,
  };
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { data: dbNotifications = [], isLoading } = useDbNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteNotificationMutation = useDeleteNotification();
  const clearAllMutation = useClearAllNotifications();

  // Convert DB notifications to UI format
  const notifications: Notification[] = dbNotifications.map(mapDbNotification);
  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (_notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    // Notifications are created server-side (via triggers/edge functions)
    // This is a no-op for now, but could be extended to insert via supabase
    console.log('addNotification is a no-op - notifications are created server-side');
  };

  const markAsRead = (id: string) => {
    markReadMutation.mutate(id);
  };

  const markAllAsRead = () => {
    markAllReadMutation.mutate();
  };

  const removeNotification = (id: string) => {
    deleteNotificationMutation.mutate(id);
  };

  const clearAll = () => {
    clearAllMutation.mutate();
  };

  return (
    <NotificationsContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAll,
      isLoading,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
