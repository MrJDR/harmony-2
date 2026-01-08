import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useNotifications } from './NotificationsContext';

export type WatchableType = 'task' | 'project' | 'program' | 'portfolio';

interface WatchedItem {
  id: string;
  type: WatchableType;
  name: string;
}

interface WatchContextType {
  watchedItems: WatchedItem[];
  isWatching: (id: string, type: WatchableType) => boolean;
  toggleWatch: (id: string, type: WatchableType, name: string) => void;
  watchItem: (id: string, type: WatchableType, name: string) => void;
  unwatchItem: (id: string, type: WatchableType) => void;
  getWatchedByType: (type: WatchableType) => WatchedItem[];
}

const WatchContext = createContext<WatchContextType | undefined>(undefined);

// Initial watched items for demo
const initialWatchedItems: WatchedItem[] = [
  { id: 'p1', type: 'project', name: 'Website Redesign' },
  { id: 't1', type: 'task', name: 'Design Homepage Mockups' },
];

export function WatchProvider({ children }: { children: ReactNode }) {
  const [watchedItems, setWatchedItems] = useState<WatchedItem[]>(initialWatchedItems);
  const { addNotification } = useNotifications();

  const isWatching = useCallback((id: string, type: WatchableType) => {
    return watchedItems.some(item => item.id === id && item.type === type);
  }, [watchedItems]);

  const watchItem = useCallback((id: string, type: WatchableType, name: string) => {
    if (!isWatching(id, type)) {
      setWatchedItems(prev => [...prev, { id, type, name }]);
      addNotification({
        title: `Now watching ${type}`,
        message: `You will receive notifications for "${name}"`,
        type: 'info',
      });
    }
  }, [isWatching, addNotification]);

  const unwatchItem = useCallback((id: string, type: WatchableType) => {
    const item = watchedItems.find(i => i.id === id && i.type === type);
    setWatchedItems(prev => prev.filter(i => !(i.id === id && i.type === type)));
    if (item) {
      addNotification({
        title: `Stopped watching ${type}`,
        message: `You will no longer receive notifications for "${item.name}"`,
        type: 'info',
      });
    }
  }, [watchedItems, addNotification]);

  const toggleWatch = useCallback((id: string, type: WatchableType, name: string) => {
    if (isWatching(id, type)) {
      unwatchItem(id, type);
    } else {
      watchItem(id, type, name);
    }
  }, [isWatching, watchItem, unwatchItem]);

  const getWatchedByType = useCallback((type: WatchableType) => {
    return watchedItems.filter(item => item.type === type);
  }, [watchedItems]);

  return (
    <WatchContext.Provider value={{
      watchedItems,
      isWatching,
      toggleWatch,
      watchItem,
      unwatchItem,
      getWatchedByType,
    }}>
      {children}
    </WatchContext.Provider>
  );
}

export function useWatch() {
  const context = useContext(WatchContext);
  if (context === undefined) {
    throw new Error('useWatch must be used within a WatchProvider');
  }
  return context;
}
