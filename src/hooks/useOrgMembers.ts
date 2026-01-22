import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface OrgMember {
  id: string; // user_id from profiles (Supabase auth user ID)
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: string;
}

/**
 * Hook to get organization members who are actual Supabase users.
 * These are users who can participate in Stream Chat (unlike team_members which are contacts).
 * Uses profiles_safe view to respect RLS policies.
 */
export function useOrgMembers() {
  const { organization, user } = useAuth();

  return useQuery({
    queryKey: ['org_members', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      // Get user_roles for this org
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('org_id', organization.id);

      if (rolesError) throw rolesError;
      if (!userRoles || userRoles.length === 0) return [];

      // Get profiles using profiles_safe view (respects RLS)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles_safe')
        .select('id, email, first_name, last_name, avatar_url')
        .eq('org_id', organization.id);

      if (profilesError) throw profilesError;

      // Create a map of user_id to role
      const roleMap = new Map(userRoles.map(ur => [ur.user_id, ur.role]));

      // Transform to OrgMember format, excluding current user
      return (profiles || [])
        .filter(profile => profile.id !== user?.id)
        .map(profile => ({
          id: profile.id!,
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          avatar_url: profile.avatar_url,
          role: roleMap.get(profile.id!) || 'member',
        })) as OrgMember[];
    },
    enabled: !!organization?.id,
  });
}
