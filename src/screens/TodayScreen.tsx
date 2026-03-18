import { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { AnimatedProgressBar } from "@/shared/ui/organisms/progress";
import { Checkbox } from "@/shared/ui/organisms/check-box";
import { StateCard } from "@/shared/ui/feedback/StateCard";
import { useToday } from "@/modules/today/hooks";
import { useProgression } from "@/modules/progression/hooks";
import { useCompleteHabit, useUncompleteHabit } from "@/modules/habits/hooks";
import { useCompleteTask } from "@/modules/tasks/hooks";
import type { TodayHabit, TodayTask } from "@/modules/today/types";
import { colors } from "@/shared/theme/colors";

export function TodayScreen() {
  const insets = useSafeAreaInsets();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = useToday(timezone);
  const progression = useProgression();
  const completeHabit = useCompleteHabit();
  const uncompleteHabit = useUncompleteHabit();
  const completeTask = useCompleteTask();
  const habitMutationPending =
    completeHabit.isPending || uncompleteHabit.isPending;

  const handleHabitToggle = useCallback(
    (habit: TodayHabit) => {
      if (habitMutationPending) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (habit.completedToday) {
        uncompleteHabit.mutate({ id: habit.id, input: { timezone } });
      } else {
        completeHabit.mutate({ id: habit.id, input: { timezone } });
      }
    },
    [habitMutationPending, timezone, completeHabit, uncompleteHabit],
  );

  const handleTaskComplete = useCallback(
    (task: TodayTask) => {
      if (task.status === "completed" || completeTask.isPending) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      completeTask.mutate(task.id);
    },
    [completeTask],
  );

  const onRefresh = useCallback(() => {
    today.refetch();
    progression.refetch();
  }, [today, progression]);

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

  const snapshot = today.data;
  const prog = progression.data;

  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const completedHabits =
    snapshot?.habits?.filter((h) => h.completedToday).length ?? 0;
  const totalHabits = snapshot?.habits?.length ?? 0;
  const completedTasks =
    snapshot?.tasks?.filter((t) => t.status === "completed").length ?? 0;
  const totalTasks = snapshot?.tasks?.length ?? 0;

  const xpPercent = prog
    ? Math.min((prog.currentLevelXp / prog.nextLevelXp) * 100, 100)
    : 0;

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={[s.content, { paddingTop: insets.top + 16 }]}
      refreshControl={
        <RefreshControl
          refreshing={today.isFetching}
          onRefresh={onRefresh}
          tintColor={colors.accent}
        />
      }
    >
      {/* Header */}
      <View style={s.header}>
        <Text style={s.heading}>Today</Text>
        <Text style={s.dateText}>{dateStr}</Text>
      </View>

      {/* XP Card */}
      {prog && (
        <View style={s.xpCard}>
          <View style={s.xpHeader}>
            <View style={s.levelBadge}>
              <Text style={s.levelText}>LVL {prog.level}</Text>
            </View>
            <Text style={s.xpAmount}>
              {prog.currentLevelXp}
              <Text style={s.xpTotal}> / {prog.nextLevelXp} XP</Text>
            </Text>
          </View>
          <AnimatedProgressBar
            progress={xpPercent / 100}
            progressColor={colors.xp}
            trackColor={colors.cardBorder}
            height={8}
            borderRadius={4}
            useGradient
            gradientColors={[colors.xp, colors.accentGlow]}
          />
          <Text style={s.totalXp}>{prog.totalXp} total XP earned</Text>
        </View>
      )}

      {/* Habits Section */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Habits</Text>
          <Text style={s.sectionCount}>
            {completedHabits}/{totalHabits}
          </Text>
        </View>

        {totalHabits === 0 ? (
          <View style={s.emptyCard}>
            <Ionicons
              name="leaf-outline"
              size={32}
              color={colors.textMuted}
            />
            <Text style={s.emptyText}>No habits yet</Text>
            <Text style={s.emptySubtext}>
              Create daily habits in the Manage tab
            </Text>
          </View>
        ) : (
          <View style={s.listCard}>
            {snapshot?.habits.map((habit, i) => (
              <Pressable
                key={habit.id}
                style={[s.row, i > 0 && s.rowBorder]}
                onPress={() => handleHabitToggle(habit)}
                disabled={habitMutationPending}
              >
                <View
                  style={[
                    s.checkbox,
                    s.checkboxCircle,
                    habit.completedToday && s.checkboxChecked,
                  ]}
                >
                  {habit.completedToday && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
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
                </View>
                {habit.streak.current > 0 && (
                  <View style={s.streakBadge}>
                    <Ionicons name="flame" size={14} color={colors.streak} />
                    <Text style={s.streakText}>{habit.streak.current}</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Tasks Section */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Tasks</Text>
          <Text style={s.sectionCount}>
            {completedTasks}/{totalTasks}
          </Text>
        </View>

        {totalTasks === 0 ? (
          <View style={s.emptyCard}>
            <Ionicons
              name="checkbox-outline"
              size={32}
              color={colors.textMuted}
            />
            <Text style={s.emptyText}>No tasks for today</Text>
            <Text style={s.emptySubtext}>
              Add up to 3 focus tasks in the Manage tab
            </Text>
          </View>
        ) : (
          <View style={s.listCard}>
            {snapshot?.tasks.map((task, i) => (
              <Pressable
                key={task.id}
                style={[s.row, i > 0 && s.rowBorder]}
                onPress={() => handleTaskComplete(task)}
                disabled={task.status === "completed" || completeTask.isPending}
              >
                <Checkbox
                  checked={task.status === "completed"}
                  checkmarkColor={colors.accent}
                  size={24}
                  showBorder
                  stroke={2}
                />
                <View style={s.rowContent}>
                  <Text
                    style={[
                      s.rowTitle,
                      task.status === "completed" && s.rowTitleDone,
                    ]}
                  >
                    {task.title}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
  },

  // Header
  header: {
    marginBottom: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
  },
  dateText: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 2,
  },

  // XP Card
  xpCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 24,
  },
  xpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  levelBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  levelText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  xpAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.xp,
  },
  xpTotal: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.textMuted,
  },
  totalXp: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
  },

  // Sections
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },

  // List card container
  listCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: "hidden",
  },

  // Rows
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    color: colors.text,
  },
  rowTitleDone: {
    color: colors.textMuted,
    textDecorationLine: "line-through",
  },

  // Checkboxes
  checkbox: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.textMuted,
  },
  checkboxCircle: {
    borderRadius: 12,
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },

  // Streak badge
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  streakText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.streak,
  },

  // Empty state
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 32,
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textMuted,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
  },
});
