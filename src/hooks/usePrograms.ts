import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Program {
  id: string;
  name: string;
  description: string | null;
  status: 'planning' | 'active' | 'on-hold' | 'completed';
  portfolio_id: string;
  owner_id: string | null;
  org_id: string;
  created_at: string;
  updated_at: string;
  custom_statuses: any[] | null;
  custom_project_statuses: any[] | null;
}

export interface ProgramWithRelations extends Program {
  portfolios?: { name: string } | null;
  owner?: { first_name: string | null; last_name: string | null; email: string } | null;
}

export function usePrograms(portfolioId?: string) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['programs', organization?.id, portfolioId],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      let query = supabase
        .from('programs')
        .select(`
          *,
          portfolios:portfolio_id (name),
          owner:owner_id (first_name, last_name, email)
        `)
        .eq('org_id', organization.id)
        .order('created_at', { ascending: false });

      if (portfolioId) {
        query = query.eq('portfolio_id', portfolioId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ProgramWithRelations[];
    },
    enabled: !!organization?.id,
  });
}

export function useProgram(id: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['program', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('programs')
        .select(`
          *,
          portfolios:portfolio_id (name),
          owner:owner_id (first_name, last_name, email)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as ProgramWithRelations | null;
    },
    enabled: !!id && !!organization?.id,
  });
}

export function useCreateProgram() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (data: { 
      name: string; 
      description?: string; 
      portfolio_id: string;
      status?: 'planning' | 'active' | 'on-hold' | 'completed';
      owner_id?: string;
    }) => {
      if (!organization?.id) throw new Error('No organization');
      
      const { data: program, error } = await supabase
        .from('programs')
        .insert({
          name: data.name,
          description: data.description || null,
          portfolio_id: data.portfolio_id,
          status: data.status || 'planning',
          owner_id: data.owner_id || null,
          org_id: organization.id,
        })
        .select()
        .single();

      if (error) throw error;
      return program;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast.success('Program created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create program: ' + error.message);
    },
  });
}

export function useUpdateProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { 
      id: string; 
      name?: string; 
      description?: string;
      status?: 'planning' | 'active' | 'on-hold' | 'completed';
      owner_id?: string;
      custom_statuses?: any[];
      custom_project_statuses?: any[];
    }) => {
      const { data: program, error } = await supabase
        .from('programs')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return program;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['program', data.id] });
      toast.success('Program updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update program: ' + error.message);
    },
  });
}

export function useDeleteProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast.success('Program deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete program: ' + error.message);
    },
  });
}
