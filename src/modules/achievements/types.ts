export interface AchievementSummary {
  id: string;
  code: string;
  title: string;
}

/**
 * GET /api/v1/achievements is still not formally documented in the mobile repo,
 * so keep the list response loose for now while using a typed summary shape for
 * completion reward payloads.
 */
export type Achievement = Record<string, unknown>;
