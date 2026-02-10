// components/ActivityFeedItem.tsx
import Colors from '@/constants/Colors';
import { ACTIVITY_TYPE_CONFIG, ActivityType } from '@/constants/activityTypes';
import { formatTimeAgo, getAvatarColor, getAvatarLetter } from '@/utils/activityHelpers';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface ActivityFeedItemProps {
    id: string;
    userName: string;
    activityType: ActivityType;
    title: string;
    points: number;
    celebrationCount: number;
    locationName?: string;
    createdAt: Date | string;
    onCelebrate?: (activityId: string) => void;
    onPressUser?: (userName: string) => void;
}

export default function ActivityFeedItem({
    id,
    userName,
    activityType,
    title,
    points,
    celebrationCount,
    locationName,
    createdAt,
    onCelebrate,
    onPressUser,
}: ActivityFeedItemProps) {
    const [localCelebrations, setLocalCelebrations] = useState(celebrationCount);
    const [hasCelebrated, setHasCelebrated] = useState(false);

    const config = ACTIVITY_TYPE_CONFIG[activityType];
    const avatarColor = getAvatarColor(userName);
    const avatarLetter = getAvatarLetter(userName);

    const handleCelebrate = () => {
        if (hasCelebrated) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setLocalCelebrations(prev => prev + 1);
        setHasCelebrated(true);
        onCelebrate?.(id);
    };

    const handlePressUser = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPressUser?.(userName);
    };

    return (
        <View style={styles.container}>
            {/* Left: Avatar - Tappable */}
            <TouchableOpacity onPress={handlePressUser} activeOpacity={0.7}>
                <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                    <Text style={styles.avatarText}>{avatarLetter}</Text>
                </View>
            </TouchableOpacity>

            {/* Middle: Content */}
            <View style={styles.content}>
                <Text style={styles.title}>{title}</Text>

                <View style={styles.meta}>
                    <Text style={styles.timeAgo}>{formatTimeAgo(createdAt)}</Text>

                    {locationName && (
                        <>
                            <Text style={styles.metaDot}>•</Text>
                            <Ionicons name="location-outline" size={12} color={Colors.textSecondary} />
                            <Text style={styles.location}>{locationName}</Text>
                        </>
                    )}
                </View>
            </View>

            {/* Right: Points & Celebration */}
            <View style={styles.rightSection}>
                {/* Points Badge */}
                <View style={[styles.pointsBadge, { backgroundColor: config.bgColor }]}>
                    <Text style={[styles.pointsText, { color: config.color }]}>
                        +{points}
                    </Text>
                </View>

                {/* Celebration Button */}
                <TouchableOpacity
                    style={styles.celebrateButton}
                    onPress={handleCelebrate}
                    disabled={hasCelebrated}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name={hasCelebrated ? 'heart' : 'heart-outline'}
                        size={18}
                        color={hasCelebrated ? '#FF6B6B' : Colors.textSecondary}
                    />
                    {localCelebrations > 0 && (
                        <Text style={[styles.celebrationCount, hasCelebrated && styles.celebratedCount]}>
                            {localCelebrations}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: Colors.black,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.cardGrey,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.white,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.white,
        marginBottom: 4,
        lineHeight: 20,
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeAgo: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    metaDot: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginHorizontal: 6,
    },
    location: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginLeft: 4,
    },
    rightSection: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    pointsBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    pointsText: {
        fontSize: 13,
        fontWeight: '700',
    },
    celebrateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    celebrationCount: {
        fontSize: 13,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    celebratedCount: {
        color: '#FF6B6B',
    },
});
