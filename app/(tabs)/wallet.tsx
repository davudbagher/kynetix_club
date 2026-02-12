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
  RefreshControl,
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
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Refs for scrolling and animation
  const scrollViewRef = useRef<ScrollView>(null);
  const partnersRef = useRef<View>(null);
  const flipAnimation = useRef(new Animated.Value(0)).current;

  // Cache wallet balance (5-min freshness)
  const WALLET_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Load wallet balance from Firebase - Reload when tab is focused
  const loadWalletBalance = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const now = Date.now();
        const timeSinceLastFetch = now - lastFetchTime;

        if (timeSinceLastFetch < WALLET_CACHE_DURATION && totalEarned > 0) {
          console.log(
            `💰 Using cached wallet balance(${Math.floor(timeSinceLastFetch / 1000)}s old)`,
          );
          return;
        }
      }

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
        setLastFetchTime(Date.now());

        console.log(
          `💰 Wallet loaded: ${totalSteps.toLocaleString()} total, ${(totalSteps - spentSteps).toLocaleString()} available`,
        );
      }

      setIsLoading(false);
    } catch (error) {
      console.error("❌ Error loading wallet:", error);
      setIsLoading(false);
    }
  }, [lastFetchTime, totalEarned]);

  // Reload wallet data when screen comes into focus (smart caching!)
  useFocusEffect(
    useCallback(() => {
      const checkAndLoad = async () => {
        // Check if we need to force refresh due to redemption
        const needsRefresh = await AsyncStorage.getItem("wallet_needs_refresh");

        if (needsRefresh === "true") {
          console.log("🔄 Forcing wallet refresh after redemption");
          await AsyncStorage.removeItem("wallet_needs_refresh");
          loadWalletBalance(true); // Force refresh
        } else {
          loadWalletBalance(false); // Use 5-min cache logic
        }
      };

      checkAndLoad();
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
    <View style={styles.container}>
      {/* Top Blue Section */}
      <View style={styles.topSection}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Wallet</Text>
            <Text style={styles.headerSubtitle}>Your step rewards</Text>
          </View>
        </SafeAreaView>
      </View>

      {/* Bottom White Sheet Overlap */}
      <View style={styles.bottomSheet}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await loadWalletBalance(true); // Force refresh
                setRefreshing(false);
              }}
              tintColor={Colors.brandBlue}
              colors={[Colors.brandBlue]}
            />
          }
        >
          {/* Balance Card - Flippable */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.brandBlue} />
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
                    {/* Icon removed as requested */}
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
                      color={Colors.black}
                    />
                  </View>
                  {/* Flip indicator */}
                  <View style={styles.flipIndicator}>
                    <MaterialIcons
                      name="flip"
                      size={16}
                      color={Colors.black}
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
                      color={Colors.neonLime}
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
                      color={Colors.neonLime}
                    />
                  </View>
                  {/* Flip indicator */}
                  <View style={styles.flipIndicator}>
                    <MaterialIcons
                      name="flip"
                      size={16}
                      color={Colors.neonLime}
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
              <Ionicons name="walk" size={18} color={Colors.white} />
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
      </View>
    </View>
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
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brandBlue,
  },
  topSection: {
    backgroundColor: Colors.brandBlue,
    paddingBottom: 40, // Space for overlap
    zIndex: 1,
    paddingHorizontal: 24,
  },
  header: {
    marginTop: 12,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: Colors.white,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: Colors.background, // White
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32, // Overlap
    overflow: "hidden", // Clip content to radius
    zIndex: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 32, // Content starts after overlap curve
    paddingBottom: 20,
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
    backgroundColor: Colors.darkGrey, // Charcoal (Back)
    borderRadius: 24,
    padding: 24,
    minHeight: 200,
    justifyContent: "space-between",
    // Subtle shadow
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  debitCardPrimary: {
    backgroundColor: Colors.neonLime, // Brand Yellow/Lime (Front)
    borderColor: "rgba(0,0,0,0.05)",
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
    color: Colors.neonLime, // Brand Yellow on Charcoal
    letterSpacing: 1.5,
  },
  cardLabelPrimary: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.black, // Black text on Yellow
    letterSpacing: 1.5,
  },
  cardChip: {
    fontSize: 28,
  },
  cardBalance: {
    fontSize: 42,
    fontWeight: "bold",
    color: Colors.neonLime, // Brand Yellow
    letterSpacing: -1,
    marginBottom: 4,
  },
  cardBalancePrimary: {
    fontSize: 42,
    fontWeight: "bold",
    color: Colors.black, // Number Black
    letterSpacing: -1,
    marginBottom: 4,
  },
  cardBalanceLabel: {
    fontSize: 14,
    color: Colors.neonLime, // Brand Yellow
    marginBottom: 20,
    opacity: 0.8,
  },
  cardBalanceLabelPrimary: {
    fontSize: 14,
    color: Colors.black, // Black text
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
    color: Colors.neonLime, // Brand Yellow
    textTransform: "uppercase",
    letterSpacing: 1,
    opacity: 0.9,
  },
  cardHolderNamePrimary: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.black, // Black text
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
    opacity: 0.8,
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
    backgroundColor: Colors.brandBlue,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    // Shadow
    shadowColor: Colors.brandBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionIcon: {
    fontSize: 18,
  },
  primaryActionText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.white,
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 16,
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
    width: 54, // Match height of buttons approx
    height: 54, // Match height of buttons approx
    backgroundColor: Colors.white,
    borderRadius: 16,
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
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  seeAll: {
    fontSize: 14,
    color: Colors.brandBlue,
    fontWeight: "600",
  },
  partnerCount: {
    fontSize: 14,
    color: Colors.textSecondary,
  },

  // Trending Cards - CLEANER
  trendingList: {
    paddingHorizontal: 24,
    gap: 16,
  },
  trendingCard: {
    width: 180,
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    // Shadow
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  trendingCardLocked: {
    opacity: 0.6,
    backgroundColor: Colors.cardBackground,
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
    color: Colors.textPrimary,
  },
  trendingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
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
    color: Colors.brandBlue,
    fontWeight: "700",
  },
  trendingStepsLocked: {
    color: Colors.textSecondary,
  },
  getButton: {
    width: 36,
    height: 36,
    backgroundColor: Colors.brandBlue,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  getButtonLocked: {
    backgroundColor: Colors.border,
  },
  getButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.white,
  },

  // Partners Grid - CLEANER
  partnersGrid: {
    paddingHorizontal: 24,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  partnerCard: {
    width: "31%", // 3 columns
    aspectRatio: 1,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    // Border
    borderWidth: 1,
    borderColor: Colors.border,
  },
  partnerLogo: {
    fontSize: 36,
    marginBottom: 8,
  },
  partnerName: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 2,
  },
  partnerOffers: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
});
