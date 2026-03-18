import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import type { AchievementSummary } from "@/modules/achievements/types";
import { colors } from "@/shared/theme/colors";

interface RewardToastContentProps {
  title: string;
  subtitle: string;
  xp?: number;
  streak?: number;
  achievements?: AchievementSummary[];
}

export function RewardToastContent({
  title,
  subtitle,
  xp,
  streak,
  achievements = [],
}: RewardToastContentProps) {
  const achievement = achievements[0];

  return (
    <View style={s.wrap}>
      <View style={s.iconWrap}>
        <Ionicons name="sparkles" size={16} color={colors.text} />
      </View>
      <View style={s.content}>
        <Text style={s.title}>{title}</Text>
        <Text style={s.subtitle}>{subtitle}</Text>
        <View style={s.metaRow}>
          {typeof xp === "number" ? (
            <View style={[s.metaChip, s.metaChipPrimary]}>
              <Text style={s.metaChipText}>+{xp} XP</Text>
            </View>
          ) : null}
          {typeof streak === "number" && streak > 0 ? (
            <View style={s.metaChip}>
              <Ionicons name="flame" size={12} color={colors.streak} />
              <Text style={s.metaChipText}>{streak} streak</Text>
            </View>
          ) : null}
          {achievement ? (
            <View style={s.metaChip}>
              <Ionicons name="trophy" size={12} color={colors.xp} />
              <Text style={s.metaChipText}>{achievement.title}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: "rgba(255,255,255,0.78)",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(4, 6, 13, 0.22)",
  },
  metaChipPrimary: {
    backgroundColor: "rgba(4, 6, 13, 0.34)",
  },
  metaChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
});
