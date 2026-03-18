import { useState, useCallback, useRef } from "react";
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

  // Inline add state
  const [habitInputOpen, setHabitInputOpen] = useState(false);
  const [habitTitle, setHabitTitle] = useState("");
  const [taskInputOpen, setTaskInputOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const habitInputRef = useRef<TextInput>(null);
  const taskInputRef = useRef<TextInput>(null);

  // Derived data
  const allHabits = habitsQuery.data ?? [];
  const activeHabits = allHabits.filter((h) => !h.isArchived);
  const archivedHabits = allHabits.filter((h) => h.isArchived);
  const openTasks = tasksQuery.data ?? [];
  const atTaskLimit = openTasks.length >= MAX_OPEN_TASKS;
  const isMutating =
    createHabit.isPending ||
    updateHabit.isPending ||
    createTask.isPending ||
    deleteTask.isPending;

  // Handlers
  const handleCreateHabit = useCallback(() => {
    const title = habitTitle.trim();
    if (!title) {
      setHabitInputOpen(false);
      setHabitTitle("");
      return;
    }
    createHabit.mutate(
      { title },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setHabitTitle("");
          setHabitInputOpen(false);
        },
      },
    );
  }, [habitTitle, createHabit]);

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

  const handleCreateTask = useCallback(() => {
    const title = taskTitle.trim();
    if (!title) {
      setTaskInputOpen(false);
      setTaskTitle("");
      return;
    }
    createTask.mutate(
      { title },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setTaskTitle("");
          setTaskInputOpen(false);
        },
      },
    );
  }, [taskTitle, createTask]);

  const handleDeleteTask = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      deleteTask.mutate(id);
    },
    [deleteTask],
  );

  const onRefresh = useCallback(() => {
    habitsQuery.refetch();
    tasksQuery.refetch();
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

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={[s.content, { paddingTop: insets.top + 16 }]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={habitsQuery.isFetching || tasksQuery.isFetching}
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
          {habitInputOpen ? (
            <View style={s.inputRow}>
              <Ionicons name="add" size={20} color={colors.accent} />
              <TextInput
                ref={habitInputRef}
                style={s.textInput}
                value={habitTitle}
                onChangeText={setHabitTitle}
                placeholder="Habit name"
                placeholderTextColor={colors.textMuted}
                autoFocus
                editable={!createHabit.isPending}
                returnKeyType="done"
                onSubmitEditing={handleCreateHabit}
                onBlur={() => {
                  if (!habitTitle.trim()) {
                    setHabitInputOpen(false);
                    setHabitTitle("");
                  }
                }}
              />
            </View>
          ) : (
            <Pressable
              style={s.addRow}
              onPress={() => setHabitInputOpen(true)}
              disabled={isMutating}
            >
              <Ionicons name="add" size={20} color={colors.accent} />
              <Text style={s.addRowText}>New habit</Text>
            </Pressable>
          )}

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
              disabled={isMutating}
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
          ) : taskInputOpen ? (
            <View style={s.inputRow}>
              <Ionicons name="add" size={20} color={colors.accent} />
              <TextInput
                ref={taskInputRef}
                style={s.textInput}
                value={taskTitle}
                onChangeText={setTaskTitle}
                placeholder="Task name"
                placeholderTextColor={colors.textMuted}
                autoFocus
                editable={!createTask.isPending}
                returnKeyType="done"
                onSubmitEditing={handleCreateTask}
                onBlur={() => {
                  if (!taskTitle.trim()) {
                    setTaskInputOpen(false);
                    setTaskTitle("");
                  }
                }}
              />
            </View>
          ) : (
            <Pressable
              style={s.addRow}
              onPress={() => setTaskInputOpen(true)}
              disabled={isMutating}
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

  // Inline input
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    padding: 0,
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
});
