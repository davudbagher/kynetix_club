// constants/mockLeaderboardData.ts

export interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  steps: number;
  rank: number;
  isCurrentUser?: boolean;
}

export interface League {
  id: string;
  name: string;
  tierNumber: number; // 1 = Bronze, 5 = Champion
  promotionCount: number; // How many get promoted
  demotionCount: number; // How many get demoted
  sponsorName?: string; // For future: "Nike Silver League"
  users: LeaderboardUser[];
}

// Azerbaijani names
const AZERBAIJANI_NAMES = [
  "Rashad K.",
  "Aysel M.",
  "Elvin B.",
  "Sara L.",
  "Ali H.",
  "Nigar F.",
  "Tural M.",
  "Leyla S.",
  "Kamran R.",
  "Anar J.",
  "Gulnar A.",
  "Farid T.",
  "Samira N.",
  "Orkhan M.",
  "Zarifa K.",
  "Vugar S.",
  "Sevda G.",
  "Murad H.",
  "Gunel P.",
  "Ramil B.",
  "Arzu Y.",
  "Teymur L.",
  "Narmina K.",
  "Ilham F.",
  "Gunay M.",
  "Rovshan A.",
  "Ulviyya S.",
  "Samir N.",
  "Mehriban T.",
  "Ruslan K.",
  "Lamiya H.",
  "Mahir G.",
  "Sevinj P.",
  "Elnur B.",
  "Konul Y.",
  "Rafiq L.",
  "Sabina K.",
  "Togrul F.",
  "Aygun M.",
  "Namiq A.",
  "Parvana S.",
  "Jalal N.",
  "Farida T.",
  "Shahin K.",
  "Roya H.",
  "Fuad G.",
  "Dilara P.",
  "Emil B.",
  "Nargiz Y.",
  "Cavid L.",
];

const AVATARS = [
  "👨🏻",
  "👩🏻",
  "👨🏻‍💼",
  "👩🏻‍💼",
  "🧑🏻",
  "👨🏻‍🦱",
  "👩🏻‍🦱",
  "👨🏻‍🦰",
  "👩🏻‍🦰",
  "🧔🏻",
  "👴🏻",
  "👵🏻",
  "🧑🏻‍🎓",
  "👨🏻‍🏫",
  "👩🏻‍🏫",
  "👨🏻‍⚕️",
  "👩🏻‍⚕️",
  "👨🏻‍🍳",
  "👩🏻‍🍳",
  "🧑🏻‍💻",
];

// Generate users for a league
function generateLeagueUsers(
  count: number,
  baseSteps: number,
  variance: number,
  currentUserRank?: number,
): LeaderboardUser[] {
  const users: LeaderboardUser[] = [];

  for (let i = 0; i < count; i++) {
    const isCurrentUser = currentUserRank ? i + 1 === currentUserRank : false;
    const name = isCurrentUser
      ? "Davud B."
      : AZERBAIJANI_NAMES[i % AZERBAIJANI_NAMES.length];
    const avatar = isCurrentUser ? "🧑🏻‍💻" : AVATARS[i % AVATARS.length];

    const steps = Math.floor(
      baseSteps - i * variance + Math.random() * variance * 0.3,
    );

    users.push({
      id: `user_${i + 1}`,
      name,
      avatar,
      steps: Math.max(steps, 100),
      rank: i + 1,
      isCurrentUser,
    });
  }

  return users;
}

// ============================================
// LEAGUE DATA
// ============================================

export const LEAGUES: League[] = [
  {
    id: "bronze",
    name: "Başlanğıc League", // Beginner in Azerbaijani
    tierNumber: 1,
    promotionCount: 15,
    demotionCount: 0, // Can't go lower than bronze
    sponsorName: undefined, // Can add: "Bravo Bronze League"
    users: generateLeagueUsers(50, 15000, 300, undefined), // User not in this league
  },
  {
    id: "silver",
    name: "Gümüş League", // Silver
    tierNumber: 2,
    promotionCount: 15,
    demotionCount: 5,
    sponsorName: undefined, // Future: "Nike Silver League"
    users: generateLeagueUsers(50, 45000, 900, undefined),
  },
  {
    id: "gold",
    name: "Qızıl League", // Gold
    tierNumber: 3,
    promotionCount: 15,
    demotionCount: 5,
    sponsorName: undefined, // Future: "CrossFit Gold League"
    users: generateLeagueUsers(50, 87000, 1500, 16), // USER IS HERE! Rank 16
  },
  {
    id: "platinum",
    name: "Platin League", // Platinum
    tierNumber: 4,
    promotionCount: 10,
    demotionCount: 5,
    sponsorName: undefined, // Future: "Port Baku Platinum"
    users: generateLeagueUsers(50, 150000, 2500, undefined),
  },
  {
    id: "champion",
    name: "Çempion League", // Champion
    tierNumber: 5,
    promotionCount: 0, // Top league, can't promote
    demotionCount: 10,
    sponsorName: undefined, // Elite league - no sponsor
    users: generateLeagueUsers(50, 300000, 5000, undefined),
  },
];

// Get user's current league
export function getCurrentUserLeague(): League | undefined {
  return LEAGUES.find((league) => league.users.some((u) => u.isCurrentUser));
}

// Get user's data
export function getCurrentUserData(): LeaderboardUser | undefined {
  const league = getCurrentUserLeague();
  return league?.users.find((u) => u.isCurrentUser);
}

// Get league by ID
export function getLeagueById(id: string): League | undefined {
  return LEAGUES.find((l) => l.id === id);
}

// Helper: Get promotion/demotion zones
export function getPromotionZone(league: League): LeaderboardUser[] {
  return league.users.slice(0, league.promotionCount);
}

export function getDemotionZone(league: League): LeaderboardUser[] {
  if (league.demotionCount === 0) return [];
  return league.users.slice(-league.demotionCount);
}
