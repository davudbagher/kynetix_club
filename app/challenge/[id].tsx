// app/challenge/[id].tsx
import Colors from '@/constants/Colors';
import { Challenge, MOCK_CHALLENGES } from '@/constants/challenges';
import { getChallengeLeaderboard } from '@/constants/mockChallengeLeaderboards';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useChallenges } from '@/hooks/useChallenges';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type LeaderboardTab = 'individual' | 'average' | 'total';

export default function ChallengeDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [leaderboard, setLeaderboard] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<LeaderboardTab>('individual');
    const [refreshing, setRefreshing] = useState(false);
    const [isJoined, setIsJoined] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    const { joinChallenge, getUserChallengeProgress } = useChallenges();

    useEffect(() => {
        loadUserId();
    }, []);

    useEffect(() => {
        if (id) {
            loadChallengeData();
        }
    }, [id, userId]);

    const loadUserId = async () => {
        try {
            const storedId = await AsyncStorage.getItem('kynetix_user_id');
            setUserId(storedId);
        } catch (e) {
            console.error(e);
        }
    };

    const loadChallengeData = async () => {
        const foundChallenge = MOCK_CHALLENGES.find(c => c.id === id);
        setChallenge(foundChallenge || null);

        if (foundChallenge) {
            // Check if user is joined
            if (userId) {
                const progress = await getUserChallengeProgress(userId, id);
                // If progress is not null/undefined (or whatever the mock returns for not joined), user is joined
                // For mock, we check if progress > -1 or based on mock logic. 
                // Using existing hook logic:
                const isParticipating = progress >= 0; // Assuming -1 means not participating if that was logic, but hook uses 0 for non-participation usually?
                // Actually `getUserChallengeProgress` returns 0 even if not joined in some mocks?
                // Let's rely on checking the leaderboard participation or just local logic.
                // For now, let's assume if we can fetch progress it returns something.
                // Better approach: check Mock participation directly or rely on returned value?
                // Let's assume user is NOT joined if we can't find them?
                // Actually, let's make it simple: if button pressed -> setJoined.
                // In real app, we check backend.
            }

            const leaderboardData = await getChallengeLeaderboard(id);
            setLeaderboard(leaderboardData);

            if (userId && leaderboardData?.users) {
                const userInLeaderboard = leaderboardData.users.find((u: any) => u.userId === userId);
                setIsJoined(!!userInLeaderboard);
            }
        }
    };

    const handleJoin = async () => {
        if (!userId || !challenge) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        const success = await joinChallenge(userId, challenge.id);
        if (success) {
            setIsJoined(true);
            // Refresh logic if needed
            loadChallengeData();
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadChallengeData();
        setRefreshing(false);
    };

    if (!challenge) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.neonLime} />
                    <Text style={styles.loadingText}>Loading challenge...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const sponsor = challenge.sponsor;
    const stats = challenge.stats;

    return (
        <SafeAreaView
            style={[
                styles.container,
                sponsor && { backgroundColor: sponsor.secondaryColor || Colors.white }
            ]}
            edges={['top']}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.black} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.inviteButton}>
                    <Ionicons name="people" size={20} color={Colors.black} />
                    <Text style={styles.inviteText}>Invite</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.brandBlue}
                        colors={[Colors.brandBlue]}
                    />
                }
            >
                {/* Sponsor Branding + Challenge Title */}
                <View style={styles.titleSection}>
                    {sponsor && (
                        <View
                            style={[
                                styles.sponsorLogo,
                                { backgroundColor: sponsor.primaryColor }
                            ]}
                        >
                            <Text style={styles.sponsorLogoText}>{sponsor.logo}</Text>
                            {sponsor.name && (
                                <Text style={styles.sponsorName}>{sponsor.name}</Text>
                            )}
                        </View>
                    )}
                    <View style={styles.challengeTitleContainer}>
                        <Text style={styles.challengeIcon}>{challenge.icon}</Text>
                        <Text style={styles.challengeTitle}>{challenge.title}</Text>
                    </View>
                </View>

                {/* Description */}
                <View style={styles.descriptionSection}>
                    <Text style={styles.description} numberOfLines={2}>
                        {challenge.description}
                    </Text>
                    <TouchableOpacity>
                        <Text style={styles.readMore}>Read more</Text>
                    </TouchableOpacity>
                </View>

                {/* Quick Stats Row */}
                <View style={styles.quickStatsRow}>
                    <View style={styles.quickStat}>
                        <Ionicons name="time-outline" size={16} color={Colors.lightGrey} />
                        <Text style={styles.quickStatText}>111d left</Text>
                    </View>
                    {stats?.teamCount && (
                        <View style={styles.quickStat}>
                            <Ionicons name="people-outline" size={16} color={Colors.lightGrey} />
                            <Text style={styles.quickStatText}>{stats.teamCount} Teams</Text>
                        </View>
                    )}
                    <View style={styles.quickStat}>
                        <Ionicons name="person-outline" size={16} color={Colors.lightGrey} />
                        <Text style={styles.quickStatText}>{challenge.participantCount.toLocaleString()}</Text>
                    </View>
                </View>

                {/* Progress Bar */}
                {stats && (
                    <View style={styles.progressSection}>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressCurrent}>
                                {(stats.totalDistance || stats.totalSteps || stats.totalCheckIns || 0).toLocaleString()}
                            </Text>
                            <Text style={styles.progressGoal}>
                                {challenge.goal.toLocaleString()} {challenge.goalUnit}
                            </Text>
                        </View>
                        <View style={styles.progressBarContainer}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    {
                                        width: `${Math.min(100, ((stats.totalDistance || stats.totalSteps || stats.totalCheckIns || 0) / challenge.goal) * 100)}%`,
                                        backgroundColor: sponsor?.primaryColor || Colors.brandBlue
                                    }
                                ]}
                            />
                        </View>
                    </View>
                )}

                {/* Detailed Stats Grid */}
                {stats && (
                    <View style={styles.statsGrid}>
                        {stats.totalSteps !== undefined && (
                            <View style={styles.statCard}>
                                <Text style={styles.statIcon}>🚶</Text>
                                <Text style={styles.statValue}>{stats.totalSteps.toLocaleString()}</Text>
                            </View>
                        )}
                        {stats.teamCount !== undefined && (
                            <View style={styles.statCard}>
                                <Text style={styles.statIcon}>👥</Text>
                                <Text style={styles.statValue}>{stats.teamCount}</Text>
                            </View>
                        )}
                        {stats.totalCheckIns !== undefined && (
                            <View style={styles.statCard}>
                                <Text style={styles.statIcon}>📍</Text>
                                <Text style={styles.statValue}>{stats.totalCheckIns.toLocaleString()}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Leaderboard Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'average' && styles.tabActive]}
                        onPress={() => setActiveTab('average')}
                    >
                        <Text style={[styles.tabText, activeTab === 'average' && styles.tabTextActive]}>
                            Average
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'total' && styles.tabActive]}
                        onPress={() => setActiveTab('total')}
                    >
                        <Text style={[styles.tabText, activeTab === 'total' && styles.tabTextActive]}>
                            Total
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'individual' && styles.tabActive]}
                        onPress={() => setActiveTab('individual')}
                    >
                        <Text style={[styles.tabText, activeTab === 'individual' && styles.tabTextActive]}>
                            Individually
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Leaderboard Floating Container */}
                {leaderboard ? (
                    <View style={styles.floatingLeaderboardContainer}>
                        <View style={styles.leaderboardHeader}>
                            <Text style={styles.leaderboardTitle}>Leaderboard</Text>
                            <Text style={styles.leaderboardSubtitle}>
                                {leaderboard.users.length.toLocaleString()} participants
                            </Text>
                        </View>

                        <ScrollView
                            style={styles.leaderboardScroll}
                            nestedScrollEnabled={true}
                            showsVerticalScrollIndicator={true}
                            contentContainerStyle={{ paddingBottom: 16 }} // Internal padding
                        >
                            {leaderboard.users.map((user: any, index: number) => {
                                const isCurrentUser = user.isCurrentUser;
                                // Use Brand Colors for row logic
                                const accentColor = Colors.neonLime;

                                return (
                                    <View
                                        key={user.userId}
                                        style={[
                                            styles.leaderboardRowCompact,
                                            isCurrentUser && styles.leaderboardRowHighlight,
                                        ]}
                                    >
                                        <View style={styles.rankBadgeCompact}>
                                            <Text style={[
                                                styles.rankTextCompact,
                                                index < 3 && { fontSize: 16 }
                                            ]}>
                                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${user.rank}`}
                                            </Text>
                                        </View>

                                        <View
                                            style={[
                                                styles.avatarCompact,
                                                index < 3 && { borderColor: Colors.neonLime, borderWidth: 1.5 }
                                            ]}
                                        >
                                            <Text style={styles.avatarTextCompact}>{user.avatar}</Text>
                                        </View>

                                        <View style={styles.userInfoCompact}>
                                            <View style={styles.nameRow}>
                                                <Text style={styles.userNameCompact} numberOfLines={1}>
                                                    {user.name}
                                                    {isCurrentUser && ' (You)'}
                                                </Text>
                                                <Text style={[
                                                    styles.userProgressCompact,
                                                    isCurrentUser && { color: Colors.brandBlue }
                                                ]}>
                                                    {user.progress?.toLocaleString() || `${user.progressPercent}%`}
                                                </Text>
                                            </View>

                                            <View style={styles.compactProgressBarContainer}>
                                                <View
                                                    style={[
                                                        styles.compactProgressBar,
                                                        {
                                                            width: `${user.progressPercent}%`,
                                                            backgroundColor: Colors.neonLime
                                                        }
                                                    ]}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </View>
                ) : (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={Colors.brandBlue} />
                    </View>
                )}


                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Sticky Join Button */}
            {!isJoined && challenge && (
                <View style={styles.bottomCTA}>
                    <TouchableOpacity
                        style={styles.joinButton}
                        onPress={handleJoin}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="add-circle" size={24} color={Colors.black} />
                        <Text style={styles.joinButtonText}>Join Challenge</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: Colors.lightGrey,
        marginTop: 16,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        padding: 8,
    },
    inviteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.neonLime,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    inviteText: {
        color: Colors.black,
        fontSize: 14,
        fontWeight: '600',
    },

    // Title Section
    titleSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
        gap: 16,
    },
    sponsorLogo: {
        width: 80,
        height: 80,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sponsorLogoText: {
        fontSize: 32,
    },
    sponsorName: {
        fontSize: 10,
        color: Colors.white,
        fontWeight: 'bold',
        marginTop: 4,
        textAlign: 'center',
    },
    challengeTitleContainer: {
        flex: 1,
    },
    challengeIcon: {
        fontSize: 32,
        marginBottom: 4,
    },
    challengeTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.black,
    },

    // Description
    descriptionSection: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    description: {
        fontSize: 14,
        color: Colors.lightGrey,
        lineHeight: 20,
        marginBottom: 4,
    },
    readMore: {
        fontSize: 14,
        color: Colors.brandBlue,
        fontWeight: '600',
    },

    // Quick Stats
    quickStatsRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20,
        gap: 16,
    },
    quickStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    quickStatText: {
        fontSize: 13,
        color: Colors.lightGrey,
    },

    // Progress
    progressSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressCurrent: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.brandBlue,
    },
    progressGoal: {
        fontSize: 16,
        color: Colors.lightGrey,
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: Colors.cardGrey,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.brandBlue,
        borderRadius: 4,
    },

    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 24,
        gap: 8,
    },
    statCard: {
        flex: 1,
        backgroundColor: Colors.brandBlue,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    statIcon: {
        fontSize: 24,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.white,
    },

    // Tabs
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 16,
        gap: 8,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: Colors.cardBackground,
        borderRadius: 8,
    },
    tabActive: {
        backgroundColor: Colors.brandBlue + '20',
        borderWidth: 1,
        borderColor: Colors.brandBlue,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    tabTextActive: {
        color: Colors.brandBlue,
    },

    // Leaderboard Floating Container
    floatingLeaderboardContainer: {
        marginHorizontal: 20,
        backgroundColor: Colors.darkGrey,
        borderRadius: 16,
        padding: 4,
        height: 400,
        marginBottom: 20,
        overflow: 'hidden',
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    leaderboardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.black,
        marginBottom: 4,
        backgroundColor: Colors.darkGrey,
    },
    leaderboardTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.white,
    },
    leaderboardSubtitle: {
        fontSize: 13,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    leaderboardScroll: {
        flex: 1,
        backgroundColor: Colors.darkGrey,
    },

    // Compact Row Styles
    leaderboardRowCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.black,
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 8,
        marginHorizontal: 12,
    },
    leaderboardRowHighlight: {
        backgroundColor: Colors.darkGrey,
        borderWidth: 1.5,
        borderColor: Colors.brandBlue,
        shadowColor: Colors.brandBlue,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    rankBadgeCompact: {
        width: 32,
        alignItems: 'center',
        marginRight: 10,
    },
    rankTextCompact: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.white,
    },
    avatarCompact: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.black,
        borderWidth: 1,
        borderColor: Colors.darkGrey,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarTextCompact: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.brandBlue,
    },
    userInfoCompact: {
        flex: 1,
        justifyContent: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    userNameCompact: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.white,
        flex: 1,
    },
    userProgressCompact: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.brandBlue,
    },
    compactProgressBarContainer: {
        height: 4,
        backgroundColor: Colors.border,
        borderRadius: 2,
        overflow: 'hidden',
        width: '100%',
    },
    compactProgressBar: {
        height: '100%',
        backgroundColor: Colors.neonLime,
        borderRadius: 2,
    },


    // Bottom CTA
    bottomCTA: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        paddingBottom: 40,
        backgroundColor: Colors.darkGrey,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    joinButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.neonLime,
        borderRadius: 20,
        paddingVertical: 18,
        gap: 8,
    },
    joinButtonText: {
        fontSize: 17,
        fontWeight: '800',
        color: Colors.black,
    },
});
