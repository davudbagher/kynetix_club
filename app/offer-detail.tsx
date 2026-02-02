import Colors from "@/constants/Colors";
import {
    generateRedemptionCode,
    getOfferById,
    getPartnerById,
} from "@/constants/mockData";
import { usePedometer } from "@/hooks/usePedometer";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OfferDetailScreen() {
  const { offerId } = useLocalSearchParams<{ offerId: string }>();
  const { todaySteps } = usePedometer();

  // Get offer and partner data
  const offer = getOfferById(offerId);
  const partner = offer ? getPartnerById(offer.partner_id) : null;

  if (!offer || !partner) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Offer not found</Text>
      </SafeAreaView>
    );
  }

  const canAfford = todaySteps >= offer.steps_required;

  const handleRedeem = () => {
    if (!canAfford) {
      Alert.alert(
        "Not Enough Steps",
        `You need ${offer.steps_required.toLocaleString()} steps to redeem this offer. Keep walking!`,
        [{ text: "OK" }],
      );
      return;
    }

    // Generate redemption code
    const code = generateRedemptionCode();

    // Show success (later we'll save to Firebase)
    Alert.alert(
      "Redeemed! 🎉",
      `Your redemption code is: ${code}\n\nShow this to the cashier at ${partner.name}`,
      [{ text: "Done", onPress: () => router.back() }],
    );

    // TODO: Save redemption to Firebase
    // TODO: Deduct steps from user balance
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Offer Details",
          headerStyle: { backgroundColor: Colors.darkGrey },
          headerTintColor: Colors.white,
          headerShadowVisible: false,
        }}
      />

      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Offer Header */}
          <View style={styles.header}>
            <Text style={styles.offerIcon}>{offer.image}</Text>
            <Text style={styles.offerTitle}>{offer.title}</Text>

            {/* Partner Badge */}
            <TouchableOpacity
              style={styles.partnerBadge}
              onPress={() => router.back()}
            >
              <Text style={styles.partnerLogo}>{partner.logo}</Text>
              <Text style={styles.partnerName}>{partner.name}</Text>
            </TouchableOpacity>
          </View>

          {/* Cost Section */}
          <View style={styles.costCard}>
            <Text style={styles.costLabel}>Costs</Text>
            <Text style={styles.costAmount}>
              {offer.steps_required.toLocaleString()}
            </Text>
            <Text style={styles.costSteps}>steps</Text>

            {offer.discount_percentage && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>
                  {offer.discount_percentage}% OFF
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This Offer</Text>
            <Text style={styles.description}>{offer.description}</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsSection}>
            <View style={styles.statCard}>
              <Ionicons name="people" size={20} color={Colors.neonLime} />
              <Text style={styles.statValue}>{offer.redemption_count}</Text>
              <Text style={styles.statLabel}>Redeemed</Text>
            </View>

            {offer.expires_at && (
              <View style={styles.statCard}>
                <Ionicons name="time" size={20} color={Colors.neonLime} />
                <Text style={styles.statValue}>Limited</Text>
                <Text style={styles.statLabel}>Expires {offer.expires_at}</Text>
              </View>
            )}

            {!offer.expires_at && (
              <View style={styles.statCard}>
                <Ionicons name="infinite" size={20} color={Colors.neonLime} />
                <Text style={styles.statValue}>Lifelong</Text>
                <Text style={styles.statLabel}>Never expires</Text>
              </View>
            )}
          </View>

          {/* Your Balance */}
          <View style={styles.balanceSection}>
            <Text style={styles.balanceLabel}>Your available steps</Text>
            <Text
              style={[
                styles.balanceAmount,
                !canAfford && styles.balanceInsufficient,
              ]}
            >
              {todaySteps.toLocaleString()}
            </Text>
            {!canAfford && (
              <Text style={styles.balanceWarning}>
                ⚠️ Need {(offer.steps_required - todaySteps).toLocaleString()}{" "}
                more steps
              </Text>
            )}
          </View>

          {/* Bottom spacing */}
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Fixed Bottom Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              styles.redeemButton,
              !canAfford && styles.redeemButtonDisabled,
            ]}
            onPress={handleRedeem}
            activeOpacity={0.8}
          >
            <Text style={styles.redeemButtonText}>
              {canAfford ? "🎉 Redeem Now" : "🚶 Walk More to Redeem"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

// ============================================
// STYLES
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
  errorText: {
    color: Colors.white,
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
  },

  // Header
  header: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  offerIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  offerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: Colors.white,
    textAlign: "center",
    marginBottom: 16,
  },
  partnerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.black,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  partnerLogo: {
    fontSize: 20,
  },
  partnerName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.white,
  },

  // Cost Card
  costCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.black,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.neonLime,
  },
  costLabel: {
    fontSize: 14,
    color: Colors.lightGrey,
    marginBottom: 8,
  },
  costAmount: {
    fontSize: 48,
    fontWeight: "bold",
    color: Colors.neonLime,
    letterSpacing: -2,
  },
  costSteps: {
    fontSize: 16,
    color: Colors.lightGrey,
    marginBottom: 12,
  },
  discountBadge: {
    backgroundColor: Colors.neonLime,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  discountText: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.black,
  },

  // Section
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.white,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: Colors.lightGrey,
    lineHeight: 22,
  },

  // Stats
  statsSection: {
    paddingHorizontal: 20,
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.black,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.cardGrey,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.white,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.lightGrey,
    textAlign: "center",
  },

  // Balance Section
  balanceSection: {
    marginHorizontal: 20,
    backgroundColor: Colors.black,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.cardGrey,
  },
  balanceLabel: {
    fontSize: 13,
    color: Colors.lightGrey,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.neonLime,
  },
  balanceInsufficient: {
    color: Colors.lightGrey,
  },
  balanceWarning: {
    fontSize: 12,
    color: Colors.warning,
    marginTop: 8,
  },

  // Bottom Bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.darkGrey,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.cardGrey,
  },
  redeemButton: {
    backgroundColor: Colors.neonLime,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  redeemButtonDisabled: {
    backgroundColor: Colors.cardGrey,
  },
  redeemButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.black,
  },
});
