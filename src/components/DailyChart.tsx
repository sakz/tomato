import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatDuration } from "../utils/format";
import type { DailyStats } from "../types";

interface DailyChartProps {
  stats: DailyStats;
}

export default function DailyChart({ stats }: DailyChartProps) {
  const pieData = stats.task_breakdown.map((item) => ({
    name: item.task_name,
    value: item.duration,
    color: item.color,
  }));

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-gray-800 border border-gray-700 text-center">
          <p className="text-2xl font-bold text-gray-200">
            {stats.total_sessions}
          </p>
          <p className="text-xs text-gray-500 mt-1">番茄数</p>
        </div>
        <div className="p-4 rounded-lg bg-gray-800 border border-gray-700 text-center">
          <p className="text-2xl font-bold text-gray-200">
            {formatDuration(stats.total_duration)}
          </p>
          <p className="text-xs text-gray-500 mt-1">总时长</p>
        </div>
      </div>

      {pieData.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">任务分布</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
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
      ) : (
        <div className="text-center py-8 text-gray-500">今日暂无数据</div>
      )}
    </div>
  );
}
