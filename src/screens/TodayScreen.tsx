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
import { BottomSheet } from "@/shared/ui/feedback/BottomSheet";
import { SuccessSheet } from "@/shared/ui/feedback/SuccessSheet";
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

const vibe = {
  cyan: "#34C6FF",
  ember: "#FF6B2C",
  emberSoft: "#FF8A4C",
  panel: "rgba(12, 14, 20, 0.9)",
  panelAlt: "rgba(18, 19, 27, 0.92)",
  line: "rgba(255,255,255,0.09)",
  textSoft: "#CBD4EE",
};

interface RewardData {
  emoji: string;
  title: string;
  subtitle: string;
  meta?: string;
  points?: number;
}

export function TodayScreen() {
  const insets = useSafeAreaInsets();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = useToday(timezone);
  const progression = useProgression();
  const completeHabit = useCompleteHabit();
  const uncompleteHabit = useUncompleteHabit();
  const completeTask = useCompleteTask();

  const [heroProgression, setHeroProgression] = useState<Progression | null>(null);
  const [rewardSheet, setRewardSheet] = useState<RewardData | null>(null);
  const [isManualRefresh, setIsManualRefresh] = useState(false);

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
      setRewardSheet({
        emoji: "🔥",
        title: "Habit locked in",
        subtitle: `${habit.title} — +${rewardXp} XP earned.`,
        meta:
          result.streak.current > 0
            ? `${result.streak.current} day streak alive`
            : undefined,
        points: rewardXp,
      });
    },
    [
      applyProgressionReward,
      displayedProgression?.totalXp,
      liveProgression?.totalXp,
    ],
  );

  const handleHabitUndo = useCallback(
    (result: HabitUncompleteResult, habit: TodayHabit) => {
      applyProgressionReward(result.progression);
      setRewardSheet({
        emoji: "↩️",
        title: "Habit reopened",
        subtitle: `${habit.title} is back on your list.`,
      });
    },
    [applyProgressionReward],
  );

  const handleTaskReward = useCallback(
    (result: TaskCompletionResult, task: TodayTask) => {
      applyProgressionReward(result.progression);
      setRewardSheet({
        emoji: "🎯",
        title: "Task cleared",
        subtitle: `${task.title} — +${result.grantedXp} XP earned.`,
        points: result.grantedXp,
      });
    },
    [applyProgressionReward],
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
    setIsManualRefresh(true);
    Promise.all([today.refetch(), progression.refetch()]).finally(() => {
      setIsManualRefresh(false);
    });
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
      return "Your board is quiet. This is where the bigger picture starts.";
    }
    if (
      completedHabits + completedTasks >= totalHabits + totalTasks &&
      totalHabits + totalTasks > 0
    ) {
      return "Everything is clear. Sit with the win and track the momentum.";
    }
    if (strongestStreak >= 7) {
      return "The streak is real. This is the view that shows it.";
    }
    return "Your stats, streaks, and cleared work all live here.";
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
        colors={["#040507", "#150809", "#09111A", "#1A0D08"]}
        intensity={0.03}
        amplitude={0.04}
        brightness={-0.12}
        animated={false}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, s.bgOverlay]} />

      <ScrollView
        style={s.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.content,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 28 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isManualRefresh}
            onRefresh={onRefresh}
            tintColor={vibe.cyan}
          />
        }
      >
        <View style={s.heroHeader}>
          <Text style={s.dateLabel}>{dateStr}</Text>
          <Text style={s.heading}>Progress</Text>
          <Text style={s.subheading}>{momentumCopy}</Text>
        </View>

        <View style={s.heroCard}>
          <LinearGradient
            colors={["rgba(15, 34, 48, 0.96)", "rgba(27, 14, 12, 0.96)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={s.heroTopRow}>
            <View>
              <Text style={s.heroEyebrow}>Performance board</Text>
              <Text style={s.heroTitle}>
                {displayedProgression
                  ? `Level ${displayedProgression.level}`
                  : "Loading energy"}
              </Text>
            </View>
            <View style={s.heroBadge}>
              <Ionicons name="flash" size={14} color={vibe.cyan} />
              <Text style={s.heroBadgeText}>{completedHabits + completedTasks} reps</Text>
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
                gradientColors={[vibe.cyan, vibe.ember]}
              />
              <View style={s.heroStatsRow}>
                <View style={s.heroStatChip}>
                  <Ionicons name="trophy" size={13} color={vibe.cyan} />
                  <Text style={s.heroStatText}>
                    {displayedProgression.totalXp} total XP
                  </Text>
                </View>
                <View style={s.heroStatChip}>
                  <Ionicons name="flame" size={13} color={vibe.ember} />
                  <Text style={s.heroStatText}>
                    {strongestStreak > 0
                      ? `${strongestStreak} night streak`
                      : "Start a streak"}
                  </Text>
                </View>
              </View>
            </>
          ) : null}
        </View>

        <View style={s.quickStatsRow}>
          <View style={s.quickStatCard}>
            <Text style={s.quickStatValue}>
              {completedHabits}/{totalHabits || 0}
            </Text>
            <Text style={s.quickStatLabel}>Rituals landed</Text>
          </View>
          <View style={s.quickStatCard}>
            <Text style={s.quickStatValue}>
              {completedTasks}/{totalTasks || 0}
            </Text>
            <Text style={s.quickStatLabel}>Focus cleared</Text>
          </View>
        </View>

        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View>
              <Text style={s.sectionEyebrow}>Training</Text>
              <Text style={s.sectionTitle}>Habits</Text>
            </View>
            <Text style={s.sectionCount}>
              {completedHabits}/{totalHabits}
            </Text>
          </View>

          {totalHabits === 0 ? (
            <View style={s.emptyCard}>
              <Ionicons name="leaf-outline" size={30} color={colors.textMuted} />
              <Text style={s.emptyTitle}>No habits yet</Text>
              <Text style={s.emptyText}>
                Create daily rituals in Manage so this board has something to
                push forward.
              </Text>
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
                      <Ionicons name="flash" size={14} color={vibe.cyan} />
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
                        ? "Locked in for tonight"
                        : habit.streak.current > 0
                          ? `${habit.streak.current} night streak running`
                          : "Tap to keep the pressure on"}
                    </Text>
                  </View>
                  <View style={s.rowMeta}>
                    <Text style={s.rowRewardText}>+10 XP</Text>
                    {habit.streak.current > 0 ? (
                      <View style={s.streakBadge}>
                        <Ionicons name="flame" size={12} color={vibe.ember} />
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
              <Text style={s.sectionEyebrow}>Sprint</Text>
              <Text style={s.sectionTitle}>Tasks</Text>
            </View>
            <Text style={s.sectionCount}>
              {completedTasks}/{totalTasks}
            </Text>
          </View>

          {totalTasks === 0 ? (
            <View style={s.emptyCard}>
              <Ionicons
                name="checkbox-outline"
                size={30}
                color={colors.textMuted}
              />
              <Text style={s.emptyTitle}>No tasks loaded</Text>
              <Text style={s.emptyText}>
                Add up to three focus tasks in Manage so Today feels like a
                performance board, not dead space.
              </Text>
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
                        task.status === "completed" ? colors.xp : vibe.cyan
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
                        ? "Finished. Clean hit."
                        : "One decisive push and the lane opens up."}
                    </Text>
                  </View>
                  <Text style={s.rowRewardText}>+25 XP</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Reward bottom sheet */}
      <BottomSheet
        visible={rewardSheet !== null}
        onDismiss={() => setRewardSheet(null)}
      >
        {rewardSheet && (
          <SuccessSheet
            emoji={rewardSheet.emoji}
            title={rewardSheet.title}
            subtitle={rewardSheet.subtitle}
            meta={rewardSheet.meta}
            points={rewardSheet.points}
          />
        )}
      </BottomSheet>
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
    backgroundColor: "rgba(3, 4, 7, 0.62)",
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
    fontSize: 20,
    fontWeight: "600",
    color: vibe.textSoft,
  },
  heading: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.text,
  },
  subheading: {
    fontSize: 15,
    lineHeight: 21,
    color: vibe.textSoft,
  },
  heroCard: {
    overflow: "hidden",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 44, 0.14)",
    backgroundColor: vibe.panel,
    gap: 14,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: vibe.textSoft,
    textTransform: "uppercase",
    letterSpacing: 1.5,
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
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: vibe.line,
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
    color: vibe.textSoft,
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
    backgroundColor: "rgba(255,255,255,0.04)",
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
    backgroundColor: vibe.panelAlt,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: vibe.line,
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
    color: vibe.textSoft,
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
    letterSpacing: 1.9,
    textTransform: "uppercase",
    color: vibe.cyan,
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
    color: vibe.textSoft,
  },
  listCard: {
    overflow: "hidden",
    borderRadius: 22,
    backgroundColor: vibe.panelAlt,
    borderWidth: 1,
    borderColor: vibe.line,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "rgba(13, 16, 23, 0.92)",
  },
  rowDone: {
    backgroundColor: "rgba(16, 25, 21, 0.95)",
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: vibe.line,
  },
  leadingOrb: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(52, 198, 255, 0.12)",
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
    color: vibe.textSoft,
  },
  rowSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: vibe.textSoft,
  },
  rowMeta: {
    alignItems: "flex-end",
    gap: 8,
  },
  rowRewardText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: vibe.cyan,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255, 107, 44, 0.16)",
  },
  streakText: {
    fontSize: 12,
    fontWeight: "700",
    color: vibe.emberSoft,
  },
  emptyCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: vibe.line,
    backgroundColor: vibe.panelAlt,
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
    color: vibe.textSoft,
  },
});
