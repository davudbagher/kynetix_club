import Colors from "@/constants/Colors";
import { StyleSheet, Text, View } from "react-native";
import { Circle, Svg } from "react-native-svg";

interface CircularProgressProps {
  currentSteps: number;
  goalSteps: number;
  size?: number;
  trackColor?: string;
  textColor?: string;
}

export default function CircularProgress({
  currentSteps,
  goalSteps,
  size = 220,
  trackColor = Colors.progressTrack,
  textColor = Colors.textPrimary,
}: CircularProgressProps) {
  // Calculate progress percentage
  const progress = Math.min((currentSteps / goalSteps) * 100, 100);

  // Circle dimensions
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (progress / 100) * circumference;

  // Motivational message based on progress
  const getMotivationalMessage = () => {
    if (progress >= 100) return "Goal reached! 🎉";
    if (progress >= 75) return "Keep it up! 💪";
    if (progress >= 50) return "Halfway there! ⚡";
    if (progress >= 25) return "Great start! 🚀";
    return "Let's go! 👟";
  };

  return (
    <View style={styles.container}>
      <View style={[styles.progressContainer, { width: size, height: size }]}>
        {/* SVG Progress Ring */}
        <Svg width={size} height={size} style={styles.svg}>
          {/* Background circle (track) */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />

          {/* Progress circle (fill) */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={Colors.neonLime}
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
          <Text style={[styles.label, { color: textColor ? textColor : Colors.textSecondary, opacity: 0.7 }]}>Today</Text>
          <Text style={[styles.stepCount, { color: textColor }]}>{currentSteps.toLocaleString()}</Text>
          <Text style={[styles.goalText, { color: textColor ? textColor : Colors.textTertiary, opacity: 0.7 }]}>
            of {goalSteps.toLocaleString()} goal
          </Text>
        </View>
      </View>

      {/* Motivational message below circle */}
      <Text style={styles.motivationalText}>{getMotivationalMessage()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  progressContainer: {
    alignItems: "center",
    justifyContent: "center",
    // Subtle shadow for depth
    shadowColor: Colors.neonLime,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  svg: {
    position: "absolute",
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  stepCount: {
    fontSize: 52,
    fontWeight: "bold",
    color: Colors.textPrimary,
    letterSpacing: -2,
  },
  goalText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: "500",
  },
  motivationalText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 20,
    fontWeight: "600",
  },
});
