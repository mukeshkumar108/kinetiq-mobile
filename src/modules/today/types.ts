export interface TodayHabit {
  id: string;
  title: string;
  description: string | null;
  color: string | null;
  completedToday: boolean;
  streak: {
    current: number;
    longest: number;
  };
}

export interface TodayTask {
  id: string;
  title: string;
  status: "open" | "completed";
  dueAt: string | null;
  completedAt: string | null;
  dueToday: boolean;
  completedToday: boolean;
}

export interface TodaySnapshot {
  date: string;
  timezone: string;
  habits: TodayHabit[];
  tasks: TodayTask[];
}
