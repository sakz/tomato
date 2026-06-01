// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

pub mod db;
pub mod models;
pub mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(
                    "sqlite:tomato.db",
                    crate::db::get_migrations(),
                )
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            commands::tasks::create_task,
            commands::tasks::get_tasks,
            commands::tasks::update_task,
            commands::tasks::archive_task,
            commands::sessions::create_session,
            commands::sessions::complete_session,
            commands::sessions::abandon_session,
            commands::stats::get_daily_stats,
            commands::stats::get_weekly_stats,
            commands::stats::get_yearly_stats,
            commands::stats::get_task_stats,
            commands::settings::get_settings,
            commands::settings::update_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
