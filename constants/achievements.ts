// constants/achievements.ts

export type BadgeType =
    | 'distance_10k'
    | 'distance_50k'
    | 'distance_100k'
    | 'distance_500k'
    | 'streak_7'
    | 'streak_30'
    | 'streak_100'
    | 'challenges_1'
    | 'challenges_5'
    | 'challenges_10'
    | 'social_10'
    | 'social_50'
    | 'social_100'
    | 'early_adopter';

export interface Badge {
    id: BadgeType;
    name: string;
    description: string;
    icon: string;
    requirement: number;
    category: 'distance' | 'streak' | 'challenge' | 'social' | 'special';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    color: string;
}

export const BADGES: Record<BadgeType, Badge> = {
    // Distance Badges
    distance_10k: {
        id: 'distance_10k',
        name: 'First Steps',
        description: 'Walk 10,000 steps total',
        icon: '👣',
        requirement: 10000,
        category: 'distance',
        rarity: 'common',
        color: '#95E1D3',
    },
    distance_50k: {
        id: 'distance_50k',
        name: 'Marathon Walker',
        description: 'Walk 50,000 steps total',
        icon: '🚶',
        requirement: 50000,
        category: 'distance',
        rarity: 'rare',
        color: '#4ECDC4',
    },
    distance_100k: {
        id: 'distance_100k',
        name: 'Century Club',
        description: 'Walk 100,000 steps total',
        icon: '💎',
        requirement: 100000,
        category: 'distance',
        rarity: 'epic',
        color: '#3FA7FF',
    },
    distance_500k: {
        id: 'distance_500k',
        name: 'Legend',
        description: 'Walk 500,000 steps total',
        icon: '👑',
        requirement: 500000,
        category: 'distance',
        rarity: 'legendary',
        color: '#FFD700',
    },

    // Streak Badges
    streak_7: {
        id: 'streak_7',
        name: 'Week Warrior',
        description: 'Stay active for 7 days straight',
        icon: '🔥',
        requirement: 7,
        category: 'streak',
        rarity: 'common',
        color: '#FF9F1C',
    },
    streak_30: {
        id: 'streak_30',
        name: 'Monthly Master',
        description: 'Stay active for 30 days straight',
        icon: '⚡',
        requirement: 30,
        category: 'streak',
        rarity: 'rare',
        color: '#FF6B6B',
    },
    streak_100: {
        id: 'streak_100',
        name: 'Unstoppable',
        description: 'Stay active for 100 days straight',
        icon: '🌟',
        requirement: 100,
        category: 'streak',
        rarity: 'legendary',
        color: '#C6FF00',
    },

    // Challenge Badges
    challenges_1: {
        id: 'challenges_1',
        name: 'Challenger',
        description: 'Complete your first challenge',
        icon: '🎯',
        requirement: 1,
        category: 'challenge',
        rarity: 'common',
        color: '#A8E6CF',
    },
    challenges_5: {
        id: 'challenges_5',
        name: 'Champion',
        description: 'Complete 5 challenges',
        icon: '🏆',
        requirement: 5,
        category: 'challenge',
        rarity: 'rare',
        color: '#FFE66D',
    },
    challenges_10: {
        id: 'challenges_10',
        name: 'Elite Athlete',
        description: 'Complete 10 challenges',
        icon: '🥇',
        requirement: 10,
        category: 'challenge',
        rarity: 'epic',
        color: '#FFD700',
    },

    // Social Badges
    social_10: {
        id: 'social_10',
        name: 'Social Starter',
        description: 'Add 10 friends',
        icon: '👥',
        requirement: 10,
        category: 'social',
        rarity: 'common',
        color: '#FFD3B6',
    },
    social_50: {
        id: 'social_50',
        name: 'Influencer',
        description: 'Add 50 friends',
        icon: '🌐',
        requirement: 50,
        category: 'social',
        rarity: 'rare',
        color: '#FF9F1C',
    },
    social_100: {
        id: 'social_100',
        name: 'Community Leader',
        description: 'Add 100 friends',
        icon: '⭐',
        requirement: 100,
        category: 'social',
        rarity: 'epic',
        color: '#C6FF00',
    },

    // Special Badges
    early_adopter: {
        id: 'early_adopter',
        name: 'Early Adopter',
        description: 'Joined Kynetix Club in the first month!',
        icon: '🚀',
        requirement: 1,
        category: 'special',
        rarity: 'legendary',
        color: '#FF6B6B',
    },
};

// Get earned badges based on user stats
export const getEarnedBadges = (stats: {
    totalSteps: number;
    longestStreak: number;
    challengesCompleted: number;
    friendCount: number;
    isEarlyAdopter: boolean;
}): Badge[] => {
    const earned: Badge[] = [];

    // Distance badges
    if (stats.totalSteps >= 500000) earned.push(BADGES.distance_500k);
    else if (stats.totalSteps >= 100000) earned.push(BADGES.distance_100k);
    else if (stats.totalSteps >= 50000) earned.push(BADGES.distance_50k);
    else if (stats.totalSteps >= 10000) earned.push(BADGES.distance_10k);

    // Streak badges
    if (stats.longestStreak >= 100) earned.push(BADGES.streak_100);
    else if (stats.longestStreak >= 30) earned.push(BADGES.streak_30);
    else if (stats.longestStreak >= 7) earned.push(BADGES.streak_7);

    // Challenge badges
    if (stats.challengesCompleted >= 10) earned.push(BADGES.challenges_10);
    else if (stats.challengesCompleted >= 5) earned.push(BADGES.challenges_5);
    else if (stats.challengesCompleted >= 1) earned.push(BADGES.challenges_1);

    // Social badges
    if (stats.friendCount >= 100) earned.push(BADGES.social_100);
    else if (stats.friendCount >= 50) earned.push(BADGES.social_50);
    else if (stats.friendCount >= 10) earned.push(BADGES.social_10);

    // Special badges
    if (stats.isEarlyAdopter) earned.push(BADGES.early_adopter);

    return earned;
};

// Get all badges with locked status
export const getAllBadgesWithStatus = (stats: {
    totalSteps: number;
    longestStreak: number;
    challengesCompleted: number;
    friendCount: number;
    isEarlyAdopter: boolean;
}): Array<Badge & { unlocked: boolean; progress: number }> => {
    const earnedIds = getEarnedBadges(stats).map(b => b.id);

    return Object.values(BADGES).map(badge => ({
        ...badge,
        unlocked: earnedIds.includes(badge.id),
        progress: calculateBadgeProgress(badge, stats),
    }));
};

// Calculate progress toward a badge (0-100)
const calculateBadgeProgress = (
    badge: Badge,
    stats: {
        totalSteps: number;
        longestStreak: number;
        challengesCompleted: number;
        friendCount: number;
    }
): number => {
    let current = 0;

    switch (badge.category) {
        case 'distance':
            current = stats.totalSteps;
            break;
        case 'streak':
            current = stats.longestStreak;
            break;
        case 'challenge':
            current = stats.challengesCompleted;
            break;
        case 'social':
            current = stats.friendCount;
            break;
        default:
            return 0;
    }

    return Math.min((current / badge.requirement) * 100, 100);
};
