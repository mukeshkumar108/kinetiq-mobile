import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { color, font, space, radius, cardShadow } from "@/shared/theme/tokens";
import type { TodayHabit } from "@/modules/today/types";

interface StreakCalendarProps {
  habits: TodayHabit[];
}

interface CalendarDay {
  dayOfMonth: number;
  intensity: number;
  isToday: boolean;
  isFuture: boolean;
  isCurrentMonth: boolean;
}

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const DOT_SIZE = 28;

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildCalendarDays(habits: TodayHabit[], today: Date): CalendarDay[] {
  const year = today.getFullYear();
  const month = today.getMonth();
  const todayDate = today.getDate();
  const todayStr = dateKey(today);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Monday-based start: 0=Mon, 6=Sun
  const firstOfMonth = new Date(year, month, 1);
  const startDayOfWeek = (firstOfMonth.getDay() + 6) % 7;

  // For each habit, build a Set of date keys within its current streak
  const habitStreakSets = habits.map((habit) => {
    const dates = new Set<string>();
    if (habit.streak.current <= 0) return dates;

    const startOffset = habit.completedToday ? 0 : 1;
    for (let i = 0; i < habit.streak.current; i++) {
      const d = new Date(year, month, todayDate - startOffset - i);
      dates.add(dateKey(d));
    }
    return dates;
  });

  // Padding days before 1st
  const padding: CalendarDay[] = Array.from({ length: startDayOfWeek }, () => ({
    dayOfMonth: 0,
    intensity: 0,
    isToday: false,
    isFuture: false,
    isCurrentMonth: false,
  }));

  // Actual month days
  const days: CalendarDay[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const key = dateKey(new Date(year, month, d));
    const isFuture = d > todayDate;
    const isToday = key === todayStr;

    let intensity = 0;
    if (!isFuture && habits.length > 0) {
      const completedCount = habitStreakSets.filter((set) => set.has(key)).length;
      intensity = completedCount / habits.length;
    }

    days.push({
      dayOfMonth: d,
      intensity,
      isToday,
      isFuture,
      isCurrentMonth: true,
    });
  }

  return [...padding, ...days];
}

function getDayColor(day: CalendarDay): string {
  if (day.isFuture || !day.isCurrentMonth) return "transparent";
  if (day.intensity >= 1) return color.mint;
  if (day.intensity >= 0.5) return "rgba(87, 230, 168, 0.45)";
  if (day.intensity > 0) return color.mintMuted;
  return color.divider;
}

export function StreakCalendar({ habits }: StreakCalendarProps) {
  const today = new Date();
  const monthLabel = today.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const days = useMemo(
    () => buildCalendarDays(habits, today),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [habits],
  );

  return (
    <View style={s.container}>
      <Text style={s.monthLabel}>{monthLabel}</Text>

      <View style={s.weekdayRow}>
        {WEEKDAYS.map((label, i) => (
          <View key={i} style={s.cell}>
            <Text style={s.weekdayText}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={s.grid}>
        {days.map((day, i) => (
          <View key={i} style={s.cell}>
            {day.isCurrentMonth ? (
              <View
                style={[
                  s.dot,
                  { backgroundColor: getDayColor(day) },
                  day.isToday && s.todayRing,
                ]}
              >
                <Text
                  style={[
                    s.dayNumber,
                    day.intensity > 0 && !day.isFuture && s.dayNumberActive,
                    day.isToday && s.dayNumberToday,
                  ]}
                >
                  {day.dayOfMonth}
                </Text>
              </View>
            ) : (
              <View style={s.dotEmpty} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: color.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: color.border,
    padding: space.lg,
    ...cardShadow,
  },
  monthLabel: {
    ...font.body,
    fontWeight: "600",
    marginBottom: space.md,
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: space.sm,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: `${100 / 7}%` as unknown as number,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dotEmpty: {
    width: DOT_SIZE,
    height: DOT_SIZE,
  },
  todayRing: {
    borderWidth: 2,
    borderColor: color.mint,
  },
  dayNumber: {
    fontSize: 10,
    fontWeight: "600",
    color: color.textTertiary,
  },
  dayNumberActive: {
    color: color.text,
  },
  dayNumberToday: {
    fontWeight: "800",
    color: color.text,
  },
  weekdayText: {
    ...font.label,
    color: color.textTertiary,
  },
});
