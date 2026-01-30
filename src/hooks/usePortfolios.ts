import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  owner_id: string | null;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export function usePortfolios() {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  // Set up realtime subscription for portfolios
  useEffect(() => {
    if (!organization?.id) return;

    const channel = supabase
      .channel(`realtime:portfolios:${organization.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portfolios',
          filter: `org_id=eq.${organization.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['portfolios', organization.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organization?.id, queryClient]);

  return useQuery({
    queryKey: ['portfolios', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('org_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Portfolio[];
    },
    enabled: !!organization?.id,
  });
}

export function usePortfolio(id: string | undefined) {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  // Set up realtime subscription for single portfolio
  useEffect(() => {
    if (!organization?.id || !id) return;

    const channel = supabase
      .channel(`realtime:portfolio:${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portfolios',
          filter: `id=eq.${id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['portfolio', id] });
          queryClient.invalidateQueries({ queryKey: ['portfolios', organization.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organization?.id, id, queryClient]);

  return useQuery({
    queryKey: ['portfolio', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Portfolio | null;
    },
    enabled: !!id && !!organization?.id,
  });
}

export function useCreatePortfolio() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string; owner_id?: string }) => {
      if (!organization?.id) throw new Error('No organization');
      
      const { data: portfolio, error } = await supabase
        .from('portfolios')
        .insert({
          name: data.name,
          description: data.description || null,
          org_id: organization.id,
          owner_id: data.owner_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return portfolio;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      toast.success('Portfolio created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create portfolio: ' + error.message);
    },
  });
}

export function useUpdatePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string; owner_id?: string }) => {
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.owner_id !== undefined) updateData.owner_id = data.owner_id || null;
      
      const { data: portfolio, error } = await supabase
        .from('portfolios')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return portfolio;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio', data.id] });
      toast.success('Portfolio updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update portfolio: ' + error.message);
    },
  });
}

export function useDeletePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('portfolios')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      toast.success('Portfolio deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete portfolio: ' + error.message);
    },
  });
}
