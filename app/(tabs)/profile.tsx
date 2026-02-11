import BadgeModal from "@/components/BadgeModal";
import StoryTemplateGenerator from "@/components/StoryTemplateGenerator";
import VirtualTreesModal from "@/components/VirtualTreesModal";
import { db } from "@/config/firebase";
import Colors from "@/constants/Colors";
import {
  Badge,
  BADGES,
  getLockedBadges,
  getUnlockedBadges,
} from "@/constants/badges";
import { getUserLeague } from "@/constants/leagues";
import { useFriends } from "@/hooks/useFriends";
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

  // Friends hook
  const { friends, fetchFriends, loading: friendsLoading } = useFriends();

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

        // Fetch friends list
        await fetchFriends(userId);

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading profile:", error);
        setIsLoading(false);
      }
    };
    loadUserData();
  }, [fetchFriends]);

  // Calculate badges
  const unlockedBadges = userData ? getUnlockedBadges(userData) : [];
  const lockedBadges = userData ? getLockedBadges(userData) : [];
  const allBadgesForDisplay = [...unlockedBadges, ...lockedBadges.slice(0, 6)];

  const getCurrentLeague = () => {
    const totalSteps = userData?.totalStepsAllTime || 0;
    return getUserLeague(totalSteps);
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
          <View style={styles.headerButtons}>
            <TouchableOpacity
              onPress={() => router.push("/find-friends")}
              style={styles.iconButton}
            >
              <Text style={styles.iconButtonText}>👥</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/settings")}
              style={styles.iconButton}
            >
              <Text style={styles.iconButtonText}>⚙️</Text>
            </TouchableOpacity>
          </View>
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

        {/* Friends Section */}
        <View style={styles.friendsSection}>
          <View style={styles.friendsHeader}>
            <Text style={styles.sectionLabel}>FRIENDS</Text>
            <Text style={styles.friendsCount}>
              {friends.length} {friends.length === 1 ? 'Friend' : 'Friends'}
            </Text>
          </View>

          {friends.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.friendsList}
            >
              {friends.map((friend: any) => (
                <TouchableOpacity
                  key={friend.id}
                  style={styles.friendCard}
                  activeOpacity={0.7}
                >
                  <View style={styles.friendAvatar}>
                    <Text style={styles.friendAvatarText}>{friend.avatar || '👤'}</Text>
                  </View>
                  <Text style={styles.friendName} numberOfLines={1}>
                    {friend.fullName || 'Friend'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyFriendsContainer}>
              <Text style={styles.emptyFriendsEmoji}>👥</Text>
              <Text style={styles.emptyFriendsText}>No friends yet</Text>
              <TouchableOpacity
                style={styles.addFriendsButton}
                onPress={() => router.push("/find-friends")}
              >
                <Text style={styles.addFriendsButtonText}>Find Friends</Text>
              </TouchableOpacity>
            </View>
          )}
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

        {/* Share Story */}
        <View style={styles.shareSection}>
          <Text style={styles.sectionLabel}>SHARE YOUR ACHIEVEMENT</Text>
          <StoryTemplateGenerator
            userStats={{
              steps: userData.totalStepsAllTime,
              distance: (userData.totalStepsAllTime * 0.0007).toFixed(1),
              league: league.name,
              rank: 23, // Could be fetched from leaderboard
              name: userData.fullName.split(' ')[0],
              avatar: userData.avatar,
            }}
          />
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
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.black,
    borderRadius: 22,
  },
  iconButtonText: { fontSize: 22 },

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
  shareSection: { paddingHorizontal: 24, marginBottom: 40 },
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

  friendsSection: { paddingHorizontal: 24, marginBottom: 40 },
  friendsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  friendsCount: {
    fontSize: 13,
    color: Colors.neonLime,
    fontWeight: '600',
  },
  friendsList: {
    gap: 12,
    paddingRight: 24,
  },
  friendCard: {
    backgroundColor: Colors.black,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: 100,
  },
  friendAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.cardGrey,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  friendAvatarText: {
    fontSize: 28,
  },
  friendName: {
    fontSize: 13,
    color: Colors.white,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyFriendsContainer: {
    backgroundColor: Colors.black,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  emptyFriendsEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyFriendsText: {
    fontSize: 16,
    color: Colors.lightGrey,
    marginBottom: 20,
  },
  addFriendsButton: {
    backgroundColor: Colors.neonLime,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addFriendsButtonText: {
    color: Colors.black,
    fontWeight: 'bold',
    fontSize: 14,
  },

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
