import { useEffect, useState } from "react";
import { useTaskStore } from "../stores/taskStore";
import { formatDuration } from "../utils/format";
import type { Task } from "../types";

const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
];

export default function TasksPage() {
  const { tasks, loading, fetchTasks, createTask, updateTask, archiveTask } =
    useTaskStore();
  const [showArchived, setShowArchived] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);

  useEffect(() => {
    fetchTasks(showArchived);
  }, [fetchTasks, showArchived]);

  const openCreate = () => {
    setEditingTask(null);
    setName("");
    setColor(PRESET_COLORS[0]);
    setShowForm(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setName(task.name);
    setColor(task.color);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (editingTask) {
      await updateTask(editingTask.id, name.trim(), color);
    } else {
      await createTask(name.trim(), color);
    }
    setShowForm(false);
    setName("");
    setColor(PRESET_COLORS[0]);
    fetchTasks(showArchived);
  };

  const handleArchive = async (id: number) => {
    await archiveTask(id);
    fetchTasks(showArchived);
  };

  const activeTasks = tasks.filter((t) => !t.archived);
  const archivedTasks = tasks.filter((t) => t.archived);

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-200">📋 任务管理</h2>
        <button
          onClick={openCreate}
          className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
        >
          + 新建
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-4 p-4 rounded-lg bg-gray-800 border border-gray-700"
        >
          <h3 className="text-sm font-semibold text-gray-300 mb-3">
            {editingTask ? "编辑任务" : "新建任务"}
          </h3>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="任务名称"
            className="w-full mb-3 px-3 py-2 rounded-lg bg-gray-700 text-gray-200 border border-gray-600 focus:outline-none focus:border-red-500"
            autoFocus
          />
          <div className="flex gap-2 mb-4 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-transform ${
                  color === c ? "ring-2 ring-white ring-offset-2 ring-offset-gray-800 scale-110" : ""
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
            >
              {editingTask ? "保存" : "创建"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600"
            >
              取消
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : (
        <>
          {activeTasks.length === 0 && !showForm && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-3">📝</p>
              <p>暂无任务，点击上方"新建"创建</p>
            </div>
          )}
          <div className="space-y-2">
            {activeTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-800 border border-gray-700"
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: task.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">
                    {task.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    🍅 {task.total_sessions ?? 0} · {formatDuration(task.total_duration ?? 0)}
                  </p>
                </div>
                <button
                  onClick={() => openEdit(task)}
                  className="p-1.5 text-gray-400 hover:text-gray-200"
                  title="编辑"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleArchive(task.id)}
                  className="p-1.5 text-gray-400 hover:text-gray-200"
                  title="归档"
                >
                  📦
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="text-sm text-gray-500 hover:text-gray-300"
            >
              {showArchived ? "隐藏已归档" : "显示已归档"} ({archivedTasks.length})
            </button>
            {showArchived && archivedTasks.length > 0 && (
              <div className="mt-3 space-y-2">
                {archivedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 opacity-60"
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: task.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-400 truncate line-through">
                        {task.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        🍅 {task.total_sessions ?? 0} · {formatDuration(task.total_duration ?? 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
