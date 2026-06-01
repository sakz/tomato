import type { Task } from "../types";

interface TaskSelectorProps {
  tasks: Task[];
  selectedTaskId: number | null;
  onSelect: (task: Task) => void;
}

export default function TaskSelector({
  tasks,
  selectedTaskId,
  onSelect,
}: TaskSelectorProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>暂无任务，请先创建任务</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      {tasks.map((task) => (
        <button
          key={task.id}
          onClick={() => onSelect(task)}
          className={`flex items-center gap-2 p-3 rounded-lg border transition-colors text-left ${
            selectedTaskId === task.id
              ? "border-red-600 bg-red-900/20"
              : "border-gray-700 bg-gray-800 hover:border-gray-500"
          }`}
        >
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: task.color }}
          />
          <span className="text-sm text-gray-200 truncate">{task.name}</span>
        </button>
      ))}
    </div>
  );
}
