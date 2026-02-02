import Colors from "@/constants/Colors";
import {
    getOffersByPartner,
    getPartnerById,
    Offer,
} from "@/constants/mockData";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PartnerDetailScreen() {
  const { partnerId } = useLocalSearchParams<{ partnerId: string }>();

  // Get partner data
  const partner = getPartnerById(partnerId);
  const offers = getOffersByPartner(partnerId);

  if (!partner) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Partner not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: partner.name,
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
          {/* Partner Header */}
          <View style={styles.header}>
            <Text style={styles.partnerLogo}>{partner.logo}</Text>
            <Text style={styles.partnerName}>{partner.name}</Text>
            <Text style={styles.partnerDescription}>{partner.description}</Text>
            <View style={styles.offerCountBadge}>
              <Text style={styles.offerCountText}>
                {offers.length} offers available
              </Text>
            </View>
          </View>

          {/* Offers List */}
          <View style={styles.offersSection}>
            <Text style={styles.sectionTitle}>Available Offers</Text>
            {offers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onPress={() => {
                  router.push({
                    pathname: "/offer-detail",
                    params: { offerId: offer.id },
                  });
                }}
              />
            ))}
          </View>

          {/* Bottom spacing */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

// ============================================
// OFFER CARD COMPONENT
// ============================================

interface OfferCardProps {
  offer: Offer;
  onPress: () => void;
}

function OfferCard({ offer, onPress }: OfferCardProps) {
  return (
    <TouchableOpacity
      style={styles.offerCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.offerHeader}>
        <Text style={styles.offerIcon}>{offer.image}</Text>
        <View style={styles.offerStepsBadge}>
          <Text style={styles.offerStepsText}>
            {offer.steps_required.toLocaleString()}
          </Text>
          <Text style={styles.offerStepsLabel}>steps</Text>
        </View>
      </View>

      <Text style={styles.offerTitle}>{offer.title}</Text>
      <Text style={styles.offerDescription} numberOfLines={2}>
        {offer.description}
      </Text>

      <View style={styles.offerFooter}>
        {offer.discount_percentage && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              {offer.discount_percentage}% OFF
            </Text>
          </View>
        )}

        <View style={styles.redeemCountBadge}>
          <Text style={styles.redeemCountText}>
            {offer.redemption_count} redeemed
          </Text>
        </View>

        <TouchableOpacity style={styles.getButton} onPress={onPress}>
          <Text style={styles.getButtonText}>Get</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.black} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardGrey,
  },
  partnerLogo: {
    fontSize: 64,
    marginBottom: 16,
  },
  partnerName: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.white,
    marginBottom: 8,
  },
  partnerDescription: {
    fontSize: 14,
    color: Colors.lightGrey,
    textAlign: "center",
    marginBottom: 16,
  },
  offerCountBadge: {
    backgroundColor: Colors.neonLime,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  offerCountText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.black,
  },

  // Offers Section
  offersSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.white,
    marginBottom: 16,
  },

  // Offer Card
  offerCard: {
    backgroundColor: Colors.black,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardGrey,
  },
  offerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  offerIcon: {
    fontSize: 48,
  },
  offerStepsBadge: {
    backgroundColor: Colors.cardGrey,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
  },
  offerStepsText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.neonLime,
  },
  offerStepsLabel: {
    fontSize: 10,
    color: Colors.lightGrey,
    marginTop: 2,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.white,
    marginBottom: 8,
  },
  offerDescription: {
    fontSize: 14,
    color: Colors.lightGrey,
    marginBottom: 16,
    lineHeight: 20,
  },
  offerFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  discountBadge: {
    backgroundColor: Colors.neonLime,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 11,
    fontWeight: "bold",
    color: Colors.black,
  },
  redeemCountBadge: {
    flex: 1,
  },
  redeemCountText: {
    fontSize: 11,
    color: Colors.lightGrey,
  },
  getButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neonLime,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  getButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.black,
  },
});
