import Colors from "@/constants/Colors";
import {
  getOffersByPartner,
  getPartnerById,
  Offer,
} from "@/constants/mockData";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function PartnerDetailScreen() {
  const { partnerId } = useLocalSearchParams<{ partnerId: string }>();
  const insets = useSafeAreaInsets();

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
          headerShown: false, // Hide default header completely
        }}
      />

      <View style={styles.container}>
        {/* Blue Background for Top Section */}
        <View style={styles.topBackground} />

        {/* Back Button */}
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 10 }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 60 }]}
        >
          {/* Partner Header (on Blue) */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.partnerLogo}>{partner.logo}</Text>
            </View>
            <Text style={styles.partnerName}>{partner.name}</Text>
            <Text style={styles.partnerDescription}>{partner.description}</Text>

            <View style={styles.statsRow}>
              <View style={styles.statBadge}>
                <Ionicons name="pricetag" size={14} color={Colors.brandBlue} style={{ marginRight: 4 }} />
                <Text style={styles.statText}>{offers.length} Offers</Text>
              </View>
              <View style={styles.statBadge}>
                <Ionicons name="location" size={14} color={Colors.brandBlue} style={{ marginRight: 4 }} />
                <Text style={styles.statText}>Baku, Aze</Text>
              </View>
            </View>
          </View>

          {/* Bottom Sheet (White) */}
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />

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
            <View style={{ height: 100 }} />
          </View>
        </ScrollView>
      </View>
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
  // Mock avatars for social proof
  const avatars = [
    "https://i.pravatar.cc/100?img=1",
    "https://i.pravatar.cc/100?img=5",
    "https://i.pravatar.cc/100?img=8",
  ];

  return (
    <TouchableOpacity
      style={styles.offerCard}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.offerMainRow}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.offerIcon}>{offer.image}</Text>
        </View>

        {/* Content */}
        <View style={styles.offerContent}>
          <View style={styles.offerHeaderRow}>
            <Text style={styles.offerTitle} numberOfLines={1}>{offer.title}</Text>
            {offer.discount_percentage && (
              <View style={styles.discountPill}>
                <Text style={styles.discountText}>{offer.discount_percentage}% OFF</Text>
              </View>
            )}
          </View>
          <Text style={styles.offerDescription} numberOfLines={2}>
            {offer.description}
          </Text>
        </View>
      </View>

      {/* Footer / Badges Row */}
      <View style={styles.offerFooter}>
        <View style={styles.badgesContainer}>
          {/* Steps Pill */}
          <View style={styles.detailPill}>
            <Ionicons name="footsteps" size={12} color={Colors.textSecondary} style={{ marginRight: 4 }} />
            <Text style={styles.detailPillText}>{offer.steps_required.toLocaleString()} steps</Text>
          </View>

          {/* Claimed Pill with Avatars */}
          <View style={[styles.detailPill, styles.claimedPill]}>
            <View style={styles.avatarStack}>
              {avatars.map((uri, index) => (
                <Image
                  key={index}
                  source={{ uri }}
                  style={[styles.smallAvatar, { marginLeft: index > 0 ? -8 : 0, zIndex: 3 - index }]}
                />
              ))}
            </View>
            <Text style={[styles.detailPillText, { marginLeft: 6 }]}>
              {offer.redemption_count}+ claimed
            </Text>
          </View>
        </View>

        {/* Get Button */}
        <View style={styles.getButton}>
          <Ionicons name="arrow-forward" size={18} color={Colors.white} />
        </View>
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
    backgroundColor: Colors.background,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 12,
  },
  topBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%', // Cover top half
    backgroundColor: Colors.brandBlue,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
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
    paddingTop: 10,
    paddingBottom: 40, // Space for bottom sheet overlap
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  partnerLogo: {
    fontSize: 36,
  },
  partnerName: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.white,
    marginBottom: 6,
    textAlign: "center",
  },
  partnerDescription: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginBottom: 16,
    maxWidth: '85%',
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.white,
  },

  // Bottom Sheet
  bottomSheet: {
    backgroundColor: Colors.background, // White
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    minHeight: 500, // Ensure it fills remaining screen
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border, // Light grey handle
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
    opacity: 0.5,
  },

  // Offers Section
  offersSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 16,
  },

  // Offer Card (Polished)
  offerCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    // Shadow
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  offerMainRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F5F7FA", // Very light grey blue
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  offerIcon: {
    fontSize: 24,
  },
  offerContent: {
    flex: 1,
  },
  offerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  discountPill: {
    backgroundColor: Colors.neonLime,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.black,
  },
  offerDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  // Footer / Badges
  offerFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#F5F7FA",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  claimedPill: {
    backgroundColor: "#F0F9FF", // Light Blue tint
  },
  detailPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textPrimary,
  },

  // Avatar Stack
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.white,
    backgroundColor: '#DDD',
  },

  getButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.brandBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
