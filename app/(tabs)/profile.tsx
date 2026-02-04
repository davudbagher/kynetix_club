import BadgeModal from "@/components/BadgeModal";
import VirtualTreesModal from "@/components/VirtualTreesModal";
import { db } from "@/config/firebase";
import Colors from "@/constants/Colors";
import {
  Badge,
  BADGES,
  getLockedBadges,
  getUnlockedBadges,
} from "@/constants/badges";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LEAGUES = [
  { name: "Bronze", min: 0, max: 50000, emoji: "🥉", color: "#CD7F32" },
  { name: "Başlanğıc", min: 50000, max: 200000, emoji: "🔰", color: "#4A90E2" },
  { name: "Orta", min: 200000, max: 500000, emoji: "⚡", color: "#9B59B6" },
  { name: "İrəli", min: 500000, max: 1000000, emoji: "🚀", color: "#E67E22" },
  {
    name: "Çempion",
    min: 1000000,
    max: Infinity,
    emoji: "👑",
    color: "#F1C40F",
  },
];

interface UserData {
  fullName: string;
  avatar: string;
  totalStepsAllTime: number;
  createdAt: { seconds: number };
  phoneNumber: string;
  currentStreakDays: number;
}

export default function ProfileScreen() {
  // ALL HOOKS AT TOP
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedUserId, setSavedUserId] = useState<string>("");
  const [showTreesModal, setShowTreesModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        const userId = await AsyncStorage.getItem("kynetix_user_id");
        setSavedUserId(userId || "");

        if (!userId) {
          setIsLoading(false);
          return;
        }

        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading profile:", error);
        setIsLoading(false);
      }
    };
    loadUserData();
  }, []);

  // Calculate badges
  const unlockedBadges = userData ? getUnlockedBadges(userData) : [];
  const lockedBadges = userData ? getLockedBadges(userData) : [];
  const allBadgesForDisplay = [...unlockedBadges, ...lockedBadges.slice(0, 6)];

  const getCurrentLeague = () => {
    const totalSteps = userData?.totalStepsAllTime || 0;
    return (
      LEAGUES.find(
        (league) => totalSteps >= league.min && totalSteps < league.max,
      ) || LEAGUES[0]
    );
  };

  const getVirtualTrees = () => {
    const totalSteps = userData?.totalStepsAllTime || 0;
    return Math.floor(totalSteps / 280);
  };

  const getMemberSince = () => {
    if (!userData?.createdAt) return "Recently";
    const date = new Date(userData.createdAt.seconds * 1000);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.neonLime} />
        </View>
      </SafeAreaView>
    );
  }

  if (!userData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Profile not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const league = getCurrentLeague();
  const trees = getVirtualTrees();
  const memberSince = getMemberSince();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity
            onPress={() => router.push("/settings")}
            style={styles.settingsButton}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar & Name */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>{userData.avatar}</Text>
          </View>
          <Text style={styles.name}>{userData.fullName}</Text>
          <Text style={styles.memberSince}>Member since {memberSince}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <TouchableOpacity style={styles.statCard} activeOpacity={1}>
            <Text style={styles.statEmoji}>🚶</Text>
            <Text style={styles.statValue}>
              {userData.totalStepsAllTime.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Steps</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, styles.statCardHighlight]}
            onPress={() => setShowTreesModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.statEmoji}>🌳</Text>
            <Text style={[styles.statValue, styles.statValueHighlight]}>
              {trees.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Trees</Text>
            <View style={styles.infoButton}>
              <Text style={styles.infoButtonText}>ℹ️</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* League */}
        <View style={styles.leagueSection}>
          <Text style={styles.sectionLabel}>CURRENT LEAGUE</Text>
          <View style={styles.leagueCard}>
            <Text style={styles.leagueEmoji}>{league.emoji}</Text>
            <View style={styles.leagueInfo}>
              <Text style={styles.leagueName}>{league.name}</Text>
              <Text style={styles.leagueSteps}>
                {userData.totalStepsAllTime.toLocaleString()} steps
              </Text>
            </View>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.badgesSection}>
          <Text style={styles.sectionLabel}>BADGES</Text>
          <View style={styles.badgesGrid}>
            {allBadgesForDisplay.map((badge) => {
              const isUnlocked = unlockedBadges.some((b) => b.id === badge.id);
              return (
                <TouchableOpacity
                  key={badge.id}
                  style={[
                    styles.badgeItem,
                    !isUnlocked && styles.badgeItemLocked,
                  ]}
                  onPress={() => {
                    setSelectedBadge(badge);
                    setShowBadgeModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.badgeItemEmoji}>{badge.emoji}</Text>
                  {!isUnlocked && (
                    <View style={styles.badgeLockOverlay}>
                      <Text style={styles.lockIcon}>🔒</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.badgeCount}>
            {unlockedBadges.length} / {BADGES.length} Unlocked
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modals */}
      <VirtualTreesModal
        visible={showTreesModal}
        onClose={() => setShowTreesModal(false)}
        totalSteps={userData?.totalStepsAllTime || 0}
      />

      <BadgeModal
        visible={showBadgeModal}
        badge={selectedBadge}
        isUnlocked={unlockedBadges.some((b) => b.id === selectedBadge?.id)}
        onClose={() => setShowBadgeModal(false)}
        userData={userData}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkGrey },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 18, color: Colors.white, marginBottom: 24 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  title: { fontSize: 36, fontWeight: "bold", color: Colors.white },
  settingsButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.black,
    borderRadius: 22,
  },
  settingsIcon: { fontSize: 22 },

  profileSection: {
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.neonLime,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatar: { fontSize: 50 },
  name: {
    fontSize: 26,
    fontWeight: "bold",
    color: Colors.white,
    marginBottom: 6,
  },
  memberSince: { fontSize: 14, color: Colors.lightGrey },

  statsSection: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginBottom: 40,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.black,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 160,
  },
  statCardHighlight: { backgroundColor: Colors.neonLime },
  statEmoji: { fontSize: 40, marginBottom: 12 },
  statValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.white,
    marginBottom: 4,
  },
  statValueHighlight: { color: Colors.black },
  statLabel: {
    fontSize: 13,
    color: Colors.lightGrey,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoButtonText: { fontSize: 14 },

  leagueSection: { paddingHorizontal: 24, marginBottom: 40 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.lightGrey,
    letterSpacing: 1,
    marginBottom: 12,
  },
  leagueCard: {
    backgroundColor: Colors.black,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  leagueEmoji: { fontSize: 48 },
  leagueInfo: { flex: 1 },
  leagueName: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.white,
    marginBottom: 4,
  },
  leagueSteps: { fontSize: 14, color: Colors.lightGrey },

  badgesSection: { paddingHorizontal: 24, marginBottom: 40 },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  badgeItem: {
    width: "18%",
    aspectRatio: 1,
    backgroundColor: Colors.black,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badgeItemLocked: { opacity: 0.4 },
  badgeItemEmoji: { fontSize: 28 },
  badgeLockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  lockIcon: { fontSize: 16 },
  badgeCount: {
    fontSize: 13,
    color: Colors.lightGrey,
    textAlign: "center",
  },
});
