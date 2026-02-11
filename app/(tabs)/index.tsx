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
        }
      } catch (error) {
        console.error("❌ Error loading step history:", error);
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

  // Custom Circular Progress for Blue Background
  // We inline it or wrap the component to override colors if the component doesn't support props well enough for this specific look
  // But CircularProgress has props. Let's see. The component uses Colors.neonLime and Colors.progressTrack internally.
  // We need to pass colors or modify the component.
  // Since I can't modify props of CircularProgress easily without editing that file again (and I want to avoid ping-pong),
  // I will wrap it in a View that might not affect internal SVG colors unless I pass them.
  // Wait, I designed CircularProgress to use fixed colors. I should probably update CircularProgress to accept color props or "theme" prop.
  // Or I can just duplicate the simplified logic here for the Blue version if it's very specific,
  // OR I update CircularProgress.tsx to accept colors. Updating the component is cleaner.
  // actually, let's just update CircularProgress.tsx in the next step to accept colors. For now I will place it and it might look Green on Blue (Neon Lime on Blue is actually cool/premium).
  // Neon Lime on Brand Blue is a VERY common fintech/sporty combo. Let's stick with Neon Lime for now.

  return (
    <View style={styles.container}>
      {/* Top Blue Section */}
      <View style={styles.topSection}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>
            {/* Notification Icon or Profile placeholder */}
            <View style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={24} color={Colors.white} />
            </View>
          </View>

          <View style={styles.progressSection}>
            {/* We might need to adjust the track color of CircularProgress to be transparent white or dark blue */}
            {/* For now, let's use it as is. Neon Lime on Blue will pop. */}
            <CircularProgress
              currentSteps={todaySteps}
              goalSteps={dailyGoal}
              trackColor="rgba(255,255,255,0.15)"
              textColor={Colors.white}
            />
          </View>
        </SafeAreaView>
      </View>

      {/* Bottom White Sheet Overlap */}
      <View style={styles.bottomSheet}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Quick Stats Row - Compact */}
          <View style={styles.statsRow}>
            <StatCard
              icon={<Ionicons name="map-outline" size={20} color="#333" />}
              value={kmWalked}
              label="km"
            />
            <StatCard
              icon={<MaterialCommunityIcons name="leaf" size={20} color="#333" />}
              value={treesPlanted.toString()}
              label="trees"
            />
            <StatCard
              icon={<Ionicons name="flame" size={20} color="#333" />}
              value={caloriesBurned.toString()}
              label="kcal"
            />
          </View>

          {/* Weekly Activity Chart */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Activity</Text>
              <Text style={styles.seeAllText}>This Week</Text>
            </View>
            <WeeklyBarChart stepHistory={stepHistory} goalSteps={dailyGoal} />
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brandBlue, // Background is blue to cover top bounces
  },
  topSection: {
    backgroundColor: Colors.brandBlue,
    paddingBottom: 40, // Space for overlap
    zIndex: 1,
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: Colors.background, // White
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32, // Overlap
    overflow: "hidden", // Clip content to radius
    zIndex: 2,
  },
  scrollContent: {
    paddingTop: 32, // Content starts after overlap curve
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 12,
  },
  greeting: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 2,
    fontWeight: "500",
  },
  userName: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.white,
    letterSpacing: -0.5,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  progressSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18, // Slightly smaller for dashboard feel
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
});
