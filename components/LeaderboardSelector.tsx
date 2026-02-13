// components/LeaderboardSelector.tsx
import Colors from '@/constants/Colors';
import { Challenge } from '@/constants/challenges';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export type LeaderboardType = 'league' | 'challenge';

interface LeaderboardSelectorProps {
    selectedType: LeaderboardType;
    selectedChallengeId: string | null;
    joinedChallenges: Challenge[];
    onSelectLeague: () => void;
    onSelectChallenge: (challengeId: string) => void;
}

export default function LeaderboardSelector({
    selectedType,
    selectedChallengeId,
    joinedChallenges,
    onSelectLeague,
    onSelectChallenge,
}: LeaderboardSelectorProps) {
    const [modalVisible, setModalVisible] = useState(false);

    // Get display label
    const getDisplayLabel = () => {
        if (selectedType === 'league') {
            return '🏆 Walking League';
        }

        const challenge = joinedChallenges.find(c => c.id === selectedChallengeId);
        return challenge ? `🎯 ${challenge.title}` : '🏆 Walking League';
    };

    const handleSelectLeague = () => {
        onSelectLeague();
        setModalVisible(false);
    };

    const handleSelectChallenge = (challengeId: string) => {
        onSelectChallenge(challengeId);
        setModalVisible(false);
    };

    return (
        <>
            {/* Selector Button */}
            <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.7}
            >
                <Text style={styles.selectorLabel} numberOfLines={1}>
                    {getDisplayLabel()}
                </Text>
                <Ionicons name="chevron-down" size={18} color={Colors.neonLime} />
            </TouchableOpacity>

            {/* Bottom Sheet Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setModalVisible(false)}
                >
                    <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Leaderboard</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={Colors.white} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Walking League Option */}
                            <TouchableOpacity
                                style={[
                                    styles.optionItem,
                                    selectedType === 'league' && styles.optionItemSelected,
                                ]}
                                onPress={handleSelectLeague}
                            >
                                <View style={styles.optionContent}>
                                    <Text style={styles.optionIcon}>🏆</Text>
                                    <View style={styles.optionText}>
                                        <Text style={styles.optionTitle}>Walking League</Text>
                                        <Text style={styles.optionSubtitle}>Monthly step rankings</Text>
                                    </View>
                                </View>
                                {selectedType === 'league' && (
                                    <Ionicons name="checkmark-circle" size={24} color={Colors.neonLime} />
                                )}
                            </TouchableOpacity>

                            {/* Divider */}
                            {joinedChallenges.length > 0 && (
                                <>
                                    <View style={styles.divider} />
                                    <Text style={styles.sectionTitle}>Joined Challenges</Text>
                                </>
                            )}

                            {/* Joined Challenges */}
                            {joinedChallenges.length > 0 ? (
                                joinedChallenges.map((challenge) => (
                                    <TouchableOpacity
                                        key={challenge.id}
                                        style={[
                                            styles.optionItem,
                                            selectedType === 'challenge' &&
                                            selectedChallengeId === challenge.id &&
                                            styles.optionItemSelected,
                                        ]}
                                        onPress={() => handleSelectChallenge(challenge.id)}
                                    >
                                        <View style={styles.optionContent}>
                                            <Text style={styles.optionIcon}>{challenge.icon}</Text>
                                            <View style={styles.optionText}>
                                                <Text style={styles.optionTitle} numberOfLines={1}>
                                                    {challenge.title}
                                                </Text>
                                                <Text style={styles.optionSubtitle}>
                                                    {challenge.participantCount} participants
                                                </Text>
                                            </View>
                                        </View>
                                        {selectedType === 'challenge' && selectedChallengeId === challenge.id && (
                                            <Ionicons name="checkmark-circle" size={24} color={Colors.neonLime} />
                                        )}
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>No joined challenges yet</Text>
                                    <Text style={styles.emptySubtext}>Check the Activity tab to join challenges</Text>
                                </View>
                            )}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    selectorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.white,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        marginHorizontal: 20,
        marginBottom: 16,
        // Shadow
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    selectorLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textPrimary,
        flex: 1,
        marginRight: 8,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },

    // Options
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: Colors.cardBackground,
        marginHorizontal: 20,
        marginVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    optionItemSelected: {
        borderColor: Colors.brandBlue,
        backgroundColor: Colors.brandBlue + '10',
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    optionIcon: {
        fontSize: 32,
        marginRight: 12,
    },
    optionText: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    optionSubtitle: {
        fontSize: 12,
        color: Colors.textSecondary,
    },

    // Divider
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginHorizontal: 20,
        marginVertical: 16,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginHorizontal: 20,
        marginBottom: 8,
    },

    // Empty State
    emptyState: {
        paddingVertical: 32,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 15,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    emptySubtext: {
        fontSize: 13,
        color: Colors.textTertiary,
    },
});
