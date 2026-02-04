export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: "steps" | "trees" | "streaks" | "competition" | "special";
  unlockCondition: (userData: any) => boolean;
  progressText: (userData: any) => string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export const BADGES: Badge[] = [
  // STEP MILESTONES
  {
    id: "first_steps",
    name: "First Steps",
    emoji: "👣",
    description: "Walk your first 1,000 steps",
    category: "steps",
    unlockCondition: (user) => (user?.totalStepsAllTime || 0) >= 1000,
    progressText: (user) =>
      `${(user?.totalStepsAllTime || 0).toLocaleString()} / 1,000`,
    rarity: "common",
  },
  {
    id: "walker",
    name: "Walker",
    emoji: "🚶",
    description: "Reach 10,000 total steps",
    category: "steps",
    unlockCondition: (user) => (user?.totalStepsAllTime || 0) >= 10000,
    progressText: (user) =>
      `${(user?.totalStepsAllTime || 0).toLocaleString()} / 10,000`,
    rarity: "common",
  },
  {
    id: "athlete",
    name: "Athlete",
    emoji: "🏃",
    description: "Walk 100,000 steps",
    category: "steps",
    unlockCondition: (user) => (user?.totalStepsAllTime || 0) >= 100000,
    progressText: (user) =>
      `${(user?.totalStepsAllTime || 0).toLocaleString()} / 100,000`,
    rarity: "rare",
  },
  {
    id: "legend",
    name: "Legend",
    emoji: "💎",
    description: "Reach 500,000 steps",
    category: "steps",
    unlockCondition: (user) => (user?.totalStepsAllTime || 0) >= 500000,
    progressText: (user) =>
      `${(user?.totalStepsAllTime || 0).toLocaleString()} / 500,000`,
    rarity: "epic",
  },

  // TREE PLANTER
  {
    id: "tree_planter",
    name: "Tree Planter",
    emoji: "🌱",
    description: "Plant 100 virtual trees",
    category: "trees",
    unlockCondition: (user) =>
      Math.floor((user?.totalStepsAllTime || 0) / 280) >= 100,
    progressText: (user) =>
      `${Math.floor((user?.totalStepsAllTime || 0) / 280)} / 100`,
    rarity: "common",
  },
  {
    id: "forest_maker",
    name: "Forest Maker",
    emoji: "🌲",
    description: "Plant 1,000 virtual trees",
    category: "trees",
    unlockCondition: (user) =>
      Math.floor((user?.totalStepsAllTime || 0) / 280) >= 1000,
    progressText: (user) =>
      `${Math.floor((user?.totalStepsAllTime || 0) / 280)} / 1,000`,
    rarity: "rare",
  },

  // STREAKS
  {
    id: "streak_7",
    name: "Week Warrior",
    emoji: "🔥",
    description: "Maintain a 7-day streak",
    category: "streaks",
    unlockCondition: (user) => (user?.currentStreakDays || 0) >= 7,
    progressText: (user) => `${user?.currentStreakDays || 0} / 7 days`,
    rarity: "common",
  },
  {
    id: "streak_30",
    name: "Month Master",
    emoji: "💪",
    description: "Maintain a 30-day streak",
    category: "streaks",
    unlockCondition: (user) => (user?.currentStreakDays || 0) >= 30,
    progressText: (user) => `${user?.currentStreakDays || 0} / 30 days`,
    rarity: "rare",
  },

  // COMPETITION
  {
    id: "bronze_league",
    name: "Bronze League",
    emoji: "🥉",
    description: "Join the competition",
    category: "competition",
    unlockCondition: () => true,
    progressText: () => "Unlocked!",
    rarity: "common",
  },
  {
    id: "silver_league",
    name: "Silver League",
    emoji: "🥈",
    description: "Reach Silver League (50K steps)",
    category: "competition",
    unlockCondition: (user) => (user?.totalStepsAllTime || 0) >= 50000,
    progressText: (user) =>
      `${(user?.totalStepsAllTime || 0).toLocaleString()} / 50,000`,
    rarity: "common",
  },
];

// Helpers
export function getUnlockedBadges(userData: any): Badge[] {
  return BADGES.filter((badge) => badge.unlockCondition(userData));
}

export function getLockedBadges(userData: any): Badge[] {
  return BADGES.filter((badge) => !badge.unlockCondition(userData));
}
