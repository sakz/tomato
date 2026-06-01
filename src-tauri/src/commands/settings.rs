use crate::models::Settings;
use serde_json::{json, Value};
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
struct SettingRow {
    key: String,
    value: String,
}

#[tauri::command]
pub async fn get_settings(app: AppHandle) -> Result<Settings, String> {
    let pool = get_pool(&app).await?;

    let rows = sqlx::query_as::<_, SettingRow>("SELECT key, value FROM settings")
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;

    let get_val = |key: &str, default: i64| -> i64 {
        rows.iter()
            .find(|r| r.key == key)
            .and_then(|r| r.value.parse::<i64>().ok())
            .unwrap_or(default)
    };

    Ok(Settings {
        work_duration: get_val("work_duration", 1500),
        short_break_duration: get_val("short_break_duration", 300),
        long_break_duration: get_val("long_break_duration", 900),
        intervals_before_long_break: get_val("intervals_before_long_break", 4),
    })
}

#[tauri::command]
pub async fn update_settings(app: AppHandle, settings: Settings) -> Result<(), String> {
    let pool = get_pool(&app).await?;

    let pairs: Vec<(&str, Value)> = vec![
        ("work_duration", json!(settings.work_duration.to_string())),
        ("short_break_duration", json!(settings.short_break_duration.to_string())),
        ("long_break_duration", json!(settings.long_break_duration.to_string())),
        ("intervals_before_long_break", json!(settings.intervals_before_long_break.to_string())),
    ];

    for (key, value) in pairs {
        sqlx::query("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
            .bind(json!(key))
            .bind(value)
            .execute(&pool)
            .await
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}
