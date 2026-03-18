export interface Progression {
  level: number;
  totalXp: number;
  currentLevelXp: number;
  nextLevelXp: number;
}

export type XpSource =
  | "habit_completion"
  | "task_completion"
  | "achievement_unlock"
  | "adjustment";
