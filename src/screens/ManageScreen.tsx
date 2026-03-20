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
import { colors } from "@/shared/theme/colors";
import { StateCard } from "@/shared/ui/feedback/StateCard";
import { BottomSheet } from "@/shared/ui/feedback/BottomSheet";

const MAX_OPEN_TASKS = 3;

export function ManageScreen() {
  const insets = useSafeAreaInsets();

  // Data
  const habitsQuery = useHabits(true);
  const tasksQuery = useTasks("open");

  // Mutations
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();

  // Bottom sheet state
  const [addSheet, setAddSheet] = useState<"habit" | "task" | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [isManualRefresh, setIsManualRefresh] = useState(false);

  // Derived data
  const allHabits = habitsQuery.data ?? [];
  const activeHabits = allHabits.filter((h) => !h.isArchived);
  const archivedHabits = allHabits.filter((h) => h.isArchived);
  const openTasks = tasksQuery.data ?? [];
  const atTaskLimit = openTasks.length >= MAX_OPEN_TASKS;

  // Handlers
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
        },
      );
    }
  }, [inputValue, addSheet, createHabit, createTask]);

  const handleArchiveHabit = useCallback(
    (habit: Habit) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      updateHabit.mutate({
        id: habit.id,
        input: { isArchived: !habit.isArchived },
      });
    },
    [updateHabit],
  );

  const handleDeleteTask = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      deleteTask.mutate(id);
    },
    [deleteTask],
  );

  const onRefresh = useCallback(() => {
    setIsManualRefresh(true);
    Promise.all([habitsQuery.refetch(), tasksQuery.refetch()]).finally(() => {
      setIsManualRefresh(false);
    });
  }, [habitsQuery, tasksQuery]);

  if (habitsQuery.isLoading && !habitsQuery.data) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator color={colors.accent} size="large" />
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
        contentContainerStyle={[s.content, { paddingTop: insets.top + 16 }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isManualRefresh}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        <Text style={s.heading}>Manage</Text>

        {/* ── Habits Section ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Habits</Text>
            <Text style={s.sectionCount}>{activeHabits.length}</Text>
          </View>

          <View style={s.listCard}>
            {/* Add row */}
            <Pressable
              style={s.addRow}
              onPress={() => setAddSheet("habit")}
            >
              <Ionicons name="add" size={20} color={colors.accent} />
              <Text style={s.addRowText}>New habit</Text>
            </Pressable>

            {/* Active habits */}
            {activeHabits.map((habit) => (
              <View key={habit.id} style={[s.row, s.rowBorder]}>
                <View style={s.rowContent}>
                  <Text style={s.rowTitle}>{habit.title}</Text>
                </View>
                {habit.streak.current > 0 && (
                  <View style={s.streakBadge}>
                    <Ionicons name="flame" size={14} color={colors.streak} />
                    <Text style={s.streakText}>{habit.streak.current}</Text>
                  </View>
                )}
                <Pressable
                  onPress={() => handleArchiveHabit(habit)}
                  hitSlop={8}
                  disabled={updateHabit.isPending}
                >
                  <Ionicons
                    name="archive-outline"
                    size={20}
                    color={colors.textMuted}
                  />
                </Pressable>
              </View>
            ))}
          </View>

          {/* Archived toggle */}
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
                  color={colors.textMuted}
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
                      <Pressable
                        onPress={() => handleArchiveHabit(habit)}
                        hitSlop={8}
                        disabled={updateHabit.isPending}
                      >
                        <Ionicons
                          name="arrow-undo-outline"
                          size={20}
                          color={colors.accent}
                        />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        {/* ── Tasks Section ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Tasks</Text>
            <Text style={s.sectionCount}>
              {openTasks.length}/{MAX_OPEN_TASKS}
            </Text>
          </View>

          <View style={s.listCard}>
            {/* Add row */}
            {atTaskLimit ? (
              <View style={s.addRow}>
                <Ionicons name="add" size={20} color={colors.textMuted} />
                <Text style={s.disabledText}>
                  {MAX_OPEN_TASKS}/{MAX_OPEN_TASKS} — focus on what you have
                </Text>
              </View>
            ) : (
              <Pressable
                style={s.addRow}
                onPress={() => setAddSheet("task")}
              >
                <Ionicons name="add" size={20} color={colors.accent} />
                <Text style={s.addRowText}>New task</Text>
              </Pressable>
            )}

            {/* Open tasks */}
            {openTasks.map((task) => (
              <View key={task.id} style={[s.row, s.rowBorder]}>
                <View style={s.rowContent}>
                  <Text style={s.rowTitle}>{task.title}</Text>
                </View>
                <Pressable
                  onPress={() => handleDeleteTask(task.id)}
                  hitSlop={8}
                  disabled={deleteTask.isPending}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={colors.danger}
                  />
                </Pressable>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Add bottom sheet */}
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
          placeholderTextColor={colors.textMuted}
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
    </>
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
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 24,
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

  // List card
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

  // Add row
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  addRowText: {
    fontSize: 16,
    color: colors.textMuted,
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

  // Archived
  archivedToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  archivedToggleText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  archivedText: {
    color: colors.textMuted,
  },

  // Disabled
  disabledText: {
    fontSize: 14,
    color: colors.textMuted,
  },

  // Bottom sheet form
  sheetInput: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 20,
  },
  sheetButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  sheetButtonDisabled: {
    opacity: 0.4,
  },
  sheetButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
});
