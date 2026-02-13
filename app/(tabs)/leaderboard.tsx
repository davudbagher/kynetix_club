import Colors from "@/constants/Colors";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { getTimeUntilEndOfMonth } from "@/utils/timeUtils";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function LeaderboardScreen() {
  // Get data from hook
  const { leagues, isLoading, userLeague, userData, refresh, refreshesRemaining } = useLeaderboard();

  console.log("🎮 LeaderboardScreen render:", {
    isLoading,
    leaguesCount: leagues.length,
    hasUserLeague: !!userLeague,
    hasUserData: !!userData,
    userLeagueName: userLeague?.name,
    userRank: userData?.rank,
    userSteps: userData?.steps,
    refreshesRemaining,
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const leagueListRefs = useRef<{ [key: string]: FlatList | null }>({});

  // Handle pull-to-refresh with rate limiting
  const onRefresh = async () => {
    setRefreshing(true);
    const result = await refresh();
    setRefreshing(false);

    // Show error if rate limited
    if (result && !result.success && result.error) {
      Alert.alert(
        "Refresh Limit Reached",
        result.error + "\n\nThis helps us keep the app free! 🎉",
        [{ text: "OK" }]
      );
    }
  };

  // Update currentIndex when userLeague loads
  useEffect(() => {
    if (userLeague && leagues.length > 0) {
      const index = leagues.findIndex((l) => l.id === userLeague.id);
      if (index !== -1) {
        setCurrentIndex(index);
        // Auto-scroll to user's league
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index, animated: false });
        }, 100);
      }
    }
  }, [userLeague, leagues]);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const jumpToUserRank = () => {
    if (userData && userLeague && leagueListRefs.current[userLeague.id]) {
      // note: userData.rank is 1-based index.
      const index = userData.rank - 1;

      // Safety check
      if (index >= 0) {
        leagueListRefs.current[userLeague.id]?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.topSection}>
          <SafeAreaView edges={["top"]}>
            <Text style={styles.headerTitle}>Leaderboard</Text>
          </SafeAreaView>
        </View>
        <View style={styles.bottomSheet}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.brandBlue} />
            <Text style={styles.loadingText}>Loading leaderboard...</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Blue Section */}
      <View style={styles.topSection}>
        <SafeAreaView edges={["top"]}>
          <Text style={styles.headerTitle}>Leaderboard</Text>
          <Text style={styles.headerSubtitle}>Climb the leagues of Baku</Text>
        </SafeAreaView>
      </View>

      {/* Bottom White Sheet Overlap */}
      <View style={styles.bottomSheet}>
        <View style={styles.sheetContent}>
          {/* Your Rank Card - Hero Style */}
          {userData && userLeague && (
            <View style={styles.yourRankCard}>
              {/* Status Banner */}
              <View style={[
                styles.rankStatusBanner,
                userData.rank <= userLeague.promotionCount ? styles.statusPromoting :
                  (userLeague.demotionCount > 0 && userData.rank > 50 - userLeague.demotionCount) ? styles.statusDemoting :
                    styles.statusSafe
              ]}>
                <Text style={[
                  styles.rankStatusText,
                  userData.rank <= userLeague.promotionCount ? styles.textPromoting :
                    (userLeague.demotionCount > 0 && userData.rank > 50 - userLeague.demotionCount) ? styles.textDemoting :
                      styles.textSafe
                ]}>
                  {userData.rank <= userLeague.promotionCount ? "🔥 You are in the Promotion Zone!" :
                    (userLeague.demotionCount > 0 && userData.rank > 50 - userLeague.demotionCount) ? "⚠️ Warning: Demotion Zone" :
                      "✅ You are in the Safe Zone"}
                </Text>
              </View>

              <View style={styles.yourRankContent}>
                <View style={styles.yourRankMain}>
                  <Text style={styles.yourRankLabel}>CURRENT RANK</Text>
                  <View style={styles.rankBadgeRow}>
                    <Text style={styles.yourRankValue}>#{userData.rank}</Text>
                    <View style={styles.leagueBadge}>
                      <Text style={styles.leagueBadgeText}>{userLeague.name}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.yourRankSteps}>
                  <Text style={styles.yourRankLabel}>TOTAL STEPS</Text>
                  <Text style={styles.stepsValue}>{userData.steps.toLocaleString()}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.findMeButton} onPress={jumpToUserRank} activeOpacity={0.8}>
                <Text style={styles.findMeText}>Find Me in List</Text>
                <Ionicons name="arrow-down-circle" size={18} color={Colors.white} />
              </TouchableOpacity>
            </View>
          )}

          {/* League Navigation - Tabs Style */}
          <View style={styles.tabsContainer}>
            {leagues.map((league, index) => (
              <TouchableOpacity
                key={league.id}
                onPress={() =>
                  flatListRef.current?.scrollToIndex({ index, animated: true })
                }
                style={[styles.tabItem, index === currentIndex && styles.tabItemActive]}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    index === currentIndex && styles.tabLabelActive,
                  ]}
                >
                  {league.name.split(" ")[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Horizontal Scrolling Leagues */}
          <FlatList
            ref={flatListRef}
            data={leagues}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            keyExtractor={(item) => item.id}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            renderItem={({ item }) => (
              <LeagueView
                league={item}
                scrollViewRef={(ref: any) => {
                  if (ref) leagueListRefs.current[item.id] = ref;
                }}
                refreshing={refreshing}
                onRefresh={onRefresh}
              />
            )}
          />
        </View>
      </View>
    </View>
  );
}

