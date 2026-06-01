import { create } from "zustand";
import type { TimerStatus } from "../types";

interface TimerState {
  status: TimerStatus;
  remainingSeconds: number;
  totalSeconds: number;
  currentTaskId: number | null;
  currentTaskName: string;
  currentSessionId: number | null;
  completedPomodoros: number;
  isFullscreen: boolean;

  setStatus: (status: TimerStatus) => void;
  setRemainingSeconds: (s: number) => void;
  startWork: (
    taskId: number,
    taskName: string,
    sessionId: number,
    duration: number
  ) => void;
  startBreak: (type: "short_break" | "long_break", duration: number) => void;
  tick: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  incrementPomodoro: () => void;
  setFullscreen: (v: boolean) => void;
  setCurrentSessionId: (id: number | null) => void;
}

export const useTimerStore = create<TimerState>((set) => ({
  status: "idle",
  remainingSeconds: 0,
  totalSeconds: 0,
  currentTaskId: null,
  currentTaskName: "",
  currentSessionId: null,
  completedPomodoros: 0,
  isFullscreen: false,

  setStatus: (status) => set({ status }),
  setRemainingSeconds: (remainingSeconds) => set({ remainingSeconds }),

  startWork: (taskId, taskName, sessionId, duration) =>
    set({
      status: "working",
      remainingSeconds: duration,
      totalSeconds: duration,
      currentTaskId: taskId,
      currentTaskName: taskName,
      currentSessionId: sessionId,
    }),

  startBreak: (type, duration) =>
    set({
      status: type,
      remainingSeconds: duration,
      totalSeconds: duration,
      currentSessionId: null,
    }),

  tick: () =>
    set((state) => ({
      remainingSeconds: Math.max(0, state.remainingSeconds - 1),
    })),

  pause: () => set({ status: "paused" }),

  resume: () => set({ status: "working" }),

  reset: () =>
    set({
      status: "idle",
      remainingSeconds: 0,
      totalSeconds: 0,
      currentTaskId: null,
      currentTaskName: "",
      currentSessionId: null,
      completedPomodoros: 0,
      isFullscreen: false,
    }),

  incrementPomodoro: () =>
    set((state) => ({ completedPomodoros: state.completedPomodoros + 1 })),

  setFullscreen: (isFullscreen) => set({ isFullscreen }),
  setCurrentSessionId: (currentSessionId) => set({ currentSessionId }),
}));
