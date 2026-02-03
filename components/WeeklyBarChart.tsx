import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

interface DayData {
  dayLetter: string; // M, T, W, T, F, S, S
  steps: number;
  goalReached: boolean;
  isToday: boolean;
  isFuture: boolean;
}

interface WeeklyBarChartProps {
  stepHistory?: Array<{ date: string; steps: number; goalReached: boolean }>;
  goalSteps?: number;
}

export default function WeeklyBarChart({
  stepHistory = [],
  goalSteps = 10000,
}: WeeklyBarChartProps) {
  const [weekDays, setWeekDays] = useState<DayData[]>([]);
  const [totalWeekSteps, setTotalWeekSteps] = useState(0);

  useEffect(() => {
    // Generate last 7 days (Monday to Sunday)
    const days: DayData[] = [];
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, etc.

    // Calculate days since last Monday
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const dayLetters = ["M", "T", "W", "T", "F", "S", "S"];
    let weekTotal = 0;

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() - daysSinceMonday + i);
      const dateString = date.toISOString().split("T")[0];

      // Find steps for this day in history
      const dayData = stepHistory.find((entry) => entry.date === dateString);
      const steps = dayData?.steps || 0;

      // Check if this day is today
      const isToday = dateString === today.toISOString().split("T")[0];

      // Check if this day is in the future
      const isFuture = date > today;

      days.push({
        dayLetter: dayLetters[i],
        steps,
        goalReached: steps >= goalSteps,
        isToday,
        isFuture,
      });

      if (!isFuture) {
        weekTotal += steps;
      }
    }

    setWeekDays(days);
    setTotalWeekSteps(weekTotal);
  }, [stepHistory, goalSteps]);

  const getBarColor = (day: DayData) => {
    if (day.isFuture) return "transparent"; // Future days - empty
    if (day.isToday) return "#8B5CF6"; // Today - purple
    if (day.goalReached) return "#4CAF50"; // Past + goal reached - green
    return "#FF9800"; // Past + goal not reached - orange
  };

  const getBarHeight = (steps: number) => {
    // Max height = 120px (when steps >= goal)
    const percentage = Math.min((steps / goalSteps) * 100, 100);
    return (percentage / 100) * 120;
  };

  return (
    <View style={styles.container}>
      {/* Total Steps This Week */}
      <View style={styles.header}>
        <Text style={styles.totalSteps}>{totalWeekSteps.toLocaleString()}</Text>
        <Text style={styles.subtitle}>This week</Text>
      </View>

      {/* Bar Chart */}
      <View style={styles.chartContainer}>
        {weekDays.map((day, index) => (
          <View key={index} style={styles.barWrapper}>
            {/* Bar Container (background) */}
            <View style={styles.barBackground}>
              {/* Filled portion */}
              {!day.isFuture && (
                <View
                  style={[
                    styles.barFill,
                    {
                      height: getBarHeight(day.steps),
                      backgroundColor: getBarColor(day),
                    },
                  ]}
                >
                  {/* Checkmark if goal reached */}
                  {day.goalReached && !day.isToday && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}

                  {/* Up arrows if today and doing well */}
                  {day.isToday && day.steps > goalSteps * 0.5 && (
                    <View style={styles.arrows}>
                      <Text style={styles.arrowText}>↑↑</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Day Letter */}
            <Text style={[styles.dayLabel, day.isToday && styles.todayLabel]}>
              {day.dayLetter}
            </Text>
          </View>
        ))}
      </View>

      {/* Motivation Message */}
      <Text style={styles.motivation}>
        {totalWeekSteps >= goalSteps * 7
          ? "🔥 Amazing week! All goals crushed!"
          : totalWeekSteps >= goalSteps * 4
            ? "💪 Keep pushing! You're doing great!"
            : "🚀 Every step counts! Let's go!"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  totalSteps: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
  },
  subtitle: {
    fontSize: 16,
    color: "#999",
    marginTop: 4,
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 140,
    marginBottom: 12,
  },
  barWrapper: {
    alignItems: "center",
    width: 40,
  },
  barBackground: {
    width: 32,
    height: 120,
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    position: "absolute",
    bottom: 8,
  },
  checkmarkText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  arrows: {
    position: "absolute",
    top: -4,
  },
  arrowText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "bold",
  },
  dayLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    fontWeight: "600",
  },
  todayLabel: {
    color: "#8B5CF6",
    fontWeight: "bold",
  },
  motivation: {
    fontSize: 14,
    color: "#C6FF00",
    textAlign: "center",
    marginTop: 8,
  },
});
