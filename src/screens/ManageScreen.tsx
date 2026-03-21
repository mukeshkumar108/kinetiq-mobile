import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import {
  useHabits,
  useCreateHabit,
  useUpdateHabit,
} from "@/modules/habits/hooks";
import {
  useTasks,
  useCreateTask,
  useDeleteTask,
} from "@/modules/tasks/hooks";
import type { Habit } from "@/modules/habits/types";
import { color, font, space, radius, CONTENT_PADDING, cardShadow } from "@/shared/theme/tokens";
import { PressableScale } from "@/shared/ui/PressableScale";
import { StateCard } from "@/shared/ui/feedback/StateCard";
import { BottomSheet } from "@/shared/ui/feedback/BottomSheet";
import { Toast } from "@/shared/ui/molecules/Toast";

export function ManageScreen() {
  const insets = useSafeAreaInsets();

  const habitsQuery = useHabits(true);
  const tasksQuery = useTasks("open");

  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();

  const [addSheet, setAddSheet] = useState<"habit" | "task" | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [isManualRefresh, setIsManualRefresh] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const allHabits = habitsQuery.data ?? [];
  const activeHabits = allHabits.filter((h) => !h.isArchived);
  const archivedHabits = allHabits.filter((h) => h.isArchived);
  const openTasks = tasksQuery.data ?? [];

  const dismissSheet = useCallback(() => {
    setAddSheet(null);
    setInputValue("");
  }, []);

  const handleSubmit = useCallback(() => {
    const title = inputValue.trim();
    if (!title) return;

    if (addSheet === "habit") {
      createHabit.mutate(
        { title },
        {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setInputValue("");
            setAddSheet(null);
          },
          onError: () => Toast.show("Couldn't add habit. Try again.", { type: "error" }),
        },
      );
    } else if (addSheet === "task") {
      createTask.mutate(
        { title },
        {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setInputValue("");
            setAddSheet(null);
          },
          onError: () => Toast.show("Couldn't add task. Try again.", { type: "error" }),
        },
      );
    }
  }, [inputValue, addSheet, createHabit, createTask]);

  const handleArchiveHabit = useCallback(
    (habit: Habit) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      updateHabit.mutate(
        { id: habit.id, input: { isArchived: !habit.isArchived } },
        { onError: () => Toast.show("Couldn't update habit. Try again.", { type: "error" }) },
      );
    },
    [updateHabit],
  );

  const handleDeleteTask = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setPendingDeleteId(id);
    },
    [],
  );

  const confirmDeleteTask = useCallback(() => {
    if (!pendingDeleteId) return;
    deleteTask.mutate(pendingDeleteId, {
      onSuccess: () => setPendingDeleteId(null),
      onError: () => {
        setPendingDeleteId(null);
        Toast.show("Couldn't delete task. Try again.", { type: "error" });
      },
    });
  }, [pendingDeleteId, deleteTask]);

  const onRefresh = useCallback(() => {
    setIsManualRefresh(true);
    Promise.all([habitsQuery.refetch(), tasksQuery.refetch()]).finally(() => {
      setIsManualRefresh(false);
    });
  }, [habitsQuery, tasksQuery]);

  if (habitsQuery.isLoading && !habitsQuery.data) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator color={color.mint} size="large" />
      </View>
    );
  }

  if ((habitsQuery.isError || tasksQuery.isError) && !habitsQuery.data && !tasksQuery.data) {
    return (
      <View style={s.loadingContainer}>
        <View style={s.content}>
          <StateCard
            icon="alert-circle-outline"
            title="Manage is unavailable"
            description="Habits or tasks failed to load. Retry once the backend is reachable again."
            actionLabel="Retry"
            onAction={onRefresh}
          />
        </View>
      </View>
    );
  }

  const isSubmitting = createHabit.isPending || createTask.isPending;

  return (
    <>
      <ScrollView
        style={s.container}
        contentContainerStyle={[s.content, { paddingTop: insets.top + space.lg }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isManualRefresh}
            onRefresh={onRefresh}
            tintColor={color.text}
          />
        }
      >
        <Text style={s.heading}>Manage</Text>

        {/* Habits */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Habits</Text>
            <Text style={s.sectionCount}>{activeHabits.length}</Text>
          </View>

          <View style={s.listCard}>
            <PressableScale
              style={s.addRow}
              onPress={() => setAddSheet("habit")}
            >
              <Ionicons name="add" size={20} color={color.mint} />
              <Text style={s.addRowText}>New habit</Text>
            </PressableScale>

            {activeHabits.map((habit) => (
              <View key={habit.id} style={[s.row, s.rowBorder]}>
                <View style={s.rowContent}>
                  <Text style={s.rowTitle}>{habit.title}</Text>
                </View>
                {habit.streak.current > 0 && (
                  <View style={s.streakBadge}>
                    <Ionicons name="flame" size={14} color={color.ember} />
                    <Text style={s.streakText}>{habit.streak.current}</Text>
                  </View>
                )}
                <PressableScale
                  onPress={() => handleArchiveHabit(habit)}
                  hitSlop={8}
                  disabled={updateHabit.isPending}
                >
                  <Ionicons
                    name="archive-outline"
                    size={20}
                    color={color.textSecondary}
                  />
                </PressableScale>
              </View>
            ))}
          </View>

          {archivedHabits.length > 0 && (
            <>
              <Pressable
                style={s.archivedToggle}
                onPress={() => setShowArchived((v) => !v)}
              >
                <Text style={s.archivedToggleText}>
                  {showArchived ? "Hide" : "Show"} archived ({archivedHabits.length})
                </Text>
                <Ionicons
                  name={showArchived ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={color.textSecondary}
                />
              </Pressable>

              {showArchived && (
                <View style={s.listCard}>
                  {archivedHabits.map((habit, i) => (
                    <View
                      key={habit.id}
                      style={[s.row, i > 0 && s.rowBorder]}
                    >
                      <View style={s.rowContent}>
                        <Text style={[s.rowTitle, s.archivedText]}>
                          {habit.title}
                        </Text>
                      </View>
                      <PressableScale
                        onPress={() => handleArchiveHabit(habit)}
                        hitSlop={8}
                        disabled={updateHabit.isPending}
                      >
                        <Ionicons
                          name="arrow-undo-outline"
                          size={20}
                          color={color.mint}
                        />
                      </PressableScale>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        {/* Tasks */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Tasks</Text>
            <Text style={s.sectionCount}>{openTasks.length}</Text>
          </View>

          <View style={s.listCard}>
            <PressableScale
              style={s.addRow}
              onPress={() => setAddSheet("task")}
            >
              <Ionicons name="add" size={20} color={color.mint} />
              <Text style={s.addRowText}>New task</Text>
            </PressableScale>

            {openTasks.map((task) => (
              <View key={task.id} style={[s.row, s.rowBorder]}>
                <View style={s.rowContent}>
                  <Text style={s.rowTitle}>{task.title}</Text>
                </View>
                <PressableScale
                  onPress={() => handleDeleteTask(task.id)}
                  hitSlop={8}
                  disabled={deleteTask.isPending}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={color.danger}
                  />
                </PressableScale>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: space["3xl"] }} />
      </ScrollView>

      <BottomSheet
        visible={addSheet !== null}
        onDismiss={dismissSheet}
        title={addSheet === "habit" ? "New habit" : "New task"}
      >
        <TextInput
          style={s.sheetInput}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder={addSheet === "habit" ? "Habit name" : "Task name"}
          placeholderTextColor={color.textSecondary}
          returnKeyType="done"
          editable={!isSubmitting}
          onSubmitEditing={handleSubmit}
        />
        <Pressable
          style={[s.sheetButton, (!inputValue.trim() || isSubmitting) && s.sheetButtonDisabled]}
          onPress={handleSubmit}
          disabled={!inputValue.trim() || isSubmitting}
        >
          <Text style={s.sheetButtonText}>
            {isSubmitting ? "Adding..." : "Add"}
          </Text>
        </Pressable>
      </BottomSheet>

      <BottomSheet
        visible={pendingDeleteId !== null}
        onDismiss={() => setPendingDeleteId(null)}
        title="Delete task?"
      >
        <Text style={s.confirmText}>
          This task will be permanently removed. This can't be undone.
        </Text>
        <Pressable
          style={[s.sheetButton, s.sheetButtonDanger, deleteTask.isPending && s.sheetButtonDisabled]}
          onPress={confirmDeleteTask}
          disabled={deleteTask.isPending}
        >
          <Text style={s.sheetButtonText}>
            {deleteTask.isPending ? "Deleting..." : "Delete"}
          </Text>
        </Pressable>
        <Pressable
          style={s.cancelButton}
          onPress={() => setPendingDeleteId(null)}
        >
          <Text style={s.cancelButtonText}>Cancel</Text>
        </Pressable>
      </BottomSheet>
    </>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bg,
  },
  content: {
    paddingHorizontal: CONTENT_PADDING,
    paddingBottom: space.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: color.bg,
  },
  heading: {
    ...font.display,
    marginBottom: space["2xl"],
  },

  section: {
    marginBottom: space.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: space.md,
  },
  sectionTitle: {
    ...font.headline,
    fontSize: 18,
  },
  sectionCount: {
    ...font.label,
  },

  listCard: {
    backgroundColor: color.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: color.border,
    overflow: "hidden",
    ...cardShadow,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: space.lg,
    gap: space.md,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: color.divider,
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    ...font.body,
  },

  addRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: space.lg,
    gap: space.md,
  },
  addRowText: {
    ...font.body,
    color: color.textSecondary,
  },

  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    backgroundColor: color.emberMuted,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: radius.sm,
  },
  streakText: {
    ...font.label,
    color: color.ember,
  },

  archivedToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
    paddingVertical: space.md,
  },
  archivedToggleText: {
    ...font.caption,
  },
  archivedText: {
    color: color.textSecondary,
  },

  sheetInput: {
    backgroundColor: color.divider,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.border,
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    fontSize: 16,
    color: color.text,
    marginBottom: space.xl,
  },
  sheetButton: {
    backgroundColor: color.mint,
    borderRadius: radius.lg,
    paddingVertical: space.lg,
    alignItems: "center",
  },
  sheetButtonDanger: {
    backgroundColor: color.danger,
  },
  sheetButtonDisabled: {
    opacity: 0.4,
  },
  sheetButtonText: {
    ...font.body,
    fontWeight: "700",
    color: color.textInverse,
  },
  confirmText: {
    ...font.caption,
    lineHeight: 22,
    marginBottom: space.xl,
  },
  cancelButton: {
    marginTop: space.md,
    paddingVertical: space.lg,
    alignItems: "center",
  },
  cancelButtonText: {
    ...font.body,
    color: color.textSecondary,
  },
});
