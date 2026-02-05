import { db } from "@/config/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pedometer } from "expo-sensors";
import { doc, getDoc, Timestamp, updateDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

const DAILY_GOAL = 10000;
const SAVE_INTERVAL = 1800000; // 30 minutes (more aggressive cost optimization)
const STEP_THRESHOLD = 500; // Only save meaningful activity bursts

export function usePedometer() {
  const [todaySteps, setTodaySteps] = useState(0);
  const [isPedometerAvailable, setIsPedometerAvailable] = useState(false);
  const lastSavedSteps = useRef(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper: Check if it's sleep hours (11 PM - 6 AM)
  const isSleepHours = () => {
    const hour = new Date().getHours();
    return hour >= 23 || hour < 6;
  };

  // Optimized save function with aggressive debouncing
  const saveToFirebase = async (force = false) => {
    try {
      const userId = await AsyncStorage.getItem("kynetix_user_id");
      if (!userId || todaySteps === 0) return;

      // Skip during sleep hours (unless forced)
      if (!force && isSleepHours()) {
        console.log("😴 Skipping save during sleep hours");
        return;
      }

      // Skip if steps haven't changed significantly (unless forced)
      const stepDifference = Math.abs(todaySteps - lastSavedSteps.current);
      if (!force && stepDifference < STEP_THRESHOLD) {
        console.log(
          `📊 Skipping save - only ${stepDifference} steps changed (threshold: ${STEP_THRESHOLD})`,
        );
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


      // Calculate current month league period
      const currentLeague = today.toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      });

      // Determine if we need to reset league steps (new month)
      const existingLeague = userData?.currentLeague || "";
      const isNewLeague = existingLeague !== currentLeague;

      // If new league period, reset stepsThisLeague
      const stepsThisLeague = isNewLeague ? todaySteps : (userData?.stepsThisLeague || 0);

      // For same league, accumulate steps (but prevent duplicates from same day)
      const existingDateKey = userData?.dateKey || "";
      const existingStepsToday = userData?.stepsToday || 0;

      let updatedStepsThisLeague = stepsThisLeague;
      if (!isNewLeague && existingDateKey === todayString) {
        // Same day - update today's contribution
        updatedStepsThisLeague = stepsThisLeague - existingStepsToday + todaySteps;
      } else if (!isNewLeague && existingDateKey !== todayString) {
        // New day in same league - add today's steps
        updatedStepsThisLeague = stepsThisLeague + todaySteps;
      }

      console.log(`📊 League: ${currentLeague}, New League: ${isNewLeague}`);
      console.log(`📊 Steps this league: ${updatedStepsThisLeague} (today: ${todaySteps})`);

      // Save to Firebase - UPDATE ALL FIELDS!
      await updateDoc(doc(db, "users", userId), {
        // Step tracking fields
        stepsToday: todaySteps,
        stepsThisLeague: updatedStepsThisLeague,
        totalStepsAllTime: totalStepsAllTime,
        stepHistory: sortedHistory,

        // Date tracking
        dateKey: todayString,
        currentLeague: currentLeague,

        // Timestamp
        lastStepUpdate: Timestamp.now(),
      });

      lastSavedSteps.current = todaySteps;
      console.log(
        `✅ Saved: ${todaySteps} steps today, ${updatedStepsThisLeague} this league, ${totalStepsAllTime} total all-time`,
      );
    } catch (error) {
      console.error("❌ Save error:", error);
    }
  };

  // Save every 30 minutes (aggressive cost reduction)
  useEffect(() => {
    const interval = setInterval(() => {
      if (todaySteps > 0) {
        console.log("💾 Auto-save (30min interval)...");
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