function LeagueView({ league, scrollViewRef, refreshing, onRefresh }: any) {
  return (
    <View style={styles.leaguePage}>
      <View style={styles.leagueInfoRow}>
        <View style={styles.leagueTimer}>
          <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.leagueTimerText}>{getTimeUntilEndOfMonth()} left</Text>
        </View>
        <Text style={styles.leagueRulesText}>
          Top {league.promotionCount} promote • Bottom {league.demotionCount} demote
        </Text>
      </View>

      <FlatList
        ref={scrollViewRef}
        data={league.users}
        keyExtractor={(item: any) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.brandBlue}
            colors={[Colors.brandBlue]}
          />
        }
        renderItem={({ item: user }) => {
          const isPromotion = user.rank <= league.promotionCount;
          const isDemotion = league.demotionCount > 0 && user.rank > 50 - league.demotionCount;

          return (
            <View style={[
              styles.userRow,
              user.isCurrentUser && styles.userRowHighlight
            ]}>
              <View style={styles.rankColumn}>
                <Text style={[
                  styles.userRank,
                  isPromotion && styles.rankPromoting,
                  isDemotion && styles.rankDemoting
                ]}>
                  {user.rank}
                </Text>
                {isPromotion && <Ionicons name="caret-up" size={10} color={Colors.success} />}
                {isDemotion && <Ionicons name="caret-down" size={10} color={Colors.error} />}
              </View>

              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{user.avatar}</Text>
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user.name}
                  {user.isCurrentUser && <Text style={styles.youIndicator}> (You)</Text>}
                </Text>
              </View>

              <Text style={styles.userSteps}>
                {user.steps.toLocaleString()}
              </Text>
            </View>
          );
        }}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brandBlue,
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },

  // Top Section
  topSection: {
    backgroundColor: Colors.brandBlue,
    paddingBottom: 40, // Space for overlap
    zIndex: 1,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: Colors.white,
    marginTop: 12,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
    marginBottom: 20,
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
  sheetContent: {
    flex: 1,
    paddingTop: 24,
  },

  // Your Rank Card
  yourRankCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: Colors.white,
    borderRadius: 24,
    // Shadow
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rankStatusBanner: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  statusPromoting: { backgroundColor: Colors.success + '20' }, // Light Green
  statusDemoting: { backgroundColor: Colors.error + '15' }, // Light Red
  statusSafe: { backgroundColor: Colors.brandBlue + '10' }, // Light Blue

  rankStatusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textPromoting: { color: Colors.success }, // Dark Green/Success Color
  textDemoting: { color: Colors.error },
  textSafe: { color: Colors.brandBlue },

  yourRankContent: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  yourRankMain: {
    gap: 4,
  },
  yourRankSteps: {
    alignItems: 'flex-end',
    gap: 4,
  },
  yourRankLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  yourRankValue: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  rankBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leagueBadge: {
    backgroundColor: Colors.brandBlue,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  leagueBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  stepsValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.brandBlue,
  },

  findMeButton: {
    backgroundColor: Colors.textPrimary, // Black/Dark
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  findMeText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },

  // Tabs Navigation
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 0,
  },
  tabItem: {
    paddingVertical: 12,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: Colors.brandBlue,
  },
  tabLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  tabLabelActive: {
    color: Colors.brandBlue,
    fontWeight: "700",
  },

  // League View
  leaguePage: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  leagueInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.cardBackground,
  },
  leagueTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  leagueTimerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  leagueRulesText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },

  // User Row
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  userRowHighlight: {
    backgroundColor: Colors.brandBlue + '08', // Very subtle blue tint
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },

  rankColumn: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  userRank: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  rankPromoting: {
    color: Colors.success,
  },
  rankDemoting: {
    color: Colors.error,
  },

  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  avatarText: {
    fontSize: 18,
  },

  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  youIndicator: {
    color: Colors.brandBlue,
    fontWeight: 'bold',
  },

  userSteps: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
});

// Challenge Leaderboard View Component (Preserved & Styled)
function ChallengeLeaderboardView({ challengeId, refreshing, onRefresh }: { challengeId: string, refreshing: boolean, onRefresh: () => void }) {
  const [leaderboard, setLeaderboard] = useState<any>(null);

  // Placeholder for future implementation matching new style
  return (
    <View style={styles.leaguePage}>
      <View style={{ padding: 24, alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <Text style={{ color: Colors.textSecondary, fontSize: 16 }}>Challenge Leaderboard</Text>
        <Text style={{ color: Colors.textTertiary, fontSize: 14, marginTop: 8 }}>Select a challenge to view active rankings</Text>
      </View>
    </View>
  );
}
