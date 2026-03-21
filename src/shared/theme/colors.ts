import { color } from "./tokens";

/**
 * Legacy color map — kept so existing imports don't break.
 * New code should import from `@/shared/theme/tokens` directly.
 */
export const colors = {
  bg: color.bg,
  bgElevated: color.bgRaised,
  bgPanel: color.bgCardSolid,
  card: color.bgCard,
  cardStrong: color.bgCardSolid,
  cardBorder: color.borderStrong,
  cardBorderStrong: color.borderStrong,
  text: color.text,
  textMuted: color.textSecondary,
  textSoft: color.textSecondary,
  accent: color.mint,
  accentGlow: color.mint,
  accentElectric: color.cyan,
  xp: color.mint,
  streak: color.ember,
  success: color.mint,
  danger: color.danger,
  tabBar: color.bgSheet,
  tabInactive: color.textTertiary,
  overlay: color.overlay,
} as const;
