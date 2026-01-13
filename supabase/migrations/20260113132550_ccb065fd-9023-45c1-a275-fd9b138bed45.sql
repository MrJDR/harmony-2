-- Insert sample contacts for ABC org (skip if exists)
INSERT INTO public.contacts (org_id, name, email, role, expertise, company, phone) VALUES
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'Sarah Chen', 'sarah.chen@example.com', 'Project Manager', 'Agile, Scrum', 'ABC Corp', '555-0101'),
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'Marcus Johnson', 'marcus.j@example.com', 'Senior Developer', 'React, TypeScript', 'ABC Corp', '555-0102'),
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'Emily Rodriguez', 'emily.r@example.com', 'UX Designer', 'Figma, User Research', 'ABC Corp', '555-0103'),
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'David Kim', 'david.kim@example.com', 'DevOps Engineer', 'AWS, Docker, K8s', 'ABC Corp', '555-0104'),
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'Lisa Thompson', 'lisa.t@example.com', 'Business Analyst', 'Requirements, SQL', 'ABC Corp', '555-0105'),
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'James Wilson', 'james.w@example.com', 'QA Lead', 'Testing, Automation', 'ABC Corp', '555-0106'),
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'Anna Martinez', 'anna.m@example.com', 'Product Owner', 'Strategy, Roadmapping', 'ABC Corp', '555-0107'),
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'Michael Brown', 'michael.b@example.com', 'Backend Developer', 'Node.js, PostgreSQL', 'ABC Corp', '555-0108')
ON CONFLICT DO NOTHING;

-- Insert team members linked to contacts
INSERT INTO public.team_members (org_id, contact_id, capacity)
SELECT 'd0b18a83-0556-46b7-89c7-ea1fbde3ee44', id, 
  CASE 
    WHEN name = 'Sarah Chen' THEN 40
    WHEN name = 'Marcus Johnson' THEN 35
    WHEN name = 'Emily Rodriguez' THEN 30
    WHEN name = 'David Kim' THEN 40
    WHEN name = 'Lisa Thompson' THEN 25
    WHEN name = 'James Wilson' THEN 35
    WHEN name = 'Anna Martinez' THEN 30
    WHEN name = 'Michael Brown' THEN 40
  END
FROM public.contacts 
WHERE org_id = 'd0b18a83-0556-46b7-89c7-ea1fbde3ee44'
AND NOT EXISTS (
  SELECT 1 FROM public.team_members tm WHERE tm.contact_id = contacts.id
);

