# Tomato 番茄钟应用实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个 macOS 番茄钟桌面应用，支持任务管理、全屏暗色计时、日/周/年统计图表、系统通知。

**Architecture:** Tauri v2 提供原生窗口与 SQLite 持久化，React 前端使用 Zustand 管理状态，Tailwind CSS 实现暗色 UI，Recharts 渲染统计图表。前后端通过 Tauri commands (invoke) 通信。

**Tech Stack:** Tauri v2, React 18, TypeScript, Vite, Tailwind CSS 3, Recharts, Zustand, date-fns, tauri-plugin-sql

---

## 文件结构

```
tomato/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs                # Tauri 应用入口，注册命令
│   │   ├── db.rs                  # 数据库初始化与迁移
│   │   ├── models.rs              # Rust 数据模型 (Task, Session, Settings)
│   │   └── commands/
│   │       ├── mod.rs             # 命令模块导出
│   │       ├── tasks.rs           # 任务 CRUD 命令
│   │       ├── sessions.rs        # 会话生命周期命令
│   │       ├── stats.rs           # 统计查询命令
│   │       └── settings.rs        # 设置读写命令
│   ├── icons/                     # 应用图标
│   ├── Cargo.toml                 # Rust 依赖
│   └── tauri.conf.json            # Tauri 配置
├── src/
│   ├── types/index.ts             # TypeScript 类型定义
│   ├── utils/format.ts            # 格式化工具函数 (时间格式化等)
│   ├── stores/
│   │   ├── timerStore.ts          # 计时器状态 (Zustand)
│   │   ├── taskStore.ts           # 任务列表状态 (Zustand)
│   │   └── settingsStore.ts       # 设置状态 (Zustand)
│   ├── hooks/useTimer.ts          # 计时器逻辑 hook
│   ├── components/
│   │   ├── Layout.tsx             # 主布局 + Tab 导航
│   │   ├── TimerDisplay.tsx       # 倒计时数字展示
│   │   ├── TaskSelector.tsx       # 任务选择列表
│   │   ├── DailyChart.tsx         # 日统计图表
│   │   ├── WeeklyChart.tsx        # 周统计图表
│   │   └── YearlyChart.tsx        # 年统计图表
│   ├── pages/
│   │   ├── TimerPage.tsx          # 计时主页 (含全屏)
│   │   ├── TasksPage.tsx          # 任务管理页
│   │   ├── StatsPage.tsx          # 统计分析页
│   │   └── SettingsPage.tsx       # 设置页
│   ├── App.tsx                    # 路由 + 全局布局
│   ├── main.tsx                   # 入口
│   └── index.css                  # Tailwind 引入 + 全局样式
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── tsconfig.json
```

---

### Task 1: 项目初始化与脚手架

**Files:**
- Create: 项目根目录所有配置文件（通过 CLI 生成）

- [ ] **Step 1: 使用 Tauri CLI 创建项目**

```bash
npm create tauri-app@latest tomato -- --template react-ts
```

选择：React + TypeScript 模板，包管理器选 npm。

- [ ] **Step 2: 进入项目目录并安装前端依赖**

```bash
cd /Users/saber/myProject/tomato
npm install react-router-dom zustand recharts date-fns
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 3: 安装 Tauri SQL 插件**

```bash
cd src-tauri
cargo add tauri-plugin-sql --features sqlite
```

- [ ] **Step 4: 配置 Tailwind CSS**

替换 `tailwind.config.js` 内容：

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

- [ ] **Step 5: 配置全局样式**

替换 `src/index.css`：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background-color: #1a1a1a;
  color: #e0e0e0;
  overflow: hidden;
  user-select: none;
}
```

- [ ] **Step 6: 验证项目可运行**

```bash
npm run tauri dev
```

确认窗口正常弹出，能看到 React 默认页面。然后关闭。

- [ ] **Step 7: 提交**

```bash
cd /Users/saber/myProject/tomato
git init
git add -A
git commit -m "chore: initialize tauri + react project"
```

---

### Task 2: Tauri 后端 — 数据模型与数据库初始化

**Files:**
- Create: `src-tauri/src/models.rs`
- Create: `src-tauri/src/db.rs`
- Modify: `src-tauri/src/main.rs`

- [ ] **Step 1: 创建 Rust 数据模型 `src-tauri/src/models.rs`**

```rust
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
```

- [ ] **Step 2: 创建数据库初始化模块 `src-tauri/src/db.rs`**

```rust
use tauri_plugin_sql::{DbInstances, DbPool, Migration, MigrationKind};

pub fn get_migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "create initial tables",
        sql: r#"
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                color TEXT NOT NULL DEFAULT '#6366f1',
                archived INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS pomodoro_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER NOT NULL,
                session_type TEXT NOT NULL CHECK(session_type IN ('work', 'short_break', 'long_break')),
                planned_duration INTEGER NOT NULL,
                actual_duration INTEGER NOT NULL DEFAULT 0,
                completed INTEGER NOT NULL DEFAULT 0,
                started_at TEXT NOT NULL DEFAULT (datetime('now')),
                ended_at TEXT,
                FOREIGN KEY (task_id) REFERENCES tasks(id)
            );

            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );

            INSERT OR IGNORE INTO settings (key, value) VALUES
                ('work_duration', '1500'),
                ('short_break_duration', '300'),
                ('long_break_duration', '900'),
                ('intervals_before_long_break', '4');
        "#,
        kind: MigrationKind::Up,
    }]
}
```

- [ ] **Step 3: 更新 `src-tauri/src/main.rs`**

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;
mod models;

