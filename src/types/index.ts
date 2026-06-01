export interface Task {
  id: number;
  name: string;
  color: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
  total_sessions?: number;
  total_duration?: number;
}

export interface PomodoroSession {
  id: number;
  task_id: number;
  session_type: "work" | "short_break" | "long_break";
  planned_duration: number;
  actual_duration: number;
  completed: boolean;
  started_at: string;
  ended_at: string | null;
}

export interface Settings {
  work_duration: number;
  short_break_duration: number;
  long_break_duration: number;
  intervals_before_long_break: number;
}

export interface TaskBreakdown {
  task_id: number;
  task_name: string;
  color: string;
  duration: number;
}

export interface DailyStats {
  date: string;
  total_sessions: number;
  total_duration: number;
  task_breakdown: TaskBreakdown[];
}

export interface MonthlyStats {
  month: string;
  total_sessions: number;
  total_duration: number;
}

export interface TaskStats {
  task_id: number;
  task_name: string;
  total_sessions: number;
  total_duration: number;
}

export type TimerStatus =
  | "idle"
  | "working"
  | "short_break"
  | "long_break"
  | "paused";
