import Colors from "@/constants/Colors";
import { useSquads } from "@/hooks/useSquads";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function SquadProgressWidget() {
    const { activeSquad, subscribeToActiveSquad } = useSquads();
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        AsyncStorage.getItem("kynetix_user_id").then((id) => {
            if (id) {
                setCurrentUserId(id);
                const unsub = subscribeToActiveSquad(id);
                return () => unsub();
            }
        });
    }, []);

    if (!activeSquad) {
        return (
            <TouchableOpacity
                style={[styles.container, styles.emptyContainer]}
                onPress={() => {
                    router.push("/");
                }}
            >
                <View style={styles.emptyContent}>
                    <Ionicons name="people-outline" size={48} color={Colors.textSecondary} style={{ marginBottom: 16 }} />
                    <Text style={styles.emptyTitle}>No Active Quest</Text>
                    <Text style={styles.emptySubtitle}>
                        Team up with friends to unlock exclusive rewards!
                    </Text>
                    <View style={styles.ctaButton}>
                        <Text style={styles.ctaText}>Find a Quest</Text>
                        <Ionicons name="arrow-forward" size={16} color={Colors.white} />
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    const progress = Math.min(activeSquad.currentSteps / activeSquad.targetSteps, 1);
    const percentage = Math.round(progress * 100);

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => {
                router.push("/squad-detail");
            }}
            activeOpacity={0.9}
        >
            <View style={styles.header}>
                <View style={styles.badge}>
                    <MaterialCommunityIcons name="sword-cross" size={14} color={Colors.neonLime} />
                    <Text style={styles.badgeText}>Active Quest</Text>
                </View>
                {/* Partner Name as a subtle text or badge */}
                <Text style={styles.partnerName}>{activeSquad.offerPartner}</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.offerTitle}>{activeSquad.offerTitle}</Text>

                <View style={styles.statsRow}>
                    <View style={styles.pill}>
                        <Ionicons name="walk" size={14} color={Colors.neonLime} />
                        <Text style={styles.pillText}>
                            {activeSquad.currentSteps.toLocaleString()} / {activeSquad.targetSteps.toLocaleString()}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${percentage}%` }]} />
            </View>

            <View style={styles.footer}>
                {/* Avatars */}
                <View style={styles.avatarRow}>
                    {activeSquad.members.slice(0, 4).map((m, index) => (
                        <View key={m.userId} style={[styles.avatar, { left: index * 22, zIndex: 10 - index }]}>
                            {/* Use first letter if no avatar image */}
                            <Text style={styles.avatarText}>{m.avatar || m.fullName?.charAt(0)}</Text>
                        </View>
                    ))}
                    {activeSquad.members.length > 4 && (
                        <View style={[styles.avatar, { left: 4 * 22, zIndex: 5, backgroundColor: Colors.border }]}>
                            <Text style={styles.avatarText}>+{activeSquad.members.length - 4}</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.membersText}>{activeSquad.members.length} Members</Text>

                <View style={{ flex: 1 }} />
                <Text style={styles.percentageText}>{percentage}%</Text>
            </View>
        </TouchableOpacity>
    );
}


const styles = StyleSheet.create({
    container: {
        backgroundColor: "#1C1C1E", // Charcoal
        borderRadius: 28,
        padding: 24,
        marginHorizontal: 24,
        marginBottom: 24,
        marginTop: 8,
        // Premium shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: "center",
        marginBottom: 16,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: "rgba(198, 255, 0, 0.1)", // Light Lime bg
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    badgeText: {
        color: Colors.neonLime,
        fontWeight: '700',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    partnerName: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: "600",
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    content: {
        marginBottom: 16,
    },
    offerTitle: {
        color: Colors.white,
        fontWeight: '800',
        fontSize: 20,
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    statsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 6,
    },
    pillText: {
        color: Colors.textTertiary,
        fontSize: 13,
        fontWeight: '600',
    },
    progressContainer: {
        height: 6,
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 16,
    },
    progressBar: {
        height: '100%',
        backgroundColor: Colors.neonLime,
        borderRadius: 3,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        height: 32,
        width: 100, // Fixed width to accommodate stack (32 + 22*3 approx)
        marginRight: 8,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.cardGrey,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: "#1C1C1E", // Match container bg
        position: 'absolute',
    },
    avatarText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.white,
    },
    membersText: {
        color: Colors.textSecondary,
        fontSize: 13,
        fontWeight: "500",
        marginLeft: 0, // Reset margin since row has width styling now
    },
    percentageText: {
        color: Colors.neonLime,
        fontWeight: '800',
        fontSize: 16,
    },

    // Empty State
    emptyContainer: {
        backgroundColor: "#1C1C1E",
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.2)",
    },
    emptyContent: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    emptyTitle: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptySubtitle: {
        color: Colors.textSecondary,
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    ctaButton: {
        backgroundColor: Colors.brandBlue,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    ctaText: {
        color: Colors.white,
        fontWeight: '700',
        fontSize: 14,
    },
});
