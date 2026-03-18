import { apiGet } from "@/api/client";
import type { User } from "./types";

export function fetchMe(): Promise<User> {
  return apiGet<User>("/api/v1/me");
}
