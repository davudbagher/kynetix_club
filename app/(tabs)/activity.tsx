import ActivityFeedItem from "@/components/ActivityFeedItem";
import ChallengeCard from "@/components/ChallengeCard";
import ChallengeDetailModal from "@/components/ChallengeDetailModal";
import { Challenge, MOCK_CHALLENGES } from "@/constants/challenges";
import Colors from "@/constants/Colors";
import { MOCK_ACTIVITIES } from "@/constants/mockActivityData";
import { getMockChallengeProgress } from "@/constants/mockChallengeParticipation";
import { useActivities } from "@/hooks/useActivities";
import { useChallenges } from "@/hooks/useChallenges";
import { useFriends } from "@/hooks/useFriends";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FeedTab = 'everyone' | 'following';

export default function ActivityScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FeedTab>('everyone');
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Initialize with mock data immediately (like Wallet tab with PARTNERS)
  const [challenges, setChallenges] = useState<Challenge[]>(MOCK_CHALLENGES.filter(c => c.status === 'active'));
  const [challengeProgressMap, setChallengeProgressMap] = useState<Record<string, number>>(() => {
    // Calculate initial progress map from mock data
    const mockUserId = 'mock_user_123';
    const progressMap: Record<string, number> = {};
    MOCK_CHALLENGES.forEach(challenge => {
      if (challenge.status === 'active') {
        progressMap[challenge.id] = getMockChallengeProgress(mockUserId, challenge.id);
      }
    });
    return progressMap;
  });

  // Initialize activities with mock data
  const [activities, setActivities] = useState(MOCK_ACTIVITIES.map(mock => ({
    ...mock,
    createdAt: new Date(mock.createdAt)
  })));

  // Firebase hooks (for future Firebase integration)
  const { fetchActivities } = useActivities();
  const { fetchActiveChallenges, joinChallenge, getUserChallengeProgress } = useChallenges();
  const { friendIds, fetchFriends } = useFriends();

  // Get user ID on mount
  useEffect(() => {
    const getUserId = async () => {
      try {
        const savedUserId = await AsyncStorage.getItem('userId');
        if (savedUserId) {
          setUserId(savedUserId);
        }
      } catch (error) {
        console.error('Error getting userId:', error);
      }
    };
    getUserId();
  }, []);

  // Initial load
  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  // Load all data
  const loadData = async () => {
    if (!userId) return;

    try {
      // Fetch friends first (needed for Following tab)
      const friends = await fetchFriends(userId);

      // Fetch challenges and activities in parallel
      const [fetchedChallenges] = await Promise.all([
        fetchActiveChallenges(),
        fetchActivities(activeTab, friends),
      ]);

      // Fetch user progress for each challenge
      if (fetchedChallenges && fetchedChallenges.length > 0) {
        const progressMap: Record<string, number> = {};
        await Promise.all(
          fetchedChallenges.map(async (challenge) => {
            const progress = await getUserChallengeProgress(userId, challenge.id);
            progressMap[challenge.id] = progress;
          })
        );
        setChallengeProgressMap(progressMap);
        console.log('📊 Challenge progress map:', progressMap);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    await loadData();

    setRefreshing(false);
  }, [activeTab, userId]);

  // Handle celebration
  const handleCelebrate = (activityId: string) => {
    console.log('Celebrated activity:', activityId);
    // TODO: Update Firebase celebration count with increment
    // await updateDoc(doc(db, 'activities', activityId), {
    //   celebrationCount: increment(1)
    // });
  };

  // Handle user profile navigation
  const handlePressUser = (userName: string) => {
    router.push({
      pathname: '/user-profile',
      params: { userName },
    });
  };

  // Handle tab change
  const handleTabChange = async (tab: FeedTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);

    // Fetch activities for the new tab
    if (userId) {
      await fetchActivities(tab, friendIds);
    }
  };

  // Handle challenge press
  const handleChallengePress = (challenge: Challenge) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedChallenge(challenge);
    setModalVisible(true);
  };

  // Handle join challenge
  const handleJoinChallenge = async () => {
    if (!userId || !selectedChallenge) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const success = await joinChallenge(userId, selectedChallenge.id);

    if (success) {
      console.log('✅ Joined challenge successfully');
      setModalVisible(false);

      // Update progress map to show newly joined challenge
      setChallengeProgressMap(prev => ({
        ...prev,
        [selectedChallenge.id]: 0,
      }));

      // Refresh challenges to update participant count
      await fetchActiveChallenges();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.neonLime}
            colors={[Colors.neonLime]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Activity</Text>
            <Text style={styles.subtitle}>What's happening now</Text>
          </View>
        </View>

        {/* Active Challenges Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Challenges</Text>
            <Text style={styles.sectionCount}>{challenges.length}</Text>
          </View>

          {challenges.length > 0 ? (
            <FlatList
              data={challenges}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.challengesList}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ChallengeCard
                  challenge={item}
                  userProgress={challengeProgressMap[item.id] || 0}
                  onPress={() => handleChallengePress(item)}
                />
              )}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No active challenges</Text>
            </View>
          )}
        </View>

        {/* Activity Feed Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
          </View>

          {/* Feed Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'everyone' && styles.tabActive]}
              onPress={() => handleTabChange('everyone')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'everyone' && styles.tabTextActive]}>
                Everyone
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'following' && styles.tabActive]}
              onPress={() => handleTabChange('following')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'following' && styles.tabTextActive]}>
                Following
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.feedContainer}>
            {activities.length > 0 ? (
              activities.map((activity) => (
                <ActivityFeedItem
                  key={activity.id}
                  id={activity.id}
                  userName={activity.userName}
                  activityType={activity.activityType}
                  title={activity.title}
                  points={activity.points}
                  celebrationCount={activity.celebrationCount}
                  locationName={activity.locationName}
                  createdAt={activity.createdAt}
                  onCelebrate={handleCelebrate}
                  onPressUser={handlePressUser}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  {activeTab === 'following' ? 'No activities from friends yet' : 'No activities yet'}
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  {activeTab === 'following' ? 'Add friends to see their activity here!' : 'Start moving to see activity!'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Challenge Detail Modal */}
      <ChallengeDetailModal
        challenge={selectedChallenge}
        userProgress={selectedChallenge ? challengeProgressMap[selectedChallenge.id] || 0 : 0}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onJoin={handleJoinChallenge}
      />
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: Colors.white,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.white,
  },
  sectionCount: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.neonLime,
    backgroundColor: Colors.black,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  challengesList: {
    paddingLeft: 24,
  },
  feedContainer: {
    paddingHorizontal: 24,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.black,
    borderWidth: 1,
    borderColor: Colors.cardGrey,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.neonLime,
    borderColor: Colors.neonLime,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.black,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    opacity: 0.7,
  },
});
