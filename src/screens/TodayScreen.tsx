import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import GrainyGradient from "@/shared/ui/organisms/grainy-gradient";
import { AnimatedProgressBar } from "@/shared/ui/organisms/progress";
import { Checkbox } from "@/shared/ui/organisms/check-box";
import { StateCard } from "@/shared/ui/feedback/StateCard";
import { RewardToastContent } from "@/shared/ui/feedback/RewardToastContent";
import { Toast } from "@/shared/ui/molecules/Toast";
import { useToday } from "@/modules/today/hooks";
import { useProgression } from "@/modules/progression/hooks";
import { useCompleteHabit, useUncompleteHabit } from "@/modules/habits/hooks";
import { useCompleteTask } from "@/modules/tasks/hooks";
import type {
  HabitCompletionResult,
  HabitUncompleteResult,
} from "@/modules/habits/types";
import type { Progression } from "@/modules/progression/types";
import type { TaskCompletionResult } from "@/modules/tasks/types";
import type { TodayHabit, TodayTask } from "@/modules/today/types";
import { colors } from "@/shared/theme/colors";

const HABIT_FALLBACK_XP = 10;

export function TodayScreen() {
  const insets = useSafeAreaInsets();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = useToday(timezone);
  const progression = useProgression();
  const completeHabit = useCompleteHabit();
  const uncompleteHabit = useUncompleteHabit();
  const completeTask = useCompleteTask();

  const [heroProgression, setHeroProgression] = useState<Progression | null>(null);

  const snapshot = today.data;
  const liveProgression = progression.data;
  const displayedProgression = heroProgression ?? liveProgression ?? null;
  const habitMutationPending =
    completeHabit.isPending || uncompleteHabit.isPending;

  useEffect(() => {
    if (!heroProgression || !liveProgression) return;

    if (heroProgression.totalXp === liveProgression.totalXp) {
      setHeroProgression(null);
    }
  }, [heroProgression, liveProgression]);

  const showRewardToast = useCallback(
    ({
      title,
      subtitle,
      xp,
      streak,
      achievements,
    }: {
      title: string;
      subtitle: string;
      xp?: number;
      streak?: number;
      achievements?: { id: string; code: string; title: string }[];
    }) => {
      Toast.show(
        (
          <RewardToastContent
            title={title}
            subtitle={subtitle}
            xp={xp}
            streak={streak}
            achievements={achievements}
          />
        ),
        {
          position: "top",
          duration: achievements?.length ? 3600 : 2600,
          backgroundColor: "rgba(11, 15, 23, 0.94)",
          style: {
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "rgba(167, 139, 250, 0.28)",
            shadowColor: "#000",
            shadowOpacity: 0.25,
            shadowRadius: 22,
            shadowOffset: { width: 0, height: 14 },
          },
        },
      );
    },
    [],
  );

  const applyProgressionReward = useCallback((nextProgression: Progression) => {
    setHeroProgression(nextProgression);
  }, []);

  const handleHabitCompletion = useCallback(
    (result: HabitCompletionResult, habit: TodayHabit) => {
      const previousTotalXp =
        displayedProgression?.totalXp ?? liveProgression?.totalXp ?? 0;
      const rewardXp = Math.max(
        result.progression.totalXp - previousTotalXp,
        HABIT_FALLBACK_XP,
      );

      applyProgressionReward(result.progression);
      showRewardToast({
        title: habit.title,
        subtitle:
          result.unlockedAchievements.length > 0
            ? "Momentum locked in. You unlocked something new."
            : "Daily ritual logged. Keep the chain alive.",
        xp: rewardXp,
        streak: result.streak.current,
        achievements: result.unlockedAchievements,
      });
    },
    [applyProgressionReward, displayedProgression?.totalXp, liveProgression?.totalXp, showRewardToast],
  );

  const handleHabitUndo = useCallback(
    (result: HabitUncompleteResult, habit: TodayHabit) => {
      applyProgressionReward(result.progression);
      Toast.show(`${habit.title} removed from today`, {
        position: "top",
        duration: 1800,
        backgroundColor: "rgba(18, 22, 31, 0.96)",
      });
    },
    [applyProgressionReward],
  );

  const handleTaskReward = useCallback(
    (result: TaskCompletionResult, task: TodayTask) => {
      applyProgressionReward(result.progression);
      showRewardToast({
        title: task.title,
        subtitle:
          result.unlockedAchievements.length > 0
            ? "Focus task cleared. Bonus momentum unlocked."
            : "Focus task complete. The board just got lighter.",
        xp: result.grantedXp,
        achievements: result.unlockedAchievements,
      });
    },
    [applyProgressionReward, showRewardToast],
  );

  const handleHabitToggle = useCallback(
    (habit: TodayHabit) => {
      if (habitMutationPending) return;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (habit.completedToday) {
        uncompleteHabit.mutate(
          { id: habit.id, input: { timezone } },
          {
            onSuccess: (result) => handleHabitUndo(result, habit),
          },
        );
        return;
      }

      completeHabit.mutate(
        { id: habit.id, input: { timezone } },
        {
          onSuccess: (result) => handleHabitCompletion(result, habit),
        },
      );
    },
    [
      habitMutationPending,
      timezone,
      uncompleteHabit,
      handleHabitUndo,
      completeHabit,
      handleHabitCompletion,
    ],
  );

  const handleTaskComplete = useCallback(
    (task: TodayTask) => {
      if (task.status === "completed" || completeTask.isPending) return;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      completeTask.mutate(task.id, {
        onSuccess: (result) => handleTaskReward(result, task),
      });
    },
    [completeTask, handleTaskReward],
  );

  const onRefresh = useCallback(() => {
    today.refetch();
    progression.refetch();
  }, [today, progression]);

  const completedHabits =
    snapshot?.habits?.filter((habit) => habit.completedToday).length ?? 0;
  const totalHabits = snapshot?.habits?.length ?? 0;
  const completedTasks =
    snapshot?.tasks?.filter((task) => task.status === "completed").length ?? 0;
  const totalTasks = snapshot?.tasks?.length ?? 0;
  const strongestStreak = Math.max(
    ...(snapshot?.habits.map((habit) => habit.streak.current) ?? [0]),
  );

  const momentumCopy = useMemo(() => {
    if (completedHabits + completedTasks === 0) {
      return "Fresh board. Start with one easy win.";
    }
    if (
      completedHabits + completedTasks >= totalHabits + totalTasks &&
      totalHabits + totalTasks > 0
    ) {
      return "Everything for today is handled. Ride the glow.";
    }
    if (strongestStreak >= 7) {
      return "Streak energy is high. Protect the run.";
    }
    return "Momentum is building. Keep pressing forward.";
  }, [completedHabits, completedTasks, totalHabits, totalTasks, strongestStreak]);

  if (today.isLoading && !today.data) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (today.isError && !today.data) {
    return (
      <View style={s.loadingContainer}>
        <View style={s.content}>
          <StateCard
            icon="cloud-offline-outline"
            title="Today could not load"
            description="We could not reach the backend for your dashboard. Pull to retry or tap below."
            actionLabel="Retry"
            onAction={onRefresh}
          />
        </View>
      </View>
    );
  }

  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const xpPercent = displayedProgression
    ? Math.min(
        (displayedProgression.currentLevelXp / displayedProgression.nextLevelXp) *
          100,
        100,
      )
    : 0;

  return (
    <View style={s.screen}>
      <GrainyGradient
        colors={["#05070C", "#0A1330", "#1B1550", "#0C1222"]}
        intensity={0.08}
        amplitude={0.12}
        brightness={-0.09}
        animated={false}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, s.bgOverlay]} />

      <ScrollView
        style={s.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.content, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 28 }]}
        refreshControl={
          <RefreshControl
            refreshing={today.isFetching || progression.isFetching}
            onRefresh={onRefresh}
            tintColor={colors.accentElectric}
          />
        }
      >
        <View style={s.heroHeader}>
          <Text style={s.dateLabel}>{dateStr}</Text>
          <Text style={s.heading}>Today</Text>
          <Text style={s.subheading}>{momentumCopy}</Text>
        </View>

        <View style={s.heroCard}>
          <LinearGradient
            colors={["rgba(17, 30, 59, 0.95)", "rgba(16, 18, 32, 0.95)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={s.heroTopRow}>
            <View>
              <Text style={s.heroEyebrow}>Momentum meter</Text>
              <Text style={s.heroTitle}>
                {displayedProgression
                  ? `Level ${displayedProgression.level}`
                  : "Loading energy"}
              </Text>
            </View>
            <View style={s.heroBadge}>
              <Ionicons name="flash" size={14} color={colors.accentElectric} />
              <Text style={s.heroBadgeText}>{completedHabits + completedTasks} wins</Text>
            </View>
          </View>

          {displayedProgression ? (
            <>
              <Text style={s.xpReadout}>
                {displayedProgression.currentLevelXp}
                <Text style={s.xpReadoutMuted}>
                  {" "}
                  / {displayedProgression.nextLevelXp} XP
                </Text>
              </Text>
              <AnimatedProgressBar
                progress={xpPercent / 100}
                progressColor={colors.xp}
                trackColor="rgba(255,255,255,0.08)"
                height={10}
                borderRadius={999}
                useGradient
                gradientColors={[colors.accentElectric, colors.accent]}
              />
              <View style={s.heroStatsRow}>
                <View style={s.heroStatChip}>
                  <Ionicons name="trophy" size={13} color={colors.xp} />
                  <Text style={s.heroStatText}>{displayedProgression.totalXp} total XP</Text>
                </View>
                <View style={s.heroStatChip}>
                  <Ionicons name="flame" size={13} color={colors.streak} />
                  <Text style={s.heroStatText}>
                    {strongestStreak > 0 ? `${strongestStreak} day streak` : "Start a streak"}
                  </Text>
                </View>
              </View>
            </>
          ) : null}
        </View>

        <View style={s.quickStatsRow}>
          <View style={s.quickStatCard}>
            <Text style={s.quickStatValue}>{completedHabits}/{totalHabits || 0}</Text>
            <Text style={s.quickStatLabel}>Habits landed</Text>
          </View>
          <View style={s.quickStatCard}>
            <Text style={s.quickStatValue}>{completedTasks}/{totalTasks || 0}</Text>
            <Text style={s.quickStatLabel}>Tasks cleared</Text>
          </View>
        </View>

        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View>
              <Text style={s.sectionEyebrow}>Rituals</Text>
              <Text style={s.sectionTitle}>Habits</Text>
            </View>
            <Text style={s.sectionCount}>{completedHabits}/{totalHabits}</Text>
          </View>

          {totalHabits === 0 ? (
            <View style={s.emptyCard}>
              <Ionicons name="leaf-outline" size={30} color={colors.textMuted} />
              <Text style={s.emptyTitle}>No habits yet</Text>
              <Text style={s.emptyText}>Create daily rituals in Manage so this screen can start working for you.</Text>
            </View>
          ) : (
            <View style={s.listCard}>
              {snapshot?.habits.map((habit, index) => (
                <Pressable
                  key={habit.id}
                  style={[
                    s.row,
                    index > 0 && s.rowBorder,
                    habit.completedToday && s.rowDone,
                  ]}
                  onPress={() => handleHabitToggle(habit)}
                  disabled={habitMutationPending}
                >
                  <View style={[s.leadingOrb, habit.completedToday && s.leadingOrbDone]}>
                    {habit.completedToday ? (
                      <Ionicons name="checkmark" size={16} color={colors.text} />
                    ) : (
                      <Ionicons name="sparkles" size={14} color={colors.accentElectric} />
                    )}
                  </View>
                  <View style={s.rowContent}>
                    <Text
                      style={[
                        s.rowTitle,
                        habit.completedToday && s.rowTitleDone,
                      ]}
                    >
                      {habit.title}
                    </Text>
                    <Text style={s.rowSubtitle}>
                      {habit.completedToday
                        ? "Locked in for today"
                        : habit.streak.current > 0
                          ? `${habit.streak.current} day streak running`
                          : "Tap to build momentum"}
                    </Text>
                  </View>
                  <View style={s.rowMeta}>
                    <Text style={s.rowRewardText}>+10 XP</Text>
                    {habit.streak.current > 0 ? (
                      <View style={s.streakBadge}>
                        <Ionicons name="flame" size={12} color={colors.streak} />
                        <Text style={s.streakText}>{habit.streak.current}</Text>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View>
              <Text style={s.sectionEyebrow}>Focus</Text>
              <Text style={s.sectionTitle}>Tasks</Text>
            </View>
            <Text style={s.sectionCount}>{completedTasks}/{totalTasks}</Text>
          </View>

          {totalTasks === 0 ? (
            <View style={s.emptyCard}>
              <Ionicons name="checkbox-outline" size={30} color={colors.textMuted} />
              <Text style={s.emptyTitle}>No tasks loaded</Text>
              <Text style={s.emptyText}>Add up to three focus tasks in Manage so Today feels like a board, not a blank slate.</Text>
            </View>
          ) : (
            <View style={s.listCard}>
              {snapshot?.tasks.map((task, index) => (
                <Pressable
                  key={task.id}
                  style={[
                    s.row,
                    index > 0 && s.rowBorder,
                    task.status === "completed" && s.rowDone,
                  ]}
                  onPress={() => handleTaskComplete(task)}
                  disabled={task.status === "completed" || completeTask.isPending}
                >
                  <View style={s.taskCheckbox}>
                    <Checkbox
                      checked={task.status === "completed"}
                      checkmarkColor={
                        task.status === "completed" ? colors.xp : colors.accentElectric
                      }
                      size={24}
                      showBorder
                      stroke={2}
                    />
                  </View>
                  <View style={s.rowContent}>
                    <Text
                      style={[
                        s.rowTitle,
                        task.status === "completed" && s.rowTitleDone,
                      ]}
                    >
                      {task.title}
                    </Text>
                    <Text style={s.rowSubtitle}>
                      {task.status === "completed"
                        ? "Finished. Nice clean hit."
                        : "One decisive push and this board opens up."}
                    </Text>
                  </View>
                  <Text style={s.rowRewardText}>+25 XP</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
  },
  bgOverlay: {
    backgroundColor: "rgba(4, 6, 10, 0.48)",
  },
  content: {
    paddingHorizontal: 18,
    gap: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
  },
  heroHeader: {
    marginTop: 6,
    gap: 4,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: colors.accentElectric,
  },
  heading: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.text,
  },
  subheading: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.textSoft,
  },
  heroCard: {
    overflow: "hidden",
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(9, 12, 18, 0.78)",
    gap: 14,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  heroEyebrow: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSoft,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    marginTop: 4,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(10, 15, 24, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  xpReadout: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
  },
  xpReadoutMuted: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSoft,
  },
  heroStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  heroStatChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(7, 11, 20, 0.5)",
  },
  heroStatText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  quickStatsRow: {
    flexDirection: "row",
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
  },
  quickStatLabel: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
  sectionTitle: {
    marginTop: 2,
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
  },
  sectionCount: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textSoft,
  },
  listCard: {
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "rgba(14, 18, 28, 0.78)",
  },
  rowDone: {
    backgroundColor: "rgba(17, 29, 30, 0.72)",
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  leadingOrb: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(49, 198, 255, 0.12)",
  },
  leadingOrbDone: {
    backgroundColor: "rgba(52, 211, 153, 0.2)",
  },
  taskCheckbox: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  rowTitleDone: {
    color: colors.textSoft,
  },
  rowSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  rowMeta: {
    alignItems: "flex-end",
    gap: 8,
  },
  rowRewardText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: colors.accentElectric,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255, 157, 51, 0.14)",
  },
  streakText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.streak,
  },
  emptyCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingVertical: 28,
    alignItems: "center",
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  emptyText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: colors.textMuted,
  },
});
