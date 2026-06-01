use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Task {
    pub id: i64,
    pub name: String,
    pub color: String,
    pub archived: bool,
    pub created_at: String,
    pub updated_at: String,
    pub total_sessions: Option<i64>,
    pub total_duration: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PomodoroSession {
    pub id: i64,
    pub task_id: i64,
    pub session_type: String,
    pub planned_duration: i64,
    pub actual_duration: i64,
    pub completed: bool,
    pub started_at: String,
    pub ended_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Settings {
    pub work_duration: i64,
    pub short_break_duration: i64,
    pub long_break_duration: i64,
    pub intervals_before_long_break: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TaskBreakdown {
    pub task_id: i64,
    pub task_name: String,
    pub color: String,
    pub duration: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DailyStats {
    pub date: String,
    pub total_sessions: i64,
    pub total_duration: i64,
    pub task_breakdown: Vec<TaskBreakdown>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MonthlyStats {
    pub month: String,
    pub total_sessions: i64,
    pub total_duration: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TaskStats {
    pub task_id: i64,
    pub task_name: String,
    pub total_sessions: i64,
    pub total_duration: i64,
}
