/**
 * Achievement domain types.
 *
 * Known from handover doc:
 *   - Models: AchievementDefinition, UserAchievement
 *   - Achievement unlock is idempotent (unique on userId + achievementDefinitionId)
 *
 * Exact response shape for GET /api/v1/achievements is NOT documented.
 */

/** Refine after inspecting GET /api/v1/achievements */
export type Achievement = Record<string, unknown>;