-- Insert portfolios
INSERT INTO public.portfolios (id, org_id, name, description) VALUES
('a1111111-1111-1111-1111-111111111111', 'd0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'Digital Transformation', 'Enterprise-wide digital modernization initiatives'),
('a2222222-2222-2222-2222-222222222222', 'd0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'Customer Experience', 'Customer-facing product improvements and new features')
ON CONFLICT (id) DO NOTHING;

-- Insert programs
INSERT INTO public.programs (id, org_id, portfolio_id, name, description, status) VALUES
('b1111111-1111-1111-1111-111111111111', 'd0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'a1111111-1111-1111-1111-111111111111', 'Cloud Migration', 'Migrate legacy systems to cloud infrastructure', 'active'),
('b2222222-2222-2222-2222-222222222222', 'd0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'a1111111-1111-1111-1111-111111111111', 'Data Platform', 'Build unified data analytics platform', 'planning'),
('b3333333-3333-3333-3333-333333333333', 'd0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'a2222222-2222-2222-2222-222222222222', 'Mobile App Redesign', 'Complete redesign of mobile applications', 'active'),
('b4444444-4444-4444-4444-444444444444', 'd0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'a2222222-2222-2222-2222-222222222222', 'Self-Service Portal', 'Customer self-service portal development', 'active')
ON CONFLICT (id) DO NOTHING;

-- Insert projects
INSERT INTO public.projects (id, org_id, program_id, name, description, status, progress, start_date, end_date) VALUES
('c1111111-1111-1111-1111-111111111111', 'd0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'b1111111-1111-1111-1111-111111111111', 'AWS Infrastructure Setup', 'Set up core AWS infrastructure and networking', 'active', 65, '2025-01-01', '2025-03-31'),
('c2222222-2222-2222-2222-222222222222', 'd0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'b1111111-1111-1111-1111-111111111111', 'Database Migration', 'Migrate on-prem databases to RDS', 'planning', 10, '2025-02-15', '2025-05-30'),
('c3333333-3333-3333-3333-333333333333', 'd0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'b1111111-1111-1111-1111-111111111111', 'Application Containerization', 'Containerize legacy applications', 'active', 40, '2025-01-15', '2025-04-30'),
('c4444444-4444-4444-4444-444444444444', 'd0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'b2222222-2222-2222-2222-222222222222', 'Data Warehouse Design', 'Design and implement data warehouse', 'planning', 5, '2025-03-01', '2025-06-30'),
('c5555555-5555-5555-5555-555555555555', 'd0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'b2222222-2222-2222-2222-222222222222', 'ETL Pipeline Development', 'Build data ingestion pipelines', 'planning', 0, '2025-04-01', '2025-07-31'),
('c6666666-6666-6666-6666-666666666666', 'd0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'b3333333-3333-3333-3333-333333333333', 'Mobile UI/UX Research', 'User research and design system', 'completed', 100, '2024-10-01', '2024-12-31'),
('c7777777-7777-7777-7777-777777777777', 'd0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'b3333333-3333-3333-3333-333333333333', 'iOS App Development', 'Develop new iOS application', 'active', 55, '2025-01-01', '2025-04-30'),
('c8888888-8888-8888-8888-888888888888', 'd0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'b3333333-3333-3333-3333-333333333333', 'Android App Development', 'Develop new Android application', 'active', 45, '2025-01-01', '2025-05-15'),
('c9999999-9999-9999-9999-999999999999', 'd0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'b4444444-4444-4444-4444-444444444444', 'Portal Backend API', 'Build REST API for portal', 'active', 70, '2024-11-01', '2025-02-28'),
('caaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'b4444444-4444-4444-4444-444444444444', 'Portal Frontend', 'React-based portal frontend', 'active', 50, '2024-12-01', '2025-03-31')
ON CONFLICT (id) DO NOTHING;

-- Insert milestones
INSERT INTO public.milestones (org_id, program_id, project_id, title, description, due_date) VALUES
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'b1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'VPC Setup Complete', 'All VPCs and networking configured', '2025-01-31'),
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'b1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Production Ready', 'Infrastructure ready for production workloads', '2025-03-15'),
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'b3333333-3333-3333-3333-333333333333', 'c7777777-7777-7777-7777-777777777777', 'Beta Release', 'iOS app beta available in TestFlight', '2025-03-01'),
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'b3333333-3333-3333-3333-333333333333', 'c7777777-7777-7777-7777-777777777777', 'App Store Launch', 'iOS app live in App Store', '2025-04-30'),
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'b4444444-4444-4444-4444-444444444444', 'c9999999-9999-9999-9999-999999999999', 'API v1 Complete', 'All core API endpoints implemented', '2025-02-15'),
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'b4444444-4444-4444-4444-444444444444', 'caaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Portal MVP Launch', 'Portal live for pilot customers', '2025-03-31');

-- Insert tasks (using valid statuses: todo, in-progress, review, done)
INSERT INTO public.tasks (org_id, project_id, title, description, status, priority, due_date, start_date) VALUES
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'c1111111-1111-1111-1111-111111111111', 'Configure VPC and subnets', 'Set up VPC with public/private subnets', 'done', 'high', '2025-01-20', '2025-01-05'),
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'c1111111-1111-1111-1111-111111111111', 'Set up IAM roles and policies', 'Create IAM roles for services', 'done', 'high', '2025-01-25', '2025-01-15'),
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'c1111111-1111-1111-1111-111111111111', 'Configure CloudWatch monitoring', 'Set up logging and alerting', 'in-progress', 'medium', '2025-02-10', '2025-01-28'),
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'c1111111-1111-1111-1111-111111111111', 'Implement CI/CD pipeline', 'GitHub Actions to AWS deployment', 'todo', 'high', '2025-02-28', '2025-02-15'),
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'c2222222-2222-2222-2222-222222222222', 'Audit existing databases', 'Document current database schemas', 'in-progress', 'high', '2025-02-28', '2025-02-15'),
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'c2222222-2222-2222-2222-222222222222', 'Create RDS instances', 'Provision RDS PostgreSQL instances', 'todo', 'high', '2025-03-15', '2025-03-01'),
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'c2222222-2222-2222-2222-222222222222', 'Data migration scripts', 'Write and test migration scripts', 'todo', 'medium', '2025-04-15', '2025-03-20'),
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'c7777777-7777-7777-7777-777777777777', 'Implement authentication flow', 'OAuth and biometric login', 'done', 'high', '2025-01-31', '2025-01-10'),
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'c7777777-7777-7777-7777-777777777777', 'Build home dashboard', 'Main dashboard with widgets', 'done', 'high', '2025-02-15', '2025-02-01'),
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'c7777777-7777-7777-7777-777777777777', 'Implement notifications', 'Push notification system', 'in-progress', 'medium', '2025-02-28', '2025-02-20'),
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'c7777777-7777-7777-7777-777777777777', 'Offline mode support', 'Enable offline data caching', 'todo', 'low', '2025-03-31', '2025-03-15'),
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'c7777777-7777-7777-7777-777777777777', 'Performance optimization', 'Optimize app load time', 'review', 'medium', '2025-04-15', '2025-04-01'),
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'c9999999-9999-9999-9999-999999999999', 'User management endpoints', 'CRUD for user accounts', 'done', 'high', '2024-12-15', '2024-11-15'),
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'c9999999-9999-9999-9999-999999999999', 'Order history API', 'Endpoints for order data', 'done', 'high', '2025-01-10', '2024-12-20'),
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'c9999999-9999-9999-9999-999999999999', 'Support ticket system', 'API for support tickets', 'in-progress', 'medium', '2025-02-10', '2025-01-25'),
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'c9999999-9999-9999-9999-999999999999', 'Payment integration', 'Stripe payment endpoints', 'todo', 'high', '2025-02-28', '2025-02-15'),
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'caaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Design system setup', 'Implement component library', 'done', 'high', '2024-12-31', '2024-12-01'),
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'caaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Dashboard implementation', 'Build main dashboard view', 'done', 'high', '2025-01-20', '2025-01-05'),
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'caaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Account settings page', 'User profile and settings', 'in-progress', 'medium', '2025-02-15', '2025-02-01'),
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'caaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Order management UI', 'Order history and details', 'todo', 'high', '2025-03-10', '2025-02-20'),
('d0b18a83-0556-46b7-89c7-ea1fbde3ee44', 'caaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Support chat widget', 'Live chat integration', 'todo', 'low', '2025-03-31', '2025-03-20');