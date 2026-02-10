// components/ChallengeDetailModal.tsx
import Colors from '@/constants/Colors';
import { Challenge, calculateTimeRemaining, formatProgress } from '@/constants/challenges';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ChallengeDetailModalProps {
    challenge: Challenge | null;
    userProgress?: number;
    visible: boolean;
    onClose: () => void;
    onJoin?: () => void;
}

export default function ChallengeDetailModal({
    challenge,
    userProgress = 0,
    visible,
    onClose,
    onJoin,
}: ChallengeDetailModalProps) {
    const [timeRemaining, setTimeRemaining] = useState('');
    const [isUrgent, setIsUrgent] = useState(false);

    // Update countdown timer every minute
    useEffect(() => {
        if (!challenge) return;

        const updateTimer = () => {
            const remaining = calculateTimeRemaining(challenge.endDate);
            setTimeRemaining(remaining);
            setIsUrgent(
                remaining.includes('h left') &&
                !remaining.includes('d') &&
                parseInt(remaining) < 24
            );
        };

        updateTimer();
        const interval = setInterval(updateTimer, 60000);
        return () => clearInterval(interval);
    }, [challenge]);

    const handleJoin = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (onJoin && challenge && !isCompleted) {
            onJoin();
        }
    };

    const handleViewFullChallenge = () => {
        if (!challenge) return;
        onClose();
        router.push(`/challenge/${challenge.id}`);
    };

    if (!challenge) {
        return (
            <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
                <View style={styles.emptyContainer}>
                    <ActivityIndicator size="large" color={Colors.neonLime} />
                </View>
            </Modal>
        );
    }

    const isJoined = userProgress > 0;
    const isCompleted = userProgress >= 100;
    const sponsor = challenge.sponsor;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={28} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Challenge Details</Text>
                    <View style={{ width: 28 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                    {/* Challenge Header */}
                    <View style={styles.challengeHeader}>
                        <Text style={styles.challengeIcon}>{challenge.icon}</Text>
                        <Text style={styles.challengeTitle}>{challenge.title}</Text>
                        {sponsor && (
                            <View style={styles.sponsorBadge}>
                                <Text style={styles.sponsorBadgeText}>{sponsor.logo} {sponsor.name}</Text>
                            </View>
                        )}
                    </View>

                    {/* Progress Card (if joined) */}
                    {isJoined && (
                        <View style={styles.progressCard}>
                            <View style={styles.progressHeader}>
                                <Text style={styles.progressLabel}>Your Progress</Text>
                                <Text style={styles.progressPercent}>{userProgress}%</Text>
                            </View>
                            <View style={styles.progressBarContainer}>
                                <View
                                    style={[
                                        styles.progressBarFill,
                                        {
                                            width: `${userProgress}%`,
                                            backgroundColor: sponsor?.primaryColor || Colors.neonLime
                                        }
                                    ]}
                                />
                            </View>
                            <Text style={styles.progressDetail}>
                                {formatProgress(userProgress, challenge.goal, challenge.goalUnit)}
                            </Text>
                        </View>
                    )}

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Ionicons name="people" size={20} color={Colors.neonLime} />
                            <Text style={styles.statValue}>{challenge.participantCount}</Text>
                            <Text style={styles.statLabel}>Participants</Text>
                        </View>

                        <View style={styles.statItem}>
                            <Ionicons name="time-outline" size={20} color={isUrgent ? '#FF4444' : Colors.neonLime} />
                            <Text style={[styles.statValue, isUrgent && { color: '#FF4444' }]}>{timeRemaining}</Text>
                            <Text style={styles.statLabel}>Remaining</Text>
                        </View>

                        <View style={styles.statItem}>
                            <Text style={styles.rewardBadge}>{challenge.rewardBadge}</Text>
                            <Text style={styles.statValue}>+{challenge.rewardPoints}</Text>
                            <Text style={styles.statLabel}>Reward</Text>
                        </View>
                    </View>

                    {/* About Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>About</Text>
                        <Text style={styles.description}>{challenge.description}</Text>
                    </View>

                    {/* Challenge Details */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Details</Text>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Goal</Text>
                            <Text style={styles.detailValue}>
                                {challenge.goal.toLocaleString()} {challenge.goalUnit}
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Type</Text>
                            <Text style={styles.detailValue}>
                                {challenge.type === 'distance' ? 'Distance 🏃' :
                                    challenge.type === 'checkin' ? 'Check-in 📍' : 'Streak 🔥'}
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Duration</Text>
                            <Text style={styles.detailValue}>
                                {new Date(challenge.startDate).toLocaleDateString()} - {new Date(challenge.endDate).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>

                    {/* View Full Challenge Button */}
                    <TouchableOpacity
                        style={styles.viewFullButton}
                        onPress={handleViewFullChallenge}
                        activeOpacity={0.8}
                    >
                        <View style={styles.viewFullContent}>
                            <Ionicons name="trophy" size={24} color={sponsor?.primaryColor || Colors.neonLime} />
                            <View style={styles.viewFullText}>
                                <Text style={styles.viewFullTitle}>View Full Challenge</Text>
                                <Text style={styles.viewFullSubtitle}>
                                    See leaderboard, stats & compete with others
                                </Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>

                    <View style={{ height: 120 }} />
                </ScrollView>

                {/* Fixed Bottom CTA */}
                <View style={styles.bottomCTA}>
                    <TouchableOpacity
                        style={[
                            styles.joinButton,
                            isJoined && styles.joinButtonJoined,
                            sponsor && !isJoined && { backgroundColor: sponsor.primaryColor },
                            isCompleted && styles.joinButtonCompleted,
                        ]}
                        onPress={handleJoin}
                        disabled={isCompleted}
                        activeOpacity={0.8}
                    >
                        <Text
                            style={[
                                styles.joinButtonText,
                                sponsor && !isJoined && { color: Colors.white },
                            ]}
                        >
                            {isCompleted ? 'Completed ✓' : isJoined ? 'Continue Challenge' : 'Join Challenge'}
                        </Text>
                        {!isCompleted && (
                            <Ionicons
                                name="arrow-forward"
                                size={20}
                                color={sponsor && !isJoined ? Colors.white : Colors.textPrimary}
                            />
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    closeButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: Colors.textPrimary,
    },

    // Content
    content: {
        padding: 20,
    },

    // Challenge Header
    challengeHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    challengeIcon: {
        fontSize: 64,
        marginBottom: 12,
    },
    challengeTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        textAlign: 'center',
        marginBottom: 8,
    },
    sponsorBadge: {
        backgroundColor: Colors.cardBackground,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    sponsorBadgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
    },

    // Progress Card
    progressCard: {
        backgroundColor: Colors.cardBackground,
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    progressLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    progressPercent: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.neonLime,
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: Colors.progressTrack,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.neonLime,
        borderRadius: 4,
    },
    progressDetail: {
        fontSize: 13,
        color: Colors.textSecondary,
    },

    // Stats Row
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: Colors.cardBackground,
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    statItem: {
        alignItems: 'center',
        gap: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    rewardBadge: {
        fontSize: 24,
    },

    // Sections
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginBottom: 12,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        color: Colors.textSecondary,
    },

    // Detail Rows
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    detailLabel: {
        fontSize: 15,
        color: Colors.textSecondary,
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textPrimary,
        flex: 1,
        textAlign: 'right',
    },

    // View Full Challenge Button
    viewFullButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.cardBackground,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    viewFullContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    viewFullText: {
        flex: 1,
    },
    viewFullTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    viewFullSubtitle: {
        fontSize: 13,
        color: Colors.textSecondary,
    },

    // Bottom CTA
    bottomCTA: {
        padding: 20,
        paddingBottom: 32,
        backgroundColor: Colors.background,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    joinButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.neonLime,
        borderRadius: 16,
        paddingVertical: 16,
        gap: 8,
    },
    joinButtonJoined: {
        backgroundColor: Colors.cardBackground,
    },
    joinButtonCompleted: {
        backgroundColor: Colors.success,
        opacity: 0.6,
    },
    joinButtonText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
});
