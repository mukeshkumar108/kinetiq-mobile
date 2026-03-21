import { useAuth } from "@clerk/clerk-expo";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateQueryKeys } from "@/api/invalidate";
import { getHabitInvalidationKeys, queryKeys } from "@/api/query-keys";
import type { TodaySnapshot } from "@/modules/today/types";
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
    onMutate: async ({ id }) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await qc.cancelQueries({ queryKey: queryKeys.todayRoot(userId) });
      // Snapshot previous value for rollback
      const todayQueries = qc.getQueriesData<TodaySnapshot>({ queryKey: queryKeys.todayRoot(userId) });
      // Optimistically flip completedToday
      qc.setQueriesData<TodaySnapshot>(
        { queryKey: queryKeys.todayRoot(userId) },
        (old) => old ? {
          ...old,
          habits: old.habits.map((h) =>
            h.id === id ? { ...h, completedToday: true, streak: { ...h.streak, current: h.streak.current + 1 } } : h,
          ),
        } : old,
      );
      return { todayQueries };
    },
    onError: (_err, _vars, ctx) => {
      // Rollback on error
      ctx?.todayQueries?.forEach(([key, data]) => {
        if (data) qc.setQueryData(key, data);
      });
    },
    onSettled: () => invalidateQueryKeys(qc, getHabitInvalidationKeys(userId)),
  });
}

export function useUncompleteHabit() {
  const { userId } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input?: HabitCompleteInput }) =>
      uncompleteHabit(id, input),
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: queryKeys.todayRoot(userId) });
      const todayQueries = qc.getQueriesData<TodaySnapshot>({ queryKey: queryKeys.todayRoot(userId) });
      qc.setQueriesData<TodaySnapshot>(
        { queryKey: queryKeys.todayRoot(userId) },
        (old) => old ? {
          ...old,
          habits: old.habits.map((h) =>
            h.id === id ? { ...h, completedToday: false, streak: { ...h.streak, current: Math.max(0, h.streak.current - 1) } } : h,
          ),
        } : old,
      );
      return { todayQueries };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.todayQueries?.forEach(([key, data]) => {
        if (data) qc.setQueryData(key, data);
      });
    },
    onSettled: () => invalidateQueryKeys(qc, getHabitInvalidationKeys(userId)),
  });
}
