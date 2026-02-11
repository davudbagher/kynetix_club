import Colors from "@/constants/Colors";
import { useSquads } from "@/hooks/useSquads";
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
                    // Navigate to Home/Offers to find a squad
                    router.push("/");
                }}
            >
                <View style={styles.emptyContent}>
                    <Text style={styles.emptyTitle}>No Active Squad</Text>
                    <Text style={styles.emptySubtitle}>
                        Team up with friends to unlock exclusive rewards!
                    </Text>
                    <View style={styles.ctaButton}>
                        <Text style={styles.ctaText}>Find a Quest</Text>
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
        >
            <View style={styles.header}>
                <Text style={styles.title}>⚔️ Active Quest</Text>
                <Text style={styles.partner}>{activeSquad.offerPartner}</Text>
            </View>

            <Text style={styles.offerTitle}>{activeSquad.offerTitle}</Text>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${percentage}%` }]} />
            </View>

            <View style={styles.statsRow}>
                <Text style={styles.stepsText}>
                    {activeSquad.currentSteps.toLocaleString()} / {activeSquad.targetSteps.toLocaleString()} steps
                </Text>
                <Text style={styles.percentageText}>{percentage}%</Text>
            </View>

            {/* Avatars */}
            <View style={styles.avatarRow}>
                {activeSquad.members.map((m, index) => (
                    <View key={m.userId} style={[styles.avatar, { left: index * -10 }]}>
                        <Text style={{ fontSize: 12 }}>{m.avatar}</Text>
                    </View>
                ))}
                <Text style={[styles.membersText, { marginLeft: (activeSquad.members.length * 16) }]}>
                    {activeSquad.members.length} Squad Members
                </Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.black,
        borderWidth: 1,
        borderColor: Colors.neonLime,
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 24,
        marginTop: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    title: {
        color: Colors.neonLime,
        fontWeight: 'bold',
        fontSize: 12,
        textTransform: 'uppercase',
    },
    partner: {
        color: Colors.textSecondary,
        fontSize: 12,
    },
    offerTitle: {
        color: Colors.white,
        fontWeight: 'bold',
        fontSize: 18,
        marginBottom: 12,
    },
    progressContainer: {
        height: 8,
        backgroundColor: Colors.cardGrey,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBar: {
        height: '100%',
        backgroundColor: Colors.neonLime,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    stepsText: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
    },
    percentageText: {
        color: Colors.white,
        fontWeight: 'bold',
        fontSize: 12,
    },
    avatarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        height: 24,
    },
    avatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.cardGrey,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.black,
        position: 'absolute',
    },
    membersText: {
        color: Colors.textSecondary,
        fontSize: 12,
        marginLeft: 4,
    },
    emptyContainer: {
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyContent: {
        alignItems: 'center',
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
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    ctaButton: {
        backgroundColor: Colors.neonLime,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    ctaText: {
        color: Colors.black,
        fontWeight: 'bold',
        fontSize: 14,
    },
});
