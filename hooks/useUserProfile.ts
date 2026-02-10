// hooks/useUserProfile.ts
import { db } from '@/config/firebase';
import { CacheKeys, CacheTTL, getCachedData, setCachedData } from '@/utils/cacheHelper';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useCallback, useState } from 'react';

export interface UserProfile {
    id: string;
    fullName: string;
    phone?: string;
    bio?: string;

    // Stats
    totalSteps: number;
    currentStreak: number;
    longestStreak: number;
    challengesCompleted: number;
    challengesActive: number;
    friendCount: number;

    // Badges
    unlockedBadges: string[];

    // Social
    isEarlyAdopter: boolean;

    // Metadata
    joinedDate: Date;
    lastActive: Date;
}

export const useUserProfile = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetch user profile with caching
     */
    const fetchUserProfile = useCallback(async (userId: string) => {
        try {
            setLoading(true);
            setError(null);

            // Check cache first
            const cacheKey = CacheKeys.USER_PROFILE(userId);
            const cached = await getCachedData<UserProfile>(cacheKey, CacheTTL.USER_PROFILE);

            if (cached) {
                console.log('📦 Using cached user profile');
                setProfile(cached);
                setLoading(false);
                return cached;
            }

            console.log('🔍 Fetching user profile from Firestore...');

            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                throw new Error('User not found');
            }

            const data = userDoc.data();
            const userProfile: UserProfile = {
                id: userDoc.id,
                fullName: data.fullName,
                phone: data.phone,
                bio: data.bio,
                totalSteps: data.totalSteps || 0,
                currentStreak: data.currentStreak || 0,
                longestStreak: data.longestStreak || 0,
                challengesCompleted: data.challengesCompleted || 0,
                challengesActive: data.challengesActive || 0,
                friendCount: data.friendCount || 0,
                unlockedBadges: data.unlockedBadges || [],
                isEarlyAdopter: data.isEarlyAdopter || false,
                joinedDate: data.joinedDate?.toDate() || new Date(),
                lastActive: data.lastActive?.toDate() || new Date(),
            };

            console.log('✅ Fetched user profile');

            // Cache the result
            await setCachedData(cacheKey, userProfile);

            setProfile(userProfile);
            setLoading(false);
            return userProfile;
        } catch (err: any) {
            console.error('Error fetching user profile:', err);
            setError(err.message);
            setLoading(false);
            return null;
        }
    }, []);

    /**
     * Get user profile by name (for navigation from activity feed)
     */
    const fetchUserByName = useCallback(async (userName: string) => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔍 Searching for user by name:', userName);

            const usersQuery = query(
                collection(db, 'users'),
                where('fullName', '==', userName)
            );

            const snapshot = await getDocs(usersQuery);

            if (snapshot.empty) {
                throw new Error('User not found');
            }

            const userDoc = snapshot.docs[0];
            const data = userDoc.data();

            const userProfile: UserProfile = {
                id: userDoc.id,
                fullName: data.fullName,
                phone: data.phone,
                bio: data.bio,
                totalSteps: data.totalSteps || 0,
                currentStreak: data.currentStreak || 0,
                longestStreak: data.longestStreak || 0,
                challengesCompleted: data.challengesCompleted || 0,
                challengesActive: data.challengesActive || 0,
                friendCount: data.friendCount || 0,
                unlockedBadges: data.unlockedBadges || [],
                isEarlyAdopter: data.isEarlyAdopter || false,
                joinedDate: data.joinedDate?.toDate() || new Date(),
                lastActive: data.lastActive?.toDate() || new Date(),
            };

            console.log('✅ Found user:', userProfile.fullName);

            setProfile(userProfile);
            setLoading(false);
            return userProfile;
        } catch (err: any) {
            console.error('Error fetching user by name:', err);
            setError(err.message);
            setLoading(false);
            return null;
        }
    }, []);

    return {
        profile,
        loading,
        error,
        fetchUserProfile,
        fetchUserByName,
    };
};
