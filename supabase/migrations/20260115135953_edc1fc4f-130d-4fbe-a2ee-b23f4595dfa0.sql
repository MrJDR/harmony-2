-- Prevent blank titles at the database level (server-side validation)
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_title_not_blank
  CHECK (length(btrim(title)) > 0);

ALTER TABLE public.subtasks
  ADD CONSTRAINT subtasks_title_not_blank
  CHECK (length(btrim(title)) > 0);
