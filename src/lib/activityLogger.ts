import { supabase } from '@/integrations/supabase/client';

export type ActivityType = 
  | 'task_created'
  | 'task_updated'
  | 'task_deleted'
  | 'task_completed'
  | 'task_assigned'
  | 'subtask_added'
  | 'subtask_completed'
  | 'subtask_deleted'
  | 'project_created'
  | 'project_updated'
  | 'project_deleted'
  | 'program_created'
  | 'program_updated'
  | 'program_deleted'
  | 'portfolio_created'
  | 'portfolio_updated'
  | 'portfolio_deleted'
  | 'milestone_created'
  | 'milestone_updated'
  | 'milestone_deleted'
  | 'team_member_added'
  | 'team_member_removed'
  | 'contact_created'
  | 'contact_updated'
  | 'contact_deleted'
  | 'email_sent'
  | 'permission_changed'
  | 'role_assigned'
  | 'settings_updated'
  | 'report_exported'
  | 'login'
  | 'logout';

export type ActivityCategory = 'tasks' | 'projects' | 'programs' | 'portfolios' | 'milestones' | 'team' | 'contacts' | 'email' | 'settings' | 'auth' | 'reports';

interface LogActivityParams {
  type: ActivityType;
  category: ActivityCategory;
  title: string;
  description?: string;
  entityId?: string;
  entityType?: string;
}

/**
 * Log an activity to the database. This is a fire-and-forget function
 * that won't block the calling code or throw errors.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get user's org_id from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (!profile?.org_id) return;

    await supabase.from('activity_logs').insert({
      type: params.type,
      category: params.category,
      title: params.title,
      description: params.description || null,
      entity_id: params.entityId || null,
      entity_type: params.entityType || null,
      user_id: user.id,
      org_id: profile.org_id,
    });
  } catch (error) {
    // Silent fail - activity logging should never break the app
    console.warn('Failed to log activity:', error);
  }
}
