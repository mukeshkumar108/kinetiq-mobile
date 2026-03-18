import { useAuth } from "@clerk/clerk-expo";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateQueryKeys } from "@/api/invalidate";
import { getTaskInvalidationKeys, queryKeys } from "@/api/query-keys";
import {
  fetchTasks,
  fetchTask,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  reopenTask,
} from "./api";
import type { TaskStatusFilter, CreateTaskInput, UpdateTaskInput } from "./types";

export function useTasks(status: TaskStatusFilter = "open") {
  const { isLoaded, userId } = useAuth();

  return useQuery({
    queryKey: queryKeys.tasks(userId, status),
    queryFn: () => fetchTasks(status),
    enabled: isLoaded && !!userId,
  });
}

export function useTask(id: string) {
  const { isLoaded, userId } = useAuth();

  return useQuery({
    queryKey: [...queryKeys.tasksRoot(userId), id],
    queryFn: () => fetchTask(id),
    enabled: isLoaded && !!userId,
  });
}

export function useCreateTask() {
  const { userId } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onSuccess: () => invalidateQueryKeys(qc, getTaskInvalidationKeys(userId)),
  });
}

export function useUpdateTask() {
  const { userId } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) =>
      updateTask(id, input),
    onSuccess: () => invalidateQueryKeys(qc, getTaskInvalidationKeys(userId)),
  });
}

export function useDeleteTask() {
  const { userId } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => invalidateQueryKeys(qc, getTaskInvalidationKeys(userId)),
  });
}

export function useCompleteTask() {
  const { userId } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => completeTask(id),
    onSuccess: () => invalidateQueryKeys(qc, getTaskInvalidationKeys(userId)),
  });
}

export function useReopenTask() {
  const { userId } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reopenTask(id),
    onSuccess: () => invalidateQueryKeys(qc, getTaskInvalidationKeys(userId)),
  });
}
