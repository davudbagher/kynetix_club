import Colors from "@/constants/Colors";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface VirtualTreesModalProps {
  visible: boolean;
  onClose: () => void;
  totalSteps: number;
}

export default function VirtualTreesModal({
  visible,
  onClose,
  totalSteps,
}: VirtualTreesModalProps) {
  const totalTrees = Math.floor(totalSteps / 280);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🌳</Text>
            </View>
            <Text style={styles.count}>{totalTrees}</Text>
            <Text style={styles.title}>Virtual trees</Text>
          </View>

          {/* Explanation */}
          <ScrollView style={styles.content}>
            <Text style={styles.mainText}>
              Join us by growing virtual trees!
            </Text>

            <Text style={styles.description}>
              Going by car 1 km on average your CO2 emission is 180g. This CO2
              quantity can be absorbed by 5 trees during 24 hours.{"\n\n"}
              Kynetix Club offers to walk this 1 km or 1400 steps instead of
              using a car and in this way to grow 5 virtual trees!
            </Text>

            {/* Conversion Table */}
            <View style={styles.table}>
              {/* Row 1 */}
              <View style={styles.row}>
                <View style={styles.cell}>
                  <Text style={styles.stepsValue}>1,400</Text>
                  <Text style={styles.stepsIcon}>🚶</Text>
                  <Text style={styles.cellLabel}>1 km</Text>
                </View>
                <Text style={styles.equals}>=</Text>
                <View style={styles.cell}>
                  <Text style={styles.treesValue}>5</Text>
                  <Text style={styles.treesIcon}>🌳</Text>
                </View>
              </View>

              {/* Row 2 */}
              <View style={styles.row}>
                <View style={styles.cell}>
                  <Text style={styles.stepsValue}>4,200</Text>
                  <Text style={styles.stepsIcon}>🚶</Text>
                  <Text style={styles.cellLabel}>3 km</Text>
                </View>
                <Text style={styles.equals}>=</Text>
                <View style={styles.cell}>
                  <Text style={styles.treesValue}>15</Text>
                  <Text style={styles.treesIcon}>🌳</Text>
                </View>
              </View>

              {/* Row 3 */}
              <View style={styles.row}>
                <View style={styles.cell}>
                  <Text style={styles.stepsValue}>9,800</Text>
                  <Text style={styles.stepsIcon}>🚶</Text>
                  <Text style={styles.cellLabel}>7 km</Text>
                </View>
                <Text style={styles.equals}>=</Text>
                <View style={styles.cell}>
                  <Text style={styles.treesValue}>35</Text>
                  <Text style={styles.treesIcon}>🌳</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxHeight: "80%",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  icon: {
    fontSize: 48,
  },
  count: {
    fontSize: 48,
    fontWeight: "bold",
    color: Colors.black,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.black,
  },
  content: {
    marginBottom: 24,
  },
  mainText: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.black,
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
    marginBottom: 24,
  },
  table: {
    gap: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    padding: 16,
    justifyContent: "space-between",
  },
  cell: {
    alignItems: "center",
  },
  stepsValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.black,
  },
  stepsIcon: {
    fontSize: 24,
    marginVertical: 4,
  },
  cellLabel: {
    fontSize: 14,
    color: "#666",
  },
  equals: {
    fontSize: 24,
    color: "#999",
    marginHorizontal: 16,
  },
  treesValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  treesIcon: {
    fontSize: 32,
  },
  closeButton: {
    backgroundColor: Colors.neonLime,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.black,
  },
});
