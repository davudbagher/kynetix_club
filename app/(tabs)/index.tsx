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
  const { todaySteps, isPedometerAvailable } = usePedometer();
  const [stepHistory, setStepHistory] = useState<any[]>([]);
  const [userName, setUserName] = useState("User");
  const dailyGoal = 10000;

  // Load user name from Firestore
  useEffect(() => {
    const loadUserName = async () => {
      try {
        const savedUserId = await AsyncStorage.getItem("kynetix_user_id");
        const userId = savedUserId || auth.currentUser?.uid;

        if (userId) {
          const userDoc = await getDoc(doc(db, "users", userId));
          const userData = userDoc.data();
          if (userData?.fullName) {
            // Extract first name
            const firstName = userData.fullName.split(" ")[0];
            setUserName(firstName);
          }
        }
      } catch (error) {
        console.error("❌ Error loading user name:", error);
      }
    };
    loadUserName();
  }, []);

  // Load step history from Firestore (ONCE on mount)
  useEffect(() => {
    const loadStepHistory = async () => {
      try {
        const savedUserId = await AsyncStorage.getItem("kynetix_user_id");
        const userId = savedUserId || auth.currentUser?.uid;

        if (userId) {
          const userDoc = await getDoc(doc(db, "users", userId));
          const userData = userDoc.data();
          setStepHistory(userData?.stepHistory || []);
          console.log(
            `📊 Loaded ${userData?.stepHistory?.length || 0} days of step history`,
          );
        }
      } catch (error) {
        console.error("❌ Error loading step history:", error);
        setStepHistory([]);
      }
    };
    loadStepHistory();
  }, []);

  // Update step history when todaySteps changes (LIVE!)
  useEffect(() => {
    if (todaySteps === 0) return;

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const todayString = `${year}-${month}-${day}`;

    console.log(`📊 Updating chart: ${todayString} → ${todaySteps} steps`);

    setStepHistory((prev) => {
      const withoutToday = prev.filter((entry) => entry.date !== todayString);
      return [
        ...withoutToday,
        {
          date: todayString,
          steps: todaySteps,
          goalReached: todaySteps >= dailyGoal,
        },
      ];
    });
  }, [todaySteps]);

  const kmWalked = (todaySteps * 0.0008).toFixed(1);
  const treesPlanted = Math.floor(todaySteps / 280);
  const caloriesBurned = Math.floor(todaySteps * 0.04);

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
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
        </View>



        <View style={styles.progressSection}>
          <CircularProgress currentSteps={todaySteps} goalSteps={dailyGoal} />
        </View>

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

        <View style={styles.weeklySection}>
          <View style={styles.weeklySummaryHeader}>
            <Text style={styles.weeklySummaryTitle}>This Week</Text>
            <Text style={styles.weeklySummarySubtitle}>Your activity</Text>
          </View>
          <WeeklyBarChart stepHistory={stepHistory} goalSteps={dailyGoal} />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
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
});
