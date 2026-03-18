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
