import { auth, db } from "@/config/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

// Types (matching your mock data structure!)
export interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  steps: number;
  rank: number;
  totalStepsAllTime?: number;
  currentLeague?: string;
  isCurrentUser?: boolean;
}

export interface League {
  id: string;
  name: string;
  minSteps: number;
  maxSteps: number;
  promotionCount: number;
  demotionCount: number;
  users: LeaderboardUser[];
}

// League thresholds (SINGLE SOURCE OF TRUTH!)
const LEAGUES = [
  {
    id: "bronze",
    name: "Başlanğıc League",
    minSteps: 0,
    maxSteps: 50000,
    promotionCount: 10,
    demotionCount: 0, // Can't demote from Bronze
  },
  {
    id: "silver",
    name: "Gümüş League",
    minSteps: 50000,
    maxSteps: 150000,
    promotionCount: 10,
    demotionCount: 10,
  },
  {
    id: "gold",
    name: "Qızıl League",
    minSteps: 150000,
    maxSteps: 300000,
    promotionCount: 10,
    demotionCount: 10,
  },
  {
    id: "platinum",
    name: "Platin League",
    minSteps: 300000,
    maxSteps: 500000,
    promotionCount: 10,
    demotionCount: 10,
  },
  {
    id: "champion",
    name: "Çempion League",
    minSteps: 500000,
    maxSteps: Infinity,
    promotionCount: 0, // Already at the top!
    demotionCount: 10,
  },
];

export function useLeaderboard() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user ID
    const userId = auth.currentUser?.uid;
    setCurrentUserId(userId || null);

    // Query all users from Firestore, sorted by stepsThisLeague (descending)
    const usersQuery = query(
      collection(db, "users"),
      orderBy("stepsThisLeague", "desc"), // Sort by monthly steps for competition!
    );

    // Real-time listener - updates when ANY user walks!
    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        try {
          // Convert Firestore docs to user objects
          const allUsers = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.fullName || "Anonymous",
              avatar: data.avatar || "🧑🏻",
              steps: data.stepsThisLeague || 0, // Monthly accumulated steps
              totalStepsAllTime: data.totalStepsAllTime || 0, // All-time legacy
              currentLeague: data.currentLeague || "February 2026",
              isCurrentUser: doc.id === userId,
            };
          });

          console.log(`📊 Fetched ${allUsers.length} users from Firestore`);

          // Sort by monthly steps (already sorted by query, but just in case)
          const sortedUsers = allUsers.sort((a, b) => b.steps - a.steps);

          // Build leagues from users
          const leaguesData = buildLeagues(sortedUsers);

          setLeagues(leaguesData);
          setIsLoading(false);
        } catch (error) {
          console.error("❌ Error processing leaderboard data:", error);
          setIsLoading(false);
        }
      },
      (error) => {
        console.error("❌ Error fetching leaderboard:", error);
        setIsLoading(false);
      },
    );

    // Cleanup listener when component unmounts
    return () => unsubscribe();
  }, []);

  return { leagues, isLoading, currentUserId };
}

// Build leagues from ranked users
function buildLeagues(sortedUsers: any[]): League[] {
  // Group users by their league (based on totalStepsAllTime)
  const leagueGroups: { [key: string]: any[] } = {
    bronze: [],
    silver: [],
    gold: [],
    platinum: [],
    champion: [],
  };

  // Assign users to leagues based on ALL-TIME TOTAL STEPS
  sortedUsers.forEach((user) => {
    const allTimeSteps = user.totalStepsAllTime || 0;

    // Determine which league tier based on lifetime achievement
    if (allTimeSteps < 50000) {
      // 0-50K steps = Bronze (Başlanğıc)
      leagueGroups.bronze.push(user);
    } else if (allTimeSteps < 150000) {
      // 50K-150K steps = Silver (Gümüş)
      leagueGroups.silver.push(user);
    } else if (allTimeSteps < 300000) {
      // 150K-300K steps = Gold (Qızıl)
      leagueGroups.gold.push(user);
    } else if (allTimeSteps < 500000) {
      // 300K-500K steps = Platinum (Platin)
      leagueGroups.platinum.push(user);
    } else {
      // 500K+ steps = Champion (Çempion) - ELITE!
      leagueGroups.champion.push(user);
    }
  });

  // Sort users within each league by stepsThisLeague (monthly competition!)
  Object.values(leagueGroups).forEach((users) => {
    users.sort((a, b) => b.steps - a.steps);
  });

  // Combine league definitions with user data and assign ranks
  const leagues = [
    { ...LEAGUES[0], users: leagueGroups.bronze },
    { ...LEAGUES[1], users: leagueGroups.silver },
    { ...LEAGUES[2], users: leagueGroups.gold },
    { ...LEAGUES[3], users: leagueGroups.platinum },
    { ...LEAGUES[4], users: leagueGroups.champion },
  ].map((league) => ({
    ...league,
    users: league.users.map((user, index) => ({
      ...user,
      rank: index + 1, // Rank within this league (1, 2, 3...)
    })),
  }));

  return leagues; // ← FIXED! Return array, not object
}

// Helper: Get current user's league
export function getCurrentUserLeague(leagues: League[]): League | undefined {
  return leagues.find((league) => league.users.some((u) => u.isCurrentUser));
}

// Helper: Get current user's data
export function getCurrentUserData(
  leagues: League[],
): LeaderboardUser | undefined {
  const league = getCurrentUserLeague(leagues);
  return league?.users.find((u) => u.isCurrentUser);
}
