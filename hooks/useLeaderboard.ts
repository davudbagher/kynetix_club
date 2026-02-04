import { db } from "@/config/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

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

const LEAGUES = [
  {
    id: "bronze",
    name: "Başlanğıc League",
    minSteps: 0,
    maxSteps: 50000,
    promotionCount: 10,
    demotionCount: 0,
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
    promotionCount: 0,
    demotionCount: 10,
  },
];

export function useLeaderboard() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupListener = async () => {
      try {
        // GET USER ID FROM ASYNCSTORAGE (your custom ID!)
        const userId = await AsyncStorage.getItem("kynetix_user_id");
        setCurrentUserId(userId);

        console.log("🔍 useLeaderboard: userId from AsyncStorage:", userId);

        if (!userId) {
          console.warn("⚠️ No user ID found");
          setIsLoading(false);
          return;
        }

        const usersQuery = query(
          collection(db, "users"),
          orderBy("stepsThisLeague", "desc"),
        );

        unsubscribe = onSnapshot(
          usersQuery,
          (snapshot) => {
            try {
              const allUsers = snapshot.docs.map((doc) => {
                const data = doc.data();
                const isMe = doc.id === userId;

                if (isMe) {
                  console.log(
                    "👤 Found current user:",
                    data.fullName,
                    "with",
                    data.stepsThisLeague,
                    "steps",
                  );
                }

                return {
                  id: doc.id,
                  name: data.fullName || "Anonymous",
                  avatar: data.avatar || "🧑🏻",
                  steps: data.stepsThisLeague || 0,
                  totalStepsAllTime: data.totalStepsAllTime || 0,
                  currentLeague: data.currentLeague || "February 2026",
                  isCurrentUser: isMe,
                };
              });

              const currentUserFound = allUsers.some((u) => u.isCurrentUser);
              console.log("✅ Current user found:", currentUserFound);

              const sortedUsers = allUsers.sort((a, b) => b.steps - a.steps);
              const leaguesData = buildLeagues(sortedUsers);

              setLeagues(leaguesData);
              setIsLoading(false);
            } catch (error) {
              console.error("❌ Error processing leaderboard:", error);
              setIsLoading(false);
            }
          },
          (error) => {
            console.error("❌ Error fetching leaderboard:", error);
            setIsLoading(false);
          },
        );
      } catch (error) {
        console.error("❌ Error setting up listener:", error);
        setIsLoading(false);
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const userLeague = useMemo(() => {
    return leagues.find((league) => league.users.some((u) => u.isCurrentUser));
  }, [leagues]);

  const userData = useMemo(() => {
    return userLeague?.users.find((u) => u.isCurrentUser);
  }, [userLeague]);

  return { leagues, isLoading, currentUserId, userLeague, userData };
}

function buildLeagues(sortedUsers: any[]): League[] {
  const leagueGroups: { [key: string]: any[] } = {
    bronze: [],
    silver: [],
    gold: [],
    platinum: [],
    champion: [],
  };

  sortedUsers.forEach((user) => {
    const allTimeSteps = user.totalStepsAllTime || 0;

    if (allTimeSteps < 50000) {
      leagueGroups.bronze.push(user);
    } else if (allTimeSteps < 150000) {
      leagueGroups.silver.push(user);
    } else if (allTimeSteps < 300000) {
      leagueGroups.gold.push(user);
    } else if (allTimeSteps < 500000) {
      leagueGroups.platinum.push(user);
    } else {
      leagueGroups.champion.push(user);
    }
  });

  Object.values(leagueGroups).forEach((users) => {
    users.sort((a, b) => b.steps - a.steps);
  });

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
      rank: index + 1,
    })),
  }));

  return leagues;
}
