import Colors from "@/constants/Colors";
import { Badge } from "@/constants/badges";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface BadgeModalProps {
  visible: boolean;
  badge: Badge | null;
  isUnlocked: boolean;
  onClose: () => void;
  userData: any;
}

export default function BadgeModal({
  visible,
  badge,
  isUnlocked,
  onClose,
  userData,
}: BadgeModalProps) {
  if (!badge) return null;

  const rarityColors = {
    common: "#9CA3AF",
    rare: "#3B82F6",
    epic: "#A855F7",
    legendary: "#F59E0B",
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} style={styles.modalContainer}>
          <View style={styles.modal}>
            {/* Badge Icon */}
            <View
              style={[
                styles.badgeContainer,
                !isUnlocked && styles.badgeContainerLocked,
              ]}
            >
              <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
            </View>

            {/* Badge Name */}
            <Text style={styles.badgeName}>{badge.name}</Text>

            {/* Rarity */}
            <View
              style={[
                styles.rarityBadge,
                { backgroundColor: rarityColors[badge.rarity] },
              ]}
            >
              <Text style={styles.rarityText}>
                {badge.rarity.toUpperCase()}
              </Text>
            </View>

            {/* Description */}
            <Text style={styles.description}>{badge.description}</Text>

            {/* Progress */}
            {!isUnlocked && (
              <View style={styles.progressSection}>
                <Text style={styles.progressLabel}>Progress</Text>
                <Text style={styles.progressValue}>
                  {badge.progressText(userData)}
                </Text>
              </View>
            )}

            {/* Status */}
            <View style={styles.statusSection}>
              {isUnlocked ? (
                <>
                  <Text style={styles.statusUnlocked}>✅ Unlocked!</Text>
                  <Text style={styles.statusDate}>Keep up the great work!</Text>
                </>
              ) : (
                <>
                  <Text style={styles.statusLocked}>🔒 Locked</Text>
                  <Text style={styles.statusHint}>
                    Keep walking to unlock this badge!
                  </Text>
                </>
              )}
            </View>

            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 400,
  },
  modal: {
    backgroundColor: Colors.darkGrey,
    borderRadius: 24,
    padding: 32,
    width: "100%",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.neonLime,
  },
  badgeContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.neonLime,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  badgeContainerLocked: {
    backgroundColor: Colors.cardGrey,
    opacity: 0.5,
  },
  badgeEmoji: {
    fontSize: 64,
  },
  badgeName: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.white,
    marginBottom: 12,
    textAlign: "center",
  },
  rarityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  rarityText: {
    fontSize: 11,
    fontWeight: "bold",
    color: Colors.white,
    letterSpacing: 1,
  },
  description: {
    fontSize: 16,
    color: Colors.lightGrey,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  progressSection: {
    width: "100%",
    backgroundColor: Colors.black,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.lightGrey,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  progressValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.neonLime,
  },
  statusSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  statusUnlocked: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.neonLime,
    marginBottom: 4,
  },
  statusLocked: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.lightGrey,
    marginBottom: 4,
  },
  statusDate: {
    fontSize: 14,
    color: Colors.lightGrey,
  },
  statusHint: {
    fontSize: 14,
    color: Colors.lightGrey,
  },
  closeButton: {
    backgroundColor: Colors.neonLime,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: "100%",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.black,
    textAlign: "center",
  },
});
