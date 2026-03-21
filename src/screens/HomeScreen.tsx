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

import { useMe } from "@/modules/auth/hooks";
import { useToday } from "@/modules/today/hooks";
import { useProgression } from "@/modules/progression/hooks";
import { color, font, space, radius, cardShadow, CONTENT_PADDING } from "@/shared/theme/tokens";
import { PressableScale } from "@/shared/ui/PressableScale";
import { StateCard } from "@/shared/ui/feedback/StateCard";
import { BottomSheet } from "@/shared/ui/feedback/BottomSheet";
import { SuccessSheet } from "@/shared/ui/feedback/SuccessSheet";
import { Toast } from "@/shared/ui/molecules/Toast";
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
import type { TodayHabit, TodayTask } from "@/modules/today/types";

type SurfaceTab = "habits" | "tasks";
type SheetKind = "habit" | "task";

type RewardState = {
  emoji: string;
  title: string;
  subtitle: string;
  meta?: string;
  points?: number;
} | null;

type DraftTarget =
  | { kind: "habit"; id?: string }
  | { kind: "task"; id?: string };

const IDENTITY_CHIPS = [
  "Takes care of their body",
  "Stays focused and clear",
  "Stays calm under pressure",
  "Keeps learning and growing",
];

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
  const progression = useProgression();
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
  const [habitAction, setHabitAction] = useState("");
  const [selectedIdentity, setSelectedIdentity] = useState<string | null>(null);

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

  const summary = useMemo(() => {
    const parts: string[] = [];
    if (pendingHabits.length > 0)
      parts.push(`${pendingHabits.length} habit${pendingHabits.length > 1 ? "s" : ""}`);
    if (openTasks.length > 0)
      parts.push(`${openTasks.length} task${openTasks.length > 1 ? "s" : ""}`);
    if (parts.length === 0) return "All done for today";
    return `${parts.join(" \u00b7 ")} to go`;
  }, [pendingHabits.length, openTasks.length]);

  const showReward = useCallback((next: RewardState) => {
    setReward(next);
  }, []);

  const handleHabitToggle = useCallback(
    (habit: TodayHabit) => {
      if (habitMutationPending) return;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (habit.completedToday) {
        showReward({
          emoji: "↩️",
          title: "Habit reopened",
          subtitle: `${habit.title} is back on your list.`,
        });
        uncompleteHabit.mutate(
          { id: habit.id, input: { timezone } },
          { onError: () => Toast.show("Couldn't undo habit. Try again.", { type: "error" }) },
        );
        return;
      }

      const newStreak = habit.streak.current + 1;
      showReward({
        emoji: "🔥",
        title: "Habit locked in",
        subtitle: `${habit.title} is complete for today.`,
        meta: newStreak > 0 ? `${newStreak} day streak alive` : undefined,
        points: 10,
      });
      completeHabit.mutate(
        { id: habit.id, input: { timezone } },
        { onError: () => Toast.show("Couldn't save habit. Try again.", { type: "error" }) },
      );
    },
    [completeHabit, habitMutationPending, showReward, timezone, uncompleteHabit],
  );

  const handleTaskToggle = useCallback(
    (task: TodayTask) => {
      if (task.status === "completed") {
        if (reopenTask.isPending) return;
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        showReward({
          emoji: "↩️",
          title: "Task reopened",
          subtitle: `${task.title} is back on your list.`,
        });
        reopenTask.mutate(task.id, {
          onError: () => Toast.show("Couldn't reopen task. Try again.", { type: "error" }),
        });
        return;
      }

      if (completeTask.isPending) return;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      showReward({
        emoji: "🎯",
        title: "Task cleared",
        subtitle: `${task.title} is out of the way.`,
        points: 25,
      });
      completeTask.mutate(task.id, {
        onError: () => Toast.show("Couldn't complete task. Try again.", { type: "error" }),
      });
    },
    [completeTask, reopenTask, showReward],
  );

  const handleQuickAdd = useCallback(() => {
    if (sheetKind === "habit") {
      const title = habitAction.trim();
      if (!title) return;
      const onSuccess = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setHabitAction("");
        setSelectedIdentity(null);
        setSheetOpen(false);
        setDraftTarget({ kind: "habit" });
      };
      const onError = () => Toast.show("Couldn't save habit. Try again.", { type: "error" });
      if (draftTarget.id) {
        updateHabit.mutate({ id: draftTarget.id, input: { title } }, { onSuccess, onError });
      } else {
        createHabit.mutate({ title }, { onSuccess, onError });
      }
      return;
    }

    const title = sheetTitle.trim();
    if (!title) return;
    const onSuccess = () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSheetTitle("");
      setSheetOpen(false);
      setDraftTarget({ kind: "task" });
    };
    const onError = () => Toast.show("Couldn't save task. Try again.", { type: "error" });
    if (draftTarget.id) {
      updateTask.mutate({ id: draftTarget.id, input: { title } }, { onSuccess, onError });
    } else {
      createTask.mutate({ title }, { onSuccess, onError });
    }
  }, [
    habitAction,
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
    Promise.all([today.refetch(), me.refetch(), progression.refetch()]).finally(() => {
      setIsManualRefresh(false);
    });
  }, [me, today, progression]);

  const openAddSheet = useCallback(
    (kind: SheetKind) => {
      setSheetKind(kind);
      setDraftTarget({ kind });
      setSheetTitle("");
      setHabitAction("");
      setSelectedIdentity(null);
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
      if (target.kind === "habit") {
        setHabitAction(title);
        setSelectedIdentity(null);
      } else {
        setSheetTitle(title);
      }
      setSheetOpen(true);
    },
    [],
  );

  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  if (today.isLoading && !snapshot) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator color={color.text} size="large" />
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

  return (
    <View style={s.screen}>
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
            tintColor={color.text}
          />
        }
      >
        {/* Menu */}
        <Pressable style={s.menuButton} onPress={() => router.push("/manage")}>
          <Ionicons name="menu" size={26} color={color.text} />
        </Pressable>

        {/* Date + level */}
        <View style={s.infoStrip}>
          <Text style={s.dateText}>{dateStr}</Text>
          {progression.data ? (
            <View style={s.levelBadge}>
              <Ionicons name="flash" size={12} color={color.cyan} />
              <Text style={s.levelText}>
                Level {progression.data.level}
                <Text style={s.levelXp}> · {progression.data.currentLevelXp} XP</Text>
              </Text>
            </View>
          ) : null}
        </View>

        {/* Compact greeting */}
        <View style={s.greeting}>
          <Text style={s.greetingTitle}>{getGreeting()}, {name}.</Text>
          <Text style={s.greetingSummary}>{summary}</Text>
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

          <PressableScale
            style={s.addButton}
            onPress={() => openAddSheet(surfaceTab === "habits" ? "habit" : "task")}
            scale={0.9}
          >
            <Ionicons name="add" size={24} color={color.textInverse} />
          </PressableScale>
        </View>

        {surfaceTab === "habits" ? (
          <View style={s.cardColumn}>
            {habits.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyTitle}>No habits yet</Text>
                <Text style={s.emptyText}>
                  Start with one or two. This app should feel focused, not crowded.
                </Text>
                <PressableScale style={s.emptyAction} onPress={() => openAddSheet("habit")}>
                  <Text style={s.emptyActionText}>Add your first habit</Text>
                </PressableScale>
              </View>
            ) : (
              habits.map((habit) => (
                <PressableScale
                  key={habit.id}
                  style={[
                    s.itemCard,
                    habit.completedToday && s.itemCardDone,
                  ]}
                  onPress={() => handleHabitToggle(habit)}
                  onLongPress={() => openEditSheet({ kind: "habit", id: habit.id }, habit.title)}
                  disabled={habitMutationPending}
                >
                  <View style={[s.leadingOrb, habit.completedToday && s.leadingOrbDone]}>
                    {habit.completedToday ? (
                      <Ionicons name="checkmark" size={16} color={color.text} />
                    ) : (
                      <Ionicons name="flash" size={14} color={color.cyan} />
                    )}
                  </View>
                  <View style={s.rowContent}>
                    <Text style={[s.rowTitle, habit.completedToday && s.rowTitleDone]}>
                      {habit.title}
                    </Text>
                    <Text style={s.rowSubtitle}>
                      {habit.completedToday
                        ? "Done for today"
                        : habit.streak.current > 0
                          ? `${habit.streak.current} day streak`
                          : ""}
                    </Text>
                  </View>
                  <View style={s.rowMeta}>
                    {habit.streak.current > 0 ? (
                      <View style={s.streakBadge}>
                        <Ionicons name="flame" size={12} color={color.ember} />
                        <Text style={s.streakText}>{habit.streak.current}</Text>
                      </View>
                    ) : null}
                    <Ionicons name="pencil-outline" size={13} color={color.textTertiary} style={s.editHint} />
                  </View>
                </PressableScale>
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
                <PressableScale style={s.emptyAction} onPress={() => openAddSheet("task")}>
                  <Text style={s.emptyActionText}>Add a task</Text>
                </PressableScale>
              </View>
            ) : (
              tasks.map((task) => (
                <PressableScale
                  key={task.id}
                  style={[
                    s.itemCard,
                    task.status === "completed" && s.itemCardDone,
                  ]}
                  onPress={() => handleTaskToggle(task)}
                  onLongPress={() => openEditSheet({ kind: "task", id: task.id }, task.title)}
                  disabled={completeTask.isPending || reopenTask.isPending}
                >
                  <View style={s.taskCheckbox}>
                    <Ionicons
                      name={task.status === "completed" ? "checkmark-circle" : "ellipse"}
                      size={20}
                      color={task.status === "completed" ? color.mint : color.cyan}
                    />
                  </View>
                  <View style={s.rowContent}>
                    <Text style={[s.rowTitle, task.status === "completed" && s.rowTitleDone]}>
                      {task.title}
                    </Text>
                    {task.status === "completed" ? (
                      <Text style={s.rowSubtitle}>Done</Text>
                    ) : null}
                  </View>
                  <Ionicons name="pencil-outline" size={13} color={color.textTertiary} />
                </PressableScale>
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
            points={reward.points}
          />
        )}
      </BottomSheet>

      {/* Add / Edit bottom sheet */}
      <BottomSheet
        visible={sheetOpen}
        onDismiss={() => setSheetOpen(false)}
        title={sheetTitleText}
      >
        {sheetKind === "habit" ? (
          <>
            {!draftTarget.id && (
              <>
                <Text style={s.identityPrompt}>
                  I'm becoming someone who...
                </Text>
                <View style={s.chipRow}>
                  {IDENTITY_CHIPS.map((chip) => (
                    <PressableScale
                      key={chip}
                      style={[
                        s.chip,
                        selectedIdentity === chip && s.chipSelected,
                      ]}
                      onPress={() =>
                        setSelectedIdentity(
                          selectedIdentity === chip ? null : chip,
                        )
                      }
                    >
                      <Text
                        style={[
                          s.chipText,
                          selectedIdentity === chip && s.chipTextSelected,
                        ]}
                      >
                        {chip}
                      </Text>
                    </PressableScale>
                  ))}
                </View>
              </>
            )}
            <Text style={s.actionPrompt}>
              {draftTarget.id
                ? "Habit name"
                : "What's one thing that person does every day?"}
            </Text>
            <TextInput
              style={s.sheetInput}
              placeholder="Walk outside for 30 minutes"
              placeholderTextColor={color.textTertiary}
              value={habitAction}
              onChangeText={setHabitAction}
              returnKeyType="done"
              editable={!isSubmitting}
              onSubmitEditing={handleQuickAdd}
            />
            <Pressable
              style={[
                s.sheetAction,
                (!habitAction.trim() || isSubmitting) && s.sheetActionDisabled,
              ]}
              onPress={handleQuickAdd}
              disabled={!habitAction.trim() || isSubmitting}
            >
              <Text style={s.sheetActionText}>
                {isSubmitting
                  ? "Saving..."
                  : draftTarget.id
                    ? "Save habit"
                    : "Add habit"}
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={s.sheetSubtitle}>
              {draftTarget.id
                ? "Keep the wording simple and something you would actually do."
                : "Useful, but still secondary to your habit loop."}
            </Text>
            <TextInput
              style={s.sheetInput}
              placeholder="Send the proposal"
              placeholderTextColor={color.textSecondary}
              value={sheetTitle}
              onChangeText={setSheetTitle}
              returnKeyType="done"
              editable={!isSubmitting}
              onSubmitEditing={handleQuickAdd}
            />
            <Pressable
              style={[
                s.sheetAction,
                (!sheetTitle.trim() || isSubmitting) && s.sheetActionDisabled,
              ]}
              onPress={handleQuickAdd}
              disabled={!sheetTitle.trim() || isSubmitting}
            >
              <Text style={s.sheetActionText}>
                {isSubmitting
                  ? "Saving..."
                  : draftTarget.id
                    ? "Save task"
                    : "Add task"}
              </Text>
            </Pressable>
          </>
        )}
      </BottomSheet>
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
  content: {
    paddingHorizontal: CONTENT_PADDING,
    gap: space.xl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color.bg,
  },

  // Top
  menuButton: {
    alignSelf: "flex-start",
    padding: space.xs,
  },
  infoStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateText: {
    ...font.body,
    color: color.textSecondary,
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.full,
    backgroundColor: color.cyanMuted,
  },
  levelText: {
    ...font.label,
    fontWeight: "700",
    color: color.text,
  },
  levelXp: {
    fontWeight: "500",
    color: color.textSecondary,
  },

  // Greeting
  greeting: {
    gap: space.xs,
  },
  greetingTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "600",
    letterSpacing: -0.4,
    color: color.text,
  },
  greetingSummary: {
    ...font.caption,
  },

  // Tabs
  switchRow: {
    marginTop: space.xs,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  segmented: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xl,
  },
  segment: {
    paddingBottom: space.sm,
  },
  segmentActive: {
    borderBottomWidth: 2,
    borderBottomColor: color.mint,
  },
  segmentText: {
    ...font.body,
    fontWeight: "600",
    color: color.textTertiary,
  },
  segmentTextActive: {
    color: color.text,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color.mint,
    ...cardShadow,
  },

  // Cards
  cardColumn: {
    gap: space.md,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.lg,
    borderRadius: radius.xl,
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    backgroundColor: color.bgCard,
    borderWidth: 1,
    borderColor: color.border,
    ...cardShadow,
  },
  itemCardDone: {
    backgroundColor: "rgba(16, 25, 21, 0.92)",
  },
  leadingOrb: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: color.cyanMuted,
  },
  leadingOrbDone: {
    backgroundColor: color.mintMuted,
  },
  taskCheckbox: {
    width: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: {
    flex: 1,
    gap: space.xs,
  },
  rowTitle: {
    ...font.body,
    fontWeight: "600",
  },
  rowTitleDone: {
    color: color.textSecondary,
  },
  rowSubtitle: {
    ...font.label,
  },
  rowMeta: {
    alignItems: "flex-end",
    gap: space.xs,
  },
  editHint: {
    marginTop: space.xs,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: radius.full,
    backgroundColor: color.emberMuted,
  },
  streakText: {
    ...font.label,
    color: color.emberSoft,
  },

  // Empty states
  emptyCard: {
    borderRadius: radius.xl,
    padding: space.xl,
    backgroundColor: color.bgCard,
    borderWidth: 1,
    borderColor: color.border,
    gap: space.md,
  },
  emptyTitle: {
    ...font.headline,
  },
  emptyText: {
    ...font.caption,
    lineHeight: 22,
  },
  emptyAction: {
    marginTop: space.xs,
    alignSelf: "flex-start",
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.full,
    backgroundColor: color.mint,
  },
  emptyActionText: {
    ...font.caption,
    fontWeight: "700",
    color: color.textInverse,
  },

  // Identity chips
  identityPrompt: {
    ...font.headline,
    marginBottom: space.lg,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
    marginBottom: space["2xl"],
  },
  chip: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.divider,
  },
  chipSelected: {
    borderColor: color.mint,
    backgroundColor: color.mintMuted,
  },
  chipText: {
    ...font.caption,
    color: color.textSecondary,
  },
  chipTextSelected: {
    color: color.mint,
    fontWeight: "600",
  },
  actionPrompt: {
    ...font.caption,
    fontWeight: "600",
    color: color.textSecondary,
    marginBottom: space.md,
  },

  // Sheet form
  sheetSubtitle: {
    ...font.caption,
    marginBottom: space.lg,
  },
  sheetInput: {
    borderRadius: radius.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    fontSize: 16,
    color: color.text,
    backgroundColor: color.divider,
    borderWidth: 1,
    borderColor: color.border,
    marginBottom: space.xl,
  },
  sheetAction: {
    borderRadius: radius.lg,
    paddingVertical: space.lg,
    alignItems: "center",
    backgroundColor: color.mint,
  },
  sheetActionDisabled: {
    opacity: 0.4,
  },
  sheetActionText: {
    ...font.body,
    fontWeight: "700",
    color: color.textInverse,
  },
});
