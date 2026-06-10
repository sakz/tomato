import { useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { useTimerStore } from "../stores/timerStore";
import { useSettingsStore } from "../stores/settingsStore";

async function sendNativeNotification(title: string, body: string) {
  try {
    const { sendNotification } = await import("@tauri-apps/plugin-notification");
    await sendNotification({ title, body });
  } catch {
    // Notification plugin not available
  }
}

async function enableKeepAwake() {
  try {
    await invoke("enable_keep_awake");
  } catch (err) {
    console.warn("[keepAwake] enable failed:", err);
  }
}

async function disableKeepAwake() {
  try {
    await invoke("disable_keep_awake");
  } catch (err) {
    console.warn("[keepAwake] disable failed:", err);
  }
}

function playSound() {
  try {
    const audio = new Audio("/sounds/bell.mp3");
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch {
    // Audio not available
  }
}

export function useTimer() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    status,
    remainingSeconds,
    currentSessionId,
    completedPomodoros,
    tick,
    startWork,
    startBreak,
    incrementPomodoro,
    setFullscreen,
    setCurrentSessionId,
    reset,
    pause,
    resume,
  } = useTimerStore();

  const { settings } = useSettingsStore();

  // Timer tick effect
  useEffect(() => {
    if (
      status === "working" ||
      status === "short_break" ||
      status === "long_break"
    ) {
      intervalRef.current = setInterval(() => {
        tick();
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [status, tick]);

  // Handle timer reaching zero
  useEffect(() => {
    if (remainingSeconds > 0 || status === "idle" || status === "paused")
      return;

    const handleTimerEnd = async () => {
      if (status === "working") {
        // Complete the work session
        if (currentSessionId) {
          await invoke("complete_session", {
            id: currentSessionId,
            actualDuration: settings.work_duration,
          });
        }
        incrementPomodoro();
        playSound();

        const newCount = completedPomodoros + 1;
        const isLongBreak =
          newCount % settings.intervals_before_long_break === 0;

        const breakType = isLongBreak ? "long_break" : "short_break";
        const breakDuration = isLongBreak
          ? settings.long_break_duration
          : settings.short_break_duration;

        // Exit fullscreen for break
        await disableKeepAwake();

        try {
          const win = getCurrentWindow();
          await win.setFullscreen(false);
        } catch {
          // Window API not available
        }
        setFullscreen(false);

        sendNativeNotification(
          "🍅 番茄完成！",
          `已完成 ${newCount} 个番茄，开始${isLongBreak ? "长" : "短"}休息`
        );

        startBreak(breakType as "short_break" | "long_break", breakDuration);
      } else if (status === "short_break" || status === "long_break") {
        playSound();
        sendNativeNotification("⏰ 休息结束", "准备开始下一个番茄");

        setCurrentSessionId(null);
        useTimerStore.setState({ status: "idle", remainingSeconds: 0 });
      }
    };

    handleTimerEnd();
  }, [remainingSeconds, status, currentSessionId, completedPomodoros, settings]);

  const startPomodoro = useCallback(
    async (taskId: number, taskName: string) => {
      try {
        const session = await invoke<any>("create_session", {
          taskId,
          sessionType: "work",
          plannedDuration: settings.work_duration,
        });

        // Update state first, then enter fullscreen
        startWork(taskId, taskName, session.id, settings.work_duration);
        setFullscreen(true);
        await enableKeepAwake();

        try {
          const win = getCurrentWindow();
          await win.setFullscreen(true);
        } catch {
          // Window API not available
        }
      } catch (err) {
        console.error("[startPomodoro] failed:", err);
      }
    },
    [settings.work_duration, startWork, setFullscreen]
  );

  const stopPomodoro = useCallback(async () => {
    if (currentSessionId) {
      await invoke("abandon_session", { id: currentSessionId });
    }
    try {
      const win = getCurrentWindow();
      await win.setFullscreen(false);
    } catch {
      // Window API not available
    }
    await disableKeepAwake();
    reset();
  }, [currentSessionId, reset]);

  const skipBreak = useCallback(() => {
    useTimerStore.setState({ status: "idle", remainingSeconds: 0 });
  }, []);

  const togglePause = useCallback(() => {
    if (status === "working") {
      pause();
    } else if (status === "paused") {
      resume();
    }
  }, [status, pause, resume]);

  // Global shortcut listener
  useEffect(() => {
    const unlisten = listen<string>("global-shortcut", (event) => {
      if (event.payload === "toggle-pause") {
        togglePause();
      } else if (event.payload === "stop") {
        stopPomodoro();
      }
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [togglePause, stopPomodoro]);

  return {
    startPomodoro,
    stopPomodoro,
    skipBreak,
    togglePause,
  };
}
