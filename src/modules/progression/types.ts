export interface Progression {
  level: number;
  totalXp: number;
  currentLevelXp: number;
  nextLevelXp: number;
}

export interface StreakSnapshot {
  current: number;
  longest: number;
  lastCompletedLocalDate: string | null;
}

export type XpSource =
  | "habit_completion"
  | "task_completion"
  | "achievement_unlock"
  | "adjustment";
