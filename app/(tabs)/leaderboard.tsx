import Colors from "@/constants/Colors";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { getTimeUntilEndOfMonth } from "@/utils/timeUtils";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function LeaderboardScreen() {
  // Get data from hook (includes userLeague and userData!)
  const { leagues, isLoading, userLeague, userData } = useLeaderboard();

  console.log("🎮 LeaderboardScreen render:", {
    isLoading,
    leaguesCount: leagues.length,
    hasUserLeague: !!userLeague,
    hasUserData: !!userData,
    userLeagueName: userLeague?.name,
    userRank: userData?.rank,
    userSteps: userData?.steps,
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollViewRef = useRef<ScrollView>(null);

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
    if (userData && scrollViewRef.current) {
      const rowHeight = 60;
      const offset = (userData.rank - 1) * rowHeight;
      scrollViewRef.current.scrollTo({ y: offset, animated: true });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.neonLime} />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Leaderboard</Text>
        <Text style={styles.subtitle}>Climb the leagues of Baku</Text>
      </View>

      {/* Your Rank Card - Shows when data loaded */}
      {userData && userLeague && (
        <View style={styles.yourRankCard}>
          <View style={styles.yourRankHeader}>
            <View>
              <Text style={styles.yourRankLabel}>Your League</Text>
              <Text style={styles.yourRankLeague}>{userLeague.name}</Text>
            </View>
            <TouchableOpacity
              style={styles.jumpButton}
              onPress={jumpToUserRank}
            >
              <Ionicons name="locate" size={16} color={Colors.black} />
              <Text style={styles.jumpButtonText}>Find Me</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.yourRankStats}>
            <View style={styles.yourRankStat}>
              <Text style={styles.yourRankStatLabel}>Rank</Text>
              <Text style={styles.yourRankStatValue}>#{userData.rank}</Text>
            </View>
            <View style={styles.yourRankStat}>
              <Text style={styles.yourRankStatLabel}>Steps</Text>
              <Text style={styles.yourRankStatValue}>
                {userData.steps.toLocaleString()}
              </Text>
            </View>
            <View style={styles.yourRankStat}>
              <Text style={styles.yourRankStatLabel}>Status</Text>
              <Text style={styles.yourRankStatValue}>
                {userData.rank <= userLeague.promotionCount
                  ? "⬆️"
                  : userData.rank > 50 - userLeague.demotionCount
                    ? "⬇️"
                    : "✅"}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* League Dots Navigation */}
      <View style={styles.dotsContainer}>
        {leagues.map((league, index) => (
          <TouchableOpacity
            key={league.id}
            onPress={() =>
              flatListRef.current?.scrollToIndex({ index, animated: true })
            }
            style={styles.dotWrapper}
          >
            <View
              style={[styles.dot, index === currentIndex && styles.dotActive]}
            />
            <Text
              style={[
                styles.dotLabel,
                index === currentIndex && styles.dotLabelActive,
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
          <LeagueCard league={item} scrollViewRef={scrollViewRef} />
        )}
      />
    </SafeAreaView>
  );
}

function LeagueCard({ league, scrollViewRef }: any) {
  return (
    <View style={styles.card}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.cardContent}
      >
        {/* League Header with Timer */}
        <View style={styles.leagueHeader}>
          <View>
            <Text style={styles.leagueName}>{league.name}</Text>
            <Text style={styles.leagueSubtitle}>
              Top {league.promotionCount} advance
              {league.demotionCount > 0 &&
                ` • Bottom ${league.demotionCount} demote`}
            </Text>
          </View>
          <View style={styles.timerBadge}>
            <Ionicons name="time-outline" size={14} color={Colors.neonLime} />
            <Text style={styles.timerText}>
              {getTimeUntilEndOfMonth()} left
            </Text>
          </View>
        </View>

        {/* Users List */}
        <View style={styles.usersList}>
          {league.users.map((user: any) => {
            const isPromotion = user.rank <= league.promotionCount;
            const isDemotion =
              league.demotionCount > 0 && user.rank > 50 - league.demotionCount;

            return (
              <View
                key={user.id}
                style={[
                  styles.userRow,
                  user.isCurrentUser && styles.userRowHighlight,
                ]}
              >
                {/* Promotion/Demotion Border */}
                {isPromotion && <View style={styles.promotionBorder} />}
                {isDemotion && <View style={styles.demotionBorder} />}

                <Text style={styles.userRank}>{user.rank}</Text>
                <Text style={styles.userAvatar}>{user.avatar}</Text>
                <Text style={styles.userName} numberOfLines={1}>
                  {user.name}
                  {user.isCurrentUser && " 👈"}
                </Text>
                <Text style={styles.userSteps}>
                  {user.steps.toLocaleString()}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkGrey,
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: Colors.lightGrey,
    marginTop: 16,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.lightGrey,
  },

  // Your Rank Card
  yourRankCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: Colors.black,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.neonLime,
  },
  yourRankHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  yourRankLabel: {
    fontSize: 12,
    color: Colors.lightGrey,
    marginBottom: 4,
  },
  yourRankLeague: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.white,
  },
  jumpButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.neonLime,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  jumpButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: Colors.black,
  },
  yourRankStats: {
    flexDirection: "row",
    gap: 12,
  },
  yourRankStat: {
    flex: 1,
    alignItems: "center",
  },
  yourRankStatLabel: {
    fontSize: 11,
    color: Colors.lightGrey,
    marginBottom: 4,
  },
  yourRankStatValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.neonLime,
  },

  // Dots Navigation
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  dotWrapper: {
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.cardGrey,
  },
  dotActive: {
    backgroundColor: Colors.neonLime,
  },
  dotLabel: {
    fontSize: 10,
    color: Colors.lightGrey,
  },
  dotLabelActive: {
    color: Colors.neonLime,
    fontWeight: "bold",
  },

  // League Cards
  card: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: 20,
  },
  cardContent: {
    paddingBottom: 20,
  },

  leagueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  leagueName: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.white,
    marginBottom: 4,
  },
  leagueSubtitle: {
    fontSize: 12,
    color: Colors.lightGrey,
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.black,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timerText: {
    fontSize: 12,
    color: Colors.neonLime,
    fontWeight: "600",
  },

  // Users List
  usersList: {
    gap: 8,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.black,
    padding: 12,
    borderRadius: 12,
    gap: 12,
    position: "relative",
  },
  userRowHighlight: {
    backgroundColor: Colors.neonLime + "20",
    borderWidth: 2,
    borderColor: Colors.neonLime,
  },

  promotionBorder: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#FFD700",
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  demotionBorder: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#FF4444",
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },

  userRank: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.lightGrey,
    width: 28,
  },
  userAvatar: {
    fontSize: 24,
  },
  userName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.white,
  },
  userSteps: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.neonLime,
  },
});
