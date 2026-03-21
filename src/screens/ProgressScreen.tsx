import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { AnimatedProgressBar } from "@/shared/ui/organisms/progress";
import { StateCard } from "@/shared/ui/feedback/StateCard";
import { StreakCalendar } from "@/shared/ui/StreakCalendar";
import { useToday } from "@/modules/today/hooks";
import { useProgression } from "@/modules/progression/hooks";
import { color, font, space, radius, cardShadow, CONTENT_PADDING } from "@/shared/theme/tokens";

export function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = useToday(timezone);
  const progression = useProgression();
  const [isManualRefresh, setIsManualRefresh] = useState(false);

  const snapshot = today.data;
  const prog = progression.data;

  const completedHabits =
    snapshot?.habits.filter((h) => h.completedToday).length ?? 0;
  const totalHabits = snapshot?.habits.length ?? 0;
  const completedTasks =
    snapshot?.tasks.filter((t) => t.status === "completed").length ?? 0;
  const totalTasks = snapshot?.tasks.length ?? 0;
  const bestStreak = Math.max(
    ...(snapshot?.habits.map((h) => h.streak.longest) ?? [0]),
  );

  const onRefresh = useCallback(() => {
    setIsManualRefresh(true);
    Promise.all([today.refetch(), progression.refetch()]).finally(() => {
      setIsManualRefresh(false);
    });
  }, [today, progression]);

  const xpPercent = prog
    ? Math.min(prog.currentLevelXp / prog.nextLevelXp, 1)
    : 0;

  if (today.isLoading && !snapshot) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator color={color.text} size="large" />
      </View>
    );
  }

  if ((today.isError || progression.isError) && !snapshot && !prog) {
    return (
      <View style={s.loadingContainer}>
        <View style={s.content}>
          <StateCard
            icon="cloud-offline-outline"
            title="Progress could not load"
            description="Pull to retry or tap below."
            actionLabel="Retry"
            onAction={onRefresh}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <ScrollView
        style={s.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.scrollContent,
          {
            paddingTop: insets.top + space.md,
            paddingBottom: insets.bottom + space["3xl"],
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isManualRefresh}
            onRefresh={onRefresh}
            tintColor={color.text}
          />
        }
      >
        <Text style={s.heading}>Progress</Text>

        {/* XP Card */}
        <View style={s.heroCard}>
          <View style={s.heroTopRow}>
            <Text style={s.heroTitle}>
              {prog ? `Level ${prog.level}` : "Loading..."}
            </Text>
            <View style={s.heroBadge}>
              <Ionicons name="flash" size={14} color={color.cyan} />
              <Text style={s.heroBadgeText}>
                {completedHabits + completedTasks} done
              </Text>
            </View>
          </View>

          {prog ? (
            <>
              <Text style={s.xpReadout}>
                {prog.currentLevelXp}
                <Text style={s.xpReadoutMuted}>
                  {" "}/ {prog.nextLevelXp} XP
                </Text>
              </Text>
              <AnimatedProgressBar
                progress={xpPercent}
                progressColor={color.mint}
                trackColor={color.divider}
                height={10}
                borderRadius={radius.full}
                useGradient
                gradientColors={[color.cyan, color.ember]}
              />
              <View style={s.heroStatsRow}>
                <View style={s.heroStatChip}>
                  <Ionicons name="trophy" size={13} color={color.cyan} />
                  <Text style={s.heroStatText}>{prog.totalXp} total XP</Text>
                </View>
                {bestStreak > 0 && (
                  <View style={s.heroStatChip}>
                    <Ionicons name="flame" size={13} color={color.ember} />
                    <Text style={s.heroStatText}>{bestStreak} day best</Text>
                  </View>
                )}
              </View>
            </>
          ) : null}
        </View>

        {/* Quick stats */}
        <View style={s.quickStatsRow}>
          <View style={s.quickStatCard}>
            <Text style={s.quickStatValue}>
              {completedHabits}/{totalHabits}
            </Text>
            <Text style={s.quickStatLabel}>Habits</Text>
          </View>
          <View style={s.quickStatCard}>
            <Text style={s.quickStatValue}>
              {completedTasks}/{totalTasks}
            </Text>
            <Text style={s.quickStatLabel}>Tasks</Text>
          </View>
          <View style={s.quickStatCard}>
            <Text style={s.quickStatValue}>{bestStreak}</Text>
            <Text style={s.quickStatLabel}>Best streak</Text>
          </View>
        </View>

        {/* Streak Calendar */}
        <View style={s.calendarSection}>
          <Text style={s.calendarHeading}>Streak Calendar</Text>
          <StreakCalendar habits={snapshot?.habits ?? []} />
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: CONTENT_PADDING,
    gap: space.xl,
  },
  content: {
    paddingHorizontal: CONTENT_PADDING,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: color.bg,
  },
  heading: {
    ...font.display,
  },

  // XP Card
  heroCard: {
    overflow: "hidden",
    borderRadius: radius.xl,
    padding: space.xl,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.bgCard,
    gap: space.lg,
    ...cardShadow,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: space.md,
  },
  heroTitle: {
    ...font.headline,
    fontWeight: "700",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.full,
    backgroundColor: color.cyanMuted,
  },
  heroBadgeText: {
    ...font.label,
    color: color.text,
  },
  xpReadout: {
    ...font.headline,
    fontWeight: "700",
  },
  xpReadoutMuted: {
    ...font.caption,
  },
  heroStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
  },
  heroStatChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.full,
    backgroundColor: color.divider,
  },
  heroStatText: {
    ...font.label,
    color: color.text,
  },

  // Quick stats
  quickStatsRow: {
    flexDirection: "row",
    gap: space.md,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: color.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: color.border,
    paddingHorizontal: space.md,
    paddingVertical: space.lg,
    ...cardShadow,
  },
  quickStatValue: {
    fontSize: 22,
    fontWeight: "800",
    color: color.text,
  },
  quickStatLabel: {
    ...font.label,
    marginTop: space.xs,
  },

  // Calendar
  calendarSection: {
    gap: space.md,
  },
  calendarHeading: {
    ...font.headline,
    fontSize: 18,
  },
});
