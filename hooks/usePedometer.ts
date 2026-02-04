import { db } from "@/config/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pedometer } from "expo-sensors";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

const DAILY_GOAL = 10000;
const SAVE_INTERVAL = 480000; // 8 minutes (75% reduction: 2min → 8min)

export function usePedometer() {
  const [todaySteps, setTodaySteps] = useState(0);
  const [isPedometerAvailable, setIsPedometerAvailable] = useState(false);
  const lastSavedSteps = useRef(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Optimized save function with debouncing
  const saveToFirebase = async (force = false) => {
    try {
      const userId = await AsyncStorage.getItem("kynetix_user_id");
      if (!userId || todaySteps === 0) return;

      // Skip if steps haven't changed significantly (unless forced)
      const stepDifference = Math.abs(todaySteps - lastSavedSteps.current);
      if (!force && stepDifference < 50) {
        console.log("📊 Skipping save - minimal change");
        return;
      }

      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const todayString = `${year}-${month}-${day}`;

      // Get current data
      const userDoc = await getDoc(doc(db, "users", userId));
      const userData = userDoc.data();
      const currentHistory = userData?.stepHistory || [];

      console.log("📊 Current history from Firebase:", currentHistory);

      // Make sure it's an array (safety check)
      const historyArray = Array.isArray(currentHistory) ? currentHistory : [];

      // Remove today if it exists
      const withoutToday = historyArray.filter(
        (entry: any) => entry?.date !== todayString,
      );

      console.log(`📊 History without today (${todayString}):`, withoutToday);

      // Add today
      const newHistory = [
        ...withoutToday,
        {
          date: todayString,
          steps: todaySteps,
          goalReached: todaySteps >= DAILY_GOAL,
        },
      ];

      // Keep last 30 days only (sort by date descending and take first 30)
      const sortedHistory = newHistory
        .sort((a: any, b: any) => {
          const dateA = a?.date || "";
          const dateB = b?.date || "";
          return dateB.localeCompare(dateA); // Newest first
        })
        .slice(0, 30);

      console.log(
        `📊 Final history (${sortedHistory.length} days):`,
        sortedHistory,
      );

      // Calculate totalStepsAllTime by summing ALL days in history
      const calculatedTotal = sortedHistory.reduce(
        (sum: number, entry: any) => sum + (entry?.steps || 0),
        0,
      );

      // Get existing total from Firebase
      const existingTotal = userData?.totalStepsAllTime || 0;

      // IMPORTANT: Never decrease totalStepsAllTime (protects against data loss)
      // Only update if the new calculated total is higher
      const totalStepsAllTime = Math.max(calculatedTotal, existingTotal);

      if (calculatedTotal < existingTotal) {
        console.warn(
          `⚠️ Calculated total (${calculatedTotal}) is less than existing (${existingTotal}). Keeping existing to prevent data loss.`,
        );
      }

      // Save to Firebase
      await updateDoc(doc(db, "users", userId), {
        totalStepsAllTime: totalStepsAllTime,
        stepHistory: sortedHistory,
      });

      lastSavedSteps.current = todaySteps;
      console.log(
        `✅ Saved: ${todaySteps} steps today, ${totalStepsAllTime} total all-time`,
      );
    } catch (error) {
      console.error("❌ Save error:", error);
    }
  };

  // Save every 8 minutes (75% cost reduction)
  useEffect(() => {
    const interval = setInterval(() => {
      if (todaySteps > 0) {
        console.log("💾 Auto-save (8min interval)...");
        saveToFirebase();
      }
    }, SAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [todaySteps]);

  // Save when app goes to background (critical for data persistence)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "background" || nextAppState === "inactive") {
        console.log("💾 App backgrounded - saving now...");
        saveToFirebase(true); // Force save
      }
    });

    return () => {
      subscription.remove();
    };
  }, [todaySteps]);

  // Setup pedometer
  useEffect(() => {
    let subscription: any;

    const setupPedometer = async () => {
      const isAvailable = await Pedometer.isAvailableAsync();
      setIsPedometerAvailable(isAvailable);

      if (isAvailable) {
        console.log("📱 Pedometer available!");

        // Get steps from midnight
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();

        try {
          const pastSteps = await Pedometer.getStepCountAsync(start, end);
          if (pastSteps) {
            setTodaySteps(pastSteps.steps);
            console.log(`📊 Steps today: ${pastSteps.steps}`);
          }

          // Watch for changes
          subscription = Pedometer.watchStepCount((result) => {
            const total = (pastSteps?.steps || 0) + result.steps;
            setTodaySteps(total);
          });
        } catch (error) {
          console.error("❌ Pedometer error:", error);
        }
      }
    };

    setupPedometer();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  return {
    todaySteps,
    isPedometerAvailable,
    saveStepsNow: () => saveToFirebase(),
  };
}
