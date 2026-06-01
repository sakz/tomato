import { useEffect, useState } from "react";
import { useTimerStore } from "../stores/timerStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useTaskStore } from "../stores/taskStore";
import { useTimer } from "../hooks/useTimer";
import { formatTime } from "../utils/format";
import TimerDisplay from "../components/TimerDisplay";
import TaskSelector from "../components/TaskSelector";
import type { Task } from "../types";

export default function TimerPage() {
  const {
    status,
    remainingSeconds,
    totalSeconds,
    currentTaskName,
    completedPomodoros,
    isFullscreen,
  } = useTimerStore();

  const { settings, fetchSettings } = useSettingsStore();
  const { tasks, fetchTasks } = useTaskStore();
  const { startPomodoro, stopPomodoro, skipBreak, togglePause } = useTimer();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchTasks(false);
  }, [fetchSettings, fetchTasks]);

  // Fullscreen working mode
  if (isFullscreen && (status === "working" || status === "paused")) {
    return (
      <div
        className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center cursor-pointer"
        onClick={togglePause}
      >
        <div className="absolute top-6 right-6 text-gray-500 text-lg">
          {completedPomodoros % settings.intervals_before_long_break}/
          {settings.intervals_before_long_break}
        </div>
        <div className="absolute top-6 left-6 text-gray-500 text-sm">
          {currentTaskName}
        </div>
        {status === "paused" && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 text-gray-500 text-sm">
            已暂停
          </div>
        )}
        <div className="text-[8rem] font-mono font-bold text-[#333]">
          {formatTime(remainingSeconds)}
        </div>
        <div className="absolute bottom-12 flex gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePause();
            }}
            className="px-6 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700"
          >
            {status === "paused" ? "继续" : "暂停"}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              stopPomodoro();
            }}
            className="px-6 py-2 rounded-lg bg-red-900/50 text-red-400 hover:bg-red-900/70"
          >
            停止
          </button>
        </div>
      </div>
    );
  }

  // Break state
  if (status === "short_break" || status === "long_break") {
    const isLong = status === "long_break";
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <h2 className="text-2xl font-bold text-green-400 mb-4">
          {isLong ? "🌴 长休息" : "☕ 短休息"}
        </h2>
        <TimerDisplay
          remainingSeconds={remainingSeconds}
          totalSeconds={totalSeconds}
          status={status}
          isFullscreen={false}
          completedPomodoros={completedPomodoros}
          intervalsBeforeLongBreak={settings.intervals_before_long_break}
        />
        <p className="text-gray-400 mb-6">
          {isLong ? "好好放松一下！" : "休息一下，准备下一个番茄"}
        </p>
        <button
          onClick={skipBreak}
          className="px-6 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600"
        >
          跳过休息
        </button>
      </div>
    );
  }

  // Non-fullscreen working
  if (status === "working" || status === "paused") {
    return (
      <div className="flex flex-col items-center min-h-[calc(100vh-4rem)] px-4">
        <h2 className="text-lg text-gray-400 mt-4 mb-2">{currentTaskName}</h2>
        {status === "paused" && (
          <span className="text-sm text-yellow-500 mb-2">已暂停</span>
        )}
        <TimerDisplay
          remainingSeconds={remainingSeconds}
          totalSeconds={totalSeconds}
          status={status}
          isFullscreen={false}
          completedPomodoros={completedPomodoros}
          intervalsBeforeLongBreak={settings.intervals_before_long_break}
        />
        <div className="flex gap-4 mt-4">
          <button
            onClick={togglePause}
            className="px-6 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600"
          >
            {status === "paused" ? "继续" : "暂停"}
          </button>
          <button
            onClick={stopPomodoro}
            className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            停止
          </button>
        </div>
      </div>
    );
  }

  // Idle state
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] px-4 py-6">
      <h2 className="text-xl font-bold text-gray-200 text-center mb-4">
        🍅 选择任务
      </h2>
      <div className="flex-1">
        <TaskSelector
          tasks={tasks.filter((t) => !t.archived)}
          selectedTaskId={selectedTask?.id ?? null}
          onSelect={setSelectedTask}
        />
      </div>
      <div className="mt-6 px-4">
        <button
          disabled={!selectedTask}
          onClick={() => {
            if (selectedTask) {
              startPomodoro(selectedTask.id, selectedTask.name);
            }
          }}
          className={`w-full py-3 rounded-lg text-lg font-bold transition-colors ${
            selectedTask
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-gray-700 text-gray-500 cursor-not-allowed"
          }`}
        >
          开始番茄钟
        </button>
      </div>
    </div>
  );
}
