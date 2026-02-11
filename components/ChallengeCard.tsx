// components/ChallengeCard.tsx
import Colors from '@/constants/Colors';
import { Challenge, calculateTimeRemaining } from '@/constants/challenges';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeRemaining(calculateTimeRemaining(challenge.endDate));
        }, 60000);
        return () => clearInterval(interval);
    }, [challenge.endDate]);

    const isUrgent = timeRemaining.includes('h left') &&
        !timeRemaining.includes('d') &&
        parseInt(timeRemaining) < 24;

    // Helper to get icon name based on challenge type or title if specific icon not provided
    // Ideally challenge.icon should be an icon name, not emoji.
    // Assuming challenge.icon might still be emoji, let's map it or just wrap it.
    // For this redesign, I will force a default icon if it looks like an emoji, or use it if it's text.
    // Actually, let's render a generic icon based on logic if standard icon is emoji-like.
    const renderIcon = () => {
        return <MaterialCommunityIcons name="trophy-outline" size={28} color={Colors.white} />;
    };

    return (
        <TouchableOpacity
            style={[
                styles.container,
                challenge.isSponsored && styles.sponsoredContainer,
            ]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <View style={styles.mainContent}>
                {/* Header: Title & Sponsor */}
                <View style={styles.header}>
                    <View style={styles.iconBox}>
                        {renderIcon()}
                    </View>
                    <View style={styles.headerText}>
                        <Text style={styles.title} numberOfLines={1}>{challenge.title}</Text>
                        <Text style={styles.subtitle} numberOfLines={1}>
                            {challenge.isSponsored ? `by ${challenge.sponsor?.name}` : "Official Challenge"}
                        </Text>
                    </View>
                </View>

                {/* Details Pills Row */}
                <View style={styles.detailsRow}>
                    {/* Points Pill */}
                    <View style={styles.pill}>
                        <Ionicons name="flash" size={12} color={Colors.neonLime} />
                        <Text style={styles.pillText}>{challenge.rewardPoints} pts</Text>
                    </View>

                    {/* Participants Pill */}
                    <View style={styles.pill}>
                        <Ionicons name="people" size={12} color={Colors.textSecondary} />
                        <Text style={styles.pillText}>{challenge.participantCount}</Text>
                    </View>

                    {/* Time Pill */}
                    <View style={[styles.pill, isUrgent && styles.urgentPill]}>
                        <Ionicons name="time-outline" size={12} color={isUrgent ? '#FF4444' : Colors.textSecondary} />
                        <Text style={[styles.pillText, isUrgent && styles.urgentText]}>{timeRemaining}</Text>
                    </View>
                </View>
            </View>

            {/* Floating Action Button */}
            <TouchableOpacity
                style={[styles.actionButton, isJoined && styles.actionButtonJoined]}
                onPress={onPress}
            >
                <Ionicons
                    name={isJoined ? "arrow-forward" : "add"}
                    size={24}
                    color={Colors.white}
                />
            </TouchableOpacity>

            {/* Bottom Progress Line */}
            {isJoined && (
                <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBarFill, { width: `${userProgress}%` }]} />
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#1C1C1E", // Charcoal / Premium Dark Grey
        borderRadius: 28,
        padding: 20,
        marginRight: 16,
        width: 300,
        height: 150,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
        position: 'relative',
        justifyContent: 'space-between',
    },
    sponsoredContainer: {
        borderWidth: 1,
        borderColor: Colors.neonLime,
    },
    mainContent: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.1)", // Glassy white
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerText: {
        flex: 1,
        paddingRight: 40,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.white,
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    detailsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: "rgba(255,255,255,0.08)", // Subtle pill bg
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 6,
        gap: 4,
    },
    pillText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.textTertiary,
    },
    urgentPill: {
        backgroundColor: "rgba(255, 68, 68, 0.15)",
    },
    urgentText: {
        color: "#FF4444",
    },
    actionButton: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.brandBlue,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.brandBlue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    actionButtonJoined: {
        backgroundColor: "#00C2FF",
    },
    progressBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 20,
        right: 20,
        height: 3,
        backgroundColor: "rgba(255,255,255,0.1)",
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.neonLime,
    },
});
