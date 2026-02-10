// hooks/useChallenges.ts
import { db } from '@/config/firebase';
import { Challenge } from '@/constants/challenges';
import { getMockChallengeProgress, mockJoinChallenge } from '@/constants/mockChallengeParticipation';
import { CacheKeys, CacheTTL, getCachedData, setCachedData } from '@/utils/cacheHelper';
import { collection, doc, getDoc, getDocs, increment, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { useCallback, useState } from 'react';

export interface ChallengeParticipant {
    id: string;
    challengeId: string;
    userId: string;
    currentProgress: number;
    progressPercent: number;
    status: 'active' | 'completed' | 'failed';
    rank?: number;
    joinedAt: Date;
    lastUpdatedAt: Date;
    completedAt?: Date;
}

export const useChallenges = () => {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isUsingMockData, setIsUsingMockData] = useState(false);

    /**
     * Fetch active challenges with caching
     */
    const fetchActiveChallenges = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Check cache first
            const cached = await getCachedData<Challenge[]>(
                CacheKeys.ACTIVE_CHALLENGES,
                CacheTTL.CHALLENGES
            );

            if (cached) {
                console.log('📦 Using cached challenges');
                setChallenges(cached);
                setLoading(false);
                return cached;
            }

            console.log('🔍 Fetching challenges from Firestore...');

            const challengesQuery = query(
                collection(db, 'challenges'),
                where('status', '==', 'active')
            );

            const snapshot = await getDocs(challengesQuery);

            let fetchedChallenges: Challenge[] = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    title: data.title,
                    description: data.description,
                    icon: data.icon,
                    type: data.type,
                    goal: data.goal,
                    goalUnit: data.goalUnit,
                    startDate: data.startDate?.toDate?.()?.toISOString() || data.startDate,
                    endDate: data.endDate?.toDate?.()?.toISOString() || data.endDate,
                    isSponsored: data.isSponsored || false,
                    sponsorName: data.sponsorName,
                    sponsorLogo: data.sponsorLogo,
                    participantCount: data.participantCount || 0,
                    rewardPoints: data.rewardPoints,
                    rewardBadge: data.rewardBadge,
                    status: data.status,
                };
            });

            // FALLBACK: Use mock data if Firebase is empty (for testing)
            if (fetchedChallenges.length === 0) {
                console.log('⚠️ No Firebase challenges found, using mock data for testing');
                const { getActiveChallenges } = await import('@/constants/challenges');
                fetchedChallenges = getActiveChallenges();
                setIsUsingMockData(true); // Track that we're in mock mode
            } else {
                setIsUsingMockData(false); // Using real Firebase data
            }

            console.log(`✅ Fetched ${fetchedChallenges.length} challenges`);

            // Cache the result
            await setCachedData(CacheKeys.ACTIVE_CHALLENGES, fetchedChallenges);

            setChallenges(fetchedChallenges);
            setLoading(false);
            return fetchedChallenges;
        } catch (err: any) {
            console.error('Error fetching challenges:', err);
            setError(err.message);
            setLoading(false);
            return [];
        }
    }, []);

    /**
     * Join a challenge
     */
    const joinChallenge = useCallback(async (userId: string, challengeId: string) => {
        try {
            console.log('🎯 Joining challenge:', challengeId);

            // If using mock data, simulate joining
            if (isUsingMockData) {
                const success = mockJoinChallenge(userId, challengeId);
                return success;
            }

            // Otherwise use Firebase
            const participantId = `${userId}_${challengeId}`;
            const participantRef = doc(db, 'challenge_participants', participantId);

            // Create participant document
            await setDoc(participantRef, {
                id: participantId,
                challengeId,
                userId,
                currentProgress: 0,
                progressPercent: 0,
                status: 'active',
                joinedAt: new Date(),
                lastUpdatedAt: new Date(),
            });

            // Increment participant count on challenge
            const challengeRef = doc(db, 'challenges', challengeId);
            await updateDoc(challengeRef, {
                participantCount: increment(1),
            });

            console.log('✅ Successfully joined challenge');
            return true;
        } catch (err: any) {
            console.error('Error joining challenge:', err);
            setError(err.message);
            return false;
        }
    }, [isUsingMockData]);

    /**
     * Get user's progress in a challenge
     */
    const getUserChallengeProgress = useCallback(
        async (userId: string, challengeId: string): Promise<number> => {
            try {
                // If using mock data, return mock progress
                if (isUsingMockData) {
                    const mockProgress = getMockChallengeProgress(userId, challengeId);
                    console.log(`📊 Mock progress for ${challengeId}:`, mockProgress);
                    return mockProgress;
                }

                // Otherwise fetch from Firebase
                const participantId = `${userId}_${challengeId}`;
                const participantRef = doc(db, 'challenge_participants', participantId);
                const participantDoc = await getDoc(participantRef);

                if (participantDoc.exists()) {
                    return participantDoc.data().progressPercent || 0;
                }

                return 0;
            } catch (err: any) {
                console.error('Error getting challenge progress:', err);
                // Fallback to mock data on error
                if (isUsingMockData) {
                    return getMockChallengeProgress(userId, challengeId);
                }
                return 0;
            }
        },
        [isUsingMockData]
    );

    /**
     * Update user's challenge progress (batched - call every 10% or on completion)
     */
    const updateChallengeProgress = useCallback(
        async (userId: string, challengeId: string, newProgress: number, goal: number) => {
            try {
                const participantId = `${userId}_${challengeId}`;
                const participantRef = doc(db, 'challenge_participants', participantId);

                const progressPercent = Math.min((newProgress / goal) * 100, 100);

                const updateData: any = {
                    currentProgress: newProgress,
                    progressPercent,
                    lastUpdatedAt: new Date(),
                };

                // Check if completed
                if (newProgress >= goal) {
                    updateData.status = 'completed';
                    updateData.completedAt = new Date();

                    console.log('🎉 Challenge completed!');
                }

                await updateDoc(participantRef, updateData);

                console.log(`✅ Updated challenge progress: ${progressPercent.toFixed(0)}%`);
                return true;
            } catch (err: any) {
                console.error('Error updating challenge progress:', err);
                return false;
            }
        },
        []
    );

    /**
     * Get leaderboard for a specific challenge
     */
    const getChallengeLeaderboard = useCallback(async (challengeId: string) => {
        try {
            // If using mock data, return mock leaderboard
            if (isUsingMockData) {
                const { getChallengeLeaderboard: getMockLeaderboard } = require('@/constants/mockChallengeLeaderboards');
                return getMockLeaderboard(challengeId);
            }

            // TODO: Fetch from Firebase 'challenge_leaderboards' collection
            // For now, fall back to mock data
            const { getChallengeLeaderboard: getMockLeaderboard } = require('@/constants/mockChallengeLeaderboards');
            return getMockLeaderboard(challengeId);
        } catch (err: any) {
            console.error('❌ Error fetching challenge leaderboard:', err);
            return null;
        }
    }, [isUsingMockData]);

    return {
        challenges,
        loading,
        error,
        isUsingMockData,
        fetchActiveChallenges,
        joinChallenge,
        getUserChallengeProgress,
        updateChallengeProgress,
        getChallengeLeaderboard,
    };
};
