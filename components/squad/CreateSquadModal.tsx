import Colors from "@/constants/Colors";
import { useFriends } from "@/hooks/useFriends";
import { useSquads } from "@/hooks/useSquads";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface CreateSquadModalProps {
    visible: boolean;
    onClose: () => void;
    offer: {
        id: string;
        title: string;
        partnerName: string;
        targetSteps?: number; // Optional, defaults to 20000
    };
}

export default function CreateSquadModal({ visible, onClose, offer }: CreateSquadModalProps) {
    const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [hasActiveSquad, setHasActiveSquad] = useState(false);

    const { friends, fetchFriends, loading: friendsLoading } = useFriends();
    const { createSquad, loading: squadLoading, error: squadError, getUserActiveSquad } = useSquads();

    useEffect(() => {
        if (visible) {
            AsyncStorage.getItem("kynetix_user_id").then(async (id) => {
                if (id) {
                    setCurrentUserId(id);
                    fetchFriends(id);

                    // Check if user already has active squad
                    const existingSquad = await getUserActiveSquad(id);
                    setHasActiveSquad(!!existingSquad);
                    if (existingSquad) {
                        console.log('⚠️ User already in squad, blocking creation');
                    }
                }
            });
        }
    }, [visible, fetchFriends, getUserActiveSquad]);

    const toggleFriend = (friendId: string) => {
        if (selectedFriends.includes(friendId)) {
            setSelectedFriends(prev => prev.filter(id => id !== friendId));
        } else {
            if (selectedFriends.length >= 3) {
                alert("Max 3 friends per squad!");
                return;
            }
            setSelectedFriends(prev => [...prev, friendId]);
        }
    };

    const handleCreate = async () => {
        if (!currentUserId) return;
        if (hasActiveSquad) {
            alert("You're already in an active squad. Complete or cancel it first.");
            return;
        }

        try {
            const squadId = await createSquad(
                currentUserId,
                offer.id,
                offer.title,
                offer.partnerName,
                offer.targetSteps || 20000,
                selectedFriends
            );

            if (squadId) {
                alert("Squad Created! 🚀");
                setSelectedFriends([]); // Clear selection
                onClose();
            } else {
                alert(squadError || "Failed to create squad. Please check the console for details.");
            }
        } catch (error: any) {
            console.error("Squad creation error:", error);
            alert(`Failed to create squad: ${error.message || 'Unknown error'}`);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Squad Up! ⚔️</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={Colors.white} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.subtitle}>
                        Target: {((offer.targetSteps || 20000) / 1000)}k Steps
                    </Text>
                    <Text style={styles.description}>
                        Invite friends to unlock {offer.title} at {offer.partnerName}.
                    </Text>

                    {/* Warning if already in squad */}
                    {hasActiveSquad && (
                        <View style={styles.warningBox}>
                            <Text style={styles.warningIcon}>⚠️</Text>
                            <Text style={styles.warningText}>
                                You're already in an active squad. Complete or cancel it first to create a new one.
                            </Text>
                        </View>
                    )}

                    {/* Friend List */}
                    <Text style={styles.sectionTitle}>Select Friends ({selectedFriends.length}/3)</Text>

                    {friendsLoading ? (
                        <ActivityIndicator color={Colors.neonLime} />
                    ) : (
                        <FlatList
                            data={friends}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.friendRow,
                                        selectedFriends.includes(item.id) && styles.friendRowSelected
                                    ]}
                                    onPress={() => toggleFriend(item.id)}
                                >
                                    <View style={styles.avatarPlaceholder}>
                                        <Text>{item.avatar || '👤'}</Text>
                                    </View>
                                    <Text style={styles.friendName}>{item.fullName || 'Unknown User'}</Text>
                                    {selectedFriends.includes(item.id) && (
                                        <Ionicons name="checkmark-circle" size={20} color={Colors.black} />
                                    )}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>No friends found. Add some!</Text>
                            }
                            style={styles.list}
                        />
                    )}

                    {/* Footer Action */}
                    <TouchableOpacity
                        style={[styles.createButton, (squadLoading || hasActiveSquad) && styles.disabledButton]}
                        onPress={handleCreate}
                        disabled={squadLoading || hasActiveSquad}
                    >
                        {squadLoading ? (
                            <ActivityIndicator color={Colors.black} />
                        ) : (
                            <Text style={styles.createButtonText}>Start Quest 🚀</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.8)",
        justifyContent: "flex-end",
    },
    container: {
        backgroundColor: Colors.darkGrey,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        height: "70%",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: Colors.white,
    },
    subtitle: {
        fontSize: 18,
        color: Colors.neonLime,
        fontWeight: "bold",
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: Colors.white,
        marginBottom: 12,
    },
    list: {
        flex: 1,
    },
    friendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: Colors.black,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: Colors.cardGrey,
    },
    friendRowSelected: {
        backgroundColor: Colors.neonLime,
        borderColor: Colors.neonLime,
    },
    avatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.cardGrey,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    friendName: {
        flex: 1,
        color: Colors.white, // Will need to change for selected state in real polish
        fontSize: 16,
    },
    emptyText: {
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: 20,
    },
    warningBox: {
        backgroundColor: 'rgba(255, 165, 0, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 165, 0, 0.3)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    warningIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    warningText: {
        flex: 1,
        color: '#FFA500',
        fontSize: 13,
        lineHeight: 18,
    },
    createButton: {
        backgroundColor: Colors.neonLime,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 20,
    },
    disabledButton: {
        opacity: 0.7,
    },
    createButtonText: {
        fontSize: 18,
        fontWeight: "bold",
        color: Colors.black,
    },
});
