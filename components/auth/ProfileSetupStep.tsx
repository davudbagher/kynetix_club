import Colors from "@/constants/Colors";
import { useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface ProfileSetupStepProps {
  onComplete: (userData: { fullName: string; avatar: string }) => void;
}

const AVATAR_OPTIONS = [
  "🧑🏻‍💻",
  "👨🏻",
  "👩🏻",
  "👨🏻‍💼",
  "👩🏻‍💼",
  "🧔🏻",
  "👨🏻‍🦱",
  "👩🏻‍🦱",
  "👨🏻‍🦰",
  "👩🏻‍🦰",
  "🧑🏻‍🎓",
  "👨🏻‍🏫",
  "👩🏻‍🏫",
  "🏃🏻‍♂️",
  "🏃🏻‍♀️",
  "🚴🏻‍♂️",
  "🚴🏻‍♀️",
  "🏋🏻",
  "🤸🏻",
  "🧘🏻",
];

export default function ProfileSetupStep({
  onComplete,
}: ProfileSetupStepProps) {
  const [fullName, setFullName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleComplete = async () => {
    if (fullName.trim().length < 2) {
      setError("Please enter your full name");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // TODO: Save user profile to Firestore
      await new Promise((resolve) => setTimeout(resolve, 1000));

      onComplete({
        fullName: fullName.trim(),
        avatar: selectedAvatar,
      });
    } catch (err: any) {
      setError(err.message || "Failed to create profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            Choose your avatar and enter your name
          </Text>
        </View>

        {/* Selected Avatar Display */}
        <View style={styles.selectedAvatarContainer}>
          <Text style={styles.selectedAvatar}>{selectedAvatar}</Text>
        </View>

        {/* Avatar Grid */}
        <View style={styles.avatarGrid}>
          {AVATAR_OPTIONS.map((avatar) => (
            <TouchableOpacity
              key={avatar}
              style={[
                styles.avatarOption,
                selectedAvatar === avatar && styles.avatarOptionSelected,
              ]}
              onPress={() => setSelectedAvatar(avatar)}
            >
              <Text style={styles.avatarEmoji}>{avatar}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Name Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Davud Bagher"
            placeholderTextColor={Colors.lightGrey}
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              setError("");
            }}
            autoCapitalize="words"
            maxLength={50}
          />
        </View>

        {/* Error Message */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Complete Button */}
        <TouchableOpacity
          style={[
            styles.button,
            (fullName.trim().length < 2 || isLoading) && styles.buttonDisabled,
          ]}
          onPress={handleComplete}
          disabled={fullName.trim().length < 2 || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.black} />
          ) : (
            <Text style={styles.buttonText}>Start Walking! 🚀</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkGrey,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.lightGrey,
    textAlign: "center",
  },
  selectedAvatarContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  selectedAvatar: {
    fontSize: 80,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginBottom: 32,
  },
  avatarOption: {
    width: 56,
    height: 56,
    backgroundColor: Colors.black,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.black,
  },
  avatarOptionSelected: {
    borderColor: Colors.neonLime,
    backgroundColor: Colors.neonLime + "20",
  },
  avatarEmoji: {
    fontSize: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.white,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.black,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    fontSize: 16,
    color: Colors.white,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 14,
    color: Colors.warning,
    textAlign: "center",
    marginBottom: 16,
  },
  button: {
    backgroundColor: Colors.neonLime,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: Colors.cardGrey,
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.black,
  },
});
