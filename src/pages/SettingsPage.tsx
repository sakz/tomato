import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { useSettingsStore } from "../stores/settingsStore";

interface SettingRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}

function SettingRow({ label, value, min, max, unit, onChange }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-gray-300">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 flex items-center justify-center"
        >
          −
        </button>
        <span className="w-12 text-center text-lg font-mono text-gray-200">
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-8 h-8 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 flex items-center justify-center"
        >
          +
        </button>
        <span className="text-xs text-gray-500 w-8">{unit}</span>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { settings, fetchSettings, updateSettings } = useSettingsStore();
  const [workDuration, setWorkDuration] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [intervals, setIntervals] = useState(4);
  const [saved, setSaved] = useState(false);
  const [appVersion, setAppVersion] = useState("0.1.2");

  useEffect(() => {
    fetchSettings();
    getVersion()
      .then(setAppVersion)
      .catch(() => {});
  }, [fetchSettings]);

  useEffect(() => {
    setWorkDuration(Math.round(settings.work_duration / 60));
    setShortBreak(Math.round(settings.short_break_duration / 60));
    setLongBreak(Math.round(settings.long_break_duration / 60));
    setIntervals(settings.intervals_before_long_break);
  }, [settings]);

  const handleSave = async () => {
    await updateSettings({
      work_duration: workDuration * 60,
      short_break_duration: shortBreak * 60,
      long_break_duration: longBreak * 60,
      intervals_before_long_break: intervals,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-6">
      <h2 className="text-xl font-bold text-gray-200 mb-6">⚙️ 设置</h2>

      <div className="rounded-lg bg-gray-800 border border-gray-700 px-4">
        <SettingRow
          label="工作时长"
          value={workDuration}
          min={1}
          max={120}
          unit="分钟"
          onChange={setWorkDuration}
        />
        <div className="border-t border-gray-700" />
        <SettingRow
          label="短休息"
          value={shortBreak}
          min={1}
          max={30}
          unit="分钟"
          onChange={setShortBreak}
        />
        <div className="border-t border-gray-700" />
        <SettingRow
          label="长休息"
          value={longBreak}
          min={1}
          max={60}
          unit="分钟"
          onChange={setLongBreak}
        />
        <div className="border-t border-gray-700" />
        <SettingRow
          label="长休息间隔"
          value={intervals}
          min={2}
          max={10}
          unit="个番茄"
          onChange={setIntervals}
        />
      </div>

      <button
        onClick={handleSave}
        className="mt-6 w-full py-3 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-colors"
      >
        {saved ? "已保存 ✓" : "保存设置"}
      </button>

      <section className="mt-8 rounded-lg bg-gray-800 border border-gray-700 px-4 py-4">
        <h3 className="text-sm font-semibold text-gray-200 mb-3">关于</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Tomato</span>
          <span className="text-sm font-mono text-gray-300">v{appVersion}</span>
        </div>
      </section>
    </div>
  );
}
