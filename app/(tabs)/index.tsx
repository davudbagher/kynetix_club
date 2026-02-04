import CircularProgress from "@/components/CircularProgress";
import StatCard from "@/components/StatCard";
import WeeklyBarChart from "@/components/WeeklyBarChart";
import { auth, db } from "@/config/firebase";
import Colors from "@/constants/Colors";
import { usePedometer } from "@/hooks/usePedometer";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  // Get REAL steps from device pedometer
  const { todaySteps, isPedometerAvailable } = usePedometer();

  // 📊 State for step history (for weekly chart)
  const [stepHistory, setStepHistory] = useState<any[]>([]);

  // 📊 Load step history from Firestore
  useEffect(() => {
    const loadStepHistory = async () => {
      try {
        // Get current user ID
        const savedUserId = await AsyncStorage.getItem("kynetix_user_id");
        const userId = savedUserId || auth.currentUser?.uid;

        if (userId) {
          // Load user document from Firestore
          const userDoc = await getDoc(doc(db, "users", userId));
          const userData = userDoc.data();

          // Set step history (empty array if none exists yet)
          setStepHistory(userData?.stepHistory || []);

          console.log(
            `📊 Loaded ${userData?.stepHistory?.length || 0} days of step history`,
          );
        }
      } catch (error) {
        console.error("❌ Error loading step history:", error);
        setStepHistory([]); // Set empty on error
      }
    };

    loadStepHistory();
  }, []); // Load once when screen mounts

  // User settings
  const dailyGoal = 10000;
  const userName = "Davud";

  // Calculate derived stats
  const kmWalked = (todaySteps * 0.0008).toFixed(1); // ~0.8m per step
  const treesPlanted = Math.floor(todaySteps / 280); // 1 tree per 280 steps
  const caloriesBurned = Math.floor(todaySteps * 0.04); // ~0.04 cal per step

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
        </View>

        {/* Main Progress Circle */}
        <View style={styles.progressSection}>
          <CircularProgress currentSteps={todaySteps} goalSteps={dailyGoal} />
        </View>

        {/* Stat Cards Row */}
        <View style={styles.statsRow}>
          <StatCard
            icon={<Ionicons name="map-outline" size={24} color="#333" />}
            value={kmWalked}
            label="km"
          />
          <StatCard
            icon={<MaterialCommunityIcons name="leaf" size={24} color="#333" />}
            value={treesPlanted.toString()}
            label="trees"
          />
          <StatCard
            icon={<Ionicons name="flame" size={24} color="#333" />}
            value={caloriesBurned.toString()}
            label="kcal"
          />
        </View>

        {/* Weekly Summary */}
        <View style={styles.weeklySection}>
          <View style={styles.weeklySummaryHeader}>
            <Text style={styles.weeklySummaryTitle}>This Week</Text>
            <Text style={styles.weeklySummarySubtitle}>Your activity</Text>
          </View>
          {/* Weekly Bar Chart */}
          <WeeklyBarChart stepHistory={stepHistory} goalSteps={10000} />
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: "500",
  },
  userName: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  progressSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 36,
  },
  weeklySection: {
    paddingHorizontal: 24,
  },
  weeklySummaryHeader: {
    marginBottom: 20,
  },
  weeklySummaryTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  weeklySummarySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  chartPlaceholder: {
    backgroundColor: Colors.black,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.cardGrey,
  },
  chartPlaceholderText: {
    fontSize: 14,
    color: Colors.lightGrey,
  },
});
