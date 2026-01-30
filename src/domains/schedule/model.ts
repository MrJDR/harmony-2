export type ScheduleBlockSourceType = 'manual' | 'task' | 'milestone';

export interface ScheduleBlock {
  id: string;
  org_id: string;
  assignee_id: string | null;
  title: string;
  start_utc: string;
  end_utc: string;
  source_type: ScheduleBlockSourceType;
  source_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduleBlockInsert {
  org_id: string;
  assignee_id?: string | null;
  title: string;
  start_utc: string;
  end_utc: string;
  source_type?: ScheduleBlockSourceType;
  source_id?: string | null;
}

export interface ScheduleBlockUpdate {
  assignee_id?: string | null;
  title?: string;
  start_utc?: string;
  end_utc?: string;
}
