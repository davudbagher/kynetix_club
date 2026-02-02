import { auth, db } from "@/config/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import OnboardingSlides from "@/components/auth/OnboardingSlides";
import PhoneInputStep from "@/components/auth/PhoneInputStep";
import ProfileSetupStep from "@/components/auth/ProfileSetupStep";
import VerifyOTPStep from "@/components/auth/VerifyOTPStep";
import Colors from "@/constants/Colors";

type AuthStep = "onboarding" | "phone" | "verify" | "profile";

const ONBOARDING_KEY = "@kynetix_onboarding_completed";

export default function AuthScreen() {
  const [currentStep, setCurrentStep] = useState<AuthStep>("onboarding");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Check if user has seen onboarding before
  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (completed === "true") {
        setCurrentStep("phone"); // Skip onboarding if seen before
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark onboarding as completed
  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
      setCurrentStep("phone");
    } catch (error) {
      console.error("Error saving onboarding status:", error);
    }
  };

  // Skip onboarding (also marks as completed)
  const handleSkipOnboarding = async () => {
    await handleOnboardingComplete();
  };

  // Phone number submitted, move to OTP
  const handlePhoneSubmit = (phone: string) => {
    setPhoneNumber(phone);
    // TODO: Send OTP via Firebase Phone Auth here
    setCurrentStep("verify");
  };

  // OTP verified successfully, move to profile setup
  const handleVerifySuccess = () => {
    setCurrentStep("profile");
  };

  // Go back to phone input from OTP screen
  const handleBackToPhone = () => {
    setCurrentStep("phone");
  };

  // Profile setup completed, create user in Firestore
  const handleProfileComplete = async (userData: {
    fullName: string;
    avatar: string;
  }) => {
    try {
      // TEMPORARY: Create anonymous auth user for MVP testing
      const { signInAnonymously } = await import("firebase/auth");
      const authResult = await signInAnonymously(auth);
      const userId = authResult.user.uid;

      console.log("✅ Created temporary auth user:", userId);

      // Get today's date and current league month
      const today = new Date().toISOString().split("T")[0]; // "2026-02-02"
      const currentLeague = new Date().toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      }); // "February 2026"

      // Save user to Firestore
      await setDoc(doc(db, "users", userId), {
        // Profile data
        phoneNumber: phoneNumber,
        fullName: userData.fullName,
        avatar: userData.avatar,

        // Daily tracking (for home screen circle!)
        stepsToday: 0, // TODAY's steps (resets midnight)
        dateKey: today, // "2026-02-02"

        // Monthly League Competition (for leaderboard!)
        stepsThisLeague: 0, // This MONTH's steps (resets monthly)
        currentLeague: currentLeague, // "February 2026"
        leagueTier: "bronze", // Bronze/Silver/Gold/Platinum/Champion

        // All-Time Stats (never resets - your legacy!)
        totalStepsAllTime: 0, // Every step ever
        leaguesWon: 0, // How many times you won
        bestMonthSteps: 0, // Personal record

        // Metadata
        lastStepUpdate: Timestamp.now(),
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        memberSince: Timestamp.now(),
      });

      console.log("✅ User saved to Firestore");

      // Navigate to main app (tabs)
      router.replace("/(tabs)");
    } catch (error) {
      console.error("❌ Error creating user profile:", error);
      alert("Failed to create profile. Please try again.");
    }
  };

  if (isLoading) {
    // Show blank screen while checking onboarding status
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      {currentStep === "onboarding" && (
        <OnboardingSlides
          onComplete={handleOnboardingComplete}
          onSkip={handleSkipOnboarding}
        />
      )}

      {currentStep === "phone" && (
        <PhoneInputStep onPhoneSubmit={handlePhoneSubmit} />
      )}

      {currentStep === "verify" && (
        <VerifyOTPStep
          phoneNumber={phoneNumber}
          onVerifySuccess={handleVerifySuccess}
          onBack={handleBackToPhone}
        />
      )}

      {currentStep === "profile" && (
        <ProfileSetupStep onComplete={handleProfileComplete} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkGrey,
  },
});
