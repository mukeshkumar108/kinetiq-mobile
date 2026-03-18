import { apiGet } from "@/api/client";
import type { TodaySnapshot } from "./types";

export function fetchToday(timezone: string): Promise<TodaySnapshot> {
  return apiGet<TodaySnapshot>("/api/v1/today", { timezone });
}
