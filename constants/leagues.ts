// constants/leagues.ts

export interface League {
    id: string;
    name: string;
    minSteps: number;
    maxSteps: number;
    emoji: string;
    color: string;
    promotionCount: number;
    demotionCount: number;
}

// Unified league definitions used across the app
export const LEAGUES: League[] = [
    {
        id: "bronze",
        name: "Başlanğıc League",
        minSteps: 0,
        maxSteps: 50000,
        emoji: "🥉",
        color: "#CD7F32",
        promotionCount: 10,
        demotionCount: 0,
    },
    {
        id: "silver",
        name: "Gümüş League",
        minSteps: 50000,
        maxSteps: 150000,
        emoji: "🥈",
        color: "#C0C0C0",
        promotionCount: 10,
        demotionCount: 10,
    },
    {
        id: "gold",
        name: "Qızıl League",
        minSteps: 150000,
        maxSteps: 300000,
        emoji: "🥇",
        color: "#FFD700",
        promotionCount: 10,
        demotionCount: 10,
    },
    {
        id: "platinum",
        name: "Platin League",
        minSteps: 300000,
        maxSteps: 500000,
        emoji: "💎",
        color: "#E5E4E2",
        promotionCount: 10,
        demotionCount: 10,
    },
    {
        id: "champion",
        name: "Çempion League",
        minSteps: 500000,
        maxSteps: Infinity,
        emoji: "👑",
        color: "#F1C40F",
        promotionCount: 0,
        demotionCount: 10,
    },
];

/**
 * Get the league a user belongs to based on total steps
 */
export function getUserLeague(totalStepsAllTime: number): League {
    return (
        LEAGUES.find(
            (league) =>
                totalStepsAllTime >= league.minSteps &&
                totalStepsAllTime < league.maxSteps,
        ) || LEAGUES[0]
    );
}

/**
 * Get league by ID
 */
export function getLeagueById(id: string): League | undefined {
    return LEAGUES.find((league) => league.id === id);
}
