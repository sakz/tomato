# 🍅 Tomato

一款专注于沉浸式工作流的 macOS 原生桌面番茄钟应用。低调、简洁、不打扰，让你的注意力回归真正重要的事。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tauri](https://img.shields.io/badge/Tauri-v2-FFC131?logo=tauri)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)
![Rust](https://img.shields.io/badge/Rust-2021-000000?logo=rust)

---

## ✨ 特性

- **🎯 可配置番茄钟** — 工作、短休息、长休息时长及长休息间隔均可自定义
- **🖥️ 全屏专注模式** — 启动番茄钟后自动进入全屏，深色极简界面，余光可见但不抢眼
- **✅ 任务管理** — 创建、编辑、归档任务，为每个任务分配颜色标识，统计历史累计时长
- **📊 数据可视化** — 日/周/年多维统计视图，使用 Recharts 绘制柱状图、饼图与趋势折线图
- **🔔 原生通知** — 工作与休息结束时通过 macOS 系统通知 + 提示音提醒
- **⌨️ 全局快捷键** — 支持配置全局热键快速暂停/恢复计时器
- **💾 本地持久化** — SQLite 本地数据库，所有数据保存在本地，隐私无忧

---

## 🖼️ 预览

> 全屏专注模式

启动番茄钟后，窗口自动进入全屏，深色背景配以低对比度大字号倒计时，让你专注工作的同时随时感知剩余时间。

> 统计面板

通过日、周、年三种维度回顾你的专注数据，发现高效时段与任务分布。

---

## 🚀 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://www.rust-lang.org/tools/install) >= 1.70
- macOS（主要支持平台，其他平台可尝试构建）

### 安装依赖

```bash
# 安装前端依赖
npm install

# Tauri CLI 已作为 devDependency 包含，无需全局安装
```

### 开发模式

```bash
npm run tauri dev
```

### 构建生产版本

```bash
npm run tauri build
```

构建完成后，安装包位于 `src-tauri/target/release/bundle/` 目录。

---

## 🏗️ 技术架构

| 层级 | 技术 | 说明 |
|------|------|------|
| 桌面框架 | [Tauri v2](https://v2.tauri.app/) | 轻量级原生桌面应用壳层，Rust 核心 |
| 前端框架 | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) | 组件化 UI，类型安全 |
| 构建工具 | [Vite](https://vitejs.dev/) | 极速开发体验与生产构建 |
| 样式方案 | [Tailwind CSS](https://tailwindcss.com/) | 原子化 CSS，暗色主题优先 |
| 状态管理 | [Zustand](https://github.com/pmndrs/zustand) | 轻量全局状态 |
| 数据图表 | [Recharts](https://recharts.org/) | React 声明式图表库 |
| 本地数据库 | SQLite (via [tauri-plugin-sql](https://github.com/tauri-apps/plugins-workspace/tree/v2/plugins/sql)) | 本地持久化存储 |
| 路由 | [React Router v7](https://reactrouter.com/) | 客户端路由 |
| 日期处理 | [date-fns](https://date-fns.org/) | 日期计算与格式化 |

---

## 📁 项目结构

```
tomato/
├── src/                        # React 前端源码
│   ├── components/             # 通用组件
│   │   ├── TimerDisplay.tsx    # 倒计时显示
│   │   ├── TaskSelector.tsx    # 任务选择器
│   │   ├── DailyChart.tsx      # 日统计图表
│   │   ├── WeeklyChart.tsx     # 周统计图表
│   │   └── YearlyChart.tsx     # 年统计图表
│   ├── pages/                  # 页面级组件
│   │   ├── TimerPage.tsx       # 计时器/全屏页
│   │   ├── TasksPage.tsx       # 任务管理页
│   │   ├── StatsPage.tsx       # 统计分析页
│   │   └── SettingsPage.tsx    # 设置页
│   ├── stores/                 # Zustand 状态管理
│   │   ├── timerStore.ts
│   │   ├── taskStore.ts
│   │   └── settingsStore.ts
│   ├── hooks/                  # 自定义 Hooks
│   │   └── useTimer.ts
│   ├── types/                  # TypeScript 类型定义
│   └── utils/                  # 工具函数
│
├── src-tauri/                  # Tauri Rust 后端
│   ├── src/
│   │   ├── main.rs             # 应用入口
│   │   ├── lib.rs              # 库入口
│   │   ├── db.rs               # 数据库初始化与迁移
│   │   ├── models.rs           # 数据模型定义
│   │   └── commands/           # Tauri IPC 命令
│   │       ├── tasks.rs        # 任务 CRUD
│   │       ├── sessions.rs     # 番茄钟会话记录
│   │       ├── stats.rs        # 统计查询
│   │       └── settings.rs     # 设置管理
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── public/sounds/              # 提示音资源
└── docs/                       # 设计文档与规格说明
```

---

## 🛠️ 开发指南

### 推荐的 IDE 配置

- [VS Code](https://code.visualstudio.com/) + [Tauri 插件](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

### 代码规范

- 前端遵循 TypeScript 严格模式
- Rust 后端使用 `cargo fmt` 与 `cargo clippy` 保持代码风格一致

---

## 📝 默认配置

| 参数 | 默认值 | 说明 |
|------|--------|------|
| 工作时长 | 25 分钟 | 每个番茄钟的专注时间 |
| 短休息 | 5 分钟 | 每个番茄之间的休息 |
| 长休息 | 15 分钟 | 连续多个番茄后的较长休息 |
| 长休息间隔 | 4 个番茄 | 每完成 N 个番茄后触发长休息 |

所有参数均可在**设置页**自由调整。

---

## 🤝 贡献

欢迎 Issue 和 PR！在提交代码前，请确保：

1. 代码通过 TypeScript 类型检查：`npm run build`
2. Rust 代码通过编译：`cd src-tauri && cargo check`

---

## 📄 许可证

[MIT](LICENSE)

---

> 🍅 *保持专注，一次只做一件事。*
