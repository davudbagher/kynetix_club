// utils/squadValidation.ts
import type { Squad } from '@/hooks/useSquads';

export interface SquadRedemptionValidation {
    canRedeem: boolean;
    reason?: string;
    totalWalletBalance?: number;
    requiredBalance?: number;
}

/**
 * Validate if squad can be redeemed
 * Requirements:
 * 1. Only creator can redeem
 * 2. Squad status must be 'active'
 * 3. All members must have joined (no 'pending' status)
 * 4. Total wallet balance across all members >= target steps AT REDEMPTION TIME
 *    (Members CAN spend during collection period, but must have balance when redeeming)
 * 5. Squad has collected target steps
 * 6. Not already redeemed
 */
export async function validateSquadRedemption(
    squad: Squad,
    userId: string
): Promise<SquadRedemptionValidation> {
    // 1. Only creator can redeem
    if (userId !== squad.hostId) {
        return {
            canRedeem: false,
            reason: 'Only the squad creator can redeem this reward'
        };
    }

    // 2. Check squad is active
    if (squad.status !== 'active') {
        const statusMessages = {
            pending: 'Waiting for all members to join',
            cancelled: 'Squad was cancelled',
            expired: 'Squad has expired',
            completed: 'Squad already redeemed'
        };
        return {
            canRedeem: false,
            reason: statusMessages[squad.status as keyof typeof statusMessages] || `Squad is ${squad.status}`
        };
    }

    // 3. Check all members joined
    const allJoined = squad.members.every(m => m.status === 'active');
    if (!allJoined) {
        const pendingCount = squad.members.filter(m => m.status === 'pending').length;
        return {
            canRedeem: false,
            reason: `${pendingCount} member(s) haven't joined yet`
        };
    }

    // 4. Check total wallet balance >= target
    // Use cached wallet balances from squad members
    const totalWalletBalance = squad.members.reduce(
        (sum, m) => sum + (m.currentWalletBalance || 0),
        0
    );

    if (totalWalletBalance < squad.targetSteps) {
        return {
            canRedeem: false,
            reason: `Squad needs ${squad.targetSteps.toLocaleString()} total steps in wallets. Currently have ${totalWalletBalance.toLocaleString()}`,
            totalWalletBalance,
            requiredBalance: squad.targetSteps
        };
    }

    // 5. Check steps collected
    if (squad.currentSteps < squad.targetSteps) {
        const remaining = squad.targetSteps - squad.currentSteps;
        return {
            canRedeem: false,
            reason: `Squad needs ${remaining.toLocaleString()} more steps collected`
        };
    }

    // 6. Check not already redeemed
    if (squad.redemptionCode) {
        return {
            canRedeem: false,
            reason: 'Squad reward already redeemed'
        };
    }

    return {
        canRedeem: true,
        totalWalletBalance,
        requiredBalance: squad.targetSteps
    };
}
