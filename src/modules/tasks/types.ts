export type TaskStatus = "open" | "completed";

export type TaskStatusFilter = TaskStatus | "all";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  status: TaskStatus;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  dueAt?: string | null; // ISO 8601
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  dueAt?: string | null; // ISO 8601
}

export interface TaskCompletionResult {
  task: Task;
  progression: {
    level: number;
    totalXp: number;
    currentLevelXp: number;
    nextLevelXp: number;
  };
  unlockedAchievements: {
    id: string;
    code: string;
    title: string;
  }[];
  grantedXp: number;
}

export interface TaskReopenResult {
  task: Task;
  progression: {
    level: number;
    totalXp: number;
    currentLevelXp: number;
    nextLevelXp: number;
  };
}
