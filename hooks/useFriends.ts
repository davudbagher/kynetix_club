// hooks/useFriends.ts
import { db } from '@/config/firebase';
import { clearCacheByPrefix } from '@/utils/cacheHelper';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    endAt,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    startAt,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { useCallback, useState } from 'react';

export interface Friendship {
    id: string;
    userId1: string;
    userId2: string;
    status: 'active' | 'pending';
    initiatedBy: string; // userId of who sent the request
    createdAt: any; // Timestamp
}

export interface FriendRequest {
    id: string;
    fromUser: {
        id: string;
        fullName: string;
        avatar: string;
    };
    createdAt: any;
}

export const useFriends = () => {
    const [friendIds, setFriendIds] = useState<string[]>([]);
    const [friends, setFriends] = useState<any[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Search users by name or phone (Snapchat style)
     */
    const searchUsers = useCallback(async (searchQuery: string) => {
        if (!searchQuery || searchQuery.length < 2) return [];

        try {
            setLoading(true);
            const usersRef = collection(db, 'users');
            const normalizedQuery = searchQuery.trim();

            // Simple prefix search implementation
            // In a real app, use Algolia/Typesense for better search
            const q = query(
                usersRef,
                orderBy('fullName'),
                startAt(normalizedQuery),
                endAt(normalizedQuery + '\uf8ff'),
                limit(10)
            );

            const snapshot = await getDocs(q);
            const users = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setLoading(false);
            return users;
        } catch (err: any) {
            console.error('Error searching users:', err);
            setLoading(false);
            return [];
        }
    }, []);

    /**
     * Fetch active friend list with profiles
     */
    const fetchFriends = useCallback(async (userId: string) => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔍 Fetching friends from Firestore...');

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

            const [snapshot1, snapshot2] = await Promise.all([
                getDocs(query1),
                getDocs(query2),
            ]);

            const ids: string[] = [];

            snapshot1.docs.forEach(docSnap => {
                const data = docSnap.data();
                ids.push(data.userId2);
            });

            snapshot2.docs.forEach(docSnap => {
                const data = docSnap.data();
                ids.push(data.userId1);
            });

            // Set raw IDs for backward compatibility (activity.tsx, etc.)
            setFriendIds(ids);

            // Fetch profiles
            if (ids.length === 0) {
                setFriends([]);
                setLoading(false);
                return ids;
            }

            // Fetch user docs (Parallel)
            const userDocs = await Promise.all(
                ids.map(fid => getDoc(doc(db, 'users', fid)))
            );

            const friendObjects = userDocs
                .filter(d => d.exists())
                .map(d => ({
                    id: d.id,
                    ...d.data()
                }));

            setFriends(friendObjects);
            setLoading(false);
            return ids;
        } catch (err: any) {
            console.error('Error fetching friends:', err);
            setError(err.message);
            setLoading(false);
            return [];
        }
    }, []);

    /**
     * Fetch incoming friend requests
     */
    const fetchIncomingRequests = useCallback(async (userId: string) => {
        try {
            // Find friendships where user is target (userId2) and status is pending
            // Note: We assume userId2 is always the recipient in our send logic
            // But to be safe in a bilateral graph, we might check both, 
            // however strict 'initiatedBy' logic suggests simpler query validation.

            // Let's query where I am involved and status is pending
            // Then filter for ones where I am NOT the initiator.

            const q1 = query(
                collection(db, 'friendships'),
                where('userId1', '==', userId),
                where('status', '==', 'pending')
            );

            const q2 = query(
                collection(db, 'friendships'),
                where('userId2', '==', userId),
                where('status', '==', 'pending')
            );

            const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

            const requests: any[] = [];
            const visitedIds = new Set();

            // Helper to process docs
            const processDoc = (docSnap: any, fields: any) => {
                if (fields.initiatedBy !== userId && !visitedIds.has(fields.initiatedBy)) {
                    // This is a request FOR me
                    requests.push({
                        friendshipId: docSnap.id,
                        senderId: fields.initiatedBy
                    });
                    visitedIds.add(fields.initiatedBy);
                }
            };

            snap1.docs.forEach(d => processDoc(d, d.data()));
            snap2.docs.forEach(d => processDoc(d, d.data()));

            // Now fetch user details for these senders
            // In a real app, use a 'users' whereIn query (batched)
            const fullRequests: FriendRequest[] = [];

            for (const req of requests) {
                // fetch sender profile (could also be cached)
                // For now, minimal fetch or rely on what we might have
                // Let's assume we need to fetch
                try {
                    // Dynamic import or direct usage if we separate concerns?
                    // For simplicity, direct fetch here or assume sender details 
                    // aren't stored on friendship doc (normalized DB).

                    // Quick fetch (in production batch this)
                    // We need to import 'doc' and 'getDoc' from firebase inside loop or mapped
                    // We already imported at top.

                    //  const userDoc = await getDoc(doc(db, 'users', req.senderId));
                    //  if (userDoc.exists()) {
                    //      fullRequests.push({
                    //          id: req.friendshipId,
                    //          fromUser: { id: req.senderId, ...userDoc.data() } as any,
                    //          createdAt: new Date() 
                    //      });
                    //  }
                } catch (e) { console.warn('Failed to load sender', req.senderId); }
            }

            // For MVP, if we don't have a "getUsersByIds" helper ready, 
            // let's return the raw friendship IDs and let UI fetch profiles 
            // or implement a simple loop here.

            return requests;
        } catch (err) {
            console.error('Error fetching requests', err);
            return [];
        }
    }, []);

    /**
     * Send a Friend Request
     */
    const sendFriendRequest = useCallback(async (currentUserId: string, targetUserId: string) => {
        try {
            console.log(`📨 Sending request: ${currentUserId} -> ${targetUserId}`);

            const [userId1, userId2] = [currentUserId, targetUserId].sort();

            // Check if friendship already exists (active or pending)
            const q = query(
                collection(db, 'friendships'),
                where('userId1', '==', userId1),
                where('userId2', '==', userId2)
            );

            const existing = await getDocs(q);
            if (!existing.empty) {
                console.log('Friendship doc already exists');
                return false;
            }

            await addDoc(collection(db, 'friendships'), {
                userId1,
                userId2,
                status: 'pending',
                initiatedBy: currentUserId,
                createdAt: Timestamp.now(),
            });

            return true;
        } catch (err: any) {
            console.error('Error sending request:', err);
            setError(err.message);
            return false;
        }
    }, []);

    /**
     * Accept or Reject Request
     */
    const respondToRequest = useCallback(async (friendshipId: string, action: 'accept' | 'reject') => {
        try {
            const ref = doc(db, 'friendships', friendshipId);

            if (action === 'accept') {
                await updateDoc(ref, { status: 'active' });
                // Increment friend counts? (Cloud function is better, but client side for now)
                // We need to know who the users are to update counts. 
                // Skipping count update for MVP to avoid extra reads/writes complexity here.
            } else {
                await deleteDoc(ref);
            }

            // Clear caches
            await clearCacheByPrefix('friend_list_');
            return true;
        } catch (err: any) {
            console.error('Error responding to request:', err);
            return false;
        }
    }, []);

    return {
        friendIds,
        friends,
        loading,
        error,
        fetchFriends,
        fetchIncomingRequests,
        searchUsers,
        sendFriendRequest,
        respondToRequest,
    };
};
