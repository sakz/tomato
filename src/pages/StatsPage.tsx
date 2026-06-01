import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { format, startOfWeek, getYear } from "date-fns";
import DailyChart from "../components/DailyChart";
import WeeklyChart from "../components/WeeklyChart";
import YearlyChart from "../components/YearlyChart";
import type { DailyStats, MonthlyStats, TaskStats } from "../types";

type Tab = "daily" | "weekly" | "yearly";

export default function StatsPage() {
  const [tab, setTab] = useState<Tab>("daily");
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<DailyStats[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [topTasks, setTopTasks] = useState<TaskStats[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDaily = useCallback(async () => {
    setLoading(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const stats = await invoke<DailyStats>("get_daily_stats", { date: today });
      setDailyStats(stats);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWeekly = useCallback(async () => {
    setLoading(true);
    try {
      const weekStart = format(
        startOfWeek(new Date(), { weekStartsOn: 1 }),
        "yyyy-MM-dd"
      );
      const stats = await invoke<DailyStats[]>("get_weekly_stats", {
        weekStart,
      });
      setWeeklyStats(stats);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadYearly = useCallback(async () => {
    setLoading(true);
    try {
      const year = getYear(new Date());
      const stats = await invoke<MonthlyStats[]>("get_yearly_stats", { year });
      setMonthlyStats(stats);

      // Load top tasks - get tasks then stats for each
      const tasks = await invoke<Array<{ id: number }>>("get_tasks", {
        includeArchived: false,
      });
      const taskStatsPromises = tasks.map((t) =>
        invoke<TaskStats>("get_task_stats", { taskId: t.id })
      );
      const allTaskStats = await Promise.all(taskStatsPromises);
      const sorted = allTaskStats
        .filter((t) => t.total_sessions > 0)
        .sort((a, b) => b.total_sessions - a.total_sessions)
        .slice(0, 10);
      setTopTasks(sorted);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "daily") loadDaily();
    else if (tab === "weekly") loadWeekly();
    else loadYearly();
  }, [tab, loadDaily, loadWeekly, loadYearly]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "daily", label: "今日" },
    { key: "weekly", label: "本周" },
    { key: "yearly", label: "今年" },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-6">
      <h2 className="text-xl font-bold text-gray-200 mb-4">📊 统计</h2>

      <div className="flex gap-1 mb-6 bg-gray-800 rounded-lg p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-red-600 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : (
        <>
          {tab === "daily" && dailyStats && <DailyChart stats={dailyStats} />}
          {tab === "weekly" && <WeeklyChart stats={weeklyStats} />}
          {tab === "yearly" && (
            <YearlyChart monthlyStats={monthlyStats} topTasks={topTasks} />
          )}
        </>
      )}
    </div>
  );
}
