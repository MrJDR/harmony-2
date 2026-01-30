import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  expertise: string | null;
  role: string | null;
  notes: string | null;
  avatar_url: string | null;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export function useContacts() {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  // Set up realtime subscription for contacts
  useEffect(() => {
    if (!organization?.id) return;

    const channel = supabase
      .channel(`realtime:contacts:${organization.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts',
          filter: `org_id=eq.${organization.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['contacts', organization.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organization?.id, queryClient]);

  return useQuery({
    queryKey: ['contacts', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('org_id', organization.id)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Contact[];
    },
    enabled: !!organization?.id,
  });
}

export function useContact(id: string | undefined) {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  // Set up realtime subscription for single contact
  useEffect(() => {
    if (!organization?.id || !id) return;

    const channel = supabase
      .channel(`realtime:contact:${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts',
          filter: `id=eq.${id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['contact', id] });
          queryClient.invalidateQueries({ queryKey: ['contacts', organization.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organization?.id, id, queryClient]);

  return useQuery({
    queryKey: ['contact', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Contact | null;
    },
    enabled: !!id && !!organization?.id,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (data: { 
      name: string; 
      email?: string;
      phone?: string;
      company?: string;
      expertise?: string;
      role?: string;
      notes?: string;
      avatar_url?: string;
    }) => {
      if (!organization?.id) throw new Error('No organization');
      
      const { data: contact, error } = await supabase
        .from('contacts')
        .insert({
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          company: data.company || null,
          expertise: data.expertise || null,
          role: data.role || null,
          notes: data.notes || null,
          avatar_url: data.avatar_url || null,
          org_id: organization.id,
        })
        .select()
        .single();

      if (error) throw error;
      return contact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create contact: ' + error.message);
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { 
      id: string; 
      name?: string; 
      email?: string;
      phone?: string;
      company?: string;
      expertise?: string;
      role?: string;
      notes?: string;
      avatar_url?: string;
    }) => {
      const { data: contact, error } = await supabase
        .from('contacts')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return contact;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact', data.id] });
      toast.success('Contact updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update contact: ' + error.message);
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete contact: ' + error.message);
    },
  });
}
