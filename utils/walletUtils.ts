// utils/walletUtils.ts
import { db } from "@/config/firebase";
import {
    collection,
    doc,
    getDoc,
    runTransaction,
    Timestamp,
} from "firebase/firestore";

export interface WalletBalance {
    totalEarned: number;
    spentSteps: number;
    availableToSpend: number;
}

export interface RedemptionResult {
    success: boolean;
    redemptionCode?: string;
    redemptionId?: string;
    error?: string;
}

/**
 * Calculate user's wallet balance
 */
export async function getWalletBalance(
    userId: string,
): Promise<WalletBalance | null> {
    try {
        const userDoc = await getDoc(doc(db, "users", userId));

        if (!userDoc.exists()) {
            return null;
        }

        const userData = userDoc.data();
        const totalEarned = userData.totalStepsAllTime || 0;
        const spentSteps = userData.spentSteps || 0;

        return {
            totalEarned,
            spentSteps,
            availableToSpend: totalEarned - spentSteps,
        };
    } catch (error) {
        console.error("❌ Error getting wallet balance:", error);
        return null;
    }
}

/**
 * Generate redemption code (KX-XXXXXX format)
 */
export function generateRedemptionCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "KX-";
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Validate if user can redeem an offer
 */
export interface ValidationResult {
    canRedeem: boolean;
    reason?: string;
}

export async function validateRedemption(
    userId: string,
    stepsRequired: number,
): Promise<ValidationResult> {
    try {
        const userDoc = await getDoc(doc(db, "users", userId));

        if (!userDoc.exists()) {
            return { canRedeem: false, reason: "User not found" };
        }

        const userData = userDoc.data();
        const totalEarned = userData.totalStepsAllTime || 0;
        const spentSteps = userData.spentSteps || 0;
        const availableToSpend = totalEarned - spentSteps;

        // Check if user has enough steps
        if (availableToSpend < stepsRequired) {
            return {
                canRedeem: false,
                reason: `Need ${stepsRequired.toLocaleString()} steps, you have ${availableToSpend.toLocaleString()}`,
            };
        }

        // Check daily redemption limit (max 10 per day)
        const today = new Date().toISOString().split("T")[0];
        const lastRedemptionDate = userData.lastRedemptionDate || "";
        const dailyRedemptions = userData.dailyRedemptions || 0;

        if (lastRedemptionDate === today && dailyRedemptions >= 10) {
            return {
                canRedeem: false,
                reason: "Daily redemption limit reached (10 per day)",
            };
        }

        return { canRedeem: true };
    } catch (error) {
        console.error("❌ Error validating redemption:", error);
        return { canRedeem: false, reason: "Validation error" };
    }
}

/**
 * Redeem an offer - atomic transaction
 */
export async function redeemOffer(
    userId: string,
    offerId: string,
    partnerId: string,
    stepsRequired: number,
    offerTitle: string,
): Promise<RedemptionResult> {
    try {
        console.log(`🎁 Starting redemption for user ${userId}, offer ${offerId}`);

        // Validate first
        const validation = await validateRedemption(userId, stepsRequired);
        if (!validation.canRedeem) {
            return {
                success: false,
                error: validation.reason,
            };
        }

        // Use Firestore transaction to ensure atomicity
        const result = await runTransaction(db, async (transaction) => {
            const userRef = doc(db, "users", userId);
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists()) {
                throw new Error("User not found");
            }

            const userData = userDoc.data();
            const totalEarned = userData.totalStepsAllTime || 0;
            const spentSteps = userData.spentSteps || 0;
            const availableToSpend = totalEarned - spentSteps;

            // Double-check in transaction (prevent race conditions)
            if (availableToSpend < stepsRequired) {
                throw new Error("Insufficient steps");
            }

            // Generate redemption code and document
            const redemptionCode = generateRedemptionCode();
            const redemptionRef = doc(collection(db, "redemptions"));
            const now = Timestamp.now();
            const today = new Date().toISOString().split("T")[0];

            // Create redemption document
            transaction.set(redemptionRef, {
                userId,
                offerId,
                partnerId,
                offerTitle,
                redemptionCode,
                stepsSpent: stepsRequired,
                status: "active",
                redeemedAt: now,
                expiresAt: null, // Can be set based on offer
                usedAt: null,
            });

            // Update user document
            const lastRedemptionDate = userData.lastRedemptionDate || "";
            const isToday = lastRedemptionDate === today;

            transaction.update(userRef, {
                spentSteps: spentSteps + stepsRequired,
                dailyRedemptions: isToday ? (userData.dailyRedemptions || 0) + 1 : 1,
                lastRedemptionDate: today,
                updatedAt: now,
            });

            console.log(`✅ Redemption successful: ${redemptionCode}`);

            return {
                redemptionCode,
                redemptionId: redemptionRef.id,
            };
        });

        return {
            success: true,
            redemptionCode: result.redemptionCode,
            redemptionId: result.redemptionId,
        };
    } catch (error: any) {
        console.error("❌ Redemption failed:", error);
        return {
            success: false,
            error: error.message || "Redemption failed",
        };
    }
}
