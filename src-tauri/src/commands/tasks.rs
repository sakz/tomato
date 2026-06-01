use crate::models::Task;
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
pub async fn create_task(
    app: AppHandle,
    name: String,
    color: String,
) -> Result<Task, String> {
    let pool = get_pool(&app).await?;

    let result = sqlx::query("INSERT INTO tasks (name, color) VALUES (?, ?)")
        .bind(&name)
        .bind(&color)
        .execute(&pool)
        .await
        .map_err(|e| e.to_string())?;

    let id = result.last_insert_rowid();

    let task = sqlx::query_as::<_, Task>(
        "SELECT t.*, COUNT(ps.id) as total_sessions, COALESCE(SUM(ps.actual_duration), 0) as total_duration \
         FROM tasks t LEFT JOIN pomodoro_sessions ps ON t.id = ps.task_id AND ps.completed = 1 \
         WHERE t.id = ? GROUP BY t.id",
    )
    .bind(id)
    .fetch_one(&pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(task)
}

#[tauri::command]
pub async fn get_tasks(
    app: AppHandle,
    include_archived: bool,
) -> Result<Vec<Task>, String> {
    let pool = get_pool(&app).await?;

    let tasks = if include_archived {
        sqlx::query_as::<_, Task>(
            "SELECT t.*, COUNT(ps.id) as total_sessions, COALESCE(SUM(ps.actual_duration), 0) as total_duration \
             FROM tasks t LEFT JOIN pomodoro_sessions ps ON t.id = ps.task_id AND ps.completed = 1 \
             GROUP BY t.id ORDER BY t.created_at DESC",
        )
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?
    } else {
        sqlx::query_as::<_, Task>(
            "SELECT t.*, COUNT(ps.id) as total_sessions, COALESCE(SUM(ps.actual_duration), 0) as total_duration \
             FROM tasks t LEFT JOIN pomodoro_sessions ps ON t.id = ps.task_id AND ps.completed = 1 \
             WHERE t.archived = 0 GROUP BY t.id ORDER BY t.created_at DESC",
        )
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?
    };

    Ok(tasks)
}

#[tauri::command]
pub async fn update_task(
    app: AppHandle,
    id: i64,
    name: String,
    color: String,
) -> Result<(), String> {
    let pool = get_pool(&app).await?;

    sqlx::query("UPDATE tasks SET name = ?, color = ?, updated_at = datetime('now') WHERE id = ?")
        .bind(&name)
        .bind(&color)
        .bind(id)
        .execute(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn archive_task(app: AppHandle, id: i64) -> Result<(), String> {
    let pool = get_pool(&app).await?;

    sqlx::query("UPDATE tasks SET archived = 1, updated_at = datetime('now') WHERE id = ?")
        .bind(id)
        .execute(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}
