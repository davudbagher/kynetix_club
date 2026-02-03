import { auth, db } from "@/config/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Pedometer } from "expo-sensors";
import { StatusBar } from "expo-status-bar";
import { signInAnonymously } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// AsyncStorage keys
const STORAGE_KEYS = {
  USER_ID: "kynetix_user_id",
  PHONE_NUMBER: "kynetix_phone_number",
};

export default function AuthScreen() {
  // Navigation state
  const [step, setStep] = useState<"phone" | "otp" | "profile">("phone");

  // Phone & OTP state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Profile setup state
  const [fullName, setFullName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("🧑🏻");

  // User state
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [existingUserId, setExistingUserId] = useState<string | null>(null);

  const avatars = ["🧑🏻", "👨🏻", "👩🏻", "🧔🏻", "👱🏻‍♀️", "👨🏻‍🦱", "👩🏻‍🦱", "🧑🏻‍🦰"];

  // Check if user is already logged in on mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  // Check AsyncStorage for existing session
  const checkExistingSession = async () => {
    try {
      const savedUserId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
      const savedPhone = await AsyncStorage.getItem(STORAGE_KEYS.PHONE_NUMBER);

      if (savedUserId && savedPhone) {
        console.log(`🔐 Found saved session: ${savedUserId}`);
        console.log(`📱 Phone: ${savedPhone}`);

        // Verify this user still exists in Firestore
        const userDoc = await getDoc(doc(db, "users", savedUserId));

        if (userDoc.exists()) {
          console.log(`✅ Auto-login successful!`);
          console.log(`👤 Welcome back, ${userDoc.data().fullName}!`);

          // Sign in to Firebase Auth (for pedometer hook)
          await signInAnonymously(auth);

          // Navigate to home
          router.replace("/(tabs)");
        } else {
          console.log(
            `⚠️ Saved user not found in Firestore. Clearing session.`,
          );
          await clearSession();
        }
      } else {
        console.log(`📱 No saved session. Showing login screen.`);
      }
    } catch (error) {
      console.error("❌ Error checking session:", error);
    }
  };

  // Clear session from AsyncStorage
  const clearSession = async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_ID);
    await AsyncStorage.removeItem(STORAGE_KEYS.PHONE_NUMBER);
  };

  // Format phone number for display
  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    const match = cleaned.match(/^(\d{2})(\d{3})(\d{2})(\d{2})$/);
    if (match) {
      return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
    }
    return text;
  };

  // STEP 1: Send OTP to phone
  const handleSendOTP = async () => {
    try {
      setIsLoading(true);

      // Format phone number (+994XXXXXXXXX)
      const formattedPhone = `+994${phoneNumber.replace(/\s/g, "")}`;

      console.log(`📱 Sending OTP to: ${formattedPhone}`);

      // Check if this phone number already exists in Firestore
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("phoneNumber", "==", formattedPhone));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // EXISTING USER - Login flow
        const existingUserDoc = querySnapshot.docs[0];
        setIsExistingUser(true);
        setExistingUserId(existingUserDoc.id);
        console.log(`✅ Existing user found! ID: ${existingUserDoc.id}`);
        console.log(`👤 Name: ${existingUserDoc.data().fullName}`);
      } else {
        // NEW USER - Signup flow
        setIsExistingUser(false);
        setExistingUserId(null);
        console.log(`🎉 New user! Will show profile setup after OTP.`);
      }

      // Store the formatted phone for later
      setVerificationId(formattedPhone);

      // Move to OTP screen
      setStep("otp");
      setIsLoading(false);

      Alert.alert(
        "OTP Sent!",
        `Verification code sent to ${formattedPhone}\n\nFor testing, use: 123456`,
        [{ text: "OK" }],
      );
    } catch (error: any) {
      console.error("❌ Error sending OTP:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to send OTP. Please try again.",
      );
      setIsLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOTP = async () => {
    try {
      setIsLoading(true);

      console.log(`🔐 Verifying OTP: ${otp}`);

      // For test phone numbers, verify OTP is 123456
      if (otp !== "123456") {
        Alert.alert(
          "Invalid OTP",
          "Please enter the correct verification code.",
        );
        setIsLoading(false);
        return;
      }

      console.log(`✅ OTP verified!`);

      // Check if existing user or new user
      if (isExistingUser && existingUserId) {
        // EXISTING USER - Login
        console.log(`🔓 Logging in existing user: ${existingUserId}`);

        // Load user data from Firestore
        const userDoc = await getDoc(doc(db, "users", existingUserId));

        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log(`✅ Welcome back, ${userData.fullName}!`);
          console.log(
            `📊 Your stats: ${userData.stepsThisLeague || 0} steps this league`,
          );

          // Save session to AsyncStorage
          await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, existingUserId);
          await AsyncStorage.setItem(STORAGE_KEYS.PHONE_NUMBER, verificationId);
          console.log(`💾 Session saved to AsyncStorage`);

          // Sign in to Firebase Auth (needed for hooks)
          await signInAnonymously(auth);
          console.log(`🔐 Signed in to Firebase Auth`);

          console.log(`🚀 Navigating to home screen...`);

          // Navigate to home screen
          router.replace("/(tabs)");
        } else {
          throw new Error("User data not found");
        }
      } else {
        // NEW USER - Show profile setup
        console.log(`🎨 New user! Showing profile setup...`);
        setStep("profile");
      }

      setIsLoading(false);
    } catch (error: any) {
      console.error("❌ Error verifying OTP:", error);
      Alert.alert("Error", error.message || "Failed to verify OTP.");
      setIsLoading(false);
    }
  };

  // STEP 3: Complete profile (NEW USERS ONLY)
  const handleProfileComplete = async () => {
    try {
      if (!fullName.trim()) {
        Alert.alert("Name Required", "Please enter your full name");
        return;
      }

      setIsLoading(true);

      console.log(`👤 Creating new user profile...`);
      console.log(`Name: ${fullName}`);
      console.log(`Avatar: ${selectedAvatar}`);

      // Sign in to Firebase Auth FIRST!
      const userCredential = await signInAnonymously(auth);
      const userId = userCredential.user.uid;

      console.log(`🔐 Signed in to Firebase! UID: ${userId}`);

      const formattedPhone = verificationId;
      const today = new Date().toISOString().split("T")[0];
      const currentLeague = new Date().toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      });

      // Get device steps for initial sync
      let deviceStepsToday = 0;

      if (Platform.OS !== "web") {
        try {
          const isPedometerAvailable = await Pedometer.isAvailableAsync();

          if (isPedometerAvailable) {
            const end = new Date();
            const start = new Date();
            start.setHours(0, 0, 0, 0);

            const result = await Pedometer.getStepCountAsync(start, end);
            deviceStepsToday = result?.steps || 0;
            console.log(`📱 Device has ${deviceStepsToday} steps today`);
          }
        } catch (error) {
          console.log("⚠️ Could not read pedometer on signup:", error);
        }
      }

      // Create user document in Firestore
      await setDoc(doc(db, "users", userId), {
        // Profile
        fullName: fullName.trim(),
        avatar: selectedAvatar,
        phoneNumber: formattedPhone,
        bio: "",
        isActive: true,
        isVerified: true,

        // Step tracking
        stepsToday: deviceStepsToday,
        stepsThisLeague: deviceStepsToday,
        totalStepsAllTime: deviceStepsToday,
        dateKey: today,
        currentLeague: currentLeague,
        bestMonthSteps: 0,

        // Streaks
        currentStreakDays: 0,
        longestStreakDays: 0,
        lastActiveDate: today,

        // Points
        points: 0,
        totalPointsEarned: 0,

        // Activity stats
        totalDistanceKm: 0,
        totalWorkouts: 0,

        // Timestamps
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lastStepUpdate: Timestamp.now(),
      });

      console.log(`✅ User created successfully! ID: ${userId}`);

      if (deviceStepsToday > 0) {
        console.log(`✅ Synced ${deviceStepsToday} steps on signup!`);
      }

      // Save session to AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, userId);
      await AsyncStorage.setItem(STORAGE_KEYS.PHONE_NUMBER, formattedPhone);
      console.log(`💾 Session saved to AsyncStorage`);

      console.log(`🚀 Navigating to home screen...`);

      // Navigate to home screen
      router.replace("/(tabs)");

      setIsLoading(false);
    } catch (error: any) {
      console.error("❌ Error creating user:", error);
      Alert.alert("Error", error.message || "Failed to create account.");
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* STEP 1: Phone Number Entry */}
        {step === "phone" && (
          <View style={styles.content}>
            <Text style={styles.title}>Welcome to Kynetix</Text>
            <Text style={styles.subtitle}>
              Azerbaijan's #1 lifestyle tracking app
            </Text>

            <View style={styles.phoneInputContainer}>
              <Text style={styles.countryCode}>+994</Text>
              <TextInput
                style={styles.phoneInput}
                placeholder="51 555 1234"
                placeholderTextColor="#666"
                value={formatPhoneNumber(phoneNumber)}
                onChangeText={(text) =>
                  setPhoneNumber(text.replace(/\D/g, "").substring(0, 9))
                }
                keyboardType="phone-pad"
                maxLength={12}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                phoneNumber.length !== 9 && styles.buttonDisabled,
              ]}
              onPress={handleSendOTP}
              disabled={phoneNumber.length !== 9 || isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? "Sending..." : "Send OTP"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.hint}>
              We'll send you a verification code via SMS
            </Text>
          </View>
        )}

        {/* STEP 2: OTP Verification */}
        {step === "otp" && (
          <View style={styles.content}>
            <Text style={styles.title}>Enter Verification Code</Text>
            <Text style={styles.subtitle}>
              Sent to +994 {formatPhoneNumber(phoneNumber)}
            </Text>

            <TextInput
              style={styles.otpInput}
              placeholder="123456"
              placeholderTextColor="#666"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />

            <TouchableOpacity
              style={[styles.button, otp.length !== 6 && styles.buttonDisabled]}
              onPress={handleVerifyOTP}
              disabled={otp.length !== 6 || isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? "Verifying..." : "Verify OTP"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep("phone")}>
              <Text style={styles.link}>Change phone number</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 3: Profile Setup (NEW USERS ONLY) */}
        {step === "profile" && (
          <View style={styles.content}>
            <Text style={styles.title}>Create Your Profile</Text>
            <Text style={styles.subtitle}>Choose your avatar and name</Text>

            {/* Avatar Selection */}
            <View style={styles.avatarGrid}>
              {avatars.map((avatar) => (
                <TouchableOpacity
                  key={avatar}
                  style={[
                    styles.avatarOption,
                    selectedAvatar === avatar && styles.avatarSelected,
                  ]}
                  onPress={() => setSelectedAvatar(avatar)}
                >
                  <Text style={styles.avatarEmoji}>{avatar}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Name Input */}
            <TextInput
              style={styles.nameInput}
              placeholder="Full Name"
              placeholderTextColor="#666"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              autoFocus
            />

            <TouchableOpacity
              style={[styles.button, !fullName.trim() && styles.buttonDisabled]}
              onPress={handleProfileComplete}
              disabled={!fullName.trim() || isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? "Creating..." : "Get Started! 🚀"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  content: {
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#999",
    marginBottom: 40,
    textAlign: "center",
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    width: "100%",
  },
  countryCode: {
    fontSize: 18,
    color: "#fff",
    marginRight: 8,
    fontWeight: "600",
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    color: "#fff",
    paddingVertical: 16,
  },
  otpInput: {
    fontSize: 32,
    color: "#fff",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 20,
    textAlign: "center",
    letterSpacing: 8,
    width: "100%",
  },
  button: {
    backgroundColor: "#C6FF00",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: "#333",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  hint: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  link: {
    fontSize: 16,
    color: "#C6FF00",
    marginTop: 8,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginBottom: 24,
  },
  avatarOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  avatarSelected: {
    borderColor: "#C6FF00",
    backgroundColor: "#2a2a2a",
  },
  avatarEmoji: {
    fontSize: 32,
  },
  nameInput: {
    fontSize: 18,
    color: "#fff",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 20,
    width: "100%",
  },
});
