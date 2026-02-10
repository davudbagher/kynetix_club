// app/user-profile.tsx
import ActivityFeedItem from '@/components/ActivityFeedItem';
import Colors from '@/constants/Colors';
import { getAllBadgesWithStatus } from '@/constants/achievements';
import { getActivities } from '@/constants/mockActivityData';
import { getUserProfileByName } from '@/constants/mockUserData';
import { formatStepCount, getAvatarColor, getAvatarLetter } from '@/utils/activityHelpers';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UserProfileScreen() {
    const { userName } = useLocalSearchParams<{ userName: string }>();
    const profile = getUserProfileByName(userName || '');

    const [isFriend, setIsFriend] = useState(profile?.isFriend || false);

    if (!profile) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>User not found</Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const avatarColor = getAvatarColor(profile.fullName);
    const avatarLetter = getAvatarLetter(profile.fullName);

    // Get user badges
    const badges = getAllBadgesWithStatus({
        totalSteps: profile.totalSteps,
        longestStreak: profile.longestStreak,
        challengesCompleted: profile.challengesCompleted,
        friendCount: profile.friendCount,
        isEarlyAdopter: new Date(profile.joinedDate) < new Date('2026-02-01'),
    });

    const unlockedBadges = badges.filter(b => b.unlocked);

    // Get user's recent activities
    const userActivities = getActivities().filter(
        a => a.userName === profile.fullName
    ).slice(0, 5);

    const handleAddFriend = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsFriend(!isFriend);
        // TODO: Save to Firebase
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header with back button */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backIconButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={[styles.largeAvatar, { backgroundColor: avatarColor }]}>
                        <Text style={styles.largeAvatarText}>{avatarLetter}</Text>
                    </View>

                    <Text style={styles.fullName}>{profile.fullName}</Text>

                    {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

                    <Text style={styles.joinedDate}>
                        Joined {new Date(profile.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </Text>

                    {/* Add Friend Button */}
                    <TouchableOpacity
                        style={[styles.friendButton, isFriend && styles.friendButtonActive]}
                        onPress={handleAddFriend}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name={isFriend ? 'checkmark-circle' : 'person-add'}
                            size={18}
                            color={isFriend ? Colors.black : Colors.white}
                        />
                        <Text style={[styles.friendButtonText, isFriend && styles.friendButtonTextActive]}>
                            {isFriend ? 'Friends' : 'Add Friend'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{formatStepCount(profile.totalSteps)}</Text>
                        <Text style={styles.statLabel}>Total Steps</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{profile.currentStreak}</Text>
                        <Text style={styles.statLabel}>Current Streak</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{profile.challengesCompleted}</Text>
                        <Text style={styles.statLabel}>Challenges</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{profile.friendCount}</Text>
                        <Text style={styles.statLabel}>Friends</Text>
                    </View>
                </View>

                {/* Achievements */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Achievements ({unlockedBadges.length})</Text>

                    <View style={styles.badgesGrid}>
                        {badges.slice(0, 8).map((badge) => (
                            <View key={badge.id} style={styles.badgeCard}>
                                <View style={[
                                    styles.badgeIconContainer,
                                    badge.unlocked ? { backgroundColor: badge.color + '20' } : styles.badgeLocked
                                ]}>
                                    <Text style={[
                                        styles.badgeIcon,
                                        !badge.unlocked && styles.badgeIconLocked
                                    ]}>
                                        {badge.icon}
                                    </Text>
                                </View>
                                <Text style={styles.badgeName} numberOfLines={1}>
                                    {badge.name}
                                </Text>
                                {!badge.unlocked && badge.progress > 0 && (
                                    <View style={styles.badgeProgressBar}>
                                        <View style={[styles.badgeProgressFill, { width: `${badge.progress}%` }]} />
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Recent Activity */}
                {userActivities.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Recent Activity</Text>
                        <View style={styles.activitiesContainer}>
                            {userActivities.map((activity) => (
                                <ActivityFeedItem
                                    key={activity.id}
                                    id={activity.id}
                                    userName={activity.userName}
                                    activityType={activity.activityType}
                                    title={activity.title}
                                    points={activity.points}
                                    celebrationCount={activity.celebrationCount}
                                    locationName={activity.locationName}
                                    createdAt={activity.createdAt}
                                />
                            ))}
                        </View>
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
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backIconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.black,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.white,
    },
    profileHeader: {
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 32,
        paddingHorizontal: 24,
    },
    largeAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 4,
        borderColor: Colors.black,
    },
    largeAvatarText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: Colors.white,
    },
    fullName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.white,
        marginBottom: 8,
    },
    bio: {
        fontSize: 15,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 22,
    },
    joinedDate: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: 20,
    },
    friendButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.white,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    friendButtonActive: {
        backgroundColor: Colors.neonLime,
        borderColor: Colors.neonLime,
    },
    friendButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    friendButtonTextActive: {
        color: Colors.black,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 24,
        gap: 12,
        marginBottom: 32,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: Colors.black,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.cardGrey,
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.neonLime,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.white,
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    badgesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 24,
        gap: 12,
    },
    badgeCard: {
        width: '22%',
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    badgeLocked: {
        backgroundColor: Colors.cardGrey,
        opacity: 0.5,
    },
    badgeIcon: {
        fontSize: 28,
    },
    badgeIconLocked: {
        opacity: 0.3,
    },
    badgeName: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.white,
        textAlign: 'center',
    },
    badgeProgressBar: {
        width: '100%',
        height: 2,
        backgroundColor: Colors.cardGrey,
        borderRadius: 1,
        marginTop: 4,
        overflow: 'hidden',
    },
    badgeProgressFill: {
        height: '100%',
        backgroundColor: Colors.neonLime,
    },
    activitiesContainer: {
        paddingHorizontal: 24,
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    errorText: {
        fontSize: 18,
        color: Colors.textSecondary,
        marginBottom: 20,
    },
    backButton: {
        backgroundColor: Colors.neonLime,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    backButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.black,
    },
});
