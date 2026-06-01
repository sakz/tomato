use crate::models::{DailyStats, MonthlyStats, TaskBreakdown, TaskStats};
use sqlx::{Pool, Sqlite};
use tauri::{AppHandle, Manager};
use tauri_plugin_sql::{DbInstances, DbPool};

async fn get_pool(app: &AppHandle) -> Result<Pool<Sqlite>, String> {
    let instances = app.state::<DbInstances>();
    let lock = instances.0.read().await;
    match lock.get("sqlite:tomato.db") {
        Some(DbPool::Sqlite(pool)) => Ok(pool.clone()),
        _ => Err("Database not loaded".to_string()),
    }
}

#[derive(sqlx::FromRow)]
struct DaySummary {
    total_sessions: i64,
    total_duration: i64,
}

#[tauri::command]
pub async fn get_daily_stats(
    app: AppHandle,
    date: String,
) -> Result<DailyStats, String> {
    let pool = get_pool(&app).await?;

    let summary = sqlx::query_as::<_, DaySummary>(
        "SELECT COUNT(*) as total_sessions, COALESCE(SUM(actual_duration), 0) as total_duration \
         FROM pomodoro_sessions WHERE completed = 1 AND date(started_at) = ?",
    )
    .bind(&date)
    .fetch_one(&pool)
    .await
    .map_err(|e| e.to_string())?;

    let breakdown = sqlx::query_as::<_, TaskBreakdown>(
        "SELECT ps.task_id, t.name as task_name, t.color, COALESCE(SUM(ps.actual_duration), 0) as duration \
         FROM pomodoro_sessions ps JOIN tasks t ON ps.task_id = t.id \
         WHERE ps.completed = 1 AND date(ps.started_at) = ? \
         GROUP BY ps.task_id",
    )
    .bind(&date)
    .fetch_all(&pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(DailyStats {
        date,
        total_sessions: summary.total_sessions,
        total_duration: summary.total_duration,
        task_breakdown: breakdown,
    })
}

#[tauri::command]
pub async fn get_weekly_stats(
    app: AppHandle,
    week_start: String,
) -> Result<Vec<DailyStats>, String> {
    let pool = get_pool(&app).await?;

    let rows = sqlx::query_as::<_, DayRow>(
        "SELECT date(started_at) as day, COUNT(*) as total_sessions, COALESCE(SUM(actual_duration), 0) as total_duration \
         FROM pomodoro_sessions WHERE completed = 1 AND date(started_at) >= ? AND date(started_at) < date(?, '+7 days') \
         GROUP BY date(started_at)",
    )
    .bind(&week_start)
    .bind(&week_start)
    .fetch_all(&pool)
    .await
    .map_err(|e| e.to_string())?;

    let breakdown_rows = sqlx::query_as::<_, DayTaskBreakdown>(
        "SELECT date(ps.started_at) as day, ps.task_id, t.name as task_name, t.color, COALESCE(SUM(ps.actual_duration), 0) as duration \
         FROM pomodoro_sessions ps JOIN tasks t ON ps.task_id = t.id \
         WHERE ps.completed = 1 AND date(ps.started_at) >= ? AND date(ps.started_at) < date(?, '+7 days') \
         GROUP BY date(ps.started_at), ps.task_id",
    )
    .bind(&week_start)
    .bind(&week_start)
    .fetch_all(&pool)
    .await
    .map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for i in 0..7 {
        let day_date = compute_date_offset(&week_start, i);
        let summary = rows.iter().find(|r| r.day == day_date);
        let breakdowns: Vec<TaskBreakdown> = breakdown_rows
            .iter()
            .filter(|r| r.day == day_date)
            .map(|r| TaskBreakdown {
                task_id: r.task_id,
                task_name: r.task_name.clone(),
                color: r.color.clone(),
                duration: r.duration,
            })
            .collect();

        result.push(DailyStats {
            date: day_date,
            total_sessions: summary.map_or(0, |s| s.total_sessions),
            total_duration: summary.map_or(0, |s| s.total_duration),
            task_breakdown: breakdowns,
        });
    }

    Ok(result)
}

#[derive(sqlx::FromRow)]
struct DayRow {
    day: String,
    total_sessions: i64,
    total_duration: i64,
}

#[derive(sqlx::FromRow)]
struct DayTaskBreakdown {
    day: String,
    task_id: i64,
    task_name: String,
    color: String,
    duration: i64,
}

fn compute_date_offset(base: &str, offset: i64) -> String {
    use std::fmt::Write;
    let parts: Vec<i64> = base.split('-').filter_map(|s| s.parse().ok()).collect();
    if parts.len() != 3 {
        return base.to_string();
    }
    let (y, m, d) = (parts[0], parts[1], parts[2]);
    let days_in_month = [31, if is_leap(y) { 29 } else { 28 }, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let mut day = d + offset;
    let mut month = m;
    let mut year = y;
    while day > days_in_month[(month - 1) as usize] {
        day -= days_in_month[(month - 1) as usize];
        month += 1;
        if month > 12 {
            month = 1;
            year += 1;
        }
    }
    let mut s = String::new();
    write!(s, "{:04}-{:02}-{:02}", year, month, day).unwrap();
    s
}

fn is_leap(y: i64) -> bool {
    (y % 4 == 0 && y % 100 != 0) || y % 400 == 0
}

#[tauri::command]
pub async fn get_yearly_stats(
    app: AppHandle,
    year: i32,
) -> Result<Vec<MonthlyStats>, String> {
    let pool = get_pool(&app).await?;

    let year_str = year.to_string();
    let start = format!("{}-01-01", year_str);
    let end = format!("{}-12-31", year_str);

    let rows = sqlx::query_as::<_, MonthlyStats>(
        "SELECT strftime('%Y-%m', started_at) as month, COUNT(*) as total_sessions, COALESCE(SUM(actual_duration), 0) as total_duration \
         FROM pomodoro_sessions WHERE completed = 1 AND date(started_at) >= ? AND date(started_at) <= ? \
         GROUP BY strftime('%Y-%m', started_at) ORDER BY month",
    )
    .bind(&start)
    .bind(&end)
    .fetch_all(&pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(rows)
}

#[tauri::command]
pub async fn get_task_stats(
    app: AppHandle,
    task_id: i64,
) -> Result<TaskStats, String> {
    let pool = get_pool(&app).await?;

    let stats = sqlx::query_as::<_, TaskStats>(
        "SELECT ps.task_id, t.name as task_name, COUNT(ps.id) as total_sessions, COALESCE(SUM(ps.actual_duration), 0) as total_duration \
         FROM pomodoro_sessions ps JOIN tasks t ON ps.task_id = t.id \
         WHERE ps.task_id = ? AND ps.completed = 1 GROUP BY ps.task_id",
    )
    .bind(task_id)
    .fetch_optional(&pool)
    .await
    .map_err(|e| e.to_string())?;

    match stats {
        Some(s) => Ok(s),
        None => {
            let task = sqlx::query_as::<_, (String,)>("SELECT name FROM tasks WHERE id = ?")
                .bind(task_id)
                .fetch_one(&pool)
                .await
                .map_err(|e| e.to_string())?;
            Ok(TaskStats {
                task_id,
                task_name: task.0,
                total_sessions: 0,
                total_duration: 0,
            })
        }
    }
}
