import { db } from "@/config/firebase";
import Colors from "@/constants/Colors";
import { getOfferById } from "@/constants/mockData";
import { useSquads } from "@/hooks/useSquads";
import { validateSquadRedemption } from "@/utils/squadValidation";
import { generateRedemptionCode } from "@/utils/walletUtils";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, Stack } from "expo-router";
import {
    collection,
    doc,
    setDoc,
    Timestamp,
    updateDoc
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function SquadDetailScreen() {
    const { activeSquad, subscribeToActiveSquad, acceptSquadInvitation, declineSquadInvitation, loading } = useSquads();
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [redemptionCode, setRedemptionCode] = useState<string | null>(null);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const loadUser = async () => {
            const userId = await AsyncStorage.getItem('kynetix_user_id');
            if (userId) {
                setCurrentUserId(userId);
                subscribeToActiveSquad(userId);
            }
        };
        loadUser();
    }, [subscribeToActiveSquad]);

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.white} />
                </View>
            </View>
        );
    }

    if (!activeSquad) {
        return (
            <View style={styles.container}>
                <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color={Colors.white} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.errorContainer}>
                        <Ionicons name="people-outline" size={64} color="rgba(255,255,255,0.5)" />
                        <Text style={styles.errorText}>No active squad found</Text>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => router.back()}
                        >
                            <Text style={styles.buttonText}>Go Back</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    const progressPercentage = Math.min((activeSquad.currentSteps / activeSquad.targetSteps) * 100, 100);
    const remainingSteps = Math.max(activeSquad.targetSteps - activeSquad.currentSteps, 0);

    const handleRedeemSquadReward = async () => {
        if (!currentUserId || !activeSquad) return;

        try {
            setIsRedeeming(true);

            // 1. Validate squad redemption
            const validation = await validateSquadRedemption(activeSquad, currentUserId);

            if (!validation.canRedeem) {
                Alert.alert('Cannot Redeem', validation.reason || 'Not eligible for redemption');
                return;
            }

            // 2. Generate shared redemption code
            const offer = getOfferById(activeSquad.offerId);
            const partnerId = offer?.partner_id || 'unknown';
            const redemptionCode = generateRedemptionCode();

            // 3. Create squad redemption record
            const redemptionRef = doc(collection(db, 'redemptions'));
            await setDoc(redemptionRef, {
                type: 'squad',
                squadId: activeSquad.id,
                offerId: activeSquad.offerId,
                partnerId,
                offerTitle: activeSquad.offerTitle,
                redemptionCode,
                createdBy: currentUserId,
                memberIds: activeSquad.members.map(m => m.userId),
                stepsCollected: activeSquad.currentSteps,
                totalWalletBalance: validation.totalWalletBalance || 0,
                status: 'active',
                redeemedAt: Timestamp.now(),
                usedAt: null
            });

            // 4. Update squad status to completed
            const squadRef = doc(db, 'squads', activeSquad.id);
            await updateDoc(squadRef, {
                status: 'completed',
                redemptionCode,
                redeemedAt: Timestamp.now(),
                redeemedBy: currentUserId
            });

            setRedemptionCode(redemptionCode);
            Alert.alert(
                '🎉 Squad Reward Unlocked!',
                `Your redemption code:
${redemptionCode}

Show this code at ${activeSquad.offerPartner}.
Valid for one - time use by the squad.`,
                [{ text: 'Got it!' }]
            );
        } catch (error) {
            console.error('Squad redemption error:', error);
            Alert.alert('Error', 'Redemption failed. Please try again.');
        } finally {
            setIsRedeeming(false);
        }
    };

    const handleAcceptInvitation = async () => {
        if (!currentUserId || !activeSquad) return;

        try {
            await acceptSquadInvitation(activeSquad.id, currentUserId);
            Alert.alert('✅ Joined!', 'You are now part of this squad!');
        } catch (error) {
            console.error('Accept invitation error:', error);
            Alert.alert('Error', 'Failed to join squad. Please try again.');
        }
    };

    const handleDeclineInvitation = async () => {
        if (!currentUserId || !activeSquad) return;

        Alert.alert(
            'Decline Invitation',
            'Are you sure? This will cancel the squad for everyone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Decline',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await declineSquadInvitation(activeSquad.id, currentUserId);
                            router.back();
                        } catch (error) {
                            console.error('Decline invitation error:', error);
                            Alert.alert('Error', 'Failed to decline. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const handleLeaveSquad = () => {
        Alert.alert(
            "Leave Squad",
            "Are you sure you want to leave this squad?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Leave",
                    style: "destructive",
                    onPress: () => {
                        // TODO: Implement leave squad logic
                        router.back();
                    }
                }
            ]
        );
    };

    // Check if current user has pending invitation
    const currentMember = activeSquad?.members.find(m => m.userId === currentUserId);
    const hasPendingInvitation = currentMember?.status === 'pending';
    // Use generated code if available, otherwise check squad for existing code
    const displayedRedemptionCode = redemptionCode || activeSquad.redemptionCode;

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Blue Background Top */}
            <View style={styles.topBackground} />

            <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color={Colors.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Squad Quest</Text>
                    {!hasPendingInvitation ? (
                        <TouchableOpacity
                            style={styles.moreButton}
                            onPress={handleLeaveSquad}
                        >
                            <Ionicons name="ellipsis-horizontal" size={24} color={Colors.white} />
                        </TouchableOpacity>
                    ) : <View style={{ width: 40 }} />}
                </View>

                {/* White Content Sheet */}
                <View style={styles.contentSheet}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* Partner & Title Header */}
                        <View style={styles.questHeader}>
                            <Text style={styles.partnerName}>{activeSquad.offerPartner}</Text>
                            <Text style={styles.offerTitle}>{activeSquad.offerTitle}</Text>
                        </View>

                        {/* Invitation Pending UI */}
                        {hasPendingInvitation ? (
                            <View style={styles.invitationCard}>
                                <View style={styles.invitationIconBox}>
                                    <Ionicons name="mail-unread" size={32} color={Colors.neonLime} />
                                </View>
                                <Text style={styles.invitationTitle}>Invitation</Text>
                                <Text style={styles.invitationText}>
                                    You've been invited to join a squad quest!
                                </Text>
                                <Text style={styles.invitationDetails}>
                                    Target: {activeSquad.targetSteps.toLocaleString()} steps
                                </Text>

                                <View style={styles.invitationActions}>
                                    <TouchableOpacity
                                        style={styles.acceptButton}
                                        onPress={handleAcceptInvitation}
                                    >
                                        <Text style={styles.acceptButtonText}>Accept & Join</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.declineButton}
                                        onPress={handleDeclineInvitation}
                                    >
                                        <Text style={styles.declineButtonText}>Decline</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <>


                                {/* Status Card (Progress) - Charcoal Theme */}
                                <View style={styles.statusCard}>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.cardLabel}>Team Progress</Text>
                                        <Text style={styles.percentageText}>
                                            {Math.round(progressPercentage)}%
                                        </Text>
                                    </View>

                                    <View style={styles.progressBarContainer}>
                                        <View
                                            style={[
                                                styles.progressBar,
                                                { width: `${progressPercentage}%` }
                                            ]}
                                        />
                                    </View>

                                    <View style={styles.statsRow}>
                                        <Text style={styles.statsText}>
                                            <Text style={{ fontWeight: 'bold', color: Colors.white }}>
                                                {activeSquad.currentSteps.toLocaleString()}
                                            </Text> / {activeSquad.targetSteps.toLocaleString()} steps
                                        </Text>

                                        {remainingSteps > 0 && (
                                            <Text style={styles.remainingText}>
                                                {remainingSteps.toLocaleString()} left
                                            </Text>
                                        )}
                                    </View>

                                    {/* Action Area */}
                                    {displayedRedemptionCode ? (
                                        <View style={styles.redeemedContainer}>
                                            <Text style={styles.redeemedLabel}>Redemption Code</Text>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    // Copy to clipboard logic could go here
                                                    Alert.alert("Code", displayedRedemptionCode);
                                                }}
                                            >
                                                <Text style={styles.redeemedCode}>{displayedRedemptionCode}</Text>
                                            </TouchableOpacity>
                                            <View style={styles.redeemedBadge}>
                                                <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                                                <Text style={styles.redeemedBadgeText}>Active</Text>
                                            </View>
                                        </View>
                                    ) : remainingSteps <= 0 ? (
                                        <TouchableOpacity
                                            style={styles.redeemButton}
                                            onPress={handleRedeemSquadReward}
                                            disabled={isRedeeming}
                                        >
                                            {isRedeeming ? (
                                                <ActivityIndicator color={Colors.black} />
                                            ) : (
                                                <>
                                                    <Ionicons name="gift-outline" size={20} color={Colors.black} />
                                                    <Text style={styles.redeemButtonText}>Redeem Reward</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    ) : null}
                                </View >

                                {/* Reward Info - Moved Top */}
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <Text style={styles.sectionTitle}>Reward Details</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.rewardCard}
                                        onPress={() => {
                                            if (activeSquad.offerId) {
                                                router.push({
                                                    pathname: "/offer-detail",
                                                    params: { offerId: activeSquad.offerId }
                                                });
                                            }
                                        }}
                                    >
                                        <View style={styles.rewardIcon}>
                                            <Ionicons name="gift" size={24} color={Colors.brandBlue} />
                                        </View>
                                        <View style={styles.rewardInfo}>
                                            <Text style={styles.rewardTitle}>{activeSquad.offerTitle}</Text>
                                            <Text style={styles.rewardSubtitle}>View Offer Details</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>

                                {/* Members Section */}
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <Text style={styles.sectionTitle}>Squad Members</Text>
                                        <View style={styles.memberCountBadge}>
                                            <Text style={styles.memberCountText}>{activeSquad.members.length}</Text>
                                        </View>
                                    </View>

                                    {
                                        activeSquad.members.map((member) => (
                                            <View key={member.userId} style={styles.memberRow}>
                                                <View style={styles.memberAvatar}>
                                                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: Colors.white }}>
                                                        {member.avatar || member.fullName.charAt(0)}
                                                    </Text>
                                                </View>
                                                <View style={styles.memberInfo}>
                                                    <Text style={styles.memberName}>
                                                        {member.userId === currentUserId ? `${member.fullName} (You)` : member.fullName}
                                                    </Text>
                                                    <Text style={styles.memberSteps}>
                                                        {member.stepsContributed.toLocaleString()} steps
                                                    </Text>
                                                </View>
                                                {member.status === 'pending' ? (
                                                    <View style={styles.pendingBadge}>
                                                        <Text style={styles.pendingText}>Invited</Text>
                                                    </View>
                                                ) : (
                                                    <Text style={styles.contributionPercent}>
                                                        {Math.round((member.stepsContributed / activeSquad.targetSteps) * 100)}%
                                                    </Text>
                                                )}
                                            </View>
                                        ))
                                    }

                                    {
                                        activeSquad.members.length < 4 && (
                                            <TouchableOpacity style={styles.inviteRow}>
                                                <View style={styles.inviteIcon}>
                                                    <Ionicons name="add" size={24} color={Colors.brandBlue} />
                                                </View>
                                                <Text style={styles.inviteText}>Invite Friend</Text>
                                            </TouchableOpacity>
                                        )
                                    }
                                </View >
                            </>
                        )}
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.brandBlue,
    },
    topBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        backgroundColor: Colors.brandBlue,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 10,
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    moreButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: Colors.white,
    },
    contentSheet: {
        flex: 1,
        backgroundColor: Colors.background,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        overflow: 'hidden',
    },
    scrollContent: {
        padding: 24,
    },
    questHeader: {
        marginBottom: 24,
        alignItems: 'center',
    },
    partnerName: {
        color: Colors.textSecondary,
        fontSize: 13,
        textTransform: 'uppercase',
        fontWeight: '600',
        marginBottom: 8,
        letterSpacing: 1,
    },
    offerTitle: {
        color: Colors.textPrimary,
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 32,
    },

    // Cards & Sections
    statusCard: {
        backgroundColor: "#1C1C1E", // Charcoal
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.white,
        letterSpacing: 0.5,
    },
    progressBarContainer: {
        height: 12,
        backgroundColor: "rgba(255,255,255,0.1)", // Visible track for 0 progress
        borderRadius: 6,
        marginBottom: 16,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: Colors.neonLime,
        borderRadius: 6,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    statsText: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    remainingText: {
        fontSize: 14,
        color: Colors.white,
        fontWeight: '600',
    },
    percentageText: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.neonLime,
    },

    // Redemption
    redeemButton: {
        backgroundColor: Colors.neonLime,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    redeemButtonText: {
        color: Colors.black, // High contrast
        fontWeight: 'bold',
        fontSize: 16,
    },
    redeemedContainer: {
        marginTop: 20,
        backgroundColor: 'rgba(57, 255, 20, 0.05)',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(57, 255, 20, 0.3)',
        borderStyle: 'dashed',
    },
    redeemedLabel: {
        color: Colors.neonLime,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    redeemedCode: {
        color: Colors.white,
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: 3,
        marginBottom: 8,
        fontVariant: ['tabular-nums'],
    },
    redeemedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: "rgba(255,255,255,0.1)",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    redeemedBadgeText: {
        fontSize: 12,
        color: Colors.neonLime,
        fontWeight: '600',
    },

    // Members Section
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textPrimary, // Black on white sheet
    },
    memberCountBadge: {
        backgroundColor: Colors.cardGrey,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    memberCountText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        padding: 12,
        borderRadius: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    memberAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.brandBlue,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        color: Colors.textPrimary,
        fontWeight: '600',
        fontSize: 15,
        marginBottom: 2,
    },
    memberSteps: {
        color: Colors.textSecondary,
        fontSize: 13,
    },
    contributionPercent: {
        color: Colors.textPrimary, // Black/Dark Grey as requested
        fontWeight: '700',
        fontSize: 15,
    },
    pendingBadge: {
        backgroundColor: '#FFF8E1',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    pendingText: {
        color: '#FFB300',
        fontSize: 12,
        fontWeight: '600',
    },
    inviteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginTop: 4,
    },
    inviteIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EBF5FF', // Light blue
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    inviteText: {
        color: Colors.brandBlue,
        fontWeight: '600',
        fontSize: 15,
    },

    // Reward Card
    rewardCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    rewardIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#EBF5FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    rewardInfo: {
        flex: 1,
    },
    rewardTitle: {
        color: Colors.textPrimary,
        fontWeight: '700',
        fontSize: 15,
        marginBottom: 2,
    },
    rewardSubtitle: {
        color: Colors.brandBlue,
        fontSize: 13,
        fontWeight: '500',
    },

    // Invitation UI
    invitationCard: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 4,
    },
    invitationIconBox: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#EBF5FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    invitationTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.textPrimary,
        marginBottom: 8,
    },
    invitationText: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 8,
    },
    invitationDetails: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: 32,
    },
    invitationActions: {
        width: '100%',
        gap: 12,
    },
    acceptButton: {
        backgroundColor: Colors.neonLime,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    acceptButtonText: {
        color: Colors.textPrimary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    declineButton: {
        backgroundColor: '#F5F5F5',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    declineButtonText: {
        color: Colors.textSecondary,
        fontSize: 16,
        fontWeight: '600',
    },

    // Error/Loading
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    errorText: {
        color: Colors.white,
        fontSize: 18,
        marginTop: 20,
        marginBottom: 32,
        opacity: 0.8,
    },
    button: {
        backgroundColor: Colors.white,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    buttonText: {
        color: Colors.brandBlue,
        fontWeight: 'bold',
    },
});