fn main() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(
                    "sqlite:tomato.db",
                    db::get_migrations(),
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
```

- [ ] **Step 4: 创建空的 commands 模块占位**

创建 `src-tauri/src/commands/mod.rs`：

```rust
pub mod tasks;
pub mod sessions;
pub mod stats;
pub mod settings;
```

创建各子模块空文件（后续任务填充）：
- `src-tauri/src/commands/tasks.rs`
- `src-tauri/src/commands/sessions.rs`
- `src-tauri/src/commands/stats.rs`
- `src-tauri/src/commands/settings.rs`

每个文件暂时写入：

```rust
// placeholder - will be implemented in subsequent tasks
```

- [ ] **Step 5: 更新 `src-tauri/Cargo.toml` 确保依赖正确**

确认 `[dependencies]` 中包含：

```toml
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-sql = { version = "2", features = ["sqlite"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

- [ ] **Step 6: 编译验证**

```bash
cd /Users/saber/myProject/tomato
npm run tauri dev
```

预期：Rust 编译通过，窗口弹出（前端还是默认页面没关系）。

- [ ] **Step 7: 提交**

```bash
git add -A
git commit -m "feat: add data models, db migrations, and command stubs"
```

---

### Task 3: Tauri 后端 — 任务 CRUD 命令

**Files:**
- Create: `src-tauri/src/commands/tasks.rs`

- [ ] **Step 1: 实现任务 CRUD 命令**

完整实现 `src-tauri/src/commands/tasks.rs`：

```rust
use tauri::AppHandle;
use tauri_plugin_sql::{DbPool, DbInstances};
use crate::models::Task;

#[tauri::command]
pub async fn create_task(
    app: AppHandle,
    name: String,
    color: String,
) -> Result<Task, String> {
    let pool = app.state::<DbInstances>().lock().await;
    let db = pool.0.get("sqlite:tomato.db").ok_or("Database not found")?;

    let result = db
        .select(
            "INSERT INTO tasks (name, color) VALUES ($1, $2) RETURNING id, name, color, archived, created_at, updated_at"
                .to_string(),
            vec![serde_json::Value::String(name), serde_json::Value::String(color)],
        )
        .await
        .map_err(|e| e.to_string())?;

    let tasks: Vec<Task> = serde_json::from_value(result).map_err(|e| e.to_string())?;
    tasks.into_iter().next().ok_or("Failed to create task".to_string())
}

#[tauri::command]
pub async fn get_tasks(
    app: AppHandle,
    include_archived: bool,
) -> Result<Vec<Task>, String> {
    let pool = app.state::<DbInstances>().lock().await;
    let db = pool.0.get("sqlite:tomato.db").ok_or("Database not found")?;

    let query = if include_archived {
        "SELECT t.id, t.name, t.color, t.archived, t.created_at, t.updated_at, \
         COALESCE(s.total_sessions, 0) as total_sessions, \
         COALESCE(s.total_duration, 0) as total_duration \
         FROM tasks t \
         LEFT JOIN (SELECT task_id, COUNT(*) as total_sessions, SUM(actual_duration) as total_duration \
                    FROM pomodoro_sessions WHERE completed = 1 AND session_type = 'work' \
                    GROUP BY task_id) s ON t.id = s.task_id \
         ORDER BY t.created_at DESC"
    } else {
        "SELECT t.id, t.name, t.color, t.archived, t.created_at, t.updated_at, \
         COALESCE(s.total_sessions, 0) as total_sessions, \
         COALESCE(s.total_duration, 0) as total_duration \
         FROM tasks t \
         LEFT JOIN (SELECT task_id, COUNT(*) as total_sessions, SUM(actual_duration) as total_duration \
                    FROM pomodoro_sessions WHERE completed = 1 AND session_type = 'work' \
                    GROUP BY task_id) s ON t.id = s.task_id \
         WHERE t.archived = 0 \
         ORDER BY t.created_at DESC"
    };

    let result = db
        .select(query.to_string(), vec![])
        .await
        .map_err(|e| e.to_string())?;

    serde_json::from_value(result).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_task(
    app: AppHandle,
    id: i64,
    name: String,
    color: String,
) -> Result<(), String> {
    let pool = app.state::<DbInstances>().lock().await;
    let db = pool.0.get("sqlite:tomato.db").ok_or("Database not found")?;

    db.execute(
        "UPDATE tasks SET name = $1, color = $2, updated_at = datetime('now') WHERE id = $3"
            .to_string(),
        vec![
            serde_json::Value::String(name),
            serde_json::Value::String(color),
            serde_json::json!(id),
        ],
    )
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn archive_task(app: AppHandle, id: i64) -> Result<(), String> {
    let pool = app.state::<DbInstances>().lock().await;
    let db = pool.0.get("sqlite:tomato.db").ok_or("Database not found")?;

    db.execute(
        "UPDATE tasks SET archived = 1, updated_at = datetime('now') WHERE id = $1".to_string(),
        vec![serde_json::json!(id)],
    )
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}
```

- [ ] **Step 2: 编译验证**

```bash
cd /Users/saber/myProject/tomato
npm run tauri dev
```

预期：编译通过，无报错。

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "feat: implement task CRUD commands"
```

---

### Task 4: Tauri 后端 — 会话与设置命令

**Files:**
- Create: `src-tauri/src/commands/sessions.rs`
- Create: `src-tauri/src/commands/settings.rs`

- [ ] **Step 1: 实现会话命令 `src-tauri/src/commands/sessions.rs`**

```rust
use tauri::AppHandle;
use tauri_plugin_sql::{DbPool, DbInstances};
use crate::models::PomodoroSession;

#[tauri::command]
pub async fn create_session(
    app: AppHandle,
    task_id: i64,
    session_type: String,
    planned_duration: i64,
) -> Result<PomodoroSession, String> {
    let pool = app.state::<DbInstances>().lock().await;
    let db = pool.0.get("sqlite:tomato.db").ok_or("Database not found")?;

    let result = db
        .select(
            "INSERT INTO pomodoro_sessions (task_id, session_type, planned_duration) \
             VALUES ($1, $2, $3) \
             RETURNING id, task_id, session_type, planned_duration, actual_duration, completed, started_at, ended_at"
                .to_string(),
            vec![
                serde_json::json!(task_id),
                serde_json::Value::String(session_type),
                serde_json::json!(planned_duration),
            ],
        )
        .await
        .map_err(|e| e.to_string())?;

    let sessions: Vec<PomodoroSession> =
        serde_json::from_value(result).map_err(|e| e.to_string())?;
    sessions
        .into_iter()
        .next()
        .ok_or("Failed to create session".to_string())
}

#[tauri::command]
pub async fn complete_session(
    app: AppHandle,
    id: i64,
    actual_duration: i64,
) -> Result<(), String> {
    let pool = app.state::<DbInstances>().lock().await;
    let db = pool.0.get("sqlite:tomato.db").ok_or("Database not found")?;

    db.execute(
        "UPDATE pomodoro_sessions SET completed = 1, actual_duration = $1, \
         ended_at = datetime('now') WHERE id = $2"
            .to_string(),
        vec![serde_json::json!(actual_duration), serde_json::json!(id)],
    )
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn abandon_session(app: AppHandle, id: i64) -> Result<(), String> {
    let pool = app.state::<DbInstances>().lock().await;
    let db = pool.0.get("sqlite:tomato.db").ok_or("Database not found")?;

    db.execute(
        "UPDATE pomodoro_sessions SET completed = 0, actual_duration = 0, \
         ended_at = datetime('now') WHERE id = $1"
            .to_string(),
        vec![serde_json::json!(id)],
    )
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}
```

- [ ] **Step 2: 实现设置命令 `src-tauri/src/commands/settings.rs`**

```rust
use tauri::AppHandle;
use tauri_plugin_sql::{DbPool, DbInstances};
use crate::models::Settings;

#[tauri::command]
pub async fn get_settings(app: AppHandle) -> Result<Settings, String> {
    let pool = app.state::<DbInstances>().lock().await;
    let db = pool.0.get("sqlite:tomato.db").ok_or("Database not found")?;

    let result = db
        .select("SELECT key, value FROM settings".to_string(), vec![])
        .await
        .map_err(|e| e.to_string())?;

    let rows: Vec<serde_json::Value> =
        serde_json::from_value(result).map_err(|e| e.to_string())?;

    let mut work_duration = 1500i64;
    let mut short_break_duration = 300i64;
    let mut long_break_duration = 900i64;
    let mut intervals_before_long_break = 4i64;

    for row in rows {
        if let (Some(key), Some(value)) = (row["key"].as_str(), row["value"].as_str()) {
            match key {
                "work_duration" => work_duration = value.parse().unwrap_or(1500),
                "short_break_duration" => short_break_duration = value.parse().unwrap_or(300),
                "long_break_duration" => long_break_duration = value.parse().unwrap_or(900),
                "intervals_before_long_break" => {
                    intervals_before_long_break = value.parse().unwrap_or(4)
                }
                _ => {}
            }
        }
    }

    Ok(Settings {
        work_duration,
        short_break_duration,
        long_break_duration,
        intervals_before_long_break,
    })
}

#[tauri::command]
pub async fn update_settings(app: AppHandle, settings: Settings) -> Result<(), String> {
    let pool = app.state::<DbInstances>().lock().await;
    let db = pool.0.get("sqlite:tomato.db").ok_or("Database not found")?;

    let updates = vec![
        ("work_duration", settings.work_duration),
        ("short_break_duration", settings.short_break_duration),
        ("long_break_duration", settings.long_break_duration),
        (
            "intervals_before_long_break",
            settings.intervals_before_long_break,
        ),
    ];

    for (key, value) in updates {
        db.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ($1, $2)".to_string(),
            vec![
                serde_json::Value::String(key.to_string()),
                serde_json::Value::String(value.to_string()),
            ],
        )
        .await
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}
```

- [ ] **Step 3: 编译验证**

```bash
cd /Users/saber/myProject/tomato
npm run tauri dev
```

预期：编译通过。

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "feat: implement session and settings commands"
```

---

### Task 5: Tauri 后端 — 统计查询命令

**Files:**
- Create: `src-tauri/src/commands/stats.rs`

- [ ] **Step 1: 实现统计命令 `src-tauri/src/commands/stats.rs`**

```rust
use tauri::AppHandle;
use tauri_plugin_sql::{DbPool, DbInstances};
use crate::models::{DailyStats, MonthlyStats, TaskBreakdown, TaskStats};

#[tauri::command]
pub async fn get_daily_stats(app: AppHandle, date: String) -> Result<DailyStats, String> {
    let pool = app.state::<DbInstances>().lock().await;
    let db = pool.0.get("sqlite:tomato.db").ok_or("Database not found")?;

    let summary = db
        .select(
            "SELECT COUNT(*) as total_sessions, COALESCE(SUM(actual_duration), 0) as total_duration \
             FROM pomodoro_sessions \
             WHERE completed = 1 AND session_type = 'work' AND DATE(started_at) = $1"
                .to_string(),
            vec![serde_json::Value::String(date.clone())],
        )
        .await
        .map_err(|e| e.to_string())?;

    let summary_rows: Vec<serde_json::Value> =
        serde_json::from_value(summary).map_err(|e| e.to_string())?;
    let row = summary_rows.first();

    let total_sessions = row
        .and_then(|r| r["total_sessions"].as_i64())
        .unwrap_or(0);
    let total_duration = row
        .and_then(|r| r["total_duration"].as_i64())
        .unwrap_or(0);

    let breakdown = db
        .select(
            "SELECT ps.task_id, t.name as task_name, t.color, SUM(ps.actual_duration) as duration \
             FROM pomodoro_sessions ps JOIN tasks t ON ps.task_id = t.id \
             WHERE ps.completed = 1 AND ps.session_type = 'work' AND DATE(ps.started_at) = $1 \
             GROUP BY ps.task_id ORDER BY duration DESC"
                .to_string(),
            vec![serde_json::Value::String(date)],
        )
        .await
        .map_err(|e| e.to_string())?;

    let task_breakdown: Vec<TaskBreakdown> =
        serde_json::from_value(breakdown).map_err(|e| e.to_string())?;

    Ok(DailyStats {
        date,
        total_sessions,
        total_duration,
        task_breakdown,
    })
}

#[tauri::command]
pub async fn get_weekly_stats(
    app: AppHandle,
    week_start: String,
) -> Result<Vec<DailyStats>, String> {
    let pool = app.state::<DbInstances>().lock().await;
    let db = pool.0.get("sqlite:tomato.db").ok_or("Database not found")?;

    let result = db
        .select(
            "SELECT DATE(started_at) as date, COUNT(*) as total_sessions, \
             COALESCE(SUM(actual_duration), 0) as total_duration \
             FROM pomodoro_sessions \
             WHERE completed = 1 AND session_type = 'work' \
             AND DATE(started_at) >= $1 AND DATE(started_at) < DATE($1, '+7 days') \
             GROUP BY DATE(started_at) ORDER BY date"
                .to_string(),
            vec![serde_json::Value::String(week_start.clone())],
        )
        .await
        .map_err(|e| e.to_string())?;

    let daily_rows: Vec<serde_json::Value> =
        serde_json::from_value(result).map_err(|e| e.to_string())?;

    let mut stats: Vec<DailyStats> = Vec::new();

    for row in daily_rows {
        let date = row["date"].as_str().unwrap_or("").to_string();
        let total_sessions = row["total_sessions"].as_i64().unwrap_or(0);
        let total_duration = row["total_duration"].as_i64().unwrap_or(0);

        let breakdown_result = db
            .select(
                "SELECT ps.task_id, t.name as task_name, t.color, SUM(ps.actual_duration) as duration \
                 FROM pomodoro_sessions ps JOIN tasks t ON ps.task_id = t.id \
                 WHERE ps.completed = 1 AND ps.session_type = 'work' AND DATE(ps.started_at) = $1 \
                 GROUP BY ps.task_id ORDER BY duration DESC"
                    .to_string(),
                vec![serde_json::Value::String(date.clone())],
            )
            .await
            .map_err(|e| e.to_string())?;

        let task_breakdown: Vec<TaskBreakdown> =
            serde_json::from_value(breakdown_result).map_err(|e| e.to_string())?;

        stats.push(DailyStats {
            date,
            total_sessions,
            total_duration,
            task_breakdown,
        });
    }

    Ok(stats)
}

#[tauri::command]
pub async fn get_yearly_stats(app: AppHandle, year: i32) -> Result<Vec<MonthlyStats>, String> {
    let pool = app.state::<DbInstances>().lock().await;
    let db = pool.0.get("sqlite:tomato.db").ok_or("Database not found")?;

    let year_str = year.to_string();
    let result = db
        .select(
            "SELECT strftime('%Y-%m', started_at) as month, COUNT(*) as total_sessions, \
             COALESCE(SUM(actual_duration), 0) as total_duration \
             FROM pomodoro_sessions \
             WHERE completed = 1 AND session_type = 'work' \
             AND strftime('%Y', started_at) = $1 \
             GROUP BY strftime('%Y-%m', started_at) ORDER BY month"
                .to_string(),
            vec![serde_json::Value::String(year_str)],
        )
        .await
        .map_err(|e| e.to_string())?;

    serde_json::from_value(result).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_task_stats(app: AppHandle, task_id: i64) -> Result<TaskStats, String> {
    let pool = app.state::<DbInstances>().lock().await;
    let db = pool.0.get("sqlite:tomato.db").ok_or("Database not found")?;

    let result = db
        .select(
            "SELECT t.id as task_id, t.name as task_name, \
             COALESCE(COUNT(ps.id), 0) as total_sessions, \
             COALESCE(SUM(ps.actual_duration), 0) as total_duration \
             FROM tasks t LEFT JOIN pomodoro_sessions ps ON t.id = ps.task_id \
             AND ps.completed = 1 AND ps.session_type = 'work' \
             WHERE t.id = $1 GROUP BY t.id"
                .to_string(),
            vec![serde_json::json!(task_id)],
        )
        .await
        .map_err(|e| e.to_string())?;

    let rows: Vec<TaskStats> = serde_json::from_value(result).map_err(|e| e.to_string())?;
    rows.into_iter()
        .next()
        .ok_or("Task not found".to_string())
}
```

- [ ] **Step 2: 编译验证**

```bash
cd /Users/saber/myProject/tomato
npm run tauri dev
```

预期：所有后端命令编译通过，无 Rust 报错。

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "feat: implement stats query commands"
```

---

### Task 6: 前端基础 — TypeScript 类型、工具函数、Store

**Files:**
- Create: `src/types/index.ts`
- Create: `src/utils/format.ts`
- Create: `src/stores/taskStore.ts`
- Create: `src/stores/settingsStore.ts`
- Create: `src/stores/timerStore.ts`

- [ ] **Step 1: 创建 TypeScript 类型定义 `src/types/index.ts`**

```typescript
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

export type TimerStatus = "idle" | "working" | "short_break" | "long_break" | "paused";
```

- [ ] **Step 2: 创建格式化工具 `src/utils/format.ts`**

```typescript
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  }
  return `${minutes}分钟`;
}
```

- [ ] **Step 3: 创建任务 Store `src/stores/taskStore.ts`**

```typescript
import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { Task } from "../types";

interface TaskState {
  tasks: Task[];
  loading: boolean;
  fetchTasks: (includeArchived?: boolean) => Promise<void>;
  createTask: (name: string, color: string) => Promise<Task>;
  updateTask: (id: number, name: string, color: string) => Promise<void>;
  archiveTask: (id: number) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  loading: false,

  fetchTasks: async (includeArchived = false) => {
    set({ loading: true });
    try {
      const tasks = await invoke<Task[]>("get_tasks", { includeArchived });
      set({ tasks });
    } finally {
      set({ loading: false });
    }
  },

  createTask: async (name, color) => {
    const task = await invoke<Task>("create_task", { name, color });
    set((state) => ({ tasks: [task, ...state.tasks] }));
    return task;
  },

  updateTask: async (id, name, color) => {
    await invoke("update_task", { id, name, color });
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, name, color, updated_at: new Date().toISOString() } : t
      ),
    }));
  },

  archiveTask: async (id) => {
    await invoke("archive_task", { id });
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, archived: true } : t
      ),
    }));
  },
}));
```

- [ ] **Step 4: 创建设置 Store `src/stores/settingsStore.ts`**

```typescript
import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { Settings } from "../types";

