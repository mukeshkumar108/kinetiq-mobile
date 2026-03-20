import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { useMe } from "@/modules/auth/hooks";
import { useToday } from "@/modules/today/hooks";
import { StateCard } from "@/shared/ui/feedback/StateCard";
import { BottomSheet } from "@/shared/ui/feedback/BottomSheet";
import { SuccessSheet } from "@/shared/ui/feedback/SuccessSheet";
import {
  useCompleteHabit,
  useCreateHabit,
  useUncompleteHabit,
  useUpdateHabit,
} from "@/modules/habits/hooks";
import {
  useCompleteTask,
  useCreateTask,
  useReopenTask,
  useUpdateTask,
} from "@/modules/tasks/hooks";
import type {
  HabitCompletionResult,
  HabitUncompleteResult,
} from "@/modules/habits/types";
import type { TaskCompletionResult } from "@/modules/tasks/types";
import type { TodayHabit, TodayTask } from "@/modules/today/types";

const page = {
  bg: "#06070A",
  bgTop: "#11141C",
  text: "#F7F8FA",
  textSoft: "#AAB2C8",
  panel: "rgba(16, 19, 28, 0.9)",
  panelBorder: "rgba(255,255,255,0.08)",
  accent: "#FF6BD6",
  mint: "#57E6A8",
  mintDark: "#153E31",
  blue: "#5B8CFF",
  lilac: "#A871FF",
  yellow: "#FFCD57",
  peach: "#FF905C",
  shadow: "rgba(0, 0, 0, 0.28)",
};

const habitPalette = [
  ["#16294A", "#244A88"],
  ["#2A1A46", "#5F34A2"],
  ["#372715", "#7A5523"],
  ["#102E28", "#1A5C4D"],
  ["#3B1D18", "#8E4130"],
] as const;

type SurfaceTab = "habits" | "tasks";
type SheetKind = "habit" | "task";

type RewardState = {
  emoji: string;
  title: string;
  subtitle: string;
  meta?: string;
} | null;

