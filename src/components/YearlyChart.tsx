import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { formatDuration } from "../utils/format";
import type { MonthlyStats, TaskStats } from "../types";

interface YearlyChartProps {
  monthlyStats: MonthlyStats[];
  topTasks: TaskStats[];
}

const MONTH_LABELS = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

const TOP_COLORS = [
  "#dc2626", "#f97316", "#eab308", "#22c55e", "#3b82f6",
  "#8b5cf6", "#ec4899", "#06b6d4", "#14b8a6", "#f43f5e",
];

export default function YearlyChart({ monthlyStats, topTasks }: YearlyChartProps) {
  const lineData = monthlyStats.map((m) => {
    const monthNum = parseInt(m.month.split("-")[1] ?? "1", 10);
    return {
      month: MONTH_LABELS[monthNum - 1] ?? m.month,
      sessions: m.total_sessions,
      duration: m.total_duration,
    };
  });

  const totalSessions = monthlyStats.reduce((sum, m) => sum + m.total_sessions, 0);
  const totalDuration = monthlyStats.reduce((sum, m) => sum + m.total_duration, 0);

  const barData = topTasks.slice(0, 10).map((t) => ({
    name: t.task_name,
    sessions: t.total_sessions,
    duration: t.total_duration,
  }));

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-gray-800 border border-gray-700 text-center">
          <p className="text-2xl font-bold text-gray-200">{totalSessions}</p>
          <p className="text-xs text-gray-500 mt-1">今年番茄数</p>
        </div>
        <div className="p-4 rounded-lg bg-gray-800 border border-gray-700 text-center">
          <p className="text-2xl font-bold text-gray-200">
            {formatDuration(totalDuration)}
          </p>
          <p className="text-xs text-gray-500 mt-1">今年总时长</p>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-gray-400 mb-3">月度趋势</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={lineData}>
          <XAxis
            dataKey="month"
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
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
          <Line
            type="monotone"
            dataKey="sessions"
            stroke="#dc2626"
            strokeWidth={2}
            dot={{ fill: "#dc2626", r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {barData.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">
            Top 任务
          </h3>
          <ResponsiveContainer width="100%" height={Math.max(150, barData.length * 36)}>
            <BarChart data={barData} layout="vertical">
              <XAxis
                type="number"
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
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
              <Bar dataKey="sessions" radius={[0, 4, 4, 0]}>
                {barData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={TOP_COLORS[index % TOP_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
