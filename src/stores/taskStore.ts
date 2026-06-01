import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { Task } from "../types";

interface TaskState {
  tasks: Task[];
  loading: boolean;
  fetchTasks: (includeArchived?: boolean) => Promise<void>;
  createTask: (name: string, color: string) => Promise<Task>;
  updateTask: (id: number, name: string, color: string) => Promise<void>;
  archiveTask: (id: number) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  loading: false,

  fetchTasks: async (includeArchived = false) => {
    set({ loading: true });
    try {
      const tasks = await invoke<Task[]>("get_tasks", { includeArchived });
      set({ tasks });
    } finally {
      set({ loading: false });
    }
  },

  createTask: async (name, color) => {
    const task = await invoke<Task>("create_task", { name, color });
    set((state) => ({ tasks: [task, ...state.tasks] }));
    return task;
  },

  updateTask: async (id, name, color) => {
    await invoke("update_task", { id, name, color });
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, name, color, updated_at: new Date().toISOString() } : t
      ),
    }));
  },

  archiveTask: async (id) => {
    await invoke("archive_task", { id });
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, archived: true } : t
      ),
    }));
  },
}));
