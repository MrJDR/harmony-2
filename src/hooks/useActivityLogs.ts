import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ActivityLog {
  id: string;
  type: string;
  category: string;
  title: string;
  description: string | null;
  user_id: string | null;
  entity_id: string | null;
  entity_type: string | null;
  org_id: string;
  created_at: string;
}

export interface ActivityLogWithUser extends ActivityLog {
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
}

export function useActivityLogs(limit: number = 20) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['activity_logs', organization?.id, limit],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          *,
          profiles:user_id (first_name, last_name, email, avatar_url)
        `)
        .eq('org_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as ActivityLogWithUser[];
    },
    enabled: !!organization?.id,
  });
}

export function useCreateActivityLog() {
  const queryClient = useQueryClient();
  const { organization, user } = useAuth();

  return useMutation({
    mutationFn: async (data: { 
      type: string;
      category: string;
      title: string;
      description?: string;
      entity_id?: string;
      entity_type?: string;
    }) => {
      if (!organization?.id) throw new Error('No organization');
      
      const { data: log, error } = await supabase
        .from('activity_logs')
        .insert({
          type: data.type,
          category: data.category,
          title: data.title,
          description: data.description || null,
          user_id: user?.id || null,
          entity_id: data.entity_id || null,
          entity_type: data.entity_type || null,
          org_id: organization.id,
        })
        .select()
        .single();

      if (error) throw error;
      return log;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity_logs'] });
    },
  });
}
