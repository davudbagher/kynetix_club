import Colors from "@/constants/Colors";
import {
  getTrendingOffers,
  Offer,
  Partner,
  PARTNERS,
} from "@/constants/mockData";
import { usePedometer } from "@/hooks/usePedometer";
import { router } from "expo-router";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WalletScreen() {
  // Get user's available steps (from pedometer)
  const { todaySteps } = usePedometer();

  // For now, user has their total steps as available balance
  // Later: We'll track spent vs available in Firebase
  const availableSteps = todaySteps;

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
          <Text style={styles.title}>Wallet 💎</Text>
          <Text style={styles.subtitle}>Spend your steps on rewards</Text>
        </View>

        {/* Available Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>You can spend</Text>
          <Text style={styles.balanceAmount}>
            {availableSteps.toLocaleString()}
          </Text>
          <Text style={styles.balanceSteps}>steps</Text>
          <TouchableOpacity style={styles.earnMoreButton}>
            <Text style={styles.earnMoreText}>🔥 Walk more to earn</Text>
          </TouchableOpacity>
        </View>

        {/* Trending Section */}
        {trendingOffers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔥 Trending Today</Text>
              <Text style={styles.sectionSubtitle}>Most popular offers</Text>
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
                  onPress={() => {
                    // Navigate to offer detail (we'll build this next)
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
            <Text style={styles.sectionSubtitle}>
              {PARTNERS.length} partners in Baku
            </Text>
          </View>

          <View style={styles.partnersGrid}>
            {PARTNERS.map((partner) => (
              <PartnerCard
                key={partner.id}
                partner={partner}
                onPress={() => {
                  // Navigate to partner detail (we'll build this next)
                  router.push({
                    pathname: "/partner-detail",
                    params: { partnerId: partner.id },
                  });
                }}
              />
            ))}
          </View>
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// TRENDING OFFER CARD COMPONENT
// ============================================

interface TrendingOfferCardProps {
  offer: Offer;
  onPress: () => void;
}

function TrendingOfferCard({ offer, onPress }: TrendingOfferCardProps) {
  return (
    <TouchableOpacity
      style={styles.trendingCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.trendingCardHeader}>
        <Text style={styles.trendingIcon}>{offer.image}</Text>
        <View style={styles.trendingBadge}>
          <Text style={styles.trendingBadgeText}>{offer.redemption_count}</Text>
        </View>
      </View>

      <Text style={styles.trendingTitle} numberOfLines={2}>
        {offer.title}
      </Text>

      <View style={styles.trendingFooter}>
        <Text style={styles.trendingSteps}>
          {offer.steps_required.toLocaleString()} steps
        </Text>
        <View style={styles.trendingGetButton}>
          <Text style={styles.trendingGetText}>Get →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ============================================
// PARTNER CARD COMPONENT
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
      activeOpacity={0.7}
    >
      <Text style={styles.partnerLogo}>{partner.logo}</Text>
      <Text style={styles.partnerName} numberOfLines={1}>
        {partner.name}
      </Text>
      <Text style={styles.partnerOfferCount}>{partner.offer_count} offers</Text>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.lightGrey,
  },

  // Balance Card
  balanceCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.black,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    marginBottom: 32,
    borderWidth: 2,
    borderColor: Colors.neonLime,
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.lightGrey,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 56,
    fontWeight: "bold",
    color: Colors.neonLime,
    letterSpacing: -2,
  },
  balanceSteps: {
    fontSize: 18,
    color: Colors.lightGrey,
    marginBottom: 16,
  },
  earnMoreButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.cardGrey,
    borderRadius: 20,
  },
  earnMoreText: {
    fontSize: 13,
    color: Colors.white,
    fontWeight: "600",
  },

  // Section
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.white,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.lightGrey,
  },

  // Trending List
  trendingList: {
    paddingLeft: 20,
    paddingRight: 20,
    gap: 12,
  },
  trendingCard: {
    width: 200,
    backgroundColor: Colors.black,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.neonLime,
  },
  trendingCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  trendingIcon: {
    fontSize: 40,
  },
  trendingBadge: {
    backgroundColor: Colors.neonLime,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendingBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: Colors.black,
  },
  trendingTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.white,
    marginBottom: 12,
    minHeight: 40,
  },
  trendingFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  trendingSteps: {
    fontSize: 13,
    color: Colors.neonLime,
    fontWeight: "600",
  },
  trendingGetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.neonLime,
    borderRadius: 12,
  },
  trendingGetText: {
    fontSize: 12,
    fontWeight: "bold",
    color: Colors.black,
  },

  // Partners Grid
  partnersGrid: {
    paddingHorizontal: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  partnerCard: {
    width: "31%",
    aspectRatio: 1,
    backgroundColor: Colors.black,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.cardGrey,
  },
  partnerLogo: {
    fontSize: 36,
    marginBottom: 8,
  },
  partnerName: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.white,
    textAlign: "center",
    marginBottom: 4,
  },
  partnerOfferCount: {
    fontSize: 10,
    color: Colors.lightGrey,
  },
});
