// hooks/useFriends.ts
import { db } from '@/config/firebase';
import { CacheKeys, CacheTTL, clearCacheByPrefix, getCachedData, setCachedData } from '@/utils/cacheHelper';
import { addDoc, collection, deleteDoc, doc, getDocs, increment, query, updateDoc, where } from 'firebase/firestore';
import { useCallback, useState } from 'react';

export interface Friendship {
    id: string;
    userId1: string;
    userId2: string;
    status: 'active';
    createdAt: Date;
}

export const useFriends = () => {
    const [friendIds, setFriendIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetch friend list with caching
     */
    const fetchFriends = useCallback(async (userId: string) => {
        try {
            setLoading(true);
            setError(null);

            // Check cache first
            const cacheKey = CacheKeys.FRIEND_LIST(userId);
            const cached = await getCachedData<string[]>(cacheKey, CacheTTL.FRIEND_LIST);

            if (cached) {
                console.log('📦 Using cached friend list');
                setFriendIds(cached);
                setLoading(false);
                return cached;
            }

            console.log('🔍 Fetching friends from Firestore...');

            // Firestore OR queries require separate queries and merging
            // Query 1: where user is userId1
            const query1 = query(
                collection(db, 'friendships'),
                where('userId1', '==', userId),
                where('status', '==', 'active')
            );

            // Query 2: where user is userId2
            const query2 = query(
                collection(db, 'friendships'),
                where('userId2', '==', userId),
                where('status', '==', 'active')
            );

            // Execute both queries
            const [snapshot1, snapshot2] = await Promise.all([
                getDocs(query1),
                getDocs(query2),
            ]);

            // Merge results and extract friend IDs
            const friends: string[] = [];

            snapshot1.docs.forEach(docSnap => {
                const data = docSnap.data();
                friends.push(data.userId2); // User is userId1, so friend is userId2
            });

            snapshot2.docs.forEach(docSnap => {
                const data = docSnap.data();
                friends.push(data.userId1); // User is userId2, so friend is userId1
            });

            console.log(`✅ Fetched ${friends.length} friends`);

            // Cache the result
            await setCachedData(cacheKey, friends);

            setFriendIds(friends);
            setLoading(false);
            return friends;
        } catch (err: any) {
            console.error('Error fetching friends:', err);
            setError(err.message);
            setLoading(false);
            return [];
        }
    }, []);

    /**
     * Add a friend
     */
    const addFriend = useCallback(async (currentUserId: string, friendUserId: string) => {
        try {
            console.log('👥 Adding friend:', friendUserId);

            // Sort user IDs alphabetically to avoid duplicates
            const [userId1, userId2] = [currentUserId, friendUserId].sort();

            // Create friendship document
            await addDoc(collection(db, 'friendships'), {
                userId1,
                userId2,
                status: 'active',
                createdAt: new Date(),
            });

            // Update friend counts for both users
            const user1Ref = doc(db, 'users', userId1);
            const user2Ref = doc(db, 'users', userId2);

            await Promise.all([
                updateDoc(user1Ref, { friendCount: increment(1) }),
                updateDoc(user2Ref, { friendCount: increment(1) }),
            ]);

            console.log('✅ Friend added successfully');

            // Clear cache to force refresh
            await clearCacheByPrefix('friend_list_');
            await clearCacheByPrefix('user_profile_');

            return true;
        } catch (err: any) {
            console.error('Error adding friend:', err);
            setError(err.message);
            return false;
        }
    }, []);

    /**
     * Remove a friend
     */
    const removeFriend = useCallback(async (currentUserId: string, friendUserId: string) => {
        try {
            console.log('👋 Removing friend:', friendUserId);

            // Sort user IDs to find the friendship
            const [userId1, userId2] = [currentUserId, friendUserId].sort();

            // Find and delete the friendship
            const friendshipsQuery = query(
                collection(db, 'friendships'),
                where('userId1', '==', userId1),
                where('userId2', '==', userId2),
                where('status', '==', 'active')
            );

            const snapshot = await getDocs(friendshipsQuery);

            if (!snapshot.empty) {
                const friendshipDoc = snapshot.docs[0];
                await deleteDoc(doc(db, 'friendships', friendshipDoc.id));

                // Update friend counts
                const user1Ref = doc(db, 'users', userId1);
                const user2Ref = doc(db, 'users', userId2);

                await Promise.all([
                    updateDoc(user1Ref, { friendCount: increment(-1) }),
                    updateDoc(user2Ref, { friendCount: increment(-1) }),
                ]);

                console.log('✅ Friend removed successfully');

                // Clear cache
                await clearCacheByPrefix('friend_list_');
                await clearCacheByPrefix('user_profile_');

                return true;
            }

            return false;
        } catch (err: any) {
            console.error('Error removing friend:', err);
            setError(err.message);
            return false;
        }
    }, []);

    /**
     * Check if two users are friends
     */
    const checkFriendship = useCallback(async (userId1: string, userId2: string): Promise<boolean> => {
        try {
            const [sortedId1, sortedId2] = [userId1, userId2].sort();

            const friendshipsQuery = query(
                collection(db, 'friendships'),
                where('userId1', '==', sortedId1),
                where('userId2', '==', sortedId2),
                where('status', '==', 'active')
            );

            const snapshot = await getDocs(friendshipsQuery);
            return !snapshot.empty;
        } catch (err: any) {
            console.error('Error checking friendship:', err);
            return false;
        }
    }, []);

    return {
        friendIds,
        loading,
        error,
        fetchFriends,
        addFriend,
        removeFriend,
        checkFriendship,
    };
};