interface SettingsState {
  settings: Settings;
  loading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: Settings) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: {
    work_duration: 1500,
    short_break_duration: 300,
    long_break_duration: 900,
    intervals_before_long_break: 4,
  },
  loading: false,

  fetchSettings: async () => {
    set({ loading: true });
    try {
      const settings = await invoke<Settings>("get_settings");
      set({ settings });
    } finally {
      set({ loading: false });
    }
  },

  updateSettings: async (settings) => {
    await invoke("update_settings", { settings });
    set({ settings });
  },
}));
```

- [ ] **Step 5: 创建计时器 Store `src/stores/timerStore.ts`**

```typescript
import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { TimerStatus } from "../types";

interface TimerState {
  status: TimerStatus;
  remainingSeconds: number;
  totalSeconds: number;
  currentTaskId: number | null;
  currentTaskName: string;
  currentSessionId: number | null;
  completedPomodoros: number;
  isFullscreen: boolean;

  setStatus: (status: TimerStatus) => void;
  setRemainingSeconds: (s: number) => void;
  startWork: (taskId: number, taskName: string, sessionId: number, duration: number) => void;
  startBreak: (type: "short_break" | "long_break", duration: number) => void;
  tick: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  incrementPomodoro: () => void;
  setFullscreen: (v: boolean) => void;
  setCurrentSessionId: (id: number | null) => void;
}

