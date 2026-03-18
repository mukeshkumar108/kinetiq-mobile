import { useAuth } from "@clerk/clerk-expo";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateQueryKeys } from "@/api/invalidate";
import { getHabitInvalidationKeys, queryKeys } from "@/api/query-keys";
import {
  fetchHabits,
  fetchHabit,
  createHabit,
  updateHabit,
  deleteHabit,
  completeHabit,
  uncompleteHabit,
} from "./api";
import type { CreateHabitInput, UpdateHabitInput, HabitCompleteInput } from "./types";

export function useHabits(includeArchived = false) {
  const { isLoaded, userId } = useAuth();

  return useQuery({
    queryKey: queryKeys.habits(userId, includeArchived),
    queryFn: () => fetchHabits(includeArchived),
    enabled: isLoaded && !!userId,
  });
}

export function useHabit(id: string) {
  const { isLoaded, userId } = useAuth();

  return useQuery({
    queryKey: [...queryKeys.habitsRoot(userId), id],
    queryFn: () => fetchHabit(id),
    enabled: isLoaded && !!userId,
  });
}

export function useCreateHabit() {
  const { userId } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateHabitInput) => createHabit(input),
    onSuccess: () => invalidateQueryKeys(qc, getHabitInvalidationKeys(userId)),
  });
}

export function useUpdateHabit() {
  const { userId } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateHabitInput }) =>
      updateHabit(id, input),
    onSuccess: () => invalidateQueryKeys(qc, getHabitInvalidationKeys(userId)),
  });
}

export function useDeleteHabit() {
  const { userId } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteHabit(id),
    onSuccess: () => invalidateQueryKeys(qc, getHabitInvalidationKeys(userId)),
  });
}

export function useCompleteHabit() {
  const { userId } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input?: HabitCompleteInput }) =>
      completeHabit(id, input),
    onSuccess: () => invalidateQueryKeys(qc, getHabitInvalidationKeys(userId)),
  });
}

export function useUncompleteHabit() {
  const { userId } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input?: HabitCompleteInput }) =>
      uncompleteHabit(id, input),
    onSuccess: () => invalidateQueryKeys(qc, getHabitInvalidationKeys(userId)),
  });
}
