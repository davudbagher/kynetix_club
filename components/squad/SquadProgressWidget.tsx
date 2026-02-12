import Colors from "@/constants/Colors";
import { useSquads } from "@/hooks/useSquads";
import { Ionicons } from "@expo/vector-icons";
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
                activeOpacity={0.9}
            >
                <View style={styles.emptyContent}>
                    <View style={styles.emptyIconContainer}>
                        <Ionicons name="people" size={24} color={Colors.white} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.emptyTitle}>Start a Squad Quest</Text>
                        <Text style={styles.emptySubtitle}>
                            Team up to earn rewards together
                        </Text>
                    </View>
                    <View style={styles.ctaButton}>
                        <Ionicons name="arrow-forward" size={20} color={Colors.black} />
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
                <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Active Quest</Text>
                </View>
                <Text style={styles.partnerName}>{activeSquad.offerPartner}</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.offerTitle} numberOfLines={1}>{activeSquad.offerTitle}</Text>

                <View style={styles.progressSection}>
                    <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBar, { width: `${percentage}%` }]} />
                    </View>
                    <View style={styles.progressStats}>
                        <Text style={styles.fractionText}>
                            {activeSquad.currentSteps.toLocaleString()} <Text style={styles.totalText}>/ {activeSquad.targetSteps.toLocaleString()}</Text>
                        </Text>
                        <Text style={styles.percentageText}>{percentage}%</Text>
                    </View>
                </View>
            </View>

            <View style={styles.footer}>
                <View style={styles.avatarRow}>
                    {activeSquad.members.slice(0, 4).map((m, index) => (
                        <View key={m.userId} style={[styles.avatar, { left: index * 24, zIndex: 10 - index }]}>
                            <Text style={styles.avatarText}>{m.avatar || m.fullName?.charAt(0)}</Text>
                        </View>
                    ))}
                    {activeSquad.members.length > 4 && (
                        <View style={[styles.avatar, { left: 4 * 24, zIndex: 5, backgroundColor: Colors.cardGrey }]}>
                            <Text style={styles.avatarText}>+{activeSquad.members.length - 4}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.memberCountBadge}>
                    <Ionicons name="people" size={12} color={Colors.textSecondary} />
                    <Text style={styles.memberCountText}>{activeSquad.members.length}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}


const styles = StyleSheet.create({
    container: {
        backgroundColor: "#1C1C1E", // Premium Charcoal
        borderRadius: 24,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 24,
        marginTop: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.05)",
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: "center",
        marginBottom: 16,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: "rgba(198, 255, 0, 0.1)",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.neonLime,
    },
    statusText: {
        color: Colors.neonLime,
        fontWeight: '700',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    partnerName: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: "600",
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    content: {
        marginBottom: 20,
    },
    offerTitle: {
        color: Colors.white,
        fontWeight: '800',
        fontSize: 22,
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    progressSection: {
        gap: 8,
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: Colors.neonLime,
        borderRadius: 4,
    },
    progressStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    fractionText: {
        color: Colors.white,
        fontSize: 13,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },
    totalText: {
        color: "rgba(255,255,255,0.5)",
        fontWeight: '500',
    },
    percentageText: {
        color: Colors.neonLime,
        fontWeight: '800',
        fontSize: 13,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.1)",
    },
    avatarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 32,
        width: 120,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.cardGrey,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: "#1C1C1E",
        position: 'absolute',
    },
    avatarText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.white,
    },
    memberCountBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: "rgba(255,255,255,0.1)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    memberCountText: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
    },

    // Empty State
    emptyContainer: {
        backgroundColor: "#1C1C1E",
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    emptyContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    emptyIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "rgba(255,255,255,0.1)",
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    emptySubtitle: {
        color: Colors.textSecondary,
        fontSize: 13,
    },
    ctaButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.neonLime,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
