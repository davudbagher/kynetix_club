import ChallengeCard from "@/components/ChallengeCard";
import ChallengeDetailModal from "@/components/ChallengeDetailModal";
import SquadProgressWidget from "@/components/squad/SquadProgressWidget";
import { Challenge, MOCK_CHALLENGES } from "@/constants/challenges";
import Colors from "@/constants/Colors";
import { getMockChallengeProgress } from "@/constants/mockChallengeParticipation";
import { useChallenges } from "@/hooks/useChallenges";
import { useFriends } from "@/hooks/useFriends";
import { useSquads } from "@/hooks/useSquads";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ActivityScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Squad hook
  const { activeSquad, subscribeToActiveSquad } = useSquads();

  // Initialize with mock data immediately
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

  // Firebase hooks
  const { fetchActiveChallenges, joinChallenge, getUserChallengeProgress } = useChallenges();
  const { fetchFriends } = useFriends();

  // Get user ID on mount
  useEffect(() => {
    const getUserId = async () => {
      try {
        const savedUserId = await AsyncStorage.getItem('kynetix_user_id');
        if (savedUserId) {
          setUserId(savedUserId);
          // Subscribe to active squad
          subscribeToActiveSquad(savedUserId);
        }
      } catch (error) {
        console.error('Error getting userId:', error);
      }
    };
    getUserId();
  }, [subscribeToActiveSquad]);

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
      // Fetch friends first (needed for context if we had friend-related logic)
      await fetchFriends(userId);

      // Fetch challenges
      const fetchedChallenges = await fetchActiveChallenges();

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
  }, [userId]);


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
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.neonLime} />
        }
      >
        <Text style={styles.headerTitle}>Activity</Text>

        {/* Active Squad Widget - Only show if user has an active squad */}
        {activeSquad && (
          <View style={{ marginBottom: 24 }}>
            <SquadProgressWidget />
          </View>
        )}

        {/* Active Challenges Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Challenges</Text>
            <TouchableOpacity onPress={() => console.log('See all challenges')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.challengesList}>
            {challenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                userProgress={challengeProgressMap[challenge.id] || 0}
                onPress={() => handleChallengePress(challenge)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Removed Recent Activity Feed */}
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
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.white,
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 24,
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
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.white,
  },
  seeAllText: {
    color: Colors.neonLime,
    fontSize: 14,
    fontWeight: "600",
  },
  challengesList: {
    paddingLeft: 24,
  },
});
