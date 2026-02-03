import { db } from "@/config/firebase";
import Colors from "@/constants/Colors";
import {
  getTrendingOffers,
  Offer,
  Partner,
  PARTNERS,
} from "@/constants/mockData";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WalletScreen() {
  // State for wallet balance (loaded from Firebase!)
  const [totalEarned, setTotalEarned] = useState(0);
  const [availableToSpend, setAvailableToSpend] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load wallet balance from Firebase (like Profile does!)
  useEffect(() => {
    const loadWalletBalance = async () => {
      try {
        console.log("💰 Loading wallet balance...");
        setIsLoading(true);

        // Get user ID from AsyncStorage
        const userId = await AsyncStorage.getItem("kynetix_user_id");

        if (!userId) {
          console.log("⚠️ No user ID found");
          setIsLoading(false);
          return;
        }

        // Fetch user document from Firestore
        const userDoc = await getDoc(doc(db, "users", userId));

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const totalSteps = userData.totalStepsAllTime || 0;
          const spentSteps = userData.spentSteps || 0;

          setTotalEarned(totalSteps);
          setAvailableToSpend(totalSteps - spentSteps);

          console.log(
            `💰 Wallet loaded: ${totalSteps.toLocaleString()} total, ${(totalSteps - spentSteps).toLocaleString()} available`,
          );
        }

        setIsLoading(false);
      } catch (error) {
        console.error("❌ Error loading wallet:", error);
        setIsLoading(false);
      }
    };

    loadWalletBalance();

    // Refresh every 30 seconds (in case user walked more)
    const interval = setInterval(loadWalletBalance, 30000);
    return () => clearInterval(interval);
  }, []);

  // Get trending offers
  const trendingOffers = getTrendingOffers();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Wallet</Text>
          <Text style={styles.subtitle}>Your step rewards</Text>
        </View>

        {/* Balance Card - MINIMALIST DESIGN */}
        <View style={styles.balanceCard}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.neonLime} />
            </View>
          ) : (
            <>
              {/* Two-Column Balance */}
              <View style={styles.balanceRow}>
                {/* Total Earned */}
                <View style={styles.balanceColumn}>
                  <Text style={styles.balanceIcon}>🏃</Text>
                  <Text style={styles.balanceLabel}>Total Earned</Text>
                  <Text style={styles.balanceValue}>
                    {totalEarned.toLocaleString()}
                  </Text>
                </View>

                {/* Available - HIGHLIGHTED */}
                <View
                  style={[styles.balanceColumn, styles.balanceColumnHighlight]}
                >
                  <Text style={styles.balanceIcon}>💰</Text>
                  <Text style={styles.balanceLabelHighlight}>Available</Text>
                  <Text style={styles.balanceValueHighlight}>
                    {availableToSpend.toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Walk More Button */}
              <TouchableOpacity
                style={styles.walkMoreButton}
                onPress={() => router.push("/")}
                activeOpacity={0.8}
              >
                <Text style={styles.walkMoreText}>Walk more to earn</Text>
                <Text style={styles.walkMoreIcon}>→</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Trending Section */}
        {trendingOffers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trending</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={trendingOffers}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.trendingList}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TrendingOfferCard
                  offer={item}
                  availableSteps={availableToSpend}
                  onPress={() => {
                    router.push({
                      pathname: "/offer-detail",
                      params: { offerId: item.id },
                    });
                  }}
                />
              )}
            />
          </View>
        )}

        {/* All Partners Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Partners</Text>
            <Text style={styles.partnerCount}>{PARTNERS.length} in Baku</Text>
          </View>

          <View style={styles.partnersGrid}>
            {PARTNERS.map((partner) => (
              <PartnerCard
                key={partner.id}
                partner={partner}
                onPress={() => {
                  router.push({
                    pathname: "/partner-detail",
                    params: { partnerId: partner.id },
                  });
                }}
              />
            ))}
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// TRENDING OFFER CARD
// ============================================

interface TrendingOfferCardProps {
  offer: Offer;
  availableSteps: number;
  onPress: () => void;
}

function TrendingOfferCard({
  offer,
  availableSteps,
  onPress,
}: TrendingOfferCardProps) {
  const canAfford = availableSteps >= offer.steps_required;

  return (
    <TouchableOpacity
      style={[styles.trendingCard, !canAfford && styles.trendingCardLocked]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!canAfford}
    >
      {/* Icon + Badge */}
      <View style={styles.trendingHeader}>
        <Text style={styles.trendingIcon}>{offer.image}</Text>
        {offer.redemption_count > 0 && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>{offer.redemption_count}</Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text style={styles.trendingTitle} numberOfLines={2}>
        {offer.title}
      </Text>

      {/* Footer */}
      <View style={styles.trendingFooter}>
        <Text
          style={[
            styles.trendingSteps,
            !canAfford && styles.trendingStepsLocked,
          ]}
        >
          {offer.steps_required.toLocaleString()}
        </Text>
        <View style={[styles.getButton, !canAfford && styles.getButtonLocked]}>
          <Text style={styles.getButtonText}>{canAfford ? "→" : "🔒"}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ============================================
// PARTNER CARD
// ============================================

interface PartnerCardProps {
  partner: Partner;
  onPress: () => void;
}

function PartnerCard({ partner, onPress }: PartnerCardProps) {
  return (
    <TouchableOpacity
      style={styles.partnerCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.partnerLogo}>{partner.logo}</Text>
      <Text style={styles.partnerName} numberOfLines={1}>
        {partner.name}
      </Text>
      <Text style={styles.partnerOffers}>{partner.offer_count} offers</Text>
    </TouchableOpacity>
  );
}

// ============================================
// MINIMALIST STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkGrey,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: Colors.white,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.lightGrey,
  },

  // Balance Card - MINIMALIST
  balanceCard: {
    marginHorizontal: 24,
    backgroundColor: Colors.neonLime,
    borderRadius: 28,
    padding: 28,
    marginBottom: 36,
    // No border! Clean look
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  balanceRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  balanceColumn: {
    flex: 1,
    alignItems: "center",
  },
  balanceColumnHighlight: {
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 20,
    paddingVertical: 16,
  },
  balanceIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 11,
    color: "rgba(0, 0, 0, 0.5)",
    textTransform: "uppercase",
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 8,
  },
  balanceLabelHighlight: {
    fontSize: 11,
    color: "rgba(0, 0, 0, 0.6)",
    textTransform: "uppercase",
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.black,
  },
  balanceValueHighlight: {
    fontSize: 38,
    fontWeight: "bold",
    color: Colors.black,
  },
  walkMoreButton: {
    flexDirection: "row",
    backgroundColor: Colors.black,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  walkMoreText: {
    fontSize: 15,
    color: Colors.neonLime,
    fontWeight: "600",
  },
  walkMoreIcon: {
    fontSize: 18,
    color: Colors.neonLime,
  },

  // Section Headers
  section: {
    marginBottom: 36,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.white,
  },
  seeAll: {
    fontSize: 14,
    color: Colors.neonLime,
    fontWeight: "600",
  },
  partnerCount: {
    fontSize: 14,
    color: Colors.lightGrey,
  },

  // Trending Cards - CLEANER
  trendingList: {
    paddingHorizontal: 24,
    gap: 16,
  },
  trendingCard: {
    width: 180,
    backgroundColor: Colors.black,
    borderRadius: 24,
    padding: 20,
    // Minimal border
    borderWidth: 1,
    borderColor: "rgba(198, 255, 0, 0.2)",
  },
  trendingCardLocked: {
    opacity: 0.5,
    borderColor: Colors.cardGrey,
  },
  trendingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  trendingIcon: {
    fontSize: 44,
  },
  popularBadge: {
    backgroundColor: Colors.neonLime,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 12,
    fontWeight: "bold",
    color: Colors.black,
  },
  trendingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
    marginBottom: 16,
    minHeight: 42,
    lineHeight: 21,
  },
  trendingFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  trendingSteps: {
    fontSize: 14,
    color: Colors.neonLime,
    fontWeight: "700",
  },
  trendingStepsLocked: {
    color: Colors.lightGrey,
  },
  getButton: {
    width: 36,
    height: 36,
    backgroundColor: Colors.neonLime,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  getButtonLocked: {
    backgroundColor: Colors.cardGrey,
  },
  getButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.black,
  },

  // Partners Grid - CLEANER
  partnersGrid: {
    paddingHorizontal: 24,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  partnerCard: {
    width: "31%",
    aspectRatio: 1,
    backgroundColor: Colors.black,
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    // Minimal border
    borderWidth: 1,
    borderColor: Colors.cardGrey,
  },
  partnerLogo: {
    fontSize: 40,
    marginBottom: 8,
  },
  partnerName: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.white,
    textAlign: "center",
    marginBottom: 4,
  },
  partnerOffers: {
    fontSize: 11,
    color: Colors.lightGrey,
  },
});