export const useTimerStore = create<TimerState>((set) => ({
  status: "idle",
  remainingSeconds: 0,
  totalSeconds: 0,
  currentTaskId: null,
  currentTaskName: "",
  currentSessionId: null,
  completedPomodoros: 0,
  isFullscreen: false,

  setStatus: (status) => set({ status }),
  setRemainingSeconds: (remainingSeconds) => set({ remainingSeconds }),

  startWork: (taskId, taskName, sessionId, duration) =>
    set({
      status: "working",
      remainingSeconds: duration,
      totalSeconds: duration,
      currentTaskId: taskId,
      currentTaskName: taskName,
      currentSessionId: sessionId,
    }),

  startBreak: (type, duration) =>
    set({
      status: type,
      remainingSeconds: duration,
      totalSeconds: duration,
      currentSessionId: null,
    }),

  tick: () =>
    set((state) => ({
      remainingSeconds: Math.max(0, state.remainingSeconds - 1),
    })),

  pause: () => set({ status: "paused" }),

  resume: () => set({ status: "working" }),

  reset: () =>
    set({
      status: "idle",
      remainingSeconds: 0,
      totalSeconds: 0,
      currentTaskId: null,
      currentTaskName: "",
      currentSessionId: null,
      completedPomodoros: 0,
      isFullscreen: false,
    }),

  incrementPomodoro: () =>
    set((state) => ({ completedPomodoros: state.completedPomodoros + 1 })),

  setFullscreen: (isFullscreen) => set({ isFullscreen }),
  setCurrentSessionId: (currentSessionId) => set({ currentSessionId }),
}));
```

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: add TypeScript types, utils, and Zustand stores"
```

---

### Task 7: 前端 — 计时器 Hook 与通知

**Files:**
- Create: `src/hooks/useTimer.ts`

- [ ] **Step 1: 实现计时器 Hook `src/hooks/useTimer.ts`**

