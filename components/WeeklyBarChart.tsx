import Colors from "@/constants/Colors";
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

  useEffect(() => {
    // Generate last 7 days (Monday to Sunday)
    const days: DayData[] = [];
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, etc.

    // Calculate days since last Monday
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const dayLetters = ["M", "T", "W", "T", "F", "S", "S"];

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
    }

    setWeekDays(days);
  }, [stepHistory, goalSteps]);

  const getBarColor = (day: DayData) => {
    if (day.isFuture) return "transparent"; // Future days - empty
    return Colors.neonLime; // All past days use lime green
  };

  const getBarHeight = (steps: number) => {
    // Max height = 140px (when steps >= goal)
    const percentage = Math.min((steps / goalSteps) * 100, 100);
    return (percentage / 100) * 140;
  };

  // Find max steps for displaying labels
  const maxSteps = Math.max(...weekDays.map((d) => d.steps), goalSteps);

  return (
    <View style={styles.container}>
      {/* Bar Chart */}
      <View style={styles.chartContainer}>
        {weekDays.map((day, index) => (
          <View key={index} style={styles.barWrapper}>
            {/* Step count above bar (if has steps) */}
            {!day.isFuture && day.steps > 0 && (
              <Text style={styles.stepCount}>
                {day.steps >= 1000
                  ? `${(day.steps / 1000).toFixed(1)}k`
                  : day.steps}
              </Text>
            )}

            {/* Bar Container (background) */}
            <View style={styles.barBackground}>
              {/* Filled portion */}
              {!day.isFuture && day.steps > 0 && (
                <View
                  style={[
                    styles.barFill,
                    {
                      height: getBarHeight(day.steps),
                      backgroundColor: getBarColor(day),
                    },
                  ]}
                />
              )}
            </View>

            {/* Day Letter */}
            <Text style={[styles.dayLabel, day.isToday && styles.todayLabel]}>
              {day.dayLetter}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 20,
    // Subtle shadow
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 180,
  },
  barWrapper: {
    alignItems: "center",
    flex: 1,
  },
  stepCount: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  barBackground: {
    width: 36,
    height: 140,
    backgroundColor: Colors.border,
    borderRadius: 18,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: 18,
  },
  dayLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 10,
    fontWeight: "600",
  },
  todayLabel: {
    color: Colors.textPrimary,
    fontWeight: "bold",
  },
});
