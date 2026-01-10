import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type WatchableType = 'task' | 'project' | 'program' | 'portfolio' | 'contact';

export interface WatchedItem {
  id: string;
  user_id: string;
  item_id: string;
  item_type: WatchableType;
  item_name: string;
  org_id: string;
  created_at: string;
}

export function useWatchedItems(type?: WatchableType) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['watched_items', user?.id, type],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('watched_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (type) {
        query = query.eq('item_type', type);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as WatchedItem[];
    },
    enabled: !!user?.id,
  });
}

export function useIsWatching(itemId: string, itemType: WatchableType) {
  const { data: watchedItems } = useWatchedItems();
  
  return watchedItems?.some(
    item => item.item_id === itemId && item.item_type === itemType
  ) ?? false;
}

export function useWatchItem() {
  const queryClient = useQueryClient();
  const { user, organization } = useAuth();

  return useMutation({
    mutationFn: async (data: { 
      item_id: string; 
      item_type: WatchableType;
      item_name: string;
    }) => {
      if (!user?.id || !organization?.id) throw new Error('Not authenticated');
      
      const { data: item, error } = await supabase
        .from('watched_items')
        .insert({
          user_id: user.id,
          item_id: data.item_id,
          item_type: data.item_type,
          item_name: data.item_name,
          org_id: organization.id,
        })
        .select()
        .single();

      if (error) throw error;
      return item;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['watched_items'] });
      toast.success(`Now watching ${variables.item_name}`);
    },
    onError: (error) => {
      toast.error('Failed to watch item: ' + error.message);
    },
  });
}

export function useUnwatchItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { item_id: string; item_type: WatchableType }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('watched_items')
        .delete()
        .eq('user_id', user.id)
        .eq('item_id', data.item_id)
        .eq('item_type', data.item_type);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watched_items'] });
      toast.success('Stopped watching');
    },
    onError: (error) => {
      toast.error('Failed to unwatch item: ' + error.message);
    },
  });
}

export function useToggleWatch() {
  const watchItem = useWatchItem();
  const unwatchItem = useUnwatchItem();
  const { data: watchedItems } = useWatchedItems();

  return {
    toggleWatch: (itemId: string, itemType: WatchableType, itemName: string) => {
      const isWatching = watchedItems?.some(
        item => item.item_id === itemId && item.item_type === itemType
      );

      if (isWatching) {
        unwatchItem.mutate({ item_id: itemId, item_type: itemType });
      } else {
        watchItem.mutate({ item_id: itemId, item_type: itemType, item_name: itemName });
      }
    },
    isLoading: watchItem.isPending || unwatchItem.isPending,
  };
}
