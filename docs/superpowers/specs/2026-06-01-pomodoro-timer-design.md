# Tomato — 番茄钟应用设计文档

## 概述

Tomato 是一款 macOS 原生桌面番茄钟应用，使用 Tauri v2 + React 构建。核心场景：在办公桌前启动番茄钟，全屏暗色低调显示，专注工作时不打扰、余光可见。

## 核心功能

### 1. 番茄钟计时器

- **完全可配置时长**：工作时长、短休息、长休息、每 N 个番茄后触发长休息，均可在设置页自定义
- **默认参数**：工作 25 分钟 / 短休息 5 分钟 / 长休息 15 分钟 / 每 4 个番茄后长休息
- **计时器状态**：空闲 → 工作中 → 短休息/长休息 → 工作中 → …
- **操作**：启动、暂停、跳过（跳过当前休息）、停止（放弃当前番茄，不计入统计）
- **只有完整完成的番茄才计入统计**

### 2. 全屏模式

- **触发条件**：启动番茄钟时，窗口自动进入 macOS 全屏模式
- **视觉风格**：
  - 纯黑/深色背景（#0a0a0a）
  - 倒计时数字使用较大字号，但低对比度颜色（如深灰色 #333），余光可见但不抢眼
  - 当前任务名称小字显示在倒计时下方
  - 顶部角落显示当前番茄进度（如 2/4）
- **退出全屏**：工作时段结束自动退出全屏（休息时段不全屏）；用户手动停止时也退出
- **快捷键**：支持全局快捷键暂停/恢复（在设置中可配置）

### 3. 任务管理

- **创建任务**：名称 + 颜色标识（可选预设颜色）
- **任务列表**：显示所有活跃任务，支持编辑名称、修改颜色
- **归档任务**：不删除，标记为归档，归档任务不出现在选择列表中但保留历史统计
- **启动番茄钟时选择任务**：必选一个任务才能启动番茄钟
- **累计时长**：每个任务显示历史累计完成番茄数和总时长

### 4. 统计分析

统计维度：
- **日视图**：当天完成的番茄数、总专注时长、按任务分布的饼图/条形图
- **周视图**：本周每天的番茄数柱状图、本周总时长、任务分布
- **年视图**：月度趋势折线图、年度总时长、任务分布 Top 10

图表组件使用 Recharts，包含：
- 柱状图（每日/每周番茄数）
- 饼图（任务时间分布）
- 折线图（长期趋势）

### 5. 通知与提醒

- **工作结束**：macOS 系统原生通知 + 提示音，提醒进入休息
- **休息结束**：macOS 系统原生通知 + 提示音，提醒开始下一个番茄
- **提示音**：使用 Tauri 内置能力播放简短提示音

---

## 技术架构

### 技术栈

| 层级 | 选型 | 版本 | 用途 |
|------|------|------|------|
| 桌面框架 | Tauri | v2 | macOS 原生窗口、系统 API |
| 前端框架 | React | 18 | UI 组件 |
| 语言 | TypeScript | 5.x | 类型安全 |
| 构建工具 | Vite | 5.x | 开发服务 + 构建 |
| 样式 | Tailwind CSS | 3.x | 原子化 CSS，暗色主题 |
| 图表 | Recharts | 2.x | 统计可视化 |
| 状态管理 | Zustand | 4.x | 全局状态（轻量） |
| 数据库 | SQLite | via Tauri SQL plugin | 本地持久化 |
| 路由 | React Router | 6.x | 页面路由 |
| 日期处理 | date-fns | 3.x | 日期计算与格式化 |

### 项目结构

```
tomato/
├── src-tauri/              # Tauri 后端
│   ├── src/
│   │   ├── main.rs         # 入口
│   │   ├── db.rs           # 数据库初始化与迁移
│   │   ├── commands/       # Tauri 命令
│   │   │   ├── tasks.rs    # 任务 CRUD
│   │   │   ├── sessions.rs # 番茄钟会话
│   │   │   └── stats.rs    # 统计查询
│   │   └── models.rs       # 数据模型
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                    # React 前端
│   ├── components/         # 通用组件
│   │   ├── Timer.tsx       # 倒计时组件
│   │   └── Charts/         # 图表组件
│   ├── pages/
│   │   ├── TimerPage.tsx   # 全屏计时页
│   │   ├── TasksPage.tsx   # 任务管理页
│   │   ├── StatsPage.tsx   # 统计页
│   │   └── SettingsPage.tsx# 设置页
│   ├── stores/             # Zustand stores
│   │   ├── timerStore.ts
│   │   ├── taskStore.ts
│   │   └── settingsStore.ts
│   ├── hooks/              # 自定义 hooks
│   │   └── useTimer.ts
│   ├── types/              # TypeScript 类型
│   ├── utils/              # 工具函数
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## 数据模型

### SQLite 表结构

```sql
-- 任务表
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6366f1',
    archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 番茄钟会话表
