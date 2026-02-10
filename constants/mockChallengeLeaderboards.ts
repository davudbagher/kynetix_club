// constants/mockChallengeLeaderboards.ts

export interface ChallengeLeaderboardUser {
    rank: number;
    userId: string;
    name: string;
    avatar: string;
    progress: number; // Actual progress (km, steps, days, etc.)
    progressPercent: number;
    isCurrentUser?: boolean;
}

export interface ChallengeLeaderboard {
    challengeId: string;
    users: ChallengeLeaderboardUser[];
}

const CURRENT_USER_ID = 'mock_user_123';

// Generate realistic Azerbaijani names and avatars
const generateUser = (
    rank: number,
    name: string,
    progress: number,
    progressPercent: number,
    userId?: string
): ChallengeLeaderboardUser => ({
    rank,
    userId: userId || `user_${rank}`,
    name,
    avatar: name.charAt(0).toUpperCase(),
    progress,
    progressPercent,
    isCurrentUser: userId === CURRENT_USER_ID,
});

// Mock leaderboards for each challenge
export const MOCK_CHALLENGE_LEADERBOARDS: ChallengeLeaderboard[] = [
    // February 100km Challenge
    {
        challengeId: 'feb-100k',
        users: [
            generateUser(1, 'Rashad Mammadov', 95.8, 95.8),
            generateUser(2, 'Leyla Hasanova', 89.2, 89.2),
            generateUser(3, 'Elchin Aliyev', 87.5, 87.5),
            generateUser(4, 'Aynur Huseynova', 84.3, 84.3),
            generateUser(5, 'Farid Ibrahimov', 81.7, 81.7),
            generateUser(6, 'Nigar Karimova', 78.9, 78.9),
            generateUser(7, 'Orkhan Rzayev', 76.4, 76.4),
            generateUser(8, 'Gulnara Mammadova', 74.1, 74.1),
            generateUser(9, 'Kamran Gasimov', 71.8, 71.8),
            generateUser(10, 'Sevinj Agayeva', 69.5, 69.5),
            // ... more users ...
            generateUser(42, 'Davud Baghir', 45.2, 45.2, CURRENT_USER_ID), // Current user at rank 42
            // ... more users to 50
            generateUser(43, 'Tural Ahmadov', 44.1, 44.1),
            generateUser(44, 'Aida Mustafayeva', 42.8, 42.8),
            generateUser(45, 'Emil Safarov', 41.2, 41.2),
        ],
    },

    // 30-Day Squat Challenge
    {
        challengeId: 'squat-challenge',
        users: [
            generateUser(1, 'Jamal Aliyev', 30, 100),
            generateUser(2, 'Sabina Huseynova', 28, 93.3),
            generateUser(3, 'Murad Mammadov', 27, 90),
            generateUser(4, 'Aysel Ismayilova', 26, 86.7),
            generateUser(5, 'Rustam Hasanov', 25, 83.3),
            generateUser(6, 'Gunay Aliyeva', 24, 80),
            generateUser(7, 'Togrul Karimov', 23, 76.7),
            generateUser(8, 'Mehriban Rzayeva', 22, 73.3),
            generateUser(9, 'Ilham Mammadov', 21, 70),
            generateUser(10, 'Lamiya Gasimova', 20, 66.7),
            // ... more users ...
            generateUser(15, 'Davud Baghir', 18, 60, CURRENT_USER_ID), // Current user at rank 15
            // ... more users
            generateUser(16, 'Arzu Huseynov', 17, 56.7),
            generateUser(17, 'Samira Aliyeva', 16, 53.3),
        ],
    },

    // Flame Towers Challenge (50k steps)
    {
        challengeId: 'flame-towers',
        users: [
            generateUser(1, 'Kanan Mammadov', 50000, 100),
            generateUser(2, 'Lala Hasanova', 48200, 96.4),
            generateUser(3, 'Perviz Aliyev', 46800, 93.6),
            generateUser(4, 'Sevda Huseynova', 45100, 90.2),
            generateUser(5, 'Zahid Karimov', 43500, 87),
            generateUser(6, 'Ulduz Mammadova', 41900, 83.8),
            generateUser(7, 'Vugar Rzayev', 40200, 80.4),
            generateUser(8, 'Matanat Aliyeva', 38700, 77.4),
            generateUser(9, 'Ramil Hasanov', 37100, 74.2),
            generateUser(10, 'Gunel Ibrahimova', 35600, 71.2),
            // Not joined yet - no current user entry
        ],
    },

    // Gym Warrior Week (5 check-ins)
    {
        challengeId: 'gym-week',
        users: [
            generateUser(1, 'Samir Mammadov', 5, 100),
            generateUser(2, 'Nargiz Aliyeva', 5, 100),
            generateUser(3, 'Anar Huseynov', 4, 80),
            generateUser(4, 'Aygun Karimova', 4, 80),
            generateUser(5, 'Elvin Hasanov', 4, 80),
            generateUser(6, 'Konul Rzayeva', 3, 60),
            generateUser(7, 'Rafael Mammadov', 3, 60),
            generateUser(8, 'Nilay Aliyeva', 3, 60),
            // Not joined yet - no current user entry
        ],
    },

    // 7-Day Active Streak
    {
        challengeId: '7-day-streak',
        users: [
            generateUser(1, 'Aydin Mammadov', 7, 100),
            generateUser(2, 'Nazrin Hasanova', 7, 100),
            generateUser(3, 'Fuad Aliyev', 7, 100),
            generateUser(4, 'Jamila Huseynova', 7, 100),
            generateUser(5, 'Vusal Karimov', 7, 100),
            generateUser(6, 'Shabnam Rzayeva', 7, 100),
            generateUser(7, 'Mubariz Mammadov', 7, 100),
            generateUser(8, 'Davud Baghir', 7, 100, CURRENT_USER_ID), // Completed!
            generateUser(9, 'Leyla Aliyeva', 6, 85.7),
            generateUser(10, 'Polad Hasanov', 6, 85.7),
        ],
    },
];

/**
 * Get leaderboard for a specific challenge
 */
export const getChallengeLeaderboard = (challengeId: string): ChallengeLeaderboard | null => {
    return MOCK_CHALLENGE_LEADERBOARDS.find(lb => lb.challengeId === challengeId) || null;
};

/**
 * Get current user's rank in a challenge
 */
export const getUserRankInChallenge = (challengeId: string, userId: string = CURRENT_USER_ID): number | null => {
    const leaderboard = getChallengeLeaderboard(challengeId);
    if (!leaderboard) return null;

    const user = leaderboard.users.find(u => u.userId === userId);
    return user?.rank || null;
};
