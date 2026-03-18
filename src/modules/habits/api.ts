import { apiGet, apiPost, apiPatch, apiDelete } from "@/api/client";
import type {
  Habit,
  CreateHabitInput,
  UpdateHabitInput,
  HabitCompleteInput,
  HabitCompletionResult,
  HabitUncompleteResult,
} from "./types";

export function fetchHabits(includeArchived = false): Promise<Habit[]> {
  return apiGet<Habit[]>("/api/v1/habits", {
    includeArchived: includeArchived ? "true" : "false",
  });
}

export function fetchHabit(id: string): Promise<Habit> {
  return apiGet<Habit>(`/api/v1/habits/${id}`);
}

export function createHabit(input: CreateHabitInput): Promise<Habit> {
  return apiPost<Habit>("/api/v1/habits", input);
}

export function updateHabit(id: string, input: UpdateHabitInput): Promise<Habit> {
  return apiPatch<Habit>(`/api/v1/habits/${id}`, input);
}

export function deleteHabit(id: string): Promise<unknown> {
  return apiDelete<unknown>(`/api/v1/habits/${id}`);
}

export function completeHabit(
  id: string,
  input?: HabitCompleteInput,
): Promise<HabitCompletionResult> {
  return apiPost<HabitCompletionResult>(`/api/v1/habits/${id}/complete`, input);
}

export function uncompleteHabit(
  id: string,
  input?: HabitCompleteInput,
): Promise<HabitUncompleteResult> {
  return apiPost<HabitUncompleteResult>(`/api/v1/habits/${id}/uncomplete`, input);
}
