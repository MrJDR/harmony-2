export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
  projectId?: string;
  taskId?: string;
  link?: string; // Direct link to navigate to
}
