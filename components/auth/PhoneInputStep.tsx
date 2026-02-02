import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface PhoneInputStepProps {
  onPhoneSubmit: (phoneNumber: string) => void;
}

export default function PhoneInputStep({ onPhoneSubmit }: PhoneInputStepProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const formatPhoneNumber = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, "");

    // Format: XX XXX XX XX (Azerbaijan mobile format)
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 5)
      return `${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
    if (cleaned.length <= 7)
      return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)}`;
  };

  const handlePhoneChange = (text: string) => {
    // Only allow digits and spaces
    const cleaned = text.replace(/[^\d\s]/g, "");
    const formatted = formatPhoneNumber(cleaned);
    setPhoneNumber(formatted);
    setError(""); // Clear error when user types
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Azerbaijan mobile numbers: 9 digits after country code
    // Format: +994 XX XXX XX XX
    const cleaned = phone.replace(/\D/g, "");

    if (cleaned.length !== 9) {
      setError("Phone number must be 9 digits");
      return false;
    }

    // Azerbaijan mobile prefixes (all 3 carriers)
    // Azercell: 10, 50, 51, 54
    // Bakcell: 55, 59, 99
    // Nar (Azerfon): 70, 77
    const prefix = cleaned.slice(0, 2);
    const validPrefixes = [
      "10",
      "50",
      "51",
      "54",
      "55",
      "59",
      "70",
      "77",
      "99",
    ];

    if (!validPrefixes.includes(prefix)) {
      setError("Please enter a valid number");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validatePhoneNumber(phoneNumber)) return;

    setIsLoading(true);
    setError("");

    try {
      // Format to E.164: +994XXXXXXXXX
      const cleaned = phoneNumber.replace(/\D/g, "");
      const e164Phone = `+994${cleaned}`;

      // TODO: Send OTP via Firebase Phone Auth
      // For now, just simulate delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      onPhoneSubmit(e164Phone);
    } catch (err: any) {
      setError(err.message || "Failed to send code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isValidLength = phoneNumber.replace(/\D/g, "").length === 9;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>🏆</Text>
          <Text style={styles.title}>Kynetix Club</Text>
          <Text style={styles.subtitle}>
            Enter your phone number to get started
          </Text>
        </View>

        {/* Phone Input */}
        <View style={styles.inputContainer}>
          <View style={styles.countryCode}>
            <Text style={styles.countryCodeText}>🇦🇿 +994</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="XX XXX XX XX"
            placeholderTextColor={Colors.lightGrey}
            value={phoneNumber}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
            maxLength={14} // XX XXX XX XX with spaces
            autoFocus
          />
        </View>

        {/* Error Message */}
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color={Colors.warning} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Send Code Button */}
        <TouchableOpacity
          style={[
            styles.button,
            (!isValidLength || isLoading) && styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!isValidLength || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.black} />
          ) : (
            <Text style={styles.buttonText}>Send Code</Text>
          )}
        </TouchableOpacity>

        {/* Privacy Text */}
        <Text style={styles.privacyText}>
          By continuing, you agree to our{" "}
          <Text style={styles.privacyLink}>Terms of Service</Text> and{" "}
          <Text style={styles.privacyLink}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkGrey,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.lightGrey,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  countryCode: {
    backgroundColor: Colors.black,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: "center",
  },
  countryCodeText: {
    fontSize: 16,
    color: Colors.white,
    fontWeight: "600",
  },
  input: {
    flex: 1,
    backgroundColor: Colors.black,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    fontSize: 16,
    color: Colors.white,
    fontWeight: "600",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: Colors.warning,
  },
  button: {
    backgroundColor: Colors.neonLime,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
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
  privacyText: {
    fontSize: 12,
    color: Colors.lightGrey,
    textAlign: "center",
    lineHeight: 18,
  },
  privacyLink: {
    color: Colors.neonLime,
    fontWeight: "600",
  },
});
