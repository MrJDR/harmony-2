import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Message {
  id: string;
  org_id: string;
  sender_id: string | null;
  sender_name: string;
  sender_email: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  body: string;
  folder: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export function useMessages(folder?: string) {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['messages', folder],
    queryFn: async () => {
      let query = supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (folder) {
        query = query.eq('folder', folder);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!profile?.org_id,
  });
}

export function useCreateMessage() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (message: {
      recipient_email: string;
      recipient_name?: string;
      subject: string;
      body: string;
    }) => {
      if (!profile?.org_id) throw new Error('No organization');
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          org_id: profile.org_id,
          sender_id: profile.id,
          sender_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
          sender_email: profile.email,
          recipient_email: message.recipient_email,
          recipient_name: message.recipient_name,
          subject: message.subject,
          body: message.body,
          folder: 'sent',
          read: true,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

export function useUpdateMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; read?: boolean; folder?: string }) => {
      const { data, error } = await supabase
        .from('messages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}
