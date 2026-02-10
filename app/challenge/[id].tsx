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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type LeaderboardTab = 'individual' | 'average' | 'total';

export default function ChallengeDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [leaderboard, setLeaderboard] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<LeaderboardTab>('individual');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadChallengeData();
    }, [id]);

    const loadChallengeData = async () => {
        const foundChallenge = MOCK_CHALLENGES.find(c => c.id === id);
        setChallenge(foundChallenge || null);

        if (foundChallenge) {
            const leaderboardData = await getChallengeLeaderboard(id);
            setLeaderboard(leaderboardData);
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
                sponsor && { backgroundColor: sponsor.secondaryColor || Colors.darkGrey }
            ]}
            edges={['top']}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.white} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.inviteButton}>
                    <Ionicons name="people" size={20} color={Colors.white} />
                    <Text style={styles.inviteText}>Invite</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={sponsor?.primaryColor || Colors.neonLime}
                        colors={[sponsor?.primaryColor || Colors.neonLime]}
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
                                        backgroundColor: sponsor?.primaryColor || Colors.neonLime
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

                {/* Leaderboard */}
                {leaderboard ? (
                    <View style={styles.leaderboardContainer}>
                        {leaderboard.users.map((user: any, index: number) => {
                            const isCurrentUser = user.isCurrentUser;
                            const accentColor = sponsor?.primaryColor || Colors.neonLime;

                            return (
                                <View
                                    key={user.userId}
                                    style={[
                                        styles.leaderboardRow,
                                        isCurrentUser && styles.leaderboardRowHighlight,
                                        isCurrentUser && { borderColor: accentColor }
                                    ]}
                                >
                                    {/* Rank Badge */}
                                    <View style={styles.rankBadge}>
                                        {index === 0 ? (
                                            <Text style={styles.medalEmoji}>🥇</Text>
                                        ) : index === 1 ? (
                                            <Text style={styles.medalEmoji}>🥈</Text>
                                        ) : index === 2 ? (
                                            <Text style={styles.medalEmoji}>🥉</Text>
                                        ) : (
                                            <Text style={styles.rankNumber}>{user.rank}</Text>
                                        )}
                                    </View>

                                    {/* Avatar */}
                                    <View
                                        style={[
                                            styles.avatar,
                                            index < 3 && { borderColor: accentColor, borderWidth: 2 }
                                        ]}
                                    >
                                        <Text style={styles.avatarText}>{user.avatar}</Text>
                                    </View>

                                    {/* Name */}
                                    <Text style={styles.userName} numberOfLines={1}>
                                        {user.name}
                                        {isCurrentUser && ' 👈'}
                                    </Text>

                                    {/* Progress */}
                                    <Text style={[styles.userProgress, isCurrentUser && { color: accentColor }]}>
                                        {user.progress?.toLocaleString() || `${user.progressPercent}%`}
                                    </Text>

                                    {/* Timestamp for current user */}
                                    {isCurrentUser && user.joinedAt && (
                                        <Text style={styles.timestamp}>
                                            Since {new Date(user.joinedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    )}

                                    {/* Progress Bar */}
                                    <View style={styles.userProgressBarContainer}>
                                        <View
                                            style={[
                                                styles.userProgressBar,
                                                {
                                                    width: `${user.progressPercent}%`,
                                                    backgroundColor: accentColor
                                                }
                                            ]}
                                        />
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                ) : (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={sponsor?.primaryColor || Colors.neonLime} />
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.darkGrey,
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
        color: Colors.white,
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
        color: Colors.neonLime,
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
        color: Colors.white,
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
        backgroundColor: Colors.neonLime,
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
        backgroundColor: Colors.black,
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
        backgroundColor: Colors.black,
        borderRadius: 8,
    },
    tabActive: {
        backgroundColor: Colors.neonLime + '20',
        borderWidth: 1,
        borderColor: Colors.neonLime,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.lightGrey,
    },
    tabTextActive: {
        color: Colors.white,
    },

    // Leaderboard
    leaderboardContainer: {
        paddingHorizontal: 20,
        gap: 8,
    },
    leaderboardRow: {
        backgroundColor: Colors.black,
        borderRadius: 12,
        padding: 12,
        position: 'relative',
    },
    leaderboardRowHighlight: {
        backgroundColor: Colors.neonLime + '10',
        borderWidth: 2,
        borderColor: Colors.neonLime,
    },
    rankBadge: {
        position: 'absolute',
        left: 12,
        top: 12,
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    medalEmoji: {
        fontSize: 24,
    },
    rankNumber: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.lightGrey,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.neonLime,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 40,
        marginBottom: 8,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.black,
    },
    userName: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.white,
        marginBottom: 4,
        marginLeft: 40,
    },
    userProgress: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.neonLime,
        position: 'absolute',
        right: 12,
        top: 12,
    },
    timestamp: {
        fontSize: 11,
        color: Colors.lightGrey,
        marginLeft: 40,
        marginBottom: 8,
    },
    userProgressBarContainer: {
        height: 4,
        backgroundColor: Colors.cardGrey,
        borderRadius: 2,
        overflow: 'hidden',
        marginLeft: 40,
    },
    userProgressBar: {
        height: '100%',
        backgroundColor: Colors.neonLime,
        borderRadius: 2,
    },
});
