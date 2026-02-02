// constants/mockData.ts

export interface Partner {
  id: string;
  name: string;
  logo: string;
  category: "food" | "fitness" | "shopping" | "entertainment";
  offer_count: number;
  description: string;
}

export interface Offer {
  id: string;
  partner_id: string;
  title: string;
  description: string;
  image: string;
  steps_required: number;
  discount_percentage?: number;
  is_featured: boolean;
  expires_at: string | null; // null = lifelong
  redemption_count: number;
  category: string;
}

export interface Redemption {
  id: string;
  user_id: string;
  offer_id: string;
  redemption_code: string;
  redeemed_at: string;
  status: "active" | "used" | "expired";
}

// ============================================
// PARTNERS DATA
// ============================================

export const PARTNERS: Partner[] = [
  {
    id: "iki",
    name: "IKI Shops",
    logo: "🏪",
    category: "shopping",
    offer_count: 8,
    description: "Azerbaijan's largest supermarket chain",
  },
  {
    id: "bravo",
    name: "Bravo Supermarket",
    logo: "🛒",
    category: "shopping",
    offer_count: 5,
    description: "Quality groceries at great prices",
  },
  {
    id: "crossfit",
    name: "CrossFit Baku",
    logo: "🏋️",
    category: "fitness",
    offer_count: 4,
    description: "Premium CrossFit training facility",
  },
  {
    id: "espresso_lab",
    name: "Espresso Lab",
    logo: "☕",
    category: "food",
    offer_count: 3,
    description: "Specialty coffee in the heart of Baku",
  },
  {
    id: "nike",
    name: "Nike Store",
    logo: "👟",
    category: "shopping",
    offer_count: 6,
    description: "Athletic footwear and apparel",
  },
  {
    id: "fit_zone",
    name: "Fit Zone Gym",
    logo: "💪",
    category: "fitness",
    offer_count: 7,
    description: "24/7 gym with modern equipment",
  },
];

// ============================================
// OFFERS DATA
// ============================================

export const OFFERS: Offer[] = [
  // IKI Shops Offers
  {
    id: "iki_fruits",
    partner_id: "iki",
    title: "Fruits & Vegetables 20% Off",
    description:
      "Get 20% discount on all fresh produce. Show this offer at checkout.",
    image: "🥬",
    steps_required: 5000,
    discount_percentage: 20,
    is_featured: true,
    expires_at: null, // Lifelong
    redemption_count: 234,
    category: "food",
  },
  {
    id: "iki_dairy",
    partner_id: "iki",
    title: "Dairy Products 15% Off",
    description: "Discount on milk, cheese, yogurt and more.",
    image: "🥛",
    steps_required: 3000,
    discount_percentage: 15,
    is_featured: false,
    expires_at: null,
    redemption_count: 189,
    category: "food",
  },
  {
    id: "iki_bakery",
    partner_id: "iki",
    title: "Free Bread with Purchase",
    description: "Get a free fresh bread with any purchase over 20 AZN.",
    image: "🍞",
    steps_required: 2000,
    is_featured: false,
    expires_at: null,
    redemption_count: 412,
    category: "food",
  },

  // Bravo Offers
  {
    id: "bravo_groceries",
    partner_id: "bravo",
    title: "20% Off Entire Purchase",
    description: "Use this offer to get 20% off your entire grocery shopping.",
    image: "🛒",
    steps_required: 8000,
    discount_percentage: 20,
    is_featured: true,
    expires_at: null,
    redemption_count: 156,
    category: "shopping",
  },
  {
    id: "bravo_snacks",
    partner_id: "bravo",
    title: "Buy 2 Get 1 Free Snacks",
    description: "Any snacks - chips, nuts, chocolate. Third one free!",
    image: "🍿",
    steps_required: 4000,
    is_featured: false,
    expires_at: null,
    redemption_count: 298,
    category: "food",
  },

  // CrossFit Baku Offers
  {
    id: "crossfit_day_pass",
    partner_id: "crossfit",
    title: "Free Day Pass",
    description: "One full day access to all facilities and classes.",
    image: "🏋️‍♂️",
    steps_required: 15000,
    is_featured: true,
    expires_at: null,
    redemption_count: 87,
    category: "fitness",
  },
  {
    id: "crossfit_pt_session",
    partner_id: "crossfit",
    title: "50% Off Personal Training",
    description: "One-on-one session with certified trainer.",
    image: "💪",
    steps_required: 25000,
    discount_percentage: 50,
    is_featured: false,
    expires_at: null,
    redemption_count: 43,
    category: "fitness",
  },

  // Espresso Lab Offers
  {
    id: "espresso_cappuccino",
    partner_id: "espresso_lab",
    title: "Free Cappuccino",
    description: "Redeem for one free cappuccino of any size.",
    image: "☕",
    steps_required: 5000,
    is_featured: false,
    expires_at: null,
    redemption_count: 521,
    category: "food",
  },
  {
    id: "espresso_pastry",
    partner_id: "espresso_lab",
    title: "Free Pastry with Coffee",
    description: "Get a free croissant or muffin with any coffee purchase.",
    image: "🥐",
    steps_required: 3000,
    is_featured: false,
    expires_at: null,
    redemption_count: 367,
    category: "food",
  },

  // Nike Offers
  {
    id: "nike_shoes",
    partner_id: "nike",
    title: "25% Off Running Shoes",
    description: "Discount on all running shoe models.",
    image: "👟",
    steps_required: 20000,
    discount_percentage: 25,
    is_featured: false,
    expires_at: null,
    redemption_count: 92,
    category: "shopping",
  },
  {
    id: "nike_apparel",
    partner_id: "nike",
    title: "15% Off Athletic Wear",
    description: "T-shirts, shorts, leggings - all athletic apparel.",
    image: "👕",
    steps_required: 12000,
    discount_percentage: 15,
    is_featured: false,
    expires_at: null,
    redemption_count: 134,
    category: "shopping",
  },

  // Fit Zone Gym Offers
  {
    id: "fitzone_week_pass",
    partner_id: "fit_zone",
    title: "Free Week Pass",
    description: "7 days unlimited gym access. Try all our facilities!",
    image: "🏃",
    steps_required: 20000,
    is_featured: false,
    expires_at: null,
    redemption_count: 76,
    category: "fitness",
  },
  {
    id: "fitzone_smoothie",
    partner_id: "fit_zone",
    title: "Free Protein Smoothie",
    description: "Choice of any protein smoothie from our juice bar.",
    image: "🥤",
    steps_required: 4000,
    is_featured: false,
    expires_at: "2026-08-31", // Summer promo - expires!
    redemption_count: 203,
    category: "food",
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getTrendingOffers = (): Offer[] => {
  return OFFERS.filter((offer) => offer.is_featured)
    .sort((a, b) => b.redemption_count - a.redemption_count)
    .slice(0, 3);
};

export const getPartnerById = (partnerId: string): Partner | undefined => {
  return PARTNERS.find((p) => p.id === partnerId);
};

export const getOffersByPartner = (partnerId: string): Offer[] => {
  return OFFERS.filter((offer) => offer.partner_id === partnerId);
};

export const getOfferById = (offerId: string): Offer | undefined => {
  return OFFERS.find((o) => o.id === offerId);
};

export const generateRedemptionCode = (): string => {
  // Generate code like: KX-A8F2J9
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "KX-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};