```typescript
import { useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useTimerStore } from "../stores/timerStore";
import { useSettingsStore } from "../stores/settingsStore";

export function useTimer() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const {
    status,
    remainingSeconds,
    currentTaskId,
    currentTaskName,
    currentSessionId,
    completedPomodoros,
    tick,
    startWork,
    startBreak,
    incrementPomodoro,
    setFullscreen,
    setCurrentSessionId,
    reset,
    pause,
    resume,
  } = useTimerStore();

  const { settings } = useSettingsStore();

  const sendNotification = useCallback(async (title: string, body: string) => {
    try {
      const { sendNotification } = await import("@tauri-apps/plugin-notification");
      await sendNotification({ title, body });
    } catch {
      // notification plugin not available, silently fail
    }
  }, []);

  const playSound = useCallback(() => {
    const audio = new Audio("/sounds/bell.mp3");
    audio.play().catch(() => {});
  }, []);

  // Timer tick effect
  useEffect(() => {
    if (status === "working" || status === "short_break" || status === "long_break") {
      intervalRef.current = setInterval(() => {
        tick();
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [status, tick]);

  // Handle timer reaching zero
  useEffect(() => {
    if (remainingSeconds > 0 || status === "idle" || status === "paused") return;

    const handleTimerEnd = async () => {
      if (status === "working") {
        // Complete the work session
        if (currentSessionId) {
          await invoke("complete_session", {
            id: currentSessionId,
            actualDuration: settings.work_duration,
          });
        }
        incrementPomodoro();
        playSound();

        const newCount = completedPomodoros + 1;
        const isLongBreak =
          newCount % settings.intervals_before_long_break === 0;

        const breakType = isLongBreak ? "long_break" : "short_break";
        const breakDuration = isLongBreak
          ? settings.long_break_duration
          : settings.short_break_duration;

        // Exit fullscreen for break
        try {
          const win = getCurrentWindow();
          await win.setFullscreen(false);
        } catch {}
        setFullscreen(false);

        await sendNotification(
          "🍅 番茄完成！",
          `已完成 ${newCount} 个番茄，开始${isLongBreak ? "长" : "短"}休息`
        );

        startBreak(breakType as "short_break" | "long_break", breakDuration);
      } else if (status === "short_break" || status === "long_break") {
        playSound();
        await sendNotification("⏰ 休息结束", "准备开始下一个番茄");

        // Reset for next work session (user needs to manually start)
        setCurrentSessionId(null);
        useTimerStore.setState({ status: "idle", remainingSeconds: 0 });
      }
    };

    handleTimerEnd();
  }, [remainingSeconds, status]);

  const startPomodoro = useCallback(
    async (taskId: number, taskName: string) => {
      const session = await invoke<any>("create_session", {
        taskId,
        sessionType: "work",
        plannedDuration: settings.work_duration,
      });

      startWork(taskId, taskName, session.id, settings.work_duration);

      // Enter fullscreen
      try {
        const win = getCurrentWindow();
        await win.setFullscreen(true);
      } catch {}
      setFullscreen(true);
    },
    [settings, startWork, setFullscreen]
  );

  const stopPomodoro = useCallback(async () => {
    if (currentSessionId) {
      await invoke("abandon_session", { id: currentSessionId });
    }
    try {
      const win = getCurrentWindow();
      await win.setFullscreen(false);
    } catch {}
    reset();
  }, [currentSessionId, reset]);

  const skipBreak = useCallback(async () => {
    useTimerStore.setState({ status: "idle", remainingSeconds: 0 });
  }, []);

  const togglePause = useCallback(() => {
    if (status === "working") {
      pause();
    } else if (status === "paused") {
      resume();
    }
  }, [status, pause, resume]);

  return {
    startPomodoro,
    stopPomodoro,
    skipBreak,
    togglePause,
  };
}
```

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "feat: add useTimer hook with fullscreen and notification support"
```

---

### Task 8: 前端 — Layout 组件与路由

**Files:**
- Create: `src/components/Layout.tsx`
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: 创建 Layout 组件 `src/components/Layout.tsx`**

```tsx
import { NavLink, Outlet } from "react-router-dom";

const tabs = [
  { to: "/", label: "计时", icon: "🍅" },
  { to: "/tasks", label: "任务", icon: "📋" },
  { to: "/stats", label: "统计", icon: "📊" },
  { to: "/settings", label: "设置", icon: "⚙️" },
];

