import { StyleSheet, TextStyle } from "react-native";

// ─── Color tokens ───────────────────────────────────────────
// Single source of truth. Every screen imports from here.
// No more per-screen `page`, `vibe`, or inline rgba().

export const color = {
  // Backgrounds (blue-tinted darks, never pure black)
  bg: "#06070A",
  bgRaised: "#0C0F16",
  bgCard: "rgba(16, 19, 28, 0.92)",
  bgCardSolid: "#12151E",
  bgSheet: "#080A10",

  // Borders & dividers
  border: "rgba(255, 255, 255, 0.08)",
  borderStrong: "rgba(255, 255, 255, 0.14)",
  divider: "rgba(255, 255, 255, 0.06)",

  // Text
  text: "#F7F8FA",
  textSecondary: "#AAB2C8",
  textTertiary: "#667085",
  textInverse: "#0A0C10",

  // Primary (mint — growth, progress, "go")
  mint: "#57E6A8",
  mintMuted: "rgba(87, 230, 168, 0.15)",

  // Secondary (cyan — energy, habits, info)
  cyan: "#34C6FF",
  cyanMuted: "rgba(52, 198, 255, 0.12)",

  // Tertiary (ember — streaks, fire, momentum)
  ember: "#FF6B2C",
  emberSoft: "#FF8A4C",
  emberMuted: "rgba(255, 107, 44, 0.16)",

  // Semantic
  danger: "#EF4444",
  dangerMuted: "rgba(239, 68, 68, 0.15)",

  // Overlay
  overlay: "rgba(0, 0, 0, 0.6)",
  shadow: "rgba(0, 0, 0, 0.28)",
} as const;

// ─── Spacing scale (4px base) ───────────────────────────────
// Use these instead of magic numbers.

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
} as const;

// ─── Border radii ───────────────────────────────────────────

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  full: 999,
} as const;

// ─── Typography ─────────────────────────────────────────────
// 5 preset styles. Use these instead of per-screen font sizes.

export const font = StyleSheet.create({
  // Screen titles: "Today", "Manage", "Profile"
  display: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    letterSpacing: -0.4,
    color: color.text,
  } as TextStyle,

  // Hero text, large statements
  headline: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "600",
    letterSpacing: -0.3,
    color: color.text,
  } as TextStyle,

  // Card titles, row labels
  body: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "500",
    color: color.text,
  } as TextStyle,

  // Subtitles, descriptions
  caption: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
    color: color.textSecondary,
  } as TextStyle,

  // Labels, badges, metadata
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    color: color.textTertiary,
  } as TextStyle,
});

// ─── Shared card shadow ─────────────────────────────────────

export const cardShadow = {
  shadowColor: color.shadow,
  shadowOpacity: 1,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
} as const;

// ─── Content padding ────────────────────────────────────────
// Horizontal padding for screen content. One value, everywhere.

export const CONTENT_PADDING = space.xl; // 20