type DraftTarget =
  | { kind: "habit"; id?: string }
  | { kind: "task"; id?: string };

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = useToday(timezone);
  const me = useMe();
  const completeHabit = useCompleteHabit();
  const uncompleteHabit = useUncompleteHabit();
  const updateHabit = useUpdateHabit();
  const completeTask = useCompleteTask();
  const reopenTask = useReopenTask();
  const createHabit = useCreateHabit();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const [surfaceTab, setSurfaceTab] = useState<SurfaceTab>("habits");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetKind, setSheetKind] = useState<SheetKind>("habit");
  const [sheetTitle, setSheetTitle] = useState("");
  const [draftTarget, setDraftTarget] = useState<DraftTarget>({ kind: "habit" });
  const [reward, setReward] = useState<RewardState>(null);
  const [isManualRefresh, setIsManualRefresh] = useState(false);

  const snapshot = today.data;
  const habits = snapshot?.habits ?? [];
  const tasks = snapshot?.tasks ?? [];
  const habitMutationPending =
    completeHabit.isPending || uncompleteHabit.isPending;

  const name =
    me.data?.profile.firstName ||
    me.data?.profile.displayName ||
    me.data?.profile.username ||
    "there";

  const completedHabits = habits.filter((habit) => habit.completedToday).length;
  const pendingHabits = habits.filter((habit) => !habit.completedToday);
  const openTasks = tasks.filter((task) => task.status === "open");
  const totalDoneDays = Math.max(...habits.map((habit) => habit.streak.current), 0);

  const heroCopy = useMemo(() => {
    const habitCount = pendingHabits.length;
    const taskCount = openTasks.length;
    const thingText = habitCount === 1 ? "1 thing" : `${habitCount} things`;
    const taskText = taskCount === 1 ? "1 task to clear" : `${taskCount} tasks to clear`;

    if (habits.length === 0) {
      return {
        title: `${getGreeting()}, ${name}.`,
      };
    }

    if (habitCount === 0 && taskCount === 0) {
      return {
        title: `${getGreeting()}, ${name}. You won the day.`,
      };
    }

    if (habitCount > 0 && taskCount === 0) {
      return {
        title: `${getGreeting()}, ${name}. Today, just ${thingText} to win your day.`,
      };
    }

    if (habitCount === 0 && taskCount > 0) {
      return {
        title: `${getGreeting()}, ${name}. You've got ${taskCount === 1 ? "1 carried-over task" : `${taskCount} carried-over tasks`}.`,
      };
    }

    return {
      title: `${getGreeting()}, ${name}. Today, ${thingText} and ${taskText}.`,
    };
  }, [habits.length, name, openTasks.length, pendingHabits.length]);

  const progressMicrocopy = useMemo(() => {
    if (totalDoneDays <= 0) {
      return "Today is a good day to begin.";
    }
    if (totalDoneDays === 1) {
      return "You've shown up for 1 day. Keep it going.";
    }
    if (totalDoneDays < 7) {
      return `You've shown up for ${totalDoneDays} days and counting.`;
    }
    return `You've shown up for ${totalDoneDays} days. That's real momentum.`;
  }, [totalDoneDays]);

  const showReward = useCallback((next: RewardState) => {
    setReward(next);
  }, []);

  const handleHabitCompletion = useCallback(
    (result: HabitCompletionResult, habit: TodayHabit) => {
      showReward({
        emoji: "🔥",
        title: "Habit locked in",
        subtitle:
          result.unlockedAchievements[0]?.title ??
          `${habit.title} is complete for today.`,
        meta:
          result.streak.current > 0
            ? `${result.streak.current} day streak alive`
            : undefined,
      });
    },
    [showReward],
  );

  const handleHabitUndo = useCallback(
    (_result: HabitUncompleteResult, habit: TodayHabit) => {
      showReward({
        emoji: "↩️",
        title: "Habit reopened",
        subtitle: `${habit.title} is back on your list.`,
      });
    },
    [showReward],
  );

  const handleTaskCompletion = useCallback(
    (result: TaskCompletionResult, task: TodayTask) => {
      showReward({
        emoji: "🎯",
        title: "Task cleared",
        subtitle:
          result.unlockedAchievements[0]?.title ?? `${task.title} is out of the way.`,
      });
    },
    [showReward],
  );

  const handleTaskReopen = useCallback((task: TodayTask) => {
    showReward({
      emoji: "↩️",
      title: "Task reopened",
      subtitle: `${task.title} is back on your list.`,
    });
  }, [showReward]);

  const handleHabitToggle = useCallback(
    (habit: TodayHabit) => {
      if (habitMutationPending) return;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (habit.completedToday) {
        uncompleteHabit.mutate(
          { id: habit.id, input: { timezone } },
          { onSuccess: (result) => handleHabitUndo(result, habit) },
        );
        return;
      }

      completeHabit.mutate(
        { id: habit.id, input: { timezone } },
        { onSuccess: (result) => handleHabitCompletion(result, habit) },
      );
    },
    [
      completeHabit,
      habitMutationPending,
      handleHabitCompletion,
      handleHabitUndo,
      timezone,
      uncompleteHabit,
    ],
  );

  const handleTaskToggle = useCallback(
    (task: TodayTask) => {
      if (task.status === "completed") {
        if (reopenTask.isPending) return;
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        reopenTask.mutate(task.id, {
          onSuccess: () => handleTaskReopen(task),
        });
        return;
      }

      if (completeTask.isPending) return;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      completeTask.mutate(task.id, {
        onSuccess: (result) => handleTaskCompletion(result, task),
      });
    },
    [completeTask, handleTaskCompletion, handleTaskReopen, reopenTask],
  );

  const handleQuickAdd = useCallback(() => {
    const title = sheetTitle.trim();
    if (!title) return;

    if (draftTarget.kind === "habit" && draftTarget.id) {
      updateHabit.mutate(
        { id: draftTarget.id, input: { title } },
        {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setSheetTitle("");
            setSheetOpen(false);
            setDraftTarget({ kind: "habit" });
          },
        },
      );
      return;
    }

    if (draftTarget.kind === "task" && draftTarget.id) {
      updateTask.mutate(
        { id: draftTarget.id, input: { title } },
        {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setSheetTitle("");
            setSheetOpen(false);
            setDraftTarget({ kind: "task" });
          },
        },
      );
      return;
    }

    if (sheetKind === "habit") {
      createHabit.mutate(
        { title },
        {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setSheetTitle("");
            setSheetOpen(false);
            setDraftTarget({ kind: "habit" });
          },
        },
      );
      return;
    }

    createTask.mutate(
      { title },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setSheetTitle("");
          setSheetOpen(false);
          setDraftTarget({ kind: "task" });
        },
      },
    );
  }, [
    createHabit,
    createTask,
    draftTarget,
    sheetKind,
    sheetTitle,
    updateHabit,
    updateTask,
  ]);

  const onRefresh = useCallback(() => {
    setIsManualRefresh(true);
    Promise.all([today.refetch(), me.refetch()]).finally(() => {
      setIsManualRefresh(false);
    });
  }, [me, today]);

  const openAddSheet = useCallback(
    (kind: SheetKind) => {
      setSheetKind(kind);
      setDraftTarget({ kind });
      setSheetTitle("");
      setSurfaceTab(kind === "habit" ? "habits" : "tasks");
      setSheetOpen(true);
    },
    [],
  );

  const openEditSheet = useCallback(
    (target: DraftTarget, title: string) => {
      setDraftTarget(target);
      setSheetKind(target.kind);
      setSurfaceTab(target.kind === "habit" ? "habits" : "tasks");
      setSheetTitle(title);
      setSheetOpen(true);
    },
    [],
  );

  const dateParts = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).split(", ");

  if (today.isLoading && !snapshot) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator color={page.text} size="large" />
      </View>
    );
  }

  if (today.isError && !snapshot) {
    return (
      <View style={s.loadingContainer}>
        <View style={s.content}>
          <StateCard
            icon="cloud-offline-outline"
            title="Home could not load"
            description="The board could not refresh right now. Pull to retry."
            actionLabel="Retry"
            onAction={onRefresh}
          />
        </View>
      </View>
    );
  }

  const isSubmitting =
    createHabit.isPending ||
    createTask.isPending ||
    updateHabit.isPending ||
    updateTask.isPending;

  const sheetTitleText = draftTarget.id
    ? sheetKind === "habit"
      ? "Edit habit"
      : "Edit task"
    : sheetKind === "habit"
      ? "New habit"
      : "New task";

  const sheetButtonText = draftTarget.id
    ? sheetKind === "habit"
      ? "Save habit"
      : "Save task"
    : sheetKind === "habit"
      ? "Add habit"
      : "Add task";

  return (
    <View style={s.screen}>
      <LinearGradient
        colors={[page.bgTop, page.bg]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        style={s.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.content,
          { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 110 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isManualRefresh}
            onRefresh={onRefresh}
            tintColor={page.text}
          />
        }
      >
        <View style={s.topBar}>
          <Pressable style={s.menuButton} onPress={() => router.push("/manage")}>
            <Ionicons name="menu" size={30} color={page.text} />
          </Pressable>
          <View style={s.dateBlock}>
            <Text style={s.dateWeekday}>{dateParts[0] ?? ""}</Text>
            <Text style={s.dateDay}>{dateParts[1] ?? ""}</Text>
          </View>
        </View>

        <View style={s.hero}>
          <Text style={s.heroTitle}>{heroCopy.title}</Text>
          <Text style={s.heroMicrocopy}>{progressMicrocopy}</Text>
        </View>

        <View style={s.switchRow}>
          <View style={s.segmented}>
            <Pressable
              style={[s.segment, surfaceTab === "habits" && s.segmentActive]}
              onPress={() => setSurfaceTab("habits")}
            >
              <Text
                style={[
                  s.segmentText,
                  surfaceTab === "habits" && s.segmentTextActive,
                ]}
              >
                Habits
              </Text>
            </Pressable>
            <Pressable
              style={[s.segment, surfaceTab === "tasks" && s.segmentActive]}
              onPress={() => setSurfaceTab("tasks")}
            >
              <Text
                style={[
                  s.segmentText,
                  surfaceTab === "tasks" && s.segmentTextActive,
                ]}
              >
                Tasks
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={s.addButton}
            onPress={() => openAddSheet(surfaceTab === "habits" ? "habit" : "task")}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {surfaceTab === "habits" ? (
          <View style={s.cardColumn}>
            {habits.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyTitle}>No habits yet</Text>
                <Text style={s.emptyText}>
                  Start with one or two. This app should feel focused, not crowded.
                </Text>
                <Pressable style={s.emptyAction} onPress={() => openAddSheet("habit")}>
                  <Text style={s.emptyActionText}>Add your first habit</Text>
                </Pressable>
              </View>
            ) : (
              habits.map((habit, index) => (
                <Pressable
                  key={habit.id}
                  style={s.habitCardPressable}
                  onPress={() => handleHabitToggle(habit)}
                  onLongPress={() => openEditSheet({ kind: "habit", id: habit.id }, habit.title)}
                  disabled={habitMutationPending}
                >
                  <LinearGradient
                    colors={
                      habit.completedToday
                        ? ["#143126", "#1F4D3B"]
                        : habitPalette[index % habitPalette.length]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={s.habitCard}
                  >
                    <View style={s.cardTop}>
                      <Text style={s.cardTitle}>{habit.title}</Text>
                      <View style={s.metricCluster}>
                        <View style={s.metricInline}>
                          <Ionicons name="flash" size={13} color={page.text} />
                          <Text style={s.metricInlineText}>{habit.streak.current}</Text>
                        </View>
                        <View style={s.metricInline}>
                          <Ionicons name="flame" size={13} color={page.text} />
                          <Text style={s.metricInlineText}>{habit.streak.longest}</Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </Pressable>
              ))
            )}
          </View>
        ) : (
          <View style={s.cardColumn}>
            {tasks.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyTitle}>No tasks right now</Text>
                <Text style={s.emptyText}>
                  Keep tasks secondary. Habits are the main loop here.
                </Text>
                <Pressable style={s.emptyAction} onPress={() => openAddSheet("task")}>
                  <Text style={s.emptyActionText}>Add a task</Text>
                </Pressable>
              </View>
            ) : (
              tasks.map((task) => (
                <Pressable
                  key={task.id}
                  style={[s.taskCard, task.status === "completed" && s.taskCardDone]}
                  onPress={() => handleTaskToggle(task)}
                  onLongPress={() => openEditSheet({ kind: "task", id: task.id }, task.title)}
                  disabled={completeTask.isPending || reopenTask.isPending}
                >
                  <View style={s.taskCheck}>
                    <Ionicons
                      name={task.status === "completed" ? "checkmark-circle" : "ellipse"}
                      size={18}
                      color={page.text}
                    />
                  </View>
                  <View style={s.taskCopy}>
                    <Text style={s.taskTitle}>{task.title}</Text>
                    <Text style={s.taskSubtitle}>
                      {task.status === "completed"
                        ? "Completed. Tap to reopen if that was accidental"
                        : "Secondary to habits, but still here when needed"}
                    </Text>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Reward bottom sheet */}
      <BottomSheet
        visible={reward !== null}
        onDismiss={() => setReward(null)}
      >
        {reward && (
          <SuccessSheet
            emoji={reward.emoji}
            title={reward.title}
            subtitle={reward.subtitle}
            meta={reward.meta}
          />
        )}
      </BottomSheet>

      {/* Add / Edit bottom sheet */}
      <BottomSheet
        visible={sheetOpen}
        onDismiss={() => setSheetOpen(false)}
        title={sheetTitleText}
      >
        <Text style={s.sheetSubtitle}>
          {draftTarget.id
            ? "Keep the wording simple and something you would actually do."
            : sheetKind === "habit"
              ? "Keep it small enough to actually repeat."
              : "Useful, but still secondary to your habit loop."}
        </Text>
        <TextInput
          style={s.sheetInput}
          placeholder={
            sheetKind === "habit"
              ? "Walk outside for 10 mins"
              : "Send the proposal"
          }
          placeholderTextColor={page.textSoft}
          value={sheetTitle}
          onChangeText={setSheetTitle}
          returnKeyType="done"
          editable={!isSubmitting}
          onSubmitEditing={handleQuickAdd}
        />
        <Pressable
          style={[s.sheetAction, (!sheetTitle.trim() || isSubmitting) && s.sheetActionDisabled]}
          onPress={handleQuickAdd}
          disabled={!sheetTitle.trim() || isSubmitting}
        >
          <Text style={s.sheetActionText}>
            {isSubmitting ? "Saving..." : sheetButtonText}
          </Text>
        </Pressable>
      </BottomSheet>
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: page.bg,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 22,
    gap: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: page.bg,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  dateBlock: {
    alignItems: "flex-end",
    gap: 2,
    paddingTop: 12,
  },
  dateWeekday: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "600",
    letterSpacing: -0.3,
    color: page.text,
  },
  dateDay: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: -0.1,
    color: page.textSoft,
  },
  menuButton: {
    paddingTop: 8,
    paddingRight: 2,
    paddingBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    paddingTop: 46,
    paddingRight: 16,
  },
  heroTitle: {
    fontSize: 32,
    lineHeight: 35,
    fontWeight: "600",
    letterSpacing: -0.72,
    color: page.text,
  },
  heroMicrocopy: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 18,
    color: page.textSoft,
  },
  switchRow: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  segmented: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  segment: {
    paddingBottom: 7,
  },
  segmentActive: {
    borderBottomWidth: 2,
    borderBottomColor: page.mint,
  },
  segmentText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6D768F",
  },
  segmentTextActive: {
    color: page.text,
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: page.mint,
    shadowColor: page.shadow,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
  },
  cardColumn: {
    gap: 16,
  },
  habitCardPressable: {
    borderRadius: 26,
  },
  habitCard: {
    minHeight: 94,
    borderRadius: 26,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: page.shadow,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  cardTop: {
    gap: 8,
  },
  cardTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600",
    color: page.text,
    paddingRight: 20,
  },
  metricCluster: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 2,
  },
  metricInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    opacity: 0.5,
  },
  metricInlineText: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(247,248,250,0.58)",
  },
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 17,
    backgroundColor: page.panel,
    borderWidth: 1,
    borderColor: page.panelBorder,
    shadowColor: page.shadow,
    shadowOpacity: 0.65,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  taskCardDone: {
    backgroundColor: "rgba(24, 45, 36, 0.95)",
  },
  taskCheck: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  taskCopy: {
    flex: 1,
    gap: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: page.text,
  },
  taskSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: page.textSoft,
  },
  emptyCard: {
    borderRadius: 24,
    padding: 22,
    backgroundColor: page.panel,
    borderWidth: 1,
    borderColor: page.panelBorder,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: page.text,
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 21,
    color: page.textSoft,
  },
  emptyAction: {
    marginTop: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: page.mint,
  },
  emptyActionText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#08110D",
  },

  // Reward sheet content
  rewardBody: {
    gap: 8,
  },
  rewardSubtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: page.textSoft,
  },
  rewardMeta: {
    fontSize: 15,
    fontWeight: "700",
    color: page.mint,
  },

  // Add/edit sheet
  sheetSubtitle: {
    fontSize: 15,
    lineHeight: 21,
    color: page.textSoft,
    marginBottom: 16,
  },
  sheetInput: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: page.text,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 20,
  },
  sheetAction: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: page.mint,
  },
  sheetActionDisabled: {
    opacity: 0.4,
  },
  sheetActionText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#08110D",
  },
});
