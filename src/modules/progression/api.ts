import { apiGet } from "@/api/client";
import type { Progression } from "./types";

export function fetchProgression(): Promise<Progression> {
  return apiGet<Progression>("/api/v1/progression");
}
