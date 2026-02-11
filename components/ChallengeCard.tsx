// components/ChallengeCard.tsx
import Colors from '@/constants/Colors';
import { Challenge, calculateTimeRemaining } from '@/constants/challenges';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ChallengeCardProps {
    challenge: Challenge;
    userProgress?: number; // User's current progress (0-100%)
    onPress?: () => void;
}

export default function ChallengeCard({
    challenge,
    userProgress = 0,
    onPress,
}: ChallengeCardProps) {
    const [timeRemaining, setTimeRemaining] = useState(calculateTimeRemaining(challenge.endDate));
    const isJoined = userProgress > 0;

    // Update countdown timer every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeRemaining(calculateTimeRemaining(challenge.endDate));
        }, 60000); // 60 seconds

        return () => clearInterval(interval);
    }, [challenge.endDate]);

    // Determine if challenge is ending soon (< 24 hours)
    const isUrgent = timeRemaining.includes('h left') &&
        !timeRemaining.includes('d') &&
        parseInt(timeRemaining) < 24;

    return (
        <TouchableOpacity
            style={[
                styles.container,
                challenge.isSponsored && styles.sponsoredContainer,
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            {/* Sponsor Badge */}
            {challenge.isSponsored && challenge.sponsor && (
                <View style={styles.sponsorBadge}>
                    <Text style={styles.sponsorEmoji}>{challenge.sponsor.logo}</Text>
                    <Text style={styles.sponsorText}>Sponsored</Text>
                </View>
            )}

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.icon}>{challenge.icon}</Text>
                <View style={styles.headerInfo}>
                    <Text style={styles.title} numberOfLines={2}>
                        {challenge.title}
                    </Text>
                    {challenge.isSponsored && challenge.sponsor?.name && (
                        <Text style={styles.sponsorName}>by {challenge.sponsor.name}</Text>
                    )}
                </View>
            </View>

            {/* Description */}
            <Text style={styles.description} numberOfLines={2}>
                {challenge.description}
            </Text>

            {/* Progress Bar (if joined) */}
            {isJoined && (
                <View style={styles.progressSection}>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${userProgress}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{userProgress.toFixed(0)}%</Text>
                </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
                <View style={styles.stats}>
                    <Ionicons name="people" size={14} color={Colors.textSecondary} />
                    <Text style={styles.statText}>{challenge.participantCount}</Text>
                </View>

                {/* Countdown Timer Badge */}
                <View style={[styles.timerBadge, isUrgent && styles.timerBadgeUrgent]}>
                    <Ionicons
                        name="time-outline"
                        size={12}
                        color={isUrgent ? '#FF4444' : Colors.neonLime}
                    />
                    <Text style={[styles.timerText, isUrgent && styles.timerTextUrgent]}>
                        {timeRemaining}
                    </Text>
                </View>
            </View>

            <View style={styles.footer}>
                <View style={styles.reward}>

                    <Text style={styles.rewardPoints}>+{challenge.rewardPoints}</Text>
                    <Text style={styles.rewardBadge}>{challenge.rewardBadge}</Text>
                </View>
            </View>

            {/* CTA Button */}
            <TouchableOpacity
                style={[
                    styles.ctaButton,
                    isJoined && styles.ctaButtonJoined,
                    challenge.isSponsored && !isJoined && styles.ctaButtonSponsored,
                ]}
                onPress={onPress}
                activeOpacity={0.8}
            >
                <Text
                    style={[
                        styles.ctaText,
                        isJoined && styles.ctaTextJoined,
                        challenge.isSponsored && !isJoined && styles.ctaTextSponsored,
                    ]}
                >
                    {isJoined ? 'Continue' : 'Join Challenge'}
                </Text>
                <Ionicons
                    name="arrow-forward"
                    size={16}
                    color={isJoined ? Colors.textPrimary : (challenge.isSponsored ? Colors.black : Colors.white)}
                />
            </TouchableOpacity>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.black,
        borderRadius: 20,
        padding: 20,
        marginRight: 16,
        width: 280,
        borderWidth: 1,
        borderColor: Colors.cardGrey,
    },
    sponsoredContainer: {
        borderColor: Colors.neonLime,
        borderWidth: 2,
    },
    sponsorBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: Colors.neonLime,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        zIndex: 1,
    },
    sponsorEmoji: {
        fontSize: 12,
    },
    sponsorText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.black,
    },
    header: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'flex-start',
    },
    icon: {
        fontSize: 36,
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.white,
        lineHeight: 24,
        marginBottom: 4,
    },
    sponsorName: {
        fontSize: 12,
        color: Colors.neonLime,
        fontWeight: '600',
    },
    description: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
        marginBottom: 16,
    },
    progressSection: {
        marginBottom: 16,
    },
    progressBar: {
        height: 8,
        backgroundColor: Colors.cardGrey,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 6,
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.neonLime,
        borderRadius: 4,
    },
    progressText: {
        fontSize: 12,
        color: Colors.neonLime,
        fontWeight: '700',
        textAlign: 'right',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    stats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginLeft: 4,
        fontWeight: '600',
    },
    reward: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    rewardPoints: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.neonLime,
    },
    rewardBadge: {
        fontSize: 16,
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.black,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.neonLime + '40',
    },
    timerBadgeUrgent: {
        backgroundColor: '#FF4444' + '20',
        borderColor: '#FF4444',
    },
    timerText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.neonLime,
    },
    timerTextUrgent: {
        color: '#FF4444',
    },
    ctaButton: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    ctaButtonJoined: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.cardGrey,
    },
    ctaButtonSponsored: {
        backgroundColor: Colors.neonLime,
    },
    ctaText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    ctaTextJoined: {
        color: Colors.textPrimary,
    },
    ctaTextSponsored: {
        color: Colors.black,
    },
});
