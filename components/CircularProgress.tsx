import Colors from "@/constants/Colors";
import { StyleSheet, Text, View } from "react-native";
import { Circle, Svg } from "react-native-svg";

interface CircularProgressProps {
  currentSteps: number;
  goalSteps: number;
  size?: number;
}

export default function CircularProgress({
  currentSteps,
  goalSteps,
  size = 240,
}: CircularProgressProps) {
  // Calculate progress percentage
  const progress = Math.min((currentSteps / goalSteps) * 100, 100);

  // Circle dimensions
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (progress / 100) * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* SVG Progress Ring */}
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background circle (track) */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.progressTrack}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress circle (fill) */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.progressFill}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      {/* Center content */}
      <View style={styles.centerContent}>
        <Text style={styles.stepCount}>{currentSteps.toLocaleString()}</Text>
        <Text style={styles.stepLabel}>steps</Text>
        <View style={styles.goalContainer}>
          <Text style={styles.goalText}>
            Goal: {goalSteps.toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  svg: {
    position: "absolute",
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  stepCount: {
    fontSize: 56,
    fontWeight: "bold",
    color: Colors.white,
    letterSpacing: -2,
  },
  stepLabel: {
    fontSize: 16,
    color: Colors.lightGrey,
    marginTop: 4,
  },
  goalContainer: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.cardGrey,
    borderRadius: 12,
  },
  goalText: {
    fontSize: 12,
    color: Colors.neonLime,
    fontWeight: "600",
  },
});
