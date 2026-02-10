// utils/cacheHelper.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CacheData<T> {
    data: T;
    timestamp: number;
}

/**
 * Check if cached data is expired
 */
export const isCacheExpired = (cacheTimestamp: number, ttlSeconds: number): boolean => {
    const now = Date.now();
    const age = (now - cacheTimestamp) / 1000; // Convert to seconds
    return age > ttlSeconds;
};

/**
 * Get cached data if valid, otherwise return null
 */
export const getCachedData = async <T>(
    key: string,
    ttlSeconds: number
): Promise<T | null> => {
    try {
        const cached = await AsyncStorage.getItem(key);
        if (!cached) return null;

        const cacheData: CacheData<T> = JSON.parse(cached);

        if (isCacheExpired(cacheData.timestamp, ttlSeconds)) {
            // Cache expired, remove it
            await AsyncStorage.removeItem(key);
            return null;
        }

        return cacheData.data;
    } catch (error) {
        console.error('Error reading cache:', error);
        return null;
    }
};

/**
 * Set cached data with timestamp
 */
export const setCachedData = async <T>(key: string, data: T): Promise<void> => {
    try {
        const cacheData: CacheData<T> = {
            data,
            timestamp: Date.now(),
        };
        await AsyncStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
        console.error('Error setting cache:', error);
    }
};

/**
 * Clear all cache with a specific prefix
 */
export const clearCacheByPrefix = async (prefix: string): Promise<void> => {
    try {
        const keys = await AsyncStorage.getAllKeys();
        const keysToRemove = keys.filter(key => key.startsWith(prefix));
        await AsyncStorage.multiRemove(keysToRemove);
    } catch (error) {
        console.error('Error clearing cache:', error);
    }
};

/**
 * Cache key generators
 */
export const CacheKeys = {
    ACTIVITY_FEED_EVERYONE: 'activity_feed_everyone',
    ACTIVITY_FEED_FOLLOWING: 'activity_feed_following',
    ACTIVE_CHALLENGES: 'active_challenges',
    USER_PROFILE: (userId: string) => `user_profile_${userId}`,
    CHALLENGE_LEADERBOARD: (challengeId: string) => `challenge_leaderboard_${challengeId}`,
    FRIEND_LIST: (userId: string) => `friend_list_${userId}`,
    USER_CHALLENGES: (userId: string) => `user_challenges_${userId}`,
};

/**
 * Cache TTL (Time To Live) in seconds
 */
export const CacheTTL = {
    ACTIVITY_FEED: 5 * 60,        // 5 minutes
    CHALLENGES: 10 * 60,          // 10 minutes
    USER_PROFILE: 10 * 60,        // 10 minutes
    LEADERBOARD: 2 * 60,          // 2 minutes (more dynamic)
    FRIEND_LIST: 10 * 60,         // 10 minutes
};
