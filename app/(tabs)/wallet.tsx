import { db } from "@/config/firebase";
import Colors from "@/constants/Colors";
import {
  getTrendingOffers,
  Offer,
  Partner,
  PARTNERS,
} from "@/constants/mockData";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: screenWidth } = Dimensions.get("window");
const cardWidth = screenWidth - 48; // 24px padding on each side

export default function WalletScreen() {
  // State for wallet balance (loaded from Firebase!)
  const [totalEarned, setTotalEarned] = useState(0);
  const [availableToSpend, setAvailableToSpend] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);

  // Refs for scrolling and animation
  const scrollViewRef = useRef<ScrollView>(null);
  const partnersRef = useRef<View>(null);
  const flipAnimation = useRef(new Animated.Value(0)).current;

  // Load wallet balance from Firebase - Reload when tab is focused
  const loadWalletBalance = useCallback(async () => {
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
  }, []);

  // Reload wallet data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadWalletBalance();
    }, [loadWalletBalance]),
  );

  // Get trending offers
  const trendingOffers = getTrendingOffers();

  // Flip animation handler
  const handleFlip = () => {
    Animated.spring(flipAnimation, {
      toValue: isFlipped ? 0 : 180,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  // Interpolate rotation values
  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });
  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };
  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Wallet</Text>
          <Text style={styles.subtitle}>Your step rewards</Text>
        </View>

        {/* Balance Card - Flippable */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.neonLime} />
          </View>
        ) : (
          <View style={styles.cardFlipContainer}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={handleFlip}
              style={styles.cardTouchable}
            >
              {/* Front - Available Balance */}
              <Animated.View
                style={[
                  styles.debitCard,
                  styles.debitCardPrimary,
                  frontAnimatedStyle,
                  styles.cardFace,
                ]}
              >
                <View style={styles.cardTopSection}>
                  <Text style={styles.cardLabelPrimary}>AVAILABLE</Text>
                  <Ionicons
                    name="sparkles"
                    size={24}
                    color="rgba(0, 0, 0, 0.6)"
                  />
                </View>
                <Text style={styles.cardBalancePrimary}>
                  {availableToSpend.toLocaleString()}
                </Text>
                <Text style={styles.cardBalanceLabelPrimary}>
                  steps to spend
                </Text>
                <View style={styles.cardBottomSection}>
                  <Text style={styles.cardHolderNamePrimary}>Ready to Use</Text>
                  <Ionicons
                    name="wallet"
                    size={24}
                    color="rgba(0, 0, 0, 0.6)"
                  />
                </View>
                {/* Flip indicator */}
                <View style={styles.flipIndicator}>
                  <MaterialIcons
                    name="flip"
                    size={16}
                    color="rgba(0, 0, 0, 0.4)"
                  />
                </View>
              </Animated.View>

              {/* Back - Total Earned */}
              <Animated.View
                style={[
                  styles.debitCard,
                  backAnimatedStyle,
                  styles.cardFace,
                  styles.cardBack,
                ]}
              >
                <View style={styles.cardTopSection}>
                  <Text style={styles.cardLabel}>TOTAL EARNED</Text>
                  <MaterialCommunityIcons
                    name="diamond-stone"
                    size={24}
                    color={Colors.lightGrey}
                  />
                </View>
                <Text style={styles.cardBalance}>
                  {totalEarned.toLocaleString()}
                </Text>
                <Text style={styles.cardBalanceLabel}>steps</Text>
                <View style={styles.cardBottomSection}>
                  <Text style={styles.cardHolderName}>Kynetix Member</Text>
                  <Ionicons
                    name="footsteps"
                    size={24}
                    color={Colors.lightGrey}
                  />
                </View>
                {/* Flip indicator */}
                <View style={styles.flipIndicator}>
                  <MaterialIcons
                    name="flip"
                    size={16}
                    color="rgba(255, 255, 255, 0.4)"
                  />
                </View>
              </Animated.View>
            </TouchableOpacity>

            {/* Tap to flip hint */}
            <Text style={styles.flipHint}>Tap card to flip</Text>
          </View>
        )}

        {/* Quick Actions - Banking Style */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={() => router.push("/")}
            activeOpacity={0.8}
          >
            <Ionicons name="walk" size={18} color={Colors.black} />
            <Text style={styles.primaryActionText}>Walk More</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionButton}
            activeOpacity={0.8}
            onPress={() => {
              partnersRef.current?.measureLayout(
                scrollViewRef.current as any,
                (x, y) => {
                  scrollViewRef.current?.scrollTo({
                    y: y - 100,
                    animated: true,
                  });
                },
              );
            }}
          >
            <Ionicons name="gift" size={18} color={Colors.textPrimary} />
            <Text style={styles.secondaryActionText}>Redeem</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconOnlyButton} activeOpacity={0.8}>
            <Ionicons name="receipt" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
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
        <View style={styles.section} ref={partnersRef}>
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

  // Balance Card - Flippable
  cardFlipContainer: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  cardTouchable: {
    height: 200,
  },
  cardFace: {
    backfaceVisibility: "hidden",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  cardBack: {
    top: 0,
  },
  flipHint: {
    textAlign: "center",
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 12,
    marginBottom: 20,
  },
  debitCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 24,
    minHeight: 200,
    justifyContent: "space-between",
  },
  debitCardPrimary: {
    backgroundColor: Colors.neonLime,
  },
  cardTopSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.lightGrey,
    letterSpacing: 1.5,
  },
  cardLabelPrimary: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(0, 0, 0, 0.6)",
    letterSpacing: 1.5,
  },
  cardChip: {
    fontSize: 28,
  },
  cardBalance: {
    fontSize: 42,
    fontWeight: "bold",
    color: Colors.white,
    letterSpacing: -1,
    marginBottom: 4,
  },
  cardBalancePrimary: {
    fontSize: 42,
    fontWeight: "bold",
    color: Colors.black,
    letterSpacing: -1,
    marginBottom: 4,
  },
  cardBalanceLabel: {
    fontSize: 14,
    color: Colors.lightGrey,
    marginBottom: 20,
  },
  cardBalanceLabelPrimary: {
    fontSize: 14,
    color: "rgba(0, 0, 0, 0.6)",
    marginBottom: 20,
  },
  cardBottomSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardHolderName: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.lightGrey,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cardHolderNamePrimary: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(0, 0, 0, 0.6)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cardBrand: {
    fontSize: 24,
  },
  flipIndicator: {
    position: "absolute",
    bottom: 12,
    right: 12,
    opacity: 0.6,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },

  // Quick Actions - Banking Style
  quickActionsContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 32,
  },
  primaryActionButton: {
    flex: 1,
    backgroundColor: Colors.neonLime,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryActionIcon: {
    fontSize: 18,
  },
  primaryActionText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.black,
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryActionIcon: {
    fontSize: 18,
  },
  secondaryActionText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  iconOnlyButton: {
    width: 52,
    height: 52,
    backgroundColor: Colors.white,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconOnlyButtonIcon: {
    fontSize: 22,
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
