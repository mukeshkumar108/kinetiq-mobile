import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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

function buildCalendarDays(
  habits: TodayHabit[],
  viewDate: Date,
  today: Date,
): CalendarDay[] {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const todayStr = dateKey(today);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Monday-based start: 0=Mon, 6=Sun
  const firstOfMonth = new Date(year, month, 1);
  const startDayOfWeek = (firstOfMonth.getDay() + 6) % 7;

  // Build streak date sets relative to actual today
  const habitStreakSets = habits.map((habit) => {
    const dates = new Set<string>();
    if (habit.streak.current <= 0) return dates;

    const startOffset = habit.completedToday ? 0 : 1;
    for (let i = 0; i < habit.streak.current; i++) {
      const d = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - startOffset - i,
      );
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
    const dayDate = new Date(year, month, d);
    const key = dateKey(dayDate);
    // Compare dates at day precision (ignore time)
    const isFuture =
      dayDate.getFullYear() > today.getFullYear() ||
      (dayDate.getFullYear() === today.getFullYear() &&
        dayDate.getMonth() > today.getMonth()) ||
      (dayDate.getFullYear() === today.getFullYear() &&
        dayDate.getMonth() === today.getMonth() &&
        d > today.getDate());
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
  const [monthOffset, setMonthOffset] = useState(0);
  const today = useMemo(() => new Date(), []);

  const viewDate = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + monthOffset, 1),
    [today, monthOffset],
  );

  const monthLabel = viewDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const days = useMemo(
    () => buildCalendarDays(habits, viewDate, today),
    [habits, viewDate, today],
  );

  const canGoForward = monthOffset < 0;

  return (
    <View style={s.container}>
      <View style={s.monthHeader}>
        <Pressable
          style={s.navBtn}
          onPress={() => setMonthOffset((o) => o - 1)}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={18} color={color.textSecondary} />
        </Pressable>
        <Text style={s.monthLabel}>{monthLabel}</Text>
        <Pressable
          style={[s.navBtn, !canGoForward && s.navBtnDisabled]}
          onPress={() => canGoForward && setMonthOffset((o) => o + 1)}
          hitSlop={8}
          disabled={!canGoForward}
        >
          <Ionicons
            name="chevron-forward"
            size={18}
            color={canGoForward ? color.textSecondary : color.divider}
          />
        </Pressable>
      </View>

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
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: space.md,
  },
  monthLabel: {
    ...font.body,
    fontWeight: "600",
  },
  navBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnDisabled: {
    opacity: 0.3,
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
