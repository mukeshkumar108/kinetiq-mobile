export type HabitFrequency = "daily";

export interface HabitStreak {
  current: number;
  longest: number;
  lastCompletedLocalDate: string | null; // YYYY-MM-DD
}

export interface Habit {
  id: string;
  title: string;
  description: string | null;
  color: string | null;
  timezone: string | null;
  frequency: HabitFrequency;
  isArchived: boolean;
  streak: HabitStreak;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHabitInput {
  title: string;
  description?: string | null;
  color?: string | null;
  timezone?: string;
}

export interface UpdateHabitInput {
  title?: string;
  description?: string | null;
  color?: string | null;
  timezone?: string | null;
  isArchived?: boolean;
}

export interface HabitCompleteInput {
  timezone?: string;
  localDate?: string; // YYYY-MM-DD
}

export interface HabitCompletionResult {
  habitId: string;
  completion: {
    id: string;
    localDate: string;
    timezone: string;
    completedAt: string;
  };
  streak: {
    current: number;
    longest: number;
    lastCompletedLocalDate: string | null;
  };
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
}

export interface HabitUncompleteResult {
  habitId: string;
  removedLocalDate: string;
  streak: {
    current: number;
    longest: number;
    lastCompletedLocalDate: string | null;
  };
  progression: {
    level: number;
    totalXp: number;
    currentLevelXp: number;
    nextLevelXp: number;
  };
}
