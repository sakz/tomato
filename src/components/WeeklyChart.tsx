import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatDuration } from "../utils/format";
import type { DailyStats } from "../types";

interface WeeklyChartProps {
  stats: DailyStats[];
}

const DAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];

export default function WeeklyChart({ stats }: WeeklyChartProps) {
  const barData = stats.map((day, i) => ({
    day: DAY_LABELS[i] ?? `D${i + 1}`,
    sessions: day.total_sessions,
    duration: day.total_duration,
  }));

  // Aggregate task breakdown across the week
  const taskMap = new Map<string, { name: string; color: string; duration: number }>();
  for (const day of stats) {
    for (const item of day.task_breakdown) {
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
    }
  }
  const pieData = Array.from(taskMap.values());

  const totalSessions = stats.reduce((sum, d) => sum + d.total_sessions, 0);
  const totalDuration = stats.reduce((sum, d) => sum + d.total_duration, 0);

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-gray-800 border border-gray-700 text-center">
          <p className="text-2xl font-bold text-gray-200">{totalSessions}</p>
          <p className="text-xs text-gray-500 mt-1">本周番茄数</p>
        </div>
        <div className="p-4 rounded-lg bg-gray-800 border border-gray-700 text-center">
          <p className="text-2xl font-bold text-gray-200">
            {formatDuration(totalDuration)}
          </p>
          <p className="text-xs text-gray-500 mt-1">本周总时长</p>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-gray-400 mb-3">每日统计</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={barData}>
          <XAxis dataKey="day" tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "none",
              borderRadius: "8px",
              color: "#e5e7eb",
            }}
            formatter={(value, name) => [
              name === "sessions" ? `${value} 个` : formatDuration(Number(value)),
              name === "sessions" ? "番茄数" : "时长",
            ]}
          />
          <Bar dataKey="sessions" fill="#dc2626" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {pieData.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">任务分布</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="duration"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                strokeWidth={0}
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "none",
                  borderRadius: "8px",
                  color: "#e5e7eb",
                }}
                formatter={(value) => formatDuration(Number(value))}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
