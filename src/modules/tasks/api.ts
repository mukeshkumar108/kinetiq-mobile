import { apiGet, apiPost, apiPatch, apiDelete } from "@/api/client";
import type {
  Task,
  TaskStatusFilter,
  CreateTaskInput,
  UpdateTaskInput,
} from "./types";

export function fetchTasks(status: TaskStatusFilter = "open"): Promise<Task[]> {
  return apiGet<Task[]>("/api/v1/tasks", { status });
}

export function fetchTask(id: string): Promise<Task> {
  return apiGet<Task>(`/api/v1/tasks/${id}`);
}

export function createTask(input: CreateTaskInput): Promise<Task> {
  return apiPost<Task>("/api/v1/tasks", input);
}

export function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  return apiPatch<Task>(`/api/v1/tasks/${id}`, input);
}

export function deleteTask(id: string): Promise<unknown> {
  return apiDelete<unknown>(`/api/v1/tasks/${id}`);
}

export function completeTask(id: string): Promise<unknown> {
  return apiPost<unknown>(`/api/v1/tasks/${id}/complete`);
}

export function reopenTask(id: string): Promise<unknown> {
  return apiPost<unknown>(`/api/v1/tasks/${id}/reopen`);
}
