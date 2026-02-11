// hooks/useSquads.ts
import { db } from '@/config/firebase';
import {
    addDoc,
    collection,
    doc,
    DocumentData,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    QueryDocumentSnapshot,
    runTransaction,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { useCallback, useState } from 'react';

export interface SquadMember {
    userId: string;
    fullName: string; // Cached for display
    avatar: string;   // Cached for display
    stepsContributed: number;
    currentWalletBalance: number; // Cached wallet balance for validation
    invitedAt: any; // Timestamp - when invited
    joinedAt?: any; // Timestamp - when they accepted
    status: 'pending' | 'active' | 'declined';
}

export interface Squad {
    id: string;
    offerId: string;
    offerTitle: string;
    offerPartner: string;
    targetSteps: number;
    currentSteps: number;
    status: 'pending' | 'active' | 'completed' | 'expired' | 'cancelled';
    hostId: string;
    createdAt: any;
    expiresAt: any;
    members: SquadMember[];
    // Redemption tracking (single shared code for creator)
    redemptionCode?: string;
    redeemedAt?: any;
    redeemedBy?: string; // Creator's userId
}

export const useSquads = () => {
    const [activeSquad, setActiveSquad] = useState<Squad | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Helper: Check if user already has an active or pending squad
     */
    const getUserActiveSquad = useCallback(async (userId: string): Promise<Squad | null> => {
        try {
            const q = query(
                collection(db, 'squads'),
                where('status', 'in', ['pending', 'active'])
            );

            const snapshot = await getDocs(q);
            const userSquad = snapshot.docs.find((doc: QueryDocumentSnapshot<DocumentData>) => {
                const data = doc.data();
                return data.members.some((m: any) => m.userId === userId);
            });

            if (userSquad) {
                return { id: userSquad.id, ...userSquad.data() } as Squad;
            }
            return null;
        } catch (err) {
            console.error('Error checking for active squad:', err);
            return null;
        }
    }, []);

    /**
     * Create a new Squad
     */
    const createSquad = useCallback(async (
        hostId: string,
        offerId: string,
        offerTitle: string,
        offerPartner: string,
        targetSteps: number,
        invitedFriendIds: string[]
    ) => {
        try {
            setLoading(true);
            setError(null);

            console.log('🚀 Creating squad...', { hostId, offerId, invitedFriendIds });

            // Check if user already has an active squad
            const existingSquad = await getUserActiveSquad(hostId);
            if (existingSquad) {
                console.log('⚠️ User already in squad:', existingSquad.offerTitle);
                setError("You're already in an active squad. Complete or cancel it first.");
                setLoading(false);
                return null;
            }

            // 1. Get Host Profile (to add as first member)
            const hostDoc = await getDoc(doc(db, 'users', hostId));
            if (!hostDoc.exists()) {
                console.error('❌ Host user not found:', hostId);
                throw new Error("Host user not found");
            }
            const hostData = hostDoc.data();
            console.log('✅ Host data loaded:', hostData.fullName);

            // 2. Prepare Squad Data - Host is auto-active
            const totalEarned = hostData.totalStepsAllTime || 0;
            const spentSteps = hostData.spentSteps || 0;
            const hostWalletBalance = totalEarned - spentSteps;

            const members = [
                {
                    userId: hostId,
                    fullName: hostData.fullName || 'Host',
                    avatar: hostData.avatar || '👤',
                    stepsContributed: 0,
                    currentWalletBalance: hostWalletBalance,
                    invitedAt: Timestamp.now(),
                    joinedAt: Timestamp.now(),
                    status: 'active'
                }
            ];

            // 3. Fetch and Add Invited Friends (pending status)
            if (invitedFriendIds.length > 0) {
                console.log('📋 Fetching invited friends...', invitedFriendIds);
                const friendDocs = await Promise.all(
                    invitedFriendIds.map(fid => getDoc(doc(db, 'users', fid)))
                );

                friendDocs.forEach(d => {
                    if (d.exists()) {
                        const fData = d.data();
                        const fTotal = fData.totalStepsAllTime || 0;
                        const fSpent = fData.spentSteps || 0;
                        const fWallet = fTotal - fSpent;

                        members.push({
                            userId: d.id,
                            fullName: fData.fullName || 'Friend',
                            avatar: fData.avatar || '👤',
                            stepsContributed: 0,
                            currentWalletBalance: fWallet,
                            invitedAt: Timestamp.now(),
                            // joinedAt is omitted for pending members (will be set when they accept)
                            status: 'pending'
                        } as any);
                        console.log('✅ Added friend:', fData.fullName);
                    } else {
                        console.warn('⚠️ Friend not found:', d.id);
                    }
                });
            }

            const newSquadData = {
                offerId,
                offerTitle,
                offerPartner,
                targetSteps,
                currentSteps: 0,
                status: invitedFriendIds.length > 0 ? 'pending' : 'active', // pending if has invites
                hostId,
                createdAt: Timestamp.now(),
                expiresAt: Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                members
            };

            console.log('💾 Creating squad document...', newSquadData);

            // 4. Create Squad Doc
            const docRef = await addDoc(collection(db, 'squads'), newSquadData);

            console.log('✅ Squad created successfully! ID:', docRef.id);
            setLoading(false);
            return docRef.id;
        } catch (err: any) {
            console.error('❌ Error creating squad:', err);
            console.error('Error details:', {
                message: err.message,
                code: err.code,
                stack: err.stack
            });
            setError(err.message);
            setLoading(false);
            return null;
        }
    }, []);

    /**
     * Subscribe to the User's Active Squad
     * (Assumes user can only be in one active squad for MVP)
     */
    const subscribeToActiveSquad = useCallback((userId: string) => {
        // Query for squads where members array contains an object with userId
        // Note: Firestore array-contains-any doesn't work easily on objects.
        // We usually need a separate 'memberIds' array for querying.
        // Let's assume we add 'memberIds' to the doc for easier querying.
        // UPDATING CREATE SQUAD TO INCLUDE memberIds IS NEEDED IN A REAL APP.
        // For this prototype, let's assume we query by hostId OR we add memberIds.

        // Better approach for NoSQL: maintains a 'activeSquadId' on the User or similar.
        // Or just query squads where 'memberIds' array-contains userId.

        // Let's try the MemberIds array approach, but I need to update createSquad first.
        // ... Actually, for this snippet let's stick to a simple query assuming we added memberIds.
        // Or we can just query 'members' if we structure it as a map, but array is standard.

        // Workaround for MVP: Query all active squads and filter client side (Not scalable but works for demo)
        // OR: Query active squads where hostId == userId (if only host sees it first)

        // Let's implement the standard 'memberIds' array pattern in the create function implies we should update it.
        // But since I can't edit the function I just wrote in-memory easily without rewriting...
        // I will write the query assuming 'memberIds' exists, and I will update createSquad in next step if needed,
        // OR I will use a different query logic now: 'status' == 'active'.

        // Query for squads where user is a member
        // Include both 'pending' (waiting for confirmations) and 'active' (all joined) squads
        console.log('🔍 Subscribing to squads for user:', userId);

        const q = query(
            collection(db, 'squads'),
            where('status', 'in', ['pending', 'active'])
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log('📦 Squad query returned', snapshot.docs.length, 'squads');

            // Client-side filter to find user's squad
            const mySquad = snapshot.docs.find(doc => {
                const data = doc.data();
                const isMember = data.members.some((m: any) => m.userId === userId);
                if (isMember) {
                    console.log('✅ Found user squad:', doc.id, data.offerTitle);
                }
                return isMember;
            });

            if (mySquad) {
                const squadData = { id: mySquad.id, ...mySquad.data() } as Squad;
                console.log('🎯 Setting active squad:', squadData.offerTitle, 'Status:', squadData.status);
                setActiveSquad(squadData);
            } else {
                console.log('❌ No squad found for user:', userId);
                setActiveSquad(null);
            }
            setLoading(false);
        }, (err) => {
            console.error("❌ Squad subscription error", err);
            setError(err.message);
        });

        return unsubscribe;
    }, []);

    /**
     * Accept Squad Invitation
     */
    const acceptSquadInvitation = useCallback(async (squadId: string, userId: string) => {
        try {
            // Check if user already has an active squad
            const existingSquad = await getUserActiveSquad(userId);
            if (existingSquad && existingSquad.id !== squadId) {
                console.log('⚠️ User already in different squad:', existingSquad.offerTitle);
                setError("You're already in another squad. Complete or cancel it first.");
                return false;
            }

            const squadRef = doc(db, 'squads', squadId);
            const userRef = doc(db, 'users', userId);

            await runTransaction(db, async (transaction) => {
                const squadDoc = await transaction.get(squadRef);
                const userDoc = await transaction.get(userRef);

                if (!squadDoc.exists() || !userDoc.exists()) {
                    throw new Error('Squad or user not found');
                }

                const squad = squadDoc.data() as Squad;
                const userData = userDoc.data();

                // Calculate wallet balance
                const totalEarned = userData.totalStepsAllTime || 0;
                const spentSteps = userData.spentSteps || 0;
                const walletBalance = totalEarned - spentSteps;

                // Update member status to active
                const updatedMembers = squad.members.map(m => {
                    if (m.userId === userId) {
                        return {
                            ...m,
                            status: 'active',
                            joinedAt: Timestamp.now(),
                            currentWalletBalance: walletBalance
                        };
                    }
                    return m;
                });

                // Check if all members are now active
                const allActive = updatedMembers.every(m => m.status === 'active');

                transaction.update(squadRef, {
                    members: updatedMembers,
                    status: allActive ? 'active' : 'pending',
                    updatedAt: Timestamp.now()
                });
            });

            return true;
        } catch (e) {
            console.error('Accept invitation error:', e);
            return false;
        }
    }, []);

    /**
     * Decline Squad Invitation
     */
    const declineSquadInvitation = useCallback(async (squadId: string, userId: string) => {
        try {
            const squadRef = doc(db, 'squads', squadId);

            await updateDoc(squadRef, {
                status: 'cancelled',
                cancelledBy: userId,
                cancelledAt: Timestamp.now()
            });

            return true;
        } catch (e) {
            console.error('Decline invitation error:', e);
            return false;
        }
    }, []);


    return {
        activeSquad,
        loading,
        error,
        createSquad,
        subscribeToActiveSquad,
        acceptSquadInvitation,
        declineSquadInvitation,
        getUserActiveSquad
    };
};
