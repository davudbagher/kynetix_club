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
import { SafeAreaView } from "react-native-safe-area-context";

export default function SquadDetailScreen() {
    const { activeSquad, subscribeToActiveSquad, acceptSquadInvitation, declineSquadInvitation, loading } = useSquads();
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [redemptionCode, setRedemptionCode] = useState<string | null>(null);

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
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.neonLime} />
                </View>
            </SafeAreaView>
        );
    }

    if (!activeSquad) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>No active squad found</Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.buttonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
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

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color={Colors.neonLime} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Squad Quest</Text>
                {!hasPendingInvitation && (
                    <TouchableOpacity
                        style={styles.moreButton}
                        onPress={handleLeaveSquad}
                    >
                        <Ionicons name="ellipsis-horizontal" size={24} color={Colors.neonLime} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Invitation Pending UI */}
            {hasPendingInvitation ? (
                <ScrollView style={styles.scrollView}>
                    <View style={styles.invitationContainer}>
                        <Ionicons name="mail-outline" size={64} color={Colors.neonLime} />
                        <Text style={styles.invitationTitle}>Squad Invitation</Text>
                        <Text style={styles.invitationText}>
                            You've been invited to join a squad quest!
                        </Text>

                        {/* Offer Info */}
                        <View style={styles.invitationOfferCard}>
                            <Text style={styles.invitationOfferTitle}>{activeSquad.offerTitle}</Text>
                            <Text style={styles.invitationOfferPartner}>{activeSquad.offerPartner}</Text>
                            <Text style={styles.invitationTargetSteps}>
                                Target: {activeSquad.targetSteps.toLocaleString()} steps
                            </Text>
                        </View>

                        {/* Squad Members */}
                        <View style={styles.membersSection}>
                            <Text style={styles.sectionTitle}>Squad Members</Text>
                            {activeSquad.members.map((member) => (
                                <View key={member.userId} style={styles.memberRow}>
                                    <View style={styles.memberAvatar}>
                                        <Text style={styles.memberAvatarText}>
                                            {member.fullName.charAt(0)}
                                        </Text>
                                    </View>
                                    <View style={styles.memberInfo}>
                                        <Text style={styles.memberName}>{member.fullName}</Text>
                                        <Text style={styles.memberStatus}>
                                            {member.status === 'active' ? '✓ Joined' : '⏳ Pending'}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Action Buttons */}
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
                </ScrollView>
            ) : (

                <ScrollView style={styles.scrollView}>
                    {/* Status Card */}
                    <View style={styles.statusCard}>
                        <Text style={styles.partnerName}>{activeSquad.offerPartner}</Text>
                        <Text style={styles.offerTitle}>{activeSquad.offerTitle}</Text>

                        {/* Progress Bar */}
                        <View style={styles.largeProgressContainer}>
                            <View
                                style={[
                                    styles.largeProgressBar,
                                    { width: `${progressPercentage}%` }
                                ]}
                            />
                        </View>

                        {/* Progress Stats */}
                        <View style={styles.progressStats}>
                            <Text style={styles.progressText}>
                                {activeSquad.currentSteps.toLocaleString()} / {activeSquad.targetSteps.toLocaleString()} steps
                            </Text>
                            <Text style={styles.percentageText}>
                                {Math.round(progressPercentage)}%
                            </Text>
                        </View>

                        {/* Action/Status */}
                        {
                            remainingSteps > 0 ? (
                                <Text style={styles.motivationText}>
                                    🔥 Only {remainingSteps.toLocaleString()} steps to go!
                                </Text>
                            ) : redemptionCode ? (
                                <View style={styles.redeemedContainer}>
                                    <Text style={styles.redeemedLabel}>Redemption Code:</Text>
                                    <Text style={styles.redeemedCode}>{redemptionCode}</Text>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.redeemButton}
                                    onPress={handleRedeemSquadReward}
                                    disabled={isRedeeming}
                                >
                                    {isRedeeming ? (
                                        <ActivityIndicator color={Colors.black} />
                                    ) : (
                                        <Text style={styles.redeemButtonText}>🎁 Redeem Reward</Text>
                                    )}
                                </TouchableOpacity>
                            )
                        }
                    </View >

                    {/* Members Section */}
                    < View style={styles.section} >
                        <Text style={styles.sectionTitle}>Squad Members ({activeSquad.members.length})</Text>

                        {
                            activeSquad.members.map((member) => (
                                <View key={member.userId} style={styles.memberRow}>
                                    <View style={styles.memberAvatar}>
                                        <Text style={{ fontSize: 20 }}>{member.avatar}</Text>
                                    </View>
                                    <View style={styles.memberInfo}>
                                        <Text style={styles.memberName}>
                                            {member.userId === currentUserId ? `${member.fullName} (You)` : member.fullName}
                                        </Text>
                                        <Text style={styles.memberSteps}>
                                            {member.stepsContributed.toLocaleString()} steps contributed
                                        </Text>
                                    </View>
                                    {member.status === 'pending' && (
                                        <View style={styles.pendingBadge}>
                                            <Text style={styles.pendingText}>Pending</Text>
                                        </View>
                                    )}
                                </View>
                            ))
                        }

                        {
                            activeSquad.members.length < 4 && (
                                <TouchableOpacity style={styles.inviteButton}>
                                    <Ionicons name="person-add" size={20} color={Colors.black} />
                                    <Text style={styles.inviteButtonText}>Invite More Friends</Text>
                                </TouchableOpacity>
                            )
                        }
                    </View >

                    {/* Offer Info */}
                    < View style={styles.section} >
                        <Text style={styles.sectionTitle}>Reward</Text>
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
                                <Text style={{ fontSize: 32 }}>🎁</Text>
                            </View>
                            <View style={styles.rewardInfo}>
                                <Text style={styles.rewardTitle}>{activeSquad.offerTitle}</Text>
                                <Text style={styles.rewardPartner}>at {activeSquad.offerPartner}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color={Colors.lightGrey} />
                        </TouchableOpacity>
                    </View >

                </ScrollView >
            )}
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.darkGrey,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: Colors.cardGrey,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: Colors.white,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: Colors.textSecondary,
        fontSize: 16,
        marginBottom: 20,
    },
    button: {
        backgroundColor: Colors.neonLime,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    buttonText: {
        color: Colors.black,
        fontWeight: 'bold',
    },
    statusCard: {
        backgroundColor: Colors.black,
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.neonLime,
    },
    partnerName: {
        color: Colors.textSecondary,
        fontSize: 14,
        textTransform: 'uppercase',
        fontWeight: '600',
        marginBottom: 4,
    },
    offerTitle: {
        color: Colors.white,
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    largeProgressContainer: {
        height: 12,
        backgroundColor: Colors.cardGrey,
        borderRadius: 6,
        marginBottom: 12,
        overflow: 'hidden',
    },
    largeProgressBar: {
        height: '100%',
        backgroundColor: Colors.neonLime,
    },
    progressStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    progressText: {
        color: Colors.textSecondary,
        fontSize: 14,
    },
    percentageText: {
        color: Colors.white,
        fontWeight: 'bold',
        fontSize: 14,
    },
    motivationText: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 8,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.black,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    memberAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.cardGrey,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        color: Colors.white,
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 4,
    },
    memberSteps: {
        color: Colors.textSecondary,
        fontSize: 13,
    },
    pendingBadge: {
        backgroundColor: Colors.warning + '20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    pendingText: {
        color: Colors.warning,
        fontSize: 12,
        fontWeight: 'bold',
    },
    inviteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.neonLime,
        paddingVertical: 14,
        borderRadius: 16,
        gap: 8,
    },
    inviteButtonText: {
        color: Colors.black,
        fontWeight: 'bold',
        fontSize: 16,
    },
    rewardCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.black,
        padding: 16,
        borderRadius: 16,
    },
    rewardIcon: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: Colors.cardGrey,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    rewardInfo: {
        flex: 1,
    },
    rewardTitle: {
        color: Colors.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    rewardPartner: {
        color: Colors.textSecondary,
        fontSize: 14,
    },
    redeemButton: {
        backgroundColor: Colors.neonLime,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 12,
    },
    redeemButtonText: {
        color: Colors.black,
        fontWeight: 'bold',
        fontSize: 16,
    },
    redeemedContainer: {
        marginTop: 12,
        backgroundColor: 'rgba(57, 255, 20, 0.1)',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.neonLime,
    },
    redeemedLabel: {
        color: Colors.neonLime,
        fontSize: 12,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    redeemedCode: {
        color: Colors.white,
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 2,
    },

    // Invitation UI Styles
    headerTitle: {
        color: Colors.white,
        fontSize: 20,
        fontWeight: 'bold',
    },
    moreButton: {
        padding: 8,
    },
    invitationContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    invitationTitle: {
        color: Colors.white,
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    invitationText: {
        color: Colors.lightGrey,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
    },
    invitationOfferCard: {
        width: '100%',
        backgroundColor: Colors.darkGrey,
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
    },
    invitationOfferTitle: {
        color: Colors.white,
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    invitationOfferPartner: {
        color: Colors.neonLime,
        fontSize: 14,
        marginBottom: 12,
    },
    invitationTargetSteps: {
        color: Colors.lightGrey,
        fontSize: 14,
    },
    membersSection: {
        width: '100%',
        marginTop: 16,
    },
    memberAvatarText: {
        color: Colors.black,
        fontSize: 18,
        fontWeight: 'bold',
    },
    memberStatus: {
        color: Colors.lightGrey,
        fontSize: 12,
    },
    invitationActions: {
        width: '100%',
        marginTop: 24,
        gap: 12,
    },
    acceptButton: {
        backgroundColor: Colors.neonLime,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    acceptButtonText: {
        color: Colors.black,
        fontSize: 16,
        fontWeight: 'bold',
    },
    declineButton: {
        backgroundColor: Colors.darkGrey,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    declineButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
