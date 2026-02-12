import CircularProgress from "@/components/CircularProgress";
import CreateSquadModal from "@/components/squad/CreateSquadModal";
import Colors from "@/constants/Colors";
import {
  getOfferById,
  getPartnerById,
} from "@/constants/mockData";
import {
  getWalletBalance,
  redeemOffer,
  WalletBalance,
} from "@/utils/walletUtils";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Mock Avatars for Social Proof
const avatars = [
  "https://i.pravatar.cc/100?img=1",
  "https://i.pravatar.cc/100?img=5",
  "https://i.pravatar.cc/100?img=8",
];

export default function OfferDetailScreen() {
  const { offerId } = useLocalSearchParams<{ offerId: string }>();

  // State
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(
    null,
  );
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [showSquadModal, setShowSquadModal] = useState(false);

  // Get offer and partner data
  const offer = getOfferById(offerId);
  const partner = offer ? getPartnerById(offer.partner_id) : null;

  // Load wallet balance on mount
  useEffect(() => {
    const loadBalance = async () => {
      try {
        setIsLoadingBalance(true);
        const userId = await AsyncStorage.getItem("kynetix_user_id");

        if (!userId) {
          console.log("⚠️ No user ID found");
          setIsLoadingBalance(false);
          return;
        }

        const balance = await getWalletBalance(userId);
        setWalletBalance(balance);
        setIsLoadingBalance(false);
      } catch (error) {
        console.error("❌ Error loading wallet balance:", error);
        setIsLoadingBalance(false);
      }
    };

    loadBalance();
  }, []);

  if (!offer || !partner) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Offer not found</Text>
      </SafeAreaView>
    );
  }

  const canAfford =
    walletBalance &&
    walletBalance.availableToSpend >= offer.steps_required;

  const handleRedeem = async () => {
    if (!canAfford) {
      Alert.alert(
        "Not Enough Steps",
        `You need ${offer.steps_required.toLocaleString()} steps to redeem this offer. Keep walking!`,
        [{ text: "OK" }],
      );
      return;
    }

    try {
      setIsRedeeming(true);

      // Get user ID
      const userId = await AsyncStorage.getItem("kynetix_user_id");
      if (!userId) {
        Alert.alert("Error", "User not logged in");
        setIsRedeeming(false);
        return;
      }

      // Redeem offer (atomic transaction)
      const result = await redeemOffer(
        userId,
        offer.id,
        offer.partner_id,
        offer.steps_required,
        offer.title,
      );

      setIsRedeeming(false);

      if (result.success && result.redemptionCode) {
        // Set flag to refresh wallet on next visit
        await AsyncStorage.setItem("wallet_needs_refresh", "true");

        // Success!
        Alert.alert(
          "Redeemed! 🎉",
          `Your redemption code is:\n\n${result.redemptionCode}\n\nShow this to the cashier at ${partner.name}`,
          [{ text: "Done", onPress: () => router.back() }],
        );
      } else {
        // Failed
        Alert.alert(
          "Redemption Failed",
          result.error || "Something went wrong. Please try again.",
          [{ text: "OK" }],
        );
      }
    } catch (error: any) {
      setIsRedeeming(false);
      console.error("❌ Redemption error:", error);
      Alert.alert("Error", error.message || "Failed to redeem offer");
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false, // Custom header
        }}
      />

      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Details</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          {/* Main White Card */}
          <View style={styles.whiteCard}>
            {/* Offer Header within White Card */}
            <View style={styles.offerHeader}>
              <View style={styles.offerIconContainer}>
                <Text style={styles.offerIcon}>{offer.image}</Text>
              </View>
              <View style={styles.offerHeaderText}>
                <Text style={styles.offerTitle}>{offer.title}</Text>
                <View style={styles.partnerRow}>
                  <Text style={styles.partnerName}>{partner.name}</Text>
                  {!!offer.discount_percentage && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>{offer.discount_percentage}% OFF</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Circular Progress Section */}
            <View style={styles.progressSection}>
              <View style={styles.progressInfo}>
                <Text style={styles.progressLabel}>Active Until</Text>
                <Text style={styles.progressDate}>{offer.expires_at || "Forever"}</Text>

                <View style={styles.statusChips}>
                  <View style={[styles.chip, { backgroundColor: Colors.neonLime }]}>
                    <Text style={styles.chipText}>Available</Text>
                  </View>
                  <View style={[styles.chip, { backgroundColor: Colors.brandBlue }]}>
                    <Text style={[styles.chipText, { color: Colors.white }]}>Offer</Text>
                  </View>
                </View>
              </View>

              <View style={styles.circularProgressWrapper}>
                <CircularProgress
                  currentSteps={Math.min(walletBalance?.availableToSpend || 0, offer.steps_required)}
                  goalSteps={offer.steps_required}
                  size={200}
                  trackColor="#F0F0F0"
                  textColor={Colors.textPrimary}
                  topLabel="Step Progress"
                  mainText={`${(walletBalance?.availableToSpend || 0).toLocaleString()} / ${offer.steps_required.toLocaleString()}`}
                  bottomLabel="to redeem"
                  showMotivationalText={false}
                />
              </View>
            </View>

            {/* Social Proof */}
            <View style={styles.socialProof}>
              <View style={styles.avatarStack}>
                {avatars.map((uri, index) => (
                  <Image
                    key={index}
                    source={{ uri }}
                    style={[styles.smallAvatar, { marginLeft: index > 0 ? -10 : 0, zIndex: 3 - index }]}
                  />
                ))}
              </View>
              <Text style={styles.claimedText}>
                {offer.redemption_count}+ claimed recently
              </Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Details</Text>
            <Text style={styles.description}>{offer.description}</Text>

            {/* Spacer for bottom bar */}
            <View style={{ height: 100 }} />
          </View>
        </ScrollView>

        {/* Bottom Bar (Overlapping or Fixed) */}
        <View style={styles.bottomBarContainer}>
          {/* Squad Button */}
          <TouchableOpacity
            style={styles.squadButton}
            onPress={() => setShowSquadModal(true)}
          >
            <Ionicons name="people" size={24} color={Colors.neonLime} />
            <View>
              <Text style={styles.squadTitle}>Start Squad</Text>
              <Text style={styles.squadSubtitle}>Save 20%</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          {/* Redeem Button */}
          <TouchableOpacity
            style={[
              styles.redeemButton,
              (!canAfford || isRedeeming) && styles.redeemButtonDisabled
            ]}
            onPress={handleRedeem}
            disabled={!canAfford || isRedeeming}
          >
            {isRedeeming ? (
              <ActivityIndicator color={Colors.black} />
            ) : (
              <>
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.redeemTitle}>Redeem Offer</Text>
                  <Text style={styles.redeemSubtitle}>
                    {canAfford ? "You have enough steps!" : `${(offer.steps_required - (walletBalance?.availableToSpend || 0)).toLocaleString()} more needed`}
                  </Text>
                </View>
              </>
            )}
          </TouchableOpacity>
        </View>

        <CreateSquadModal
          visible={showSquadModal}
          onClose={() => setShowSquadModal(false)}
          offer={{
            id: offer.id,
            title: offer.title,
            partnerName: partner.name,
            targetSteps: offer.steps_required * 2
          }}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brandBlue,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 10,
    paddingBottom: 20,
  },


  // White Card
  whiteCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    borderRadius: 32,
    padding: 24,
    paddingTop: 32,
    marginTop: 20,
    minHeight: 500,
  },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  offerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  offerIcon: {
    fontSize: 30,
  },
  offerHeaderText: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  partnerName: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  discountBadge: {
    backgroundColor: Colors.neonLime,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 10,
    fontWeight: '800',
  },

  // Circular Progress Section
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  progressInfo: {
    flex: 1,
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  progressDate: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  statusChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  circularProgressWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Social Proof
  socialProof: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#F5F7FA",
    padding: 12,
    borderRadius: 16,
    marginBottom: 20,
  },
  avatarStack: {
    flexDirection: 'row',
    marginRight: 12,
    paddingLeft: 4,
  },
  smallAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.white,
    backgroundColor: '#DDD',
  },
  claimedText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  // Bottom Buttons
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 30, // Safe area
    paddingTop: 20,
    backgroundColor: 'transparent', // Let background show through if needed, or white gradient
  },
  squadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.textPrimary, // Charcoal/Black
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  squadTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  squadSubtitle: {
    fontSize: 12,
    color: Colors.neonLime,
    fontWeight: '600',
  },
  redeemButton: {
    backgroundColor: Colors.neonLime, // Brand Yellow/Green
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    height: 72,
    // Shadow
    shadowColor: Colors.neonLime,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  redeemButtonDisabled: {
    backgroundColor: Colors.lightGrey,
    shadowOpacity: 0,
  },
  redeemTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.black, // Dark text for contrast on lime
  },
  redeemSubtitle: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.6)',
    marginTop: 2,
    fontWeight: '500',
  },
  priceTag: {
    backgroundColor: 'rgba(0,0,0,0.1)', // Subtle dark background
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.black,
  },
  errorText: {
    color: Colors.white,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
    fontWeight: 'bold',
  },
});
