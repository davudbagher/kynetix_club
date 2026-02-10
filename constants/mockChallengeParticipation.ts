// constants/mockChallengeParticipation.ts

export interface MockChallengeParticipant {
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

// Mock user ID for testing
export const MOCK_USER_ID = 'mock_user_123';

// Mock challenge participation data
// This simulates different states: not joined, in progress, and completed
export const MOCK_CHALLENGE_PARTICIPANTS: MockChallengeParticipant[] = [
    {
        id: `${MOCK_USER_ID}_feb-100k`,
        challengeId: 'feb-100k',
        userId: MOCK_USER_ID,
        currentProgress: 45.2,  // 45.2 km out of 100 km
        progressPercent: 45,
        status: 'active',
        rank: 42,
        joinedAt: new Date('2026-02-03T10:00:00Z'),
        lastUpdatedAt: new Date('2026-02-10T08:30:00Z'),
    },
    {
        id: `${MOCK_USER_ID}_squat-challenge`,
        challengeId: 'squat-challenge',
        userId: MOCK_USER_ID,
        currentProgress: 18,  // 18 days out of 30 days
        progressPercent: 60,
        status: 'active',
        rank: 15,
        joinedAt: new Date('2026-02-01T00:00:00Z'),
        lastUpdatedAt: new Date('2026-02-10T07:00:00Z'),
    },
    {
        id: `${MOCK_USER_ID}_7-day-streak`,
        challengeId: '7-day-streak',
        userId: MOCK_USER_ID,
        currentProgress: 7,  // 7 days out of 7 days - COMPLETED!
        progressPercent: 100,
        status: 'completed',
        rank: 8,
        joinedAt: new Date('2026-02-03T00:00:00Z'),
        lastUpdatedAt: new Date('2026-02-10T00:00:00Z'),
        completedAt: new Date('2026-02-10T00:00:00Z'),
    },
    // flame-towers - not joined yet (no entry)
    // gym-week - not joined yet (no entry)
];

/**
 * Get user's progress in a specific challenge
 * Returns progress percent (0-100) or 0 if not joined
 */
export const getMockChallengeProgress = (userId: string, challengeId: string): number => {
    const participation = MOCK_CHALLENGE_PARTICIPANTS.find(
        p => p.userId === userId && p.challengeId === challengeId
    );

    return participation?.progressPercent || 0;
};

/**
 * Get full participation data for a challenge
 */
export const getMockChallengeParticipation = (
    userId: string,
    challengeId: string
): MockChallengeParticipant | null => {
    return MOCK_CHALLENGE_PARTICIPANTS.find(
        p => p.userId === userId && p.challengeId === challengeId
    ) || null;
};

/**
 * Simulate joining a challenge (for mock mode)
 */
export const mockJoinChallenge = (userId: string, challengeId: string): boolean => {
    // Check if already joined
    const existing = MOCK_CHALLENGE_PARTICIPANTS.find(
        p => p.userId === userId && p.challengeId === challengeId
    );

    if (existing) {
        console.log('⚠️ Mock: Already joined this challenge');
        return false;
    }

    // Create new participation entry
    const newParticipation: MockChallengeParticipant = {
        id: `${userId}_${challengeId}`,
        challengeId,
        userId,
        currentProgress: 0,
        progressPercent: 0,
        status: 'active',
        joinedAt: new Date(),
        lastUpdatedAt: new Date(),
    };

    MOCK_CHALLENGE_PARTICIPANTS.push(newParticipation);
    console.log('✅ Mock: Successfully joined challenge:', challengeId);
    return true;
};

/**
 * Get all challenges the user has joined
 */
export const getMockUserChallenges = (userId: string): MockChallengeParticipant[] => {
    return MOCK_CHALLENGE_PARTICIPANTS.filter(p => p.userId === userId);
};