CREATE TABLE pomodoro_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    session_type TEXT NOT NULL CHECK(session_type IN ('work', 'short_break', 'long_break')),
    planned_duration INTEGER NOT NULL,  -- 计划时长（秒）
    actual_duration INTEGER NOT NULL,   -- 实际完成时长（秒），中途放弃为 0
    completed INTEGER NOT NULL DEFAULT 0, -- 是否完整完成
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    ended_at TEXT,
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- 设置表
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- 默认设置
INSERT INTO settings (key, value) VALUES
    ('work_duration', '1500'),          -- 25分钟
    ('short_break_duration', '300'),    -- 5分钟
    ('long_break_duration', '900'),     -- 15分钟
    ('intervals_before_long_break', '4');
```

### TypeScript 类型

```typescript
interface Task {
  id: number;
  name: string;
  color: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  // 计算字段
  totalSessions?: number;
  totalDuration?: number;
}

interface PomodoroSession {
  id: number;
  taskId: number;
  sessionType: 'work' | 'short_break' | 'long_break';
  plannedDuration: number;
  actualDuration: number;
  completed: boolean;
  startedAt: string;
  endedAt: string | null;
}

interface Settings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  intervalsBeforeLongBreak: number;
}

interface DailyStats {
  date: string;
  totalSessions: number;
  totalDuration: number; // 秒
  taskBreakdown: { taskId: number; taskName: string; color: string; duration: number }[];
}
```

---

## Tauri Commands (前后端接口)

```rust
// 任务
#[tauri::command] async fn create_task(name: String, color: String) -> Result<Task, String>;
#[tauri::command] async fn get_tasks(include_archived: bool) -> Result<Vec<Task>, String>;
#[tauri::command] async fn update_task(id: i64, name: String, color: String) -> Result<(), String>;
#[tauri::command] async fn archive_task(id: i64) -> Result<(), String>;

// 会话
#[tauri::command] async fn create_session(task_id: i64, session_type: String, planned_duration: i64) -> Result<PomodoroSession, String>;
#[tauri::command] async fn complete_session(id: i64, actual_duration: i64) -> Result<(), String>;
#[tauri::command] async fn abandon_session(id: i64) -> Result<(), String>;

// 统计
#[tauri::command] async fn get_daily_stats(date: String) -> Result<DailyStats, String>;
#[tauri::command] async fn get_weekly_stats(week_start: String) -> Result<Vec<DailyStats>, String>;
#[tauri::command] async fn get_yearly_stats(year: i32) -> Result<Vec<MonthlyStats>, String>;
#[tauri::command] async fn get_task_stats(task_id: i64) -> Result<TaskStats, String>;

// 设置
#[tauri::command] async fn get_settings() -> Result<Settings, String>;
#[tauri::command] async fn update_settings(settings: Settings) -> Result<(), String>;
```

---

## 页面设计

### 主窗口（非全屏时的正常窗口）

正常窗口大小约 800×600，包含底部 Tab 导航：

| Tab | 页面 | 说明 |
|-----|------|------|
| 🍅 计时 | TimerPage | 选择任务 → 启动番茄钟 |
| 📋 任务 | TasksPage | 任务管理 CRUD |
| 📊 统计 | StatsPage | 日/周/年维度图表 |
| ⚙️ 设置 | SettingsPage | 时间配置 |

### 全屏计时页 (TimerPage)

**正常窗口状态**：显示任务选择列表 + "开始番茄钟"按钮

**全屏状态（工作进行中）**：
```
┌─────────────────────────────────────────────────┐
│                                          2/4    │  ← 右上角，番茄进度
│                                                 │
│                                                 │
│                  18:32                          │  ← 居中，大字号，低对比度 (#333 on #0a0a0a)
│                 读书                            │  ← 任务名，小字号
│                                                 │
│                                                 │
│              [暂停]   [停止]                    │  ← 底部操作按钮，低调
└─────────────────────────────────────────────────┘
```

**休息状态（非全屏，回到正常窗口）**：显示"休息时间"+ 倒计时 + "跳过"按钮

---

## 快捷键

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `Cmd+Shift+Space` | 暂停/恢复 | 全局快捷键，非全屏时也生效 |
| `Cmd+Shift+X` | 停止当前番茄 | 全局快捷键 |
| `Esc` | 退出全屏 | 仅全屏状态 |

---

## 非功能需求

- **性能**：计时器使用 `setInterval` 1 秒精度，全屏渲染不使用动画以避免 GPU 占用
- **离线**：纯本地应用，无网络依赖
- **数据安全**：SQLite 文件存储在 Tauri 应用数据目录，应用卸载不自动删除
- **macOS 适配**：支持深色模式、菜单栏显示当前番茄状态（可选，v2 迭代）

---

## 版本规划

**v1.0（本次开发）**：
- 完整的番茄钟计时器 + 全屏模式
- 任务 CRUD
- 日/周/年统计图表
- 设置页面
- 系统通知 + 提示音

**v2.0（后续迭代，暂不开发）**：
- 菜单栏常驻图标
- 数据导出
- 每日专注目标设定
