// hooks/useActivities.ts
import { db } from '@/config/firebase';
import { ActivityType } from '@/constants/activityTypes';
import { CacheKeys, CacheTTL, getCachedData, setCachedData } from '@/utils/cacheHelper';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { useCallback, useState } from 'react';

export interface Activity {
    id: string;
    userId: string;
    userName: string;
    activityType: ActivityType;
    title: string;
    points: number;
    celebrationCount: number;
    locationName?: string;
    challengeId?: string;
    createdAt: Date;
}

type FeedTab = 'everyone' | 'following';

export const useActivities = (userId?: string) => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetch activity feed with caching
     */
    const fetchActivities = useCallback(
        async (tab: FeedTab = 'everyone', friendIds: string[] = []) => {
            try {
                setLoading(true);
                setError(null);

                // Check cache first
                const cacheKey = tab === 'everyone'
                    ? CacheKeys.ACTIVITY_FEED_EVERYONE
                    : CacheKeys.ACTIVITY_FEED_FOLLOWING;

                const cached = await getCachedData<Activity[]>(cacheKey, CacheTTL.ACTIVITY_FEED);
                if (cached) {
                    console.log('📦 Using cached activities');
                    setActivities(cached);
                    setLoading(false);
                    return cached;
                }

                console.log('🔍 Fetching activities from Firestore...');

                // Build query
                let activitiesQuery = query(
                    collection(db, 'activities'),
                    orderBy('createdAt', 'desc'),
                    limit(50) // ⚡ Cost optimization: limit reads
                );

                // Filter by friends if "Following" tab
                if (tab === 'following' && friendIds.length > 0) {
                    // Firestore 'in' operator limited to 10 items
                    const friendIdsSlice = friendIds.slice(0, 10);
                    activitiesQuery = query(
                        collection(db, 'activities'),
                        where('userId', 'in', friendIdsSlice),
                        orderBy('createdAt', 'desc'),
                        limit(50)
                    );
                }

                const snapshot = await getDocs(activitiesQuery);

                let fetchedActivities: Activity[] = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        userId: data.userId,
                        userName: data.userName,
                        activityType: data.activityType as ActivityType,
                        title: data.title,
                        points: data.points,
                        celebrationCount: data.celebrationCount || 0,
                        locationName: data.locationName,
                        challengeId: data.challengeId,
                        createdAt: data.createdAt?.toDate() || new Date(),
                    };
                });

                // FALLBACK: Use mock data if Firebase is empty (for testing)
                if (fetchedActivities.length === 0) {
                    console.log('⚠️ No Firebase data found, using mock data for testing');
                    const { getActivities } = await import('@/constants/mockActivityData');
                    const mockActivities = getActivities();

                    fetchedActivities = mockActivities.map(mock => ({
                        id: mock.id,
                        userId: 'mock_user',
                        userName: mock.userName,
                        activityType: mock.activityType,
                        title: mock.title,
                        points: mock.points,
                        celebrationCount: mock.celebrationCount,
                        locationName: mock.locationName,
                        createdAt: new Date(mock.createdAt),
                    }));

                    // Filter for following tab
                    if (tab === 'following') {
                        fetchedActivities = fetchedActivities.filter(a =>
                            a.userName === 'Ali Mammadov'
                        );
                    }
                }

                console.log(`✅ Fetched ${fetchedActivities.length} activities`);

                // Cache the result
                await setCachedData(cacheKey, fetchedActivities);

                setActivities(fetchedActivities);
                setLoading(false);
                return fetchedActivities;
            } catch (err: any) {
                console.error('Error fetching activities:', err);
                setError(err.message);
                setLoading(false);
                return [];
            }
        },
        []
    );

    return {
        activities,
        loading,
        error,
        fetchActivities,
    };
};
