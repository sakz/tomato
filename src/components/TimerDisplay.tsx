import { formatTime } from "../utils/format";

interface TimerDisplayProps {
  remainingSeconds: number;
  totalSeconds: number;
  status: string;
  isFullscreen: boolean;
  completedPomodoros: number;
  intervalsBeforeLongBreak: number;
}

export default function TimerDisplay({
  remainingSeconds,
  totalSeconds,
  status,
  isFullscreen,
  completedPomodoros,
  intervalsBeforeLongBreak,
}: TimerDisplayProps) {
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center">
        <div className="absolute top-6 right-6 text-gray-500 text-lg">
          {completedPomodoros % intervalsBeforeLongBreak}/{intervalsBeforeLongBreak}
        </div>
        <div className="text-[8rem] font-mono font-bold text-[#333]">
          {formatTime(remainingSeconds)}
        </div>
      </div>
    );
  }

  const progress =
    totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;

  return (
    <div className="flex flex-col items-center py-8">
      <div className="relative w-48 h-48 mb-6">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#374151"
            strokeWidth="6"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={status === "working" || status === "paused" ? "#dc2626" : "#16a34a"}
            strokeWidth="6"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-mono font-bold text-gray-200">
            {formatTime(remainingSeconds)}
          </span>
        </div>
      </div>
    </div>
  );
}