export default function Layout() {
  return (
    <div className="flex flex-col h-screen bg-[#1a1a1a]">
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
      <nav className="flex border-t border-gray-800 bg-[#111]">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-3 text-xs transition-colors ${
                isActive
                  ? "text-red-400"
                  : "text-gray-500 hover:text-gray-300"
              }`
            }
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="mt-1">{tab.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
```

- [ ] **Step 2: 更新 `src/App.tsx`**

```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import TimerPage from "./pages/TimerPage";
import TasksPage from "./pages/TasksPage";
import StatsPage from "./pages/StatsPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<TimerPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 3: 更新 `src/main.tsx`**

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 4: 创建页面占位文件**

创建四个页面占位文件（后续任务填充实际内容）：

`src/pages/TimerPage.tsx`:
```tsx
export default function TimerPage() {
  return <div className="p-6"><h1 className="text-2xl">计时</h1></div>;
}
```

`src/pages/TasksPage.tsx`:
```tsx
export default function TasksPage() {
  return <div className="p-6"><h1 className="text-2xl">任务</h1></div>;
}
```

`src/pages/StatsPage.tsx`:
```tsx
export default function StatsPage() {
  return <div className="p-6"><h1 className="text-2xl">统计</h1></div>;
}
```

`src/pages/SettingsPage.tsx`:
```tsx
export default function SettingsPage() {
  return <div className="p-6"><h1 className="text-2xl">设置</h1></div>;
}
```

- [ ] **Step 5: 验证路由正常工作**

```bash
npm run tauri dev
```

预期：窗口弹出，底部有 Tab 导航，可切换四个页面。

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: add layout with tab navigation and routing"
```

---

### Task 9: 前端 — TimerPage（计时页 + 全屏）

**Files:**
- Create: `src/components/TimerDisplay.tsx`
- Create: `src/components/TaskSelector.tsx`
- Modify: `src/pages/TimerPage.tsx`

- [ ] **Step 1: 创建 TaskSelector 组件 `src/components/TaskSelector.tsx`**

```tsx
import { useTaskStore } from "../stores/taskStore";

interface Props {
  selectedId: number | null;
  onSelect: (id: number, name: string) => void;
}

export default function TaskSelector({ selectedId, onSelect }: Props) {
  const { tasks } = useTaskStore();
  const activeTasks = tasks.filter((t) => !t.archived);

  return (
    <div className="space-y-2">
      <h3 className="text-sm text-gray-400 mb-3">选择任务</h3>
      {activeTasks.length === 0 ? (
        <p className="text-gray-500 text-sm">
          暂无任务，请先在"任务"页面创建
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {activeTasks.map((task) => (
            <button
              key={task.id}
              onClick={() => onSelect(task.id, task.name)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all text-left ${
                selectedId === task.id
                  ? "bg-gray-700 ring-2 ring-red-500"
                  : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: task.color }}
              />
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{task.name}</div>
                {task.total_sessions !== undefined && (
                  <div className="text-xs text-gray-500">
                    {task.total_sessions} 个番茄
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 创建 TimerDisplay 组件 `src/components/TimerDisplay.tsx`**

```tsx
import { formatTime } from "../utils/format";

interface Props {
  seconds: number;
  isFullscreen: boolean;
}

export default function TimerDisplay({ seconds, isFullscreen }: Props) {
  if (isFullscreen) {
    return (
      <div className="text-center">
        <div
          className="font-mono tracking-wider"
          style={{ fontSize: "8rem", color: "#333", lineHeight: 1 }}
        >
          {formatTime(seconds)}
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="text-6xl font-mono text-gray-200 tracking-wider">
        {formatTime(seconds)}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 实现完整 TimerPage `src/pages/TimerPage.tsx`**

```tsx
import { useState, useEffect } from "react";
import { useTimerStore } from "../stores/timerStore";
import { useTaskStore } from "../stores/taskStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useTimer } from "../hooks/useTimer";
import TimerDisplay from "../components/TimerDisplay";
import TaskSelector from "../components/TaskSelector";
import { formatDuration } from "../utils/format";

export default function TimerPage() {
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedTaskName, setSelectedTaskName] = useState("");

  const { status, remainingSeconds, currentTaskName, completedPomodoros, isFullscreen } =
    useTimerStore();
  const { fetchTasks } = useTaskStore();
  const { settings } = useSettingsStore();
  const { startPomodoro, stopPomodoro, skipBreak, togglePause } = useTimer();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleSelectTask = (id: number, name: string) => {
    setSelectedTaskId(id);
    setSelectedTaskName(name);
  };

  const handleStart = () => {
    if (!selectedTaskId) return;
    startPomodoro(selectedTaskId, selectedTaskName);
  };

  // Fullscreen mode - minimal UI
  if (isFullscreen && status === "working") {
    return (
      <div
        className="flex flex-col items-center justify-center h-screen"
        style={{ backgroundColor: "#0a0a0a" }}
      >
        {/* Pomodoro progress - top right */}
        <div className="absolute top-6 right-8 text-gray-600 text-sm font-mono">
          {completedPomodoros % settings.intervals_before_long_break}/{settings.intervals_before_long_break}
        </div>

        <TimerDisplay seconds={remainingSeconds} isFullscreen={true} />

        <div className="text-gray-500 text-sm mt-4">{currentTaskName}</div>

        <div className="absolute bottom-12 flex gap-6">
          <button
            onClick={togglePause}
            className="px-6 py-2 text-sm text-gray-600 hover:text-gray-400 transition-colors"
          >
            {status === "paused" ? "继续" : "暂停"}
          </button>
          <button
            onClick={stopPomodoro}
            className="px-6 py-2 text-sm text-gray-600 hover:text-red-400 transition-colors"
          >
            停止
          </button>
        </div>
      </div>
    );
  }

  // Break time or idle - normal window UI
  const isBreak = status === "short_break" || status === "long_break";

  return (
    <div className="p-6 max-w-lg mx-auto">
      {status === "idle" && (
        <>
          <h2 className="text-xl font-semibold mb-6">开始番茄钟</h2>
          <TaskSelector
            selectedId={selectedTaskId}
            onSelect={handleSelectTask}
          />
          <button
            onClick={handleStart}
            disabled={!selectedTaskId}
            className="w-full mt-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-medium transition-colors"
          >
            开始番茄钟（{Math.floor(settings.work_duration / 60)} 分钟）
          </button>
        </>
      )}

      {(status === "working" || status === "paused") && !isFullscreen && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-sm mb-2">
            {status === "paused" ? "已暂停" : "专注中"} — {currentTaskName}
          </div>
          <TimerDisplay seconds={remainingSeconds} isFullscreen={false} />
          <div className="text-gray-500 text-xs mt-3">
            第 {completedPomodoros + 1} 个番茄
          </div>
          <div className="flex gap-4 justify-center mt-8">
            <button
              onClick={togglePause}
              className="px-8 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              {status === "paused" ? "继续" : "暂停"}
            </button>
            <button
              onClick={stopPomodoro}
              className="px-8 py-2 bg-gray-800 hover:bg-red-900 text-red-400 rounded-lg transition-colors"
            >
              停止
            </button>
          </div>
        </div>
      )}

      {isBreak && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-sm mb-2">
            {status === "long_break" ? "长休息" : "短休息"}
          </div>
          <TimerDisplay seconds={remainingSeconds} isFullscreen={false} />
          <button
            onClick={skipBreak}
            className="mt-8 px-8 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            跳过休息
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 验证计时页面**

```bash
npm run tauri dev
```

预期：能看到任务选择列表和开始按钮（需要先创建任务才能启动）。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: implement TimerPage with fullscreen mode"
```

---

### Task 10: 前端 — TasksPage（任务管理）

**Files:**
- Modify: `src/pages/TasksPage.tsx`

- [ ] **Step 1: 实现 TasksPage `src/pages/TasksPage.tsx`**

```tsx
import { useState, useEffect } from "react";
import { useTaskStore } from "../stores/taskStore";
import { formatDuration } from "../utils/format";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#6366f1", "#a855f7", "#ec4899",
];

export default function TasksPage() {
  const { tasks, fetchTasks, createTask, updateTask, archiveTask } = useTaskStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[5]);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    fetchTasks(showArchived);
  }, [fetchTasks, showArchived]);

  const resetForm = () => {
    setName("");
    setColor(PRESET_COLORS[5]);
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (editingId) {
      await updateTask(editingId, name.trim(), color);
    } else {
      await createTask(name.trim(), color);
    }
    resetForm();
    fetchTasks(showArchived);
  };

  const handleEdit = (task: any) => {
    setEditingId(task.id);
    setName(task.name);
    setColor(task.color);
    setShowForm(true);
  };

  const handleArchive = async (id: number) => {
    await archiveTask(id);
    fetchTasks(showArchived);
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">任务管理</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors"
        >
          + 新建
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="任务名称"
            className="w-full bg-gray-700 rounded px-3 py-2 text-sm mb-3 outline-none focus:ring-1 focus:ring-red-500"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <div className="flex gap-2 mb-3">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-transform ${
                  color === c ? "scale-125 ring-2 ring-white" : ""
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
            >
              {editingId ? "保存" : "创建"}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-center justify-between bg-gray-800 rounded-lg p-4 ${
              task.archived ? "opacity-50" : ""
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: task.color }}
              />
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{task.name}</div>
                <div className="text-xs text-gray-500">
                  {task.total_sessions || 0} 个番茄 ·{" "}
                  {formatDuration(task.total_duration || 0)}
                </div>
              </div>
            </div>
            {!task.archived && (
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleEdit(task)}
                  className="text-xs text-gray-500 hover:text-gray-300"
                >
                  编辑
                </button>
                <button
                  onClick={() => handleArchive(task.id)}
                  className="text-xs text-gray-500 hover:text-red-400"
                >
                  归档
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Toggle archived */}
      <button
        onClick={() => setShowArchived(!showArchived)}
        className="mt-4 text-xs text-gray-500 hover:text-gray-300"
      >
        {showArchived ? "隐藏已归档任务" : "显示已归档任务"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: 验证任务管理页**

```bash
npm run tauri dev
```

预期：可以创建任务、编辑、归档，看到累计时长。

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "feat: implement TasksPage with CRUD and archive"
```

---

### Task 11: 前端 — SettingsPage（设置页）

**Files:**
- Modify: `src/pages/SettingsPage.tsx`

- [ ] **Step 1: 实现 SettingsPage `src/pages/SettingsPage.tsx`**

```tsx
import { useEffect, useState } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import { Settings } from "../types";

export default function SettingsPage() {
  const { settings, fetchSettings, updateSettings } = useSettingsStore();
  const [form, setForm] = useState<Settings>(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleChange = (key: keyof Settings, value: number) => {
    setForm((prev) => ({ ...prev, [key]: value * 60 }));
    setSaved(false);
  };

  const handleSave = async () => {
    await updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toMinutes = (seconds: number) => Math.floor(seconds / 60);

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h2 className="text-xl font-semibold mb-6">设置</h2>

      <div className="space-y-5">
        <SettingRow
          label="工作时长"
          value={toMinutes(form.work_duration)}
          unit="分钟"
          min={1}
          max={120}
          onChange={(v) => handleChange("work_duration", v)}
        />
        <SettingRow
          label="短休息"
          value={toMinutes(form.short_break_duration)}
          unit="分钟"
          min={1}
          max={30}
          onChange={(v) => handleChange("short_break_duration", v)}
        />
        <SettingRow
          label="长休息"
          value={toMinutes(form.long_break_duration)}
          unit="分钟"
          min={1}
          max={60}
          onChange={(v) => handleChange("long_break_duration", v)}
        />
        <SettingRow
          label="长休息间隔"
          value={form.intervals_before_long_break}
          unit="个番茄"
          min={2}
          max={10}
          onChange={(v) =>
            setForm((prev) => ({
              ...prev,
              intervals_before_long_break: v,
            }))
          }
          isCount
        />
      </div>

      <button
        onClick={handleSave}
        className="w-full mt-8 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
      >
        {saved ? "已保存 ✓" : "保存设置"}
      </button>
    </div>
  );
}

function SettingRow({
  label,
  value,
  unit,
  min,
  max,
  onChange,
  isCount = false,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  onChange: (v: number) => void;
  isCount?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-300">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center text-lg"
        >
          −
        </button>
        <span className="w-12 text-center font-mono">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center text-lg"
        >
          +
        </button>
        <span className="text-xs text-gray-500 w-12">{unit}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "feat: implement SettingsPage with duration configuration"
```

---

### Task 12: 前端 — StatsPage（统计图表页）

**Files:**
- Create: `src/components/DailyChart.tsx`
- Create: `src/components/WeeklyChart.tsx`
- Create: `src/components/YearlyChart.tsx`
- Modify: `src/pages/StatsPage.tsx`

- [ ] **Step 1: 创建 DailyChart 组件 `src/components/DailyChart.tsx`**

```tsx
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { DailyStats } from "../types";
import { formatDuration } from "../utils/format";

interface Props {
  stats: DailyStats;
}

export default function DailyChart({ stats }: Props) {
  const data = stats.task_breakdown.map((item) => ({
    name: item.task_name,
    value: item.duration,
    color: item.color,
  }));

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <span className="text-3xl font-bold">{stats.total_sessions}</span>
          <span className="text-gray-400 text-sm ml-2">个番茄</span>
        </div>
        <span className="text-gray-400 text-sm">
          共 {formatDuration(stats.total_duration)}
        </span>
      </div>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              dataKey="value"
              label={({ name }) => name}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatDuration(value)}
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "none",
                borderRadius: "8px",
                color: "#e5e7eb",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center text-gray-500 py-8">今天还没有完成番茄</div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 创建 WeeklyChart 组件 `src/components/WeeklyChart.tsx`**

```tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { DailyStats } from "../types";
import { formatDuration } from "../utils/format";
import { format, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";

interface Props {
  stats: DailyStats[];
}

export default function WeeklyChart({ stats }: Props) {
  const barData = stats.map((day) => ({
    date: format(parseISO(day.date), "MM/dd", { locale: zhCN }),
    sessions: day.total_sessions,
  }));

  // Aggregate task breakdown across the week
  const taskMap = new Map<string, { name: string; color: string; duration: number }>();
  stats.forEach((day) => {
    day.task_breakdown.forEach((item) => {
      const existing = taskMap.get(item.task_name);
      if (existing) {
        existing.duration += item.duration;
      } else {
        taskMap.set(item.task_name, {
          name: item.task_name,
          color: item.color,
          duration: item.duration,
        });
      }
    });
  });
  const pieData = Array.from(taskMap.values());

  const totalSessions = stats.reduce((sum, d) => sum + d.total_sessions, 0);
  const totalDuration = stats.reduce((sum, d) => sum + d.total_duration, 0);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <span className="text-3xl font-bold">{totalSessions}</span>
          <span className="text-gray-400 text-sm ml-2">个番茄</span>
        </div>
        <span className="text-gray-400 text-sm">
          共 {formatDuration(totalDuration)}
        </span>
      </div>

      {barData.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData}>
              <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "none",
                  borderRadius: "8px",
                  color: "#e5e7eb",
                }}
              />
              <Bar dataKey="sessions" fill="#ef4444" radius={[4, 4, 0, 0]} name="番茄数" />
            </BarChart>
          </ResponsiveContainer>

          {pieData.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm text-gray-400 mb-2">任务分布</h4>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    dataKey="duration"
                    nameKey="name"
                    label={({ name }) => name}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatDuration(value)}
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "none",
                      borderRadius: "8px",
                      color: "#e5e7eb",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-gray-500 py-8">本周还没有完成番茄</div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: 创建 YearlyChart 组件 `src/components/YearlyChart.tsx`**

```tsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { MonthlyStats, TaskBreakdown } from "../types";
import { formatDuration } from "../utils/format";

interface Props {
  monthlyStats: MonthlyStats[];
  topTasks: TaskBreakdown[];
}

export default function YearlyChart({ monthlyStats, topTasks }: Props) {
  const lineData = monthlyStats.map((m) => ({
    month: m.month.slice(5), // "01", "02", etc.
    sessions: m.total_sessions,
  }));

  const totalSessions = monthlyStats.reduce((sum, m) => sum + m.total_sessions, 0);
  const totalDuration = monthlyStats.reduce((sum, m) => sum + m.total_duration, 0);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <span className="text-3xl font-bold">{totalSessions}</span>
          <span className="text-gray-400 text-sm ml-2">个番茄</span>
        </div>
        <span className="text-gray-400 text-sm">
          共 {formatDuration(totalDuration)}
        </span>
      </div>

      {lineData.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={lineData}>
              <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "none",
                  borderRadius: "8px",
                  color: "#e5e7eb",
                }}
              />
              <Line
                type="monotone"
                dataKey="sessions"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: "#ef4444" }}
                name="番茄数"
              />
            </LineChart>
          </ResponsiveContainer>

          {topTasks.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm text-gray-400 mb-2">Top 任务</h4>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={topTasks} layout="vertical">
                  <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="task_name"
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip
                    formatter={(value: number) => formatDuration(value)}
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "none",
                      borderRadius: "8px",
                      color: "#e5e7eb",
                    }}
                  />
                  <Bar dataKey="duration" radius={[0, 4, 4, 0]} name="时长">
                    {topTasks.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-gray-500 py-8">今年还没有完成番茄</div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 实现 StatsPage `src/pages/StatsPage.tsx`**

```tsx
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { format, startOfWeek, getYear } from "date-fns";
import { DailyStats, MonthlyStats, TaskBreakdown } from "../types";
import DailyChart from "../components/DailyChart";
import WeeklyChart from "../components/WeeklyChart";
import YearlyChart from "../components/YearlyChart";

type ViewType = "day" | "week" | "year";

export default function StatsPage() {
  const [view, setView] = useState<ViewType>("day");
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<DailyStats[]>([]);
  const [yearlyStats, setYearlyStats] = useState<MonthlyStats[]>([]);
  const [topTasks, setTopTasks] = useState<TaskBreakdown[]>([]);

  const today = format(new Date(), "yyyy-MM-dd");
  const weekStart = format(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
    "yyyy-MM-dd"
  );
  const currentYear = getYear(new Date());

  useEffect(() => {
    const loadStats = async () => {
      if (view === "day") {
        const stats = await invoke<DailyStats>("get_daily_stats", { date: today });
        setDailyStats(stats);
      } else if (view === "week") {
        const stats = await invoke<DailyStats[]>("get_weekly_stats", {
          weekStart,
        });
        setWeeklyStats(stats);
      } else {
        const stats = await invoke<MonthlyStats[]>("get_yearly_stats", {
          year: currentYear,
        });
        setYearlyStats(stats);
        // For top tasks in year view, we use weekly stats for the full year
        const fullYearStats = await invoke<DailyStats[]>("get_weekly_stats", {
          weekStart: `${currentYear}-01-01`,
        });
        const taskMap = new Map<string, TaskBreakdown>();
        fullYearStats.forEach((day) => {
          day.task_breakdown.forEach((item) => {
            const existing = taskMap.get(item.task_name);
            if (existing) {
              existing.duration += item.duration;
            } else {
              taskMap.set(item.task_name, { ...item });
            }
          });
        });
        const sorted = Array.from(taskMap.values())
          .sort((a, b) => b.duration - a.duration)
          .slice(0, 10);
        setTopTasks(sorted);
      }
    };
    loadStats();
  }, [view]);

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h2 className="text-xl font-semibold mb-4">统计</h2>

      {/* View tabs */}
      <div className="flex gap-1 bg-gray-800 rounded-lg p-1 mb-6">
        {(["day", "week", "year"] as ViewType[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 py-2 text-sm rounded-md transition-colors ${
              view === v ? "bg-gray-700 text-white" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {v === "day" ? "今日" : v === "week" ? "本周" : "今年"}
          </button>
        ))}
      </div>

      {/* Charts */}
      {view === "day" && dailyStats && <DailyChart stats={dailyStats} />}
      {view === "week" && <WeeklyChart stats={weeklyStats} />}
      {view === "year" && (
        <YearlyChart monthlyStats={yearlyStats} topTasks={topTasks} />
      )}
    </div>
  );
}
```

- [ ] **Step 5: 验证统计页**

```bash
npm run tauri dev
```

预期：三个标签页可切换，图表渲染正常（即使没有数据也不报错）。

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: implement StatsPage with daily/weekly/yearly charts"
```

---

### Task 13: 通知插件配置与提示音

**Files:**
- Modify: `src-tauri/src/main.rs`
- Modify: `src-tauri/Cargo.toml`
- Create: `public/sounds/bell.mp3` (需要一个音频文件)

- [ ] **Step 1: 添加 Tauri notification 插件**

```bash
cd /Users/saber/myProject/tomato/src-tauri
cargo add tauri-plugin-notification
```

- [ ] **Step 2: 在 `src-tauri/src/main.rs` 注册 notification 插件**

在 `main.rs` 的 Builder 链中添加 `.plugin(tauri_plugin_notification::init())`，放在 sql plugin 之后。

- [ ] **Step 3: 更新 `src-tauri/tauri.conf.json` 权限**

在 `tauri.conf.json` 中确认有 notification 权限配置：

```json
{
  "permissions": [
    "core:default",
    "notification:default",
    "sql:default"
  ]
}
```

- [ ] **Step 4: 放置提示音文件**

在 `public/sounds/` 目录下放置一个简短的 bell.mp3 提示音文件。可以使用系统自带的声音或生成一个简单的提示音。

- [ ] **Step 5: 验证通知功能**

```bash
npm run tauri dev
```

启动一个短时间的番茄钟（在设置里改为 1 分钟），等待结束后检查是否收到系统通知。

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: add notification plugin and sound effects"
```

---

### Task 14: Tauri 窗口配置与快捷键

**Files:**
- Modify: `src-tauri/tauri.conf.json`
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/src/main.rs`

- [ ] **Step 1: 配置窗口属性 `src-tauri/tauri.conf.json`**

更新窗口配置：

```json
{
  "app": {
    "windows": [
      {
        "title": "Tomato",
        "width": 800,
        "height": 600,
        "minWidth": 400,
        "minHeight": 300,
        "resizable": true,
        "decorations": true
      }
    ]
  }
}
```

- [ ] **Step 2: 添加全局快捷键插件**

```bash
cd /Users/saber/myProject/tomato/src-tauri
cargo add tauri-plugin-global-shortcut
```

- [ ] **Step 3: 注册全局快捷键 `src-tauri/src/main.rs`**

在 `main.rs` 中添加全局快捷键注册：

```rust
use tauri_plugin_global_shortcut::ShortcutState;

// 在 Builder 中添加
.plugin(tauri_plugin_global_shortcut::Builder::new().build())
.setup(|app| {
    let handle = app.handle().clone();
    tauri_plugin_global_shortcut::ShortcutManager::from_app_handle(&handle)
        .register("CmdOrCtrl+Shift+Space", move |app, _shortcut, event| {
            if event.state == ShortcutState::Pressed {
                let _ = app.emit("global-shortcut", "toggle-pause");
            }
        })?;

    let handle2 = app.handle().clone();
    tauri_plugin_global_shortcut::ShortcutManager::from_app_handle(&handle2)
        .register("CmdOrCtrl+Shift+X", move |app, _shortcut, event| {
            if event.state == ShortcutState::Pressed {
                let _ = app.emit("global-shortcut", "stop");
            }
        })?;

    Ok(())
})
```

- [ ] **Step 4: 在前端监听快捷键事件**

在 `src/hooks/useTimer.ts` 中添加 `listen` 导入和事件监听：

```typescript
import { listen } from "@tauri-apps/api/event";

// 在 hook 内添加 effect
useEffect(() => {
  const unlisten = listen<string>("global-shortcut", (event) => {
    if (event.payload === "toggle-pause") {
      togglePause();
    } else if (event.payload === "stop") {
      stopPomodoro();
    }
  });
  return () => {
    unlisten.then((fn) => fn());
  };
}, [togglePause, stopPomodoro]);
```

- [ ] **Step 5: 编译验证**

```bash
npm run tauri dev
```

预期：快捷键 `Cmd+Shift+Space` 和 `Cmd+Shift+X` 可以控制计时器。

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: add window config and global shortcuts"
```

---

### Task 15: 最终集成测试与修复

**Files:**
- 根据测试结果可能修改多个文件

- [ ] **Step 1: 完整流程测试**

按以下步骤测试完整应用：

1. 启动应用，进入设置页，将工作时长改为 1 分钟方便测试
2. 进入任务页，创建 2-3 个测试任务
3. 进入计时页，选择一个任务，启动番茄钟
4. 验证全屏模式正常进入，暗色 UI 显示正确
5. 等待 1 分钟，验证：收到系统通知、自动退出全屏、进入休息状态
6. 跳过休息，启动第二个番茄钟并完成
7. 进入统计页，验证日/周/年三个维度的图表数据正确

- [ ] **Step 2: 修复发现的问题**

根据手动测试中发现的问题进行修复。

- [ ] **Step 3: 构建生产版本**

```bash
npm run tauri build
```

确认可以正常打包为 macOS .app 或 .dmg。

- [ ] **Step 4: 最终提交**

```bash
git add -A
git commit -m "chore: integration testing and final fixes"
```
