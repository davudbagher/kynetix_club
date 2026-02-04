import Colors from "@/constants/Colors";
import { StyleSheet, Text, View } from "react-native";

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
}

export default function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>
        {value} <Text style={styles.label}>{label}</Text>
      </Text>
      <View style={styles.iconContainer}>{icon}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 4,
    // Subtle shadow
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  value: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});
