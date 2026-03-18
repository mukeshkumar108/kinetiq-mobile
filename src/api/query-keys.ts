export const GUEST_QUERY_SCOPE = "guest";

export function getQueryScope(userId?: string | null): string {
  return userId ?? GUEST_QUERY_SCOPE;
}

export const queryKeys = {
  session(userId?: string | null) {
    return ["session", getQueryScope(userId)] as const;
  },
  me(userId?: string | null) {
    return [...queryKeys.session(userId), "me"] as const;
  },
  habitsRoot(userId?: string | null) {
    return [...queryKeys.session(userId), "habits"] as const;
  },
  habits(userId?: string | null, includeArchived = false) {
    return [...queryKeys.habitsRoot(userId), { includeArchived }] as const;
  },
  tasksRoot(userId?: string | null) {
    return [...queryKeys.session(userId), "tasks"] as const;
  },
  tasks(userId?: string | null, status: "open" | "completed" | "all" = "open") {
    return [...queryKeys.tasksRoot(userId), { status }] as const;
  },
  todayRoot(userId?: string | null) {
    return [...queryKeys.session(userId), "today"] as const;
  },
  today(userId?: string | null, timezone?: string | null) {
    return [...queryKeys.todayRoot(userId), timezone ?? "UTC"] as const;
  },
  progression(userId?: string | null) {
    return [...queryKeys.session(userId), "progression"] as const;
  },
} as const;

export function getHabitInvalidationKeys(userId?: string | null) {
  return [
    queryKeys.habitsRoot(userId),
    queryKeys.todayRoot(userId),
    queryKeys.progression(userId),
  ] as const;
}

export function getTaskInvalidationKeys(userId?: string | null) {
  return [
    queryKeys.tasksRoot(userId),
    queryKeys.todayRoot(userId),
    queryKeys.progression(userId),
  ] as const;
}
