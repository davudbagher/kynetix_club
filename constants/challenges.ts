// constants/challenges.ts

export type ChallengeType = 'distance' | 'checkin' | 'streak';
export type ChallengeStatus = 'upcoming' | 'active' | 'completed';

// Sponsor branding for challenge screens
export interface Sponsor {
    name: string;
    logo: string; // emoji or URL
    primaryColor: string; // Hex color
    secondaryColor?: string;
}

// Challenge statistics
export interface ChallengeStats {
    totalDistance?: number; // in km
    totalSteps?: number;
    totalCheckIns?: number;
    teamCount?: number;
}

export interface Challenge {
    id: string;
    title: string;
    description: string;
    icon: string;

    // Challenge configuration
    type: ChallengeType;
    goal: number;
    goalUnit: 'steps' | 'km' | 'days' | 'checkins';

    // Timing
    startDate: string;  // ISO date string
    endDate: string;

    // Sponsorship (enhanced for branded screens)
    isSponsored: boolean;
    sponsor?: Sponsor;

    // Stats (enhanced for dedicated screens)
    participantCount: number;
    stats?: ChallengeStats;

    // Rewards
    rewardPoints: number;
    rewardBadge?: string;

    status: ChallengeStatus;
}

// Mock challenges for development
export const MOCK_CHALLENGES: Challenge[] = [
    {
        id: 'feb-100k',
        title: 'February 100km Challenge',
        description: 'Walk or run 100km this month. Track your progress daily and compete with friends!',
        icon: '🏃',
        type: 'distance',
        goal: 100,
        goalUnit: 'km',
        startDate: '2026-02-01T00:00:00Z',
        endDate: '2026-02-28T23:59:59Z',
        isSponsored: false,
        participantCount: 234,
        stats: {
            totalDistance: 15234, // Total km covered by all participants
            totalSteps: 21345678,
            teamCount: 12,
        },
        rewardPoints: 5000,
        rewardBadge: '🏅',
        status: 'active',
    },
    {
        id: 'squat-challenge',
        title: '30-Day Squat Challenge',
        description: 'Complete squats every day for 30 days. Build strength and win rewards!',
        icon: '🦵',
        type: 'streak',
        goal: 30,
        goalUnit: 'days',
        startDate: '2026-02-01T00:00:00Z',
        endDate: '2026-03-02T23:59:59Z',
        isSponsored: true,
        sponsor: {
            name: 'CrossFit Baku',
            logo: '🏋️',
            primaryColor: '#FF6B35',
            secondaryColor: '#2A2D34',
        },
        participantCount: 187,
        stats: {
            totalSteps: 0,
            teamCount: 8,
        },
        rewardPoints: 3000,
        rewardBadge: '💪',
        status: 'active',
    },
    {
        id: 'flame-towers',
        title: 'Climb Flame Towers Challenge',
        description: 'Climb the equivalent steps of Flame Towers (350m). A true Baku challenge!',
        icon: '🔥',
        type: 'distance',
        goal: 50000,
        goalUnit: 'steps',
        startDate: '2026-02-09T00:00:00Z',
        endDate: '2026-02-16T23:59:59Z',
        isSponsored: false,
        participantCount: 89,
        stats: {
            totalSteps: 2345678,
        },
        rewardPoints: 2000,
        rewardBadge: '🏔️',
        status: 'active',
    },
    {
        id: 'gym-week',
        title: 'Gym Warrior Week',
        description: 'Check in at the gym 5 times this week. Stay consistent!',
        icon: '🏋️‍♀️',
        type: 'checkin',
        goal: 5,
        goalUnit: 'checkins',
        startDate: '2026-02-09T00:00:00Z',
        endDate: '2026-02-15T23:59:59Z',
        isSponsored: true,
        sponsor: {
            name: 'Fit Zone Gym',
            logo: '💪',
            primaryColor: '#00D9FF',
            secondaryColor: '#1A1A2E',
        },
        participantCount: 156,
        stats: {
            totalCheckIns: 567,
            teamCount: 6,
        },
        rewardPoints: 1500,
        rewardBadge: '⚡',
        status: 'active',
    },
    {
        id: '7-day-streak',
        title: '7-Day Active Streak',
        description: 'Stay active for 7 consecutive days. Build the habit!',
        icon: '🔥',
        type: 'streak',
        goal: 7,
        goalUnit: 'days',
        startDate: '2026-02-09T00:00:00Z',
        endDate: '2026-02-16T23:59:59Z',
        isSponsored: false,
        participantCount: 421,
        rewardPoints: 1000,
        rewardBadge: '🔥',
        status: 'active',
    },
];

// Helper: Calculate time remaining
export const calculateTimeRemaining = (endDate: string): string => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
        return `${days}d ${hours}h left`;
    }

    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m left`;
};

// Helper: Format progress
export const formatProgress = (current: number, goal: number, unit: string): string => {
    const percentage = Math.min((current / goal) * 100, 100);

    if (unit === 'km') {
        return `${current.toFixed(1)} / ${goal} km (${percentage.toFixed(0)}%)`;
    }

    if (unit === 'steps') {
        return `${(current / 1000).toFixed(1)}k / ${(goal / 1000).toFixed(0)}k steps`;
    }

    return `${current} / ${goal} ${unit}`;
};

// Get active challenges
export const getActiveChallenges = (): Challenge[] => {
    return MOCK_CHALLENGES.filter(c => c.status === 'active');
};

// Get sponsored challenges
export const getSponsoredChallenges = (): Challenge[] => {
    return MOCK_CHALLENGES.filter(c => c.isSponsored && c.status === 'active');
};
