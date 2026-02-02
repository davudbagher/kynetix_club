import { usePedometer } from "@/hooks/usePedometer";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function ProfileScreen() {
  // Get REAL steps from device pedometer!
  const { todaySteps, isPedometerAvailable } = usePedometer();

  // User data
  const userName = "Davud Baghir";
  const phoneNumber = "+994 XX XXX XX XX";
  const availableSteps = todaySteps; // Steps you can spend on rewards
  const streakDays = 3; // Hardcoded for now (will sync with Firebase later)
  const totalSteps = 1245891; // Hardcoded for now (will sync with Firebase later) // Steps you can spend on rewards

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>KYNETIX CLUB 🇦🇿</Text>
        <Text style={styles.tagline}>Baku 2026</Text>
      </View>

      {/* User Info */}
      <View style={styles.userInfo}>
        <Text style={styles.userName}>👤 {userName}</Text>
        <Text style={styles.phoneNumber}>📱 {phoneNumber}</Text>
      </View>

      {/* Step Counter - The Hero Element */}
      <View style={styles.stepCounter}>
        <View style={styles.stepCircle}>
          <Text style={styles.stepNumber}>{todaySteps.toLocaleString()}</Text>
          <Text style={styles.stepLabel}>steps</Text>
          <Text style={styles.stepToday}>TODAY</Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsContainer}>
        {/* Available Steps */}
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>💎</Text>
          <Text style={styles.statValue}>
            {availableSteps.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Available to Spend</Text>
        </View>

        {/* Streak */}
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🔥</Text>
          <Text style={styles.statValue}>{streakDays} days</Text>
          <Text style={styles.statLabel}>Current Streak</Text>
        </View>

        {/* Total Steps */}
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🏆</Text>
          <Text style={styles.statValue}>{totalSteps.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Steps</Text>
        </View>
      </View>

      {/* Coming Soon Badge */}
      <View style={styles.comingSoon}>
        <Text style={styles.comingSoonText}>
          🚀 Real pedometer coming tonight when your phone charges!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0e27", // Dark blue background (like night sky)
  },
  header: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 20,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#00d4ff", // Bright cyan (Kynetix brand color)
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 14,
    color: "#8b92b0",
    marginTop: 4,
  },
  userInfo: {
    alignItems: "center",
    marginBottom: 32,
  },
  userName: {
    fontSize: 22,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 14,
    color: "#8b92b0",
  },
  stepCounter: {
    alignItems: "center",
    marginBottom: 40,
  },
  stepCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#141a3d", // Slightly lighter than background
    borderWidth: 8,
    borderColor: "#00d4ff", // Cyan border
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00d4ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10, // Android shadow
  },
  stepNumber: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#00d4ff",
  },
  stepLabel: {
    fontSize: 16,
    color: "#8b92b0",
    marginTop: 4,
  },
  stepToday: {
    fontSize: 12,
    color: "#4ade80", // Green accent
    marginTop: 8,
    fontWeight: "600",
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: "#141a3d",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1e2651",
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#8b92b0",
  },
  comingSoon: {
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 16,
    backgroundColor: "#1e2651",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4ade80",
  },
  comingSoonText: {
    fontSize: 14,
    color: "#4ade80",
    textAlign: "center",
    lineHeight: 20,
  },
});
