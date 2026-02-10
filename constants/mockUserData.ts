// constants/mockUserData.ts
import { getEarnedBadges } from './achievements';

export interface UserProfile {
    userId: string;
    fullName: string;
    joinedDate: string;
    bio?: string;

    // Stats
    totalSteps: number;
    currentStreak: number;
    longestStreak: number;
    challengesCompleted: number;
    activeChallenges: number;
    friendCount: number;

    // Social
    isFriend: boolean;
    isFollowing: boolean;
}

// Mock user profiles for development
export const MOCK_USER_PROFILES: Record<string, UserProfile> = {
    'user_davud': {
        userId: 'user_davud',
        fullName: 'Davud Baghir',
        joinedDate: '2026-01-15',
        bio: 'Fitness enthusiast from Baku 🇦🇿 | Running addict | CrossFit lover',
        totalSteps: 125000,
        currentStreak: 12,
        longestStreak: 21,
        challengesCompleted: 3,
        activeChallenges: 2,
        friendCount: 24,
        isFriend: false,
        isFollowing: false,
    },
    'user_sara': {
        userId: 'user_sara',
        fullName: 'Sara Aliyeva',
        joinedDate: '2026-01-20',
        bio: 'CrossFit athlete | Marathon runner 🏃‍♀️',
        totalSteps: 180000,
        currentStreak: 23,
        longestStreak: 45,
        challengesCompleted: 7,
        activeChallenges: 3,
        friendCount: 52,
        isFriend: false,
        isFollowing: false,
    },
    'user_ali': {
        userId: 'user_ali',
        fullName: 'Ali Mammadov',
        joinedDate: '2026-01-18',
        totalSteps: 95000,
        currentStreak: 7,
        longestStreak: 14,
        challengesCompleted: 2,
        activeChallenges: 1,
        friendCount: 18,
        isFriend: true,
        isFollowing: true,
    },
    'user_nihad': {
        userId: 'user_nihad',
        fullName: 'Nihad Hasanov',
        joinedDate: '2026-02-01',
        bio: 'Running is my therapy 🏃',
        totalSteps: 65000,
        currentStreak: 9,
        longestStreak: 9,
        challengesCompleted: 1,
        activeChallenges: 2,
        friendCount: 15,
        isFriend: false,
        isFollowing: false,
    },
};

// Get user profile by name (for testing)
export const getUserProfileByName = (fullName: string): UserProfile | undefined => {
    return Object.values(MOCK_USER_PROFILES).find(
        profile => profile.fullName === fullName
    );
};

// Get user stats for badge calculation
export const getUserStats = (userId: string) => {
    const profile = MOCK_USER_PROFILES[userId];
    if (!profile) return null;

    return {
        totalSteps: profile.totalSteps,
        longestStreak: profile.longestStreak,
        challengesCompleted: profile.challengesCompleted,
        friendCount: profile.friendCount,
        isEarlyAdopter: new Date(profile.joinedDate) < new Date('2026-02-01'),
    };
};

// Get user badges
export const getUserBadges = (userId: string) => {
    const stats = getUserStats(userId);
    if (!stats) return [];

    return getEarnedBadges(stats);
};
