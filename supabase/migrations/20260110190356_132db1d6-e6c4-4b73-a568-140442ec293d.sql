-- =============================================
-- PORTFOLIO MANAGEMENT SYSTEM - COMPLETE SCHEMA
-- =============================================

-- 1. PORTFOLIOS TABLE
CREATE TABLE public.portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_portfolios_org_id ON public.portfolios(org_id);

ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view portfolios in their org"
  ON public.portfolios FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Managers can create portfolios"
  ON public.portfolios FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) AND has_min_org_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Managers can update portfolios"
  ON public.portfolios FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()) AND has_min_org_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins can delete portfolios"
  ON public.portfolios FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()) AND has_min_org_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_portfolios_updated_at
  BEFORE UPDATE ON public.portfolios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. PROGRAMS TABLE
CREATE TABLE public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on-hold', 'completed')),
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_programs_org_id ON public.programs(org_id);
CREATE INDEX idx_programs_portfolio_id ON public.programs(portfolio_id);

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view programs in their org"
  ON public.programs FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Managers can create programs"
  ON public.programs FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) AND has_min_org_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Managers can update programs"
  ON public.programs FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()) AND has_min_org_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins can delete programs"
  ON public.programs FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()) AND has_min_org_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_programs_updated_at
  BEFORE UPDATE ON public.programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. PROJECTS TABLE
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on-hold', 'completed')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  start_date DATE,
  end_date DATE,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_org_id ON public.projects(org_id);
CREATE INDEX idx_projects_program_id ON public.projects(program_id);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view projects in their org"
  ON public.projects FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Members can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) AND has_min_org_role(auth.uid(), 'member'::app_role));

CREATE POLICY "Members can update projects"
  ON public.projects FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()) AND has_min_org_role(auth.uid(), 'member'::app_role));

CREATE POLICY "Managers can delete projects"
  ON public.projects FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()) AND has_min_org_role(auth.uid(), 'manager'::app_role));

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. CONTACTS TABLE (CRM)
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  expertise TEXT,
  role TEXT,
  notes TEXT,
  avatar_url TEXT,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contacts_org_id ON public.contacts(org_id);
CREATE INDEX idx_contacts_email ON public.contacts(email);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contacts in their org"
  ON public.contacts FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Members can create contacts"
  ON public.contacts FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) AND has_min_org_role(auth.uid(), 'member'::app_role));

CREATE POLICY "Members can update contacts"
  ON public.contacts FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()) AND has_min_org_role(auth.uid(), 'member'::app_role));

CREATE POLICY "Managers can delete contacts"
  ON public.contacts FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()) AND has_min_org_role(auth.uid(), 'manager'::app_role));

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. TEAM MEMBERS TABLE (links contacts to org capacity)
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  capacity INTEGER NOT NULL DEFAULT 40 CHECK (capacity > 0),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contact_id, org_id)
);

CREATE INDEX idx_team_members_org_id ON public.team_members(org_id);
CREATE INDEX idx_team_members_contact_id ON public.team_members(contact_id);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view team members in their org"
  ON public.team_members FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Managers can create team members"
  ON public.team_members FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) AND has_min_org_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Managers can update team members"
  ON public.team_members FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()) AND has_min_org_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins can delete team members"
  ON public.team_members FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()) AND has_min_org_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. PROJECT MEMBERS TABLE (assigns team members to projects)
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'contributor' CHECK (role IN ('owner', 'admin', 'editor', 'viewer', 'contributor')),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, member_id)
);

CREATE INDEX idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX idx_project_members_member_id ON public.project_members(member_id);
CREATE INDEX idx_project_members_org_id ON public.project_members(org_id);

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view project members in their org"
  ON public.project_members FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Members can manage project members"
  ON public.project_members FOR ALL
  USING (org_id = get_user_org_id(auth.uid()) AND has_min_org_role(auth.uid(), 'member'::app_role));

-- 7. MILESTONES TABLE
CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_milestones_org_id ON public.milestones(org_id);
CREATE INDEX idx_milestones_project_id ON public.milestones(project_id);
CREATE INDEX idx_milestones_program_id ON public.milestones(program_id);

ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view milestones in their org"
  ON public.milestones FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Members can create milestones"
  ON public.milestones FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) AND has_min_org_role(auth.uid(), 'member'::app_role));

CREATE POLICY "Members can update milestones"
  ON public.milestones FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()) AND has_min_org_role(auth.uid(), 'member'::app_role));

CREATE POLICY "Managers can delete milestones"
  ON public.milestones FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()) AND has_min_org_role(auth.uid(), 'manager'::app_role));

CREATE TRIGGER update_milestones_updated_at
  BEFORE UPDATE ON public.milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. TASKS TABLE
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'review', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  weight INTEGER NOT NULL DEFAULT 1 CHECK (weight > 0),
  assignee_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  start_date DATE,
  due_date DATE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_org_id ON public.tasks(org_id);
CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_milestone_id ON public.tasks(milestone_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks in their org"
  ON public.tasks FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Members can create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) AND has_min_org_role(auth.uid(), 'member'::app_role));

CREATE POLICY "Members can update tasks"
  ON public.tasks FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()) AND has_min_org_role(auth.uid(), 'member'::app_role));

CREATE POLICY "Members can delete tasks"
  ON public.tasks FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()) AND has_min_org_role(auth.uid(), 'member'::app_role));

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. SUBTASKS TABLE
CREATE TABLE public.subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  assignee_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subtasks_task_id ON public.subtasks(task_id);
CREATE INDEX idx_subtasks_org_id ON public.subtasks(org_id);

ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view subtasks in their org"
  ON public.subtasks FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Members can manage subtasks"
  ON public.subtasks FOR ALL
  USING (org_id = get_user_org_id(auth.uid()) AND has_min_org_role(auth.uid(), 'member'::app_role));

CREATE TRIGGER update_subtasks_updated_at
  BEFORE UPDATE ON public.subtasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. ACTIVITY LOG TABLE (for tracking changes)
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  entity_id UUID,
  entity_type TEXT,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_logs_org_id ON public.activity_logs(org_id);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON public.activity_logs(entity_id, entity_type);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activity in their org"
  ON public.activity_logs FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "System can create activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()));

-- 11. WATCHED ITEMS TABLE
CREATE TABLE public.watched_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('task', 'project', 'program', 'portfolio', 'contact')),
  item_name TEXT NOT NULL,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id, item_type)
);

CREATE INDEX idx_watched_items_user_id ON public.watched_items(user_id);
CREATE INDEX idx_watched_items_org_id ON public.watched_items(org_id);

ALTER TABLE public.watched_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their watched items"
  ON public.watched_items FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their watched items"
  ON public.watched_items FOR ALL
  USING (user_id = auth.uid());

-- 12. NOTIFICATIONS TABLE
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN NOT NULL DEFAULT false,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_org_id ON public.notifications(org_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their notifications"
  ON public.notifications FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()) OR user_id = auth.uid());