import BadgeModal from "@/components/BadgeModal";
import StoryTemplateGenerator from "@/components/StoryTemplateGenerator";
import VirtualTreesModal from "@/components/VirtualTreesModal";
import { db } from "@/config/firebase";
import Colors from "@/constants/Colors";
import {
  Badge,
  getLockedBadges,
  getUnlockedBadges
} from "@/constants/badges";
import { getUserLeague } from "@/constants/leagues";
import { useFriends } from "@/hooks/useFriends";
import { Ionicons } from "@expo/vector-icons";
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
  const [showTreesModal, setShowTreesModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);

  // Friends hook
  const { friends, fetchFriends } = useFriends();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        const userId = await AsyncStorage.getItem("kynetix_user_id");

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
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.topSection}>
          <SafeAreaView edges={["top"]}>
            <Text style={styles.headerTitle}>Profile</Text>
          </SafeAreaView>
        </View>
        <View style={styles.bottomSheet}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.brandBlue} />
          </View>
        </View>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.container}>
        <View style={styles.topSection}>
          <SafeAreaView edges={["top"]}>
            <Text style={styles.headerTitle}>Profile</Text>
          </SafeAreaView>
        </View>
        <View style={styles.bottomSheet}>
          <View style={styles.loadingContainer}>
            <Text style={styles.errorText}>Profile not found</Text>
          </View>
        </View>
      </View>
    );
  }

  const league = getCurrentLeague();
  const trees = getVirtualTrees();
  const memberSince = getMemberSince();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Top Blue Section */}
      <View style={styles.topSection}>
        <SafeAreaView edges={["top"]}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Profile</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => router.push("/find-friends")} style={styles.iconButton}>
                <Ionicons name="people" size={20} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/settings")} style={styles.iconButton}>
                <Ionicons name="settings-sharp" size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* User Profile Header - Compact */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{userData.avatar}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userData.fullName}</Text>
              <Text style={styles.memberSince}>Member since {memberSince}</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Bottom White Sheet Overlap */}
      <View style={styles.bottomSheet}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          {/* Quick Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userData.totalStepsAllTime.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Steps</Text>
            </View>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem} onPress={() => setShowTreesModal(true)}>
              <Text style={styles.statValue}>{trees}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.statLabel}>Trees Planted</Text>
                <Ionicons name="information-circle-outline" size={14} color={Colors.neonLime} />
              </View>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userData.currentStreakDays || 0}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </View>

          {/* League Banner */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>CURRENT LEAGUE</Text>
            <View style={styles.leagueCard}>
              <View style={styles.leagueIconContainer}>
                <Text style={styles.leagueEmoji}>{league.emoji}</Text>
              </View>
              <View style={styles.leagueInfo}>
                <Text style={styles.leagueName}>{league.name}</Text>
                <Text style={styles.leagueDesc}>Keep walking to promote!</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </View>
          </View>

          {/* Friends Section - Horizontal */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>FRIENDS ({friends.length})</Text>
              <TouchableOpacity onPress={() => router.push("/find-friends")}>
                <Text style={styles.seeAllText}>Find Friends</Text>
              </TouchableOpacity>
            </View>

            {friends.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.friendsList}>
                {friends.map((friend: any) => (
                  <TouchableOpacity key={friend.id} style={styles.friendItem}>
                    <View style={styles.friendAvatar}>
                      <Text style={styles.friendAvatarText}>{friend.avatar || '👤'}</Text>
                    </View>
                    <Text style={styles.friendName} numberOfLines={1}>{friend.fullName.split(' ')[0]}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Add friends to compete together!</Text>
              </View>
            )}
          </View>

          {/* Badges Grid */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>BADGES</Text>
              <Text style={styles.seeAllText}>{unlockedBadges.length} Unlocked</Text>
            </View>

            <View style={styles.badgesGrid}>
              {allBadgesForDisplay.map((badge) => {
                const isUnlocked = unlockedBadges.some((b) => b.id === badge.id);
                return (
                  <TouchableOpacity
                    key={badge.id}
                    style={[styles.badgeItem, !isUnlocked && styles.badgeItemLocked]}
                    onPress={() => {
                      setSelectedBadge(badge);
                      setShowBadgeModal(true);
                    }}
                  >
                    <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                    {!isUnlocked && (
                      <View style={styles.lockOverlay}>
                        <Ionicons name="lock-closed" size={12} color={Colors.white} />
                      </View>
                    )}
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* Share Story */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>SHARE</Text>
            <StoryTemplateGenerator
              userStats={{
                steps: userData.totalStepsAllTime,
                distance: (userData.totalStepsAllTime * 0.0007).toFixed(1),
                league: league.name,
                rank: 23, // Placeholder until rank is fetched logic improved
                name: userData.fullName.split(' ')[0],
                avatar: userData.avatar,
              }}
            />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brandBlue,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },

  // Top Section
  topSection: {
    backgroundColor: Colors.brandBlue,
    paddingBottom: 40, // Space for overlap
    zIndex: 1,
    paddingHorizontal: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: Colors.white,
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Profile Header in Top Section
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 10,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: 32,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },

  // Bottom Sheet
  bottomSheet: {
    flex: 1,
    backgroundColor: Colors.background, // White
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32, // Overlap
    overflow: "hidden", // Clip content to radius
    zIndex: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
    paddingBottom: 20,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.darkGrey, // Charcoal
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)', // Lighter divider
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.neonLime, // Lime label for pop
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Common Sections
  sectionContainer: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 13,
    color: Colors.brandBlue,
    fontWeight: '600',
  },
  emptyState: {
    paddingVertical: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },

  // League Card
  leagueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkGrey, // Charcoal
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 16,
    // Shadow
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  leagueIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.neonLime, // Lime border
  },
  leagueEmoji: {
    fontSize: 24,
  },
  leagueInfo: {
    flex: 1,
  },
  leagueName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white, // White text
    marginBottom: 2,
  },
  leagueDesc: {
    fontSize: 12,
    color: Colors.neonLime, // Lime text
    fontWeight: '600',
  },

  // Friends List
  friendsList: {
    gap: 16,
    paddingVertical: 4,
  },
  friendItem: {
    alignItems: 'center',
    width: 60,
  },
  friendAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  friendAvatarText: {
    fontSize: 24,
  },
  friendName: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '500',
  },

  // Badges Grid
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeItem: {
    width: '30%', // Approx 3 columns
    aspectRatio: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeItemLocked: {
    opacity: 0.5,
    backgroundColor: Colors.border,
  },
  badgeEmoji: {
    fontSize: 32,
  },
  lockOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 4,
  },
});
