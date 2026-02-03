import CircularProgress from "@/components/CircularProgress";
import StatCard from "@/components/StatCard";
import WeeklyBarChart from "@/components/WeeklyBarChart";
import WeeklyCalendar from "@/components/WeeklyCalendar";
import { auth, db } from "@/config/firebase";
import Colors from "@/constants/Colors";
import { usePedometer } from "@/hooks/usePedometer";
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
            <Text style={styles.userName}>{userName}! 👋</Text>
          </View>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>K</Text>
          </View>
        </View>

        {/* Weekly Calendar */}
        <WeeklyCalendar {...({ stepHistory } as any)} />

        {/* Main Progress Circle */}
        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>Today's Progress</Text>
          <View style={styles.progressContainer}>
            <CircularProgress currentSteps={todaySteps} goalSteps={dailyGoal} />
          </View>
        </View>

        {/* Stat Cards Row */}
        <View style={styles.statsRow}>
          <StatCard icon="📏" value={kmWalked} label="km" />
          <StatCard icon="🌳" value={treesPlanted.toString()} label="trees" />
          <StatCard icon="🔥" value={caloriesBurned.toString()} label="kcal" />
        </View>

        {/* Weekly Summary */}
        <View style={styles.weeklySection}>
          <View style={styles.weeklySummaryHeader}>
            <Text style={styles.weeklySummaryTitle}>This Week</Text>
            <Text style={styles.weeklySummarySubtitle}>Keep pushing! 💪</Text>
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
    backgroundColor: Colors.darkGrey,
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: Colors.lightGrey,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.white,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.neonLime,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.black,
  },
  progressSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.white,
    marginBottom: 24,
  },
  progressContainer: {
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  weeklySection: {
    paddingHorizontal: 20,
  },
  weeklySummaryHeader: {
    marginBottom: 16,
  },
  weeklySummaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.white,
    marginBottom: 4,
  },
  weeklySummarySubtitle: {
    fontSize: 14,
    color: Colors.lightGrey,
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
