import Colors from "@/constants/Colors";
import { StyleSheet, Text, View } from "react-native";

interface WeeklyCalendarProps {
  // We'll pass step data later for each day
}

export default function WeeklyCalendar({}: WeeklyCalendarProps) {
  // Get current date info
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Days of week
  const days = ["S", "M", "T", "W", "T", "F", "S"];

  // Calculate dates for the week (this week starting from Sunday)
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - currentDay + i);
    return date.getDate();
  });

  return (
    <View style={styles.container}>
      <View style={styles.daysRow}>
        {days.map((day, index) => {
          const isToday = index === currentDay;

          return (
            <View key={index} style={styles.dayContainer}>
              <Text
                style={[styles.dayLetter, isToday && styles.dayLetterActive]}
              >
                {day}
              </Text>
              <View
                style={[styles.dateCircle, isToday && styles.dateCircleActive]}
              >
                <Text
                  style={[
                    styles.dateNumber,
                    isToday && styles.dateNumberActive,
                  ]}
                >
                  {weekDates[index]}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.darkGrey,
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayContainer: {
    alignItems: "center",
    gap: 8,
  },
  dayLetter: {
    fontSize: 12,
    color: Colors.midGrey,
    fontWeight: "600",
  },
  dayLetterActive: {
    color: Colors.neonLime,
  },
  dateCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardGrey,
    alignItems: "center",
    justifyContent: "center",
  },
  dateCircleActive: {
    backgroundColor: Colors.neonLime,
  },
  dateNumber: {
    fontSize: 16,
    color: Colors.white,
    fontWeight: "600",
  },
  dateNumberActive: {
    color: Colors.black,
  },
});
