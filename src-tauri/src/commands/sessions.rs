use crate::models::PomodoroSession;
use serde_json::json;
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

#[tauri::command]
pub async fn create_session(
    app: AppHandle,
    task_id: i64,
    session_type: String,
    planned_duration: i64,
) -> Result<PomodoroSession, String> {
    let pool = get_pool(&app).await?;

    let result = sqlx::query(
        "INSERT INTO pomodoro_sessions (task_id, session_type, planned_duration) VALUES (?, ?, ?)",
    )
    .bind(task_id)
    .bind(json!(session_type))
    .bind(planned_duration)
    .execute(&pool)
    .await
    .map_err(|e| e.to_string())?;

    let id = result.last_insert_rowid();

    let session = sqlx::query_as::<_, PomodoroSession>(
        "SELECT * FROM pomodoro_sessions WHERE id = ?",
    )
    .bind(id)
    .fetch_one(&pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(session)
}

#[tauri::command]
pub async fn complete_session(
    app: AppHandle,
    id: i64,
    actual_duration: i64,
) -> Result<(), String> {
    let pool = get_pool(&app).await?;

    sqlx::query(
        "UPDATE pomodoro_sessions SET completed = 1, actual_duration = ?, ended_at = datetime('now') WHERE id = ?",
    )
    .bind(actual_duration)
    .bind(id)
    .execute(&pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn abandon_session(app: AppHandle, id: i64) -> Result<(), String> {
    let pool = get_pool(&app).await?;

    sqlx::query(
        "UPDATE pomodoro_sessions SET completed = 0, ended_at = datetime('now') WHERE id = ?",
    )
    .bind(id)
    .execute(&pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}
