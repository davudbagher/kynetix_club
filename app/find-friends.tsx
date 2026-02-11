import { db } from "@/config/firebase";
import Colors from "@/constants/Colors";
import { FriendRequest, useFriends } from "@/hooks/useFriends";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Tab = "search" | "requests";

export default function FindFriendsScreen() {
    const [activeTab, setActiveTab] = useState<Tab>("search");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const { searchUsers, sendFriendRequest, fetchIncomingRequests, respondToRequest, loading: hookLoading } = useFriends();
    const [isSearching, setIsSearching] = useState(false);
    const [loadingRequests, setLoadingRequests] = useState(false);

    // Get current user ID
    useEffect(() => {
        AsyncStorage.getItem("kynetix_user_id").then((id) => {
            if (id) setCurrentUserId(id);
        });
    }, []);

    // Load requests when tab changes to requests
    useEffect(() => {
        if (activeTab === "requests" && currentUserId) {
            loadRequests();
        }
    }, [activeTab, currentUserId]);

    const loadRequests = async () => {
        if (!currentUserId) return;
        setLoadingRequests(true);

        // Fetch raw requests
        const rawRequests = await fetchIncomingRequests(currentUserId);

        // Fetch user details for each request
        const fullRequests: FriendRequest[] = [];

        for (const req of rawRequests as any[]) {
            try {
                const userDoc = await getDoc(doc(db, "users", req.senderId));
                if (userDoc.exists()) {
                    fullRequests.push({
                        id: req.friendshipId,
                        fromUser: {
                            id: req.senderId,
                            fullName: userDoc.data().fullName,
                            avatar: userDoc.data().avatar,
                        },
                        createdAt: null, // Timestamp logic omitted for MVP
                    });
                }
            } catch (e) {
                console.error("Error loading request user", e);
            }
        }

        setRequests(fullRequests);
        setLoadingRequests(false);
    };

    const handleSearch = async () => {
        if (searchQuery.trim().length < 2) return;
        Keyboard.dismiss();
        setIsSearching(true);
        const results = await searchUsers(searchQuery);
        // Filter out self
        setSearchResults(results.filter(u => u.id !== currentUserId));
        setIsSearching(false);
    };

    const handleSendRequest = async (targetUserId: string) => {
        if (!currentUserId) return;
        const success = await sendFriendRequest(currentUserId, targetUserId);
        if (success) {
            alert("Request Sent!");
        } else {
            alert("Request already sent or you are already friends.");
        }
    };

    const handleResponse = async (requestId: string, action: "accept" | "reject") => {
        const success = await respondToRequest(requestId, action);
        if (success) {
            setRequests((prev) => prev.filter((r) => r.id !== requestId));
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.title}>Find Friends</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === "search" && styles.tabActive]}
                    onPress={() => setActiveTab("search")}
                >
                    <Text style={[styles.tabText, activeTab === "search" && styles.tabTextActive]}>Search</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === "requests" && styles.tabActive]}
                    onPress={() => setActiveTab("requests")}
                >
                    <Text style={[styles.tabText, activeTab === "requests" && styles.tabTextActive]}>
                        Requests
                    </Text>
                    {requests.length > 0 && activeTab !== "requests" && (
                        <View style={styles.badge} />
                    )}
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {activeTab === "search" ? (
                    <>
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={20} color={Colors.lightGrey} style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search by name..."
                                placeholderTextColor={Colors.lightGrey}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                onSubmitEditing={handleSearch}
                                returnKeyType="search"
                                autoCapitalize="none"
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery("")}>
                                    <Ionicons name="close-circle" size={18} color={Colors.lightGrey} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {isSearching ? (
                            <ActivityIndicator size="large" color={Colors.neonLime} style={{ marginTop: 40 }} />
                        ) : (
                            <FlatList
                                data={searchResults}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={styles.listContent}
                                renderItem={({ item }) => (
                                    <View style={styles.userRow}>
                                        <View style={styles.avatarContainer}>
                                            <Text style={styles.avatar}>{item.avatar || "👤"}</Text>
                                        </View>
                                        <View style={styles.userInfo}>
                                            <Text style={styles.userName}>{item.fullName}</Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={() => handleSendRequest(item.id)}
                                        >
                                            <Text style={styles.actionButtonText}>Add</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                                ListEmptyComponent={
                                    searchQuery.length > 2 && !isSearching ? (
                                        <Text style={styles.emptyText}>No users found.</Text>
                                    ) : (
                                        <Text style={styles.emptyText}>Type to search for friends.</Text>
                                    )
                                }
                            />
                        )}
                    </>
                ) : (
                    /* Requests Tab */
                    <>
                        {loadingRequests ? (
                            <ActivityIndicator size="large" color={Colors.neonLime} style={{ marginTop: 40 }} />
                        ) : (
                            <FlatList
                                data={requests}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={styles.listContent}
                                renderItem={({ item }) => (
                                    <View style={styles.requestRow}>
                                        <View style={styles.requestUserInfo}>
                                            <View style={styles.avatarContainer}>
                                                <Text style={styles.avatar}>{item.fromUser.avatar || "👤"}</Text>
                                            </View>
                                            <View>
                                                <Text style={styles.userName}>{item.fromUser.fullName}</Text>
                                                <Text style={styles.requestSubtitle}>wants to be friends</Text>
                                            </View>
                                        </View>
                                        <View style={styles.requestActions}>
                                            <TouchableOpacity
                                                style={[styles.miniButton, styles.rejectButton]}
                                                onPress={() => handleResponse(item.id, "reject")}
                                            >
                                                <Ionicons name="close" size={20} color={Colors.white} />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.miniButton, styles.acceptButton]}
                                                onPress={() => handleResponse(item.id, "accept")}
                                            >
                                                <Ionicons name="checkmark" size={20} color={Colors.black} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                                ListEmptyComponent={
                                    <Text style={styles.emptyText}>No pending requests.</Text>
                                }
                            />
                        )}
                    </>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.darkGrey,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: Colors.white,
    },
    tabs: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: Colors.cardGrey,
    },
    tab: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 16,
        position: 'relative',
    },
    tabActive: {
        borderBottomWidth: 2,
        borderBottomColor: Colors.neonLime,
    },
    tabText: {
        fontSize: 16,
        fontWeight: "600",
        color: Colors.lightGrey,
    },
    tabTextActive: {
        color: Colors.white,
    },
    badge: {
        position: 'absolute',
        top: 12,
        right: 40,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.neonLime,
    },
    content: {
        flex: 1,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.black,
        margin: 20,
        paddingHorizontal: 16,
        borderRadius: 12,
        height: 50,
        borderWidth: 1,
        borderColor: Colors.cardGrey,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        color: Colors.white,
        fontSize: 16,
        height: '100%',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    userRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.black,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.cardGrey,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    avatar: {
        fontSize: 24,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: "bold",
        color: Colors.white,
    },
    actionButton: {
        backgroundColor: Colors.neonLime,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: "bold",
        color: Colors.black,
    },
    emptyText: {
        textAlign: "center",
        color: Colors.lightGrey,
        marginTop: 40,
        fontSize: 16,
    },
    requestRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.black,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    requestUserInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    requestSubtitle: {
        fontSize: 12,
        color: Colors.lightGrey,
        marginTop: 2,
    },
    requestActions: {
        flexDirection: 'row',
        gap: 12,
    },
    miniButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rejectButton: {
        backgroundColor: Colors.cardGrey,
        borderWidth: 1,
        borderColor: Colors.lightGrey,
    },
    acceptButton: {
        backgroundColor: Colors.neonLime,
    },
});
