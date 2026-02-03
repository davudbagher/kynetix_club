import { auth, db } from "@/config/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pedometer } from "expo-sensors";
import { doc, getDoc, Timestamp, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

export function usePedometer() {
  const [isPedometerAvailable, setIsPedometerAvailable] = useState(false);
  const [todaySteps, setTodaySteps] = useState(0);
  const [currentStepCount, setCurrentStepCount] = useState(0);

  useEffect(() => {
    // Check if we're on web - pedometer doesn't work on web
    if (Platform.OS === "web") {
      console.log("📱 Pedometer not available on web - using mock data");
      setIsPedometerAvailable(false);
      // Use mock data for web testing
      setTodaySteps(8247); // Fake steps for testing in browser
      return;
    }

    // Check if pedometer is available on this device
    const checkAvailability = async () => {
      try {
        const available = await Pedometer.isAvailableAsync();
        setIsPedometerAvailable(available);

        if (available) {
          // Get steps from midnight until now (today's total)
          const end = new Date();
          const start = new Date();
          start.setHours(0, 0, 0, 0); // Midnight

          try {
            const pastStepCountResult = await Pedometer.getStepCountAsync(
              start,
              end,
            );
            if (pastStepCountResult) {
              setTodaySteps(pastStepCountResult.steps);
            }
          } catch (error) {
            console.log("Error getting past steps:", error);
            setTodaySteps(0);
          }
        } else {
          console.log("📱 Pedometer not available on this device");
          setTodaySteps(0);
        }
      } catch (error) {
        console.log("Error checking pedometer availability:", error);
        setIsPedometerAvailable(false);
        setTodaySteps(0);
      }
    };

    checkAvailability();

    // Subscribe to real-time step updates (only on native devices)
    let subscription: any;

    const subscribeToPedometer = async () => {
      try {
        subscription = Pedometer.watchStepCount((result) => {
          setCurrentStepCount(result.steps);
        });
      } catch (error) {
        console.log("Error subscribing to pedometer:", error);
      }
    };

    subscribeToPedometer();

    // Cleanup when component unmounts
    return () => {
      if (subscription && subscription.remove) {
        subscription.remove();
      }
    };
  }, []);

  // 🔥 Auto-save steps to Firestore every 30 minutes (TRACKS ALL THREE NUMBERS!)
  useEffect(() => {
    const saveStepsToFirestore = async () => {
      try {
        // Get current user ID
        const savedUserId = await AsyncStorage.getItem("kynetix_user_id");
        const userId = savedUserId || auth.currentUser?.uid;
        if (!userId) {
          console.log("⚠️ No user logged in, skipping step save");
          return;
        }

        // Get current date and month
        const today = new Date().toISOString().split("T")[0]; // "2026-02-03"
        const currentLeague = new Date().toLocaleString("en-US", {
          month: "long",
          year: "numeric",
        }); // "February 2026"

        // Get total steps from device sensor
        const deviceStepsToday = todaySteps + currentStepCount;

        // Get user's current data from Firestore
        const userDoc = await getDoc(doc(db, "users", userId));
        const userData = userDoc.data();

        if (!userData) {
          console.log("⚠️ User data not found");
          return;
        }

        // CHECK 1: Is it a new DAY? (midnight passed - reset daily steps)
        const isNewDay = userData.dateKey !== today;

        // CHECK 2: Is it a new MONTH? (new league started)
        const isNewMonth = userData.currentLeague !== currentLeague;

        if (isNewMonth) {
          // 🎉 NEW MONTH - New league starts!
          console.log(`🎉 NEW LEAGUE! Welcome to ${currentLeague}!`);

          const lastMonthSteps = userData.stepsThisLeague || 0;
          const newBestMonth = Math.max(
            lastMonthSteps,
            userData.bestMonthSteps || 0,
          );

          await updateDoc(doc(db, "users", userId), {
            // Daily (reset for new day)
            stepsToday: deviceStepsToday,
            dateKey: today,

            // Monthly (reset for new league)
            stepsThisLeague: deviceStepsToday,
            currentLeague: currentLeague,
            bestMonthSteps: newBestMonth,

            // All-time (keep growing!)
            totalStepsAllTime:
              (userData.totalStepsAllTime || 0) + deviceStepsToday,

            lastStepUpdate: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });

          console.log(
            `✅ New league started! Steps reset, all-time = ${(userData.totalStepsAllTime || 0) + deviceStepsToday}`,
          );
        } else if (isNewDay) {
          // 🌅 NEW DAY - Daily reset, but same month
          console.log(`🌅 New day! ${today}`);

          const yesterdaySteps = userData.stepsToday || 0;

          await updateDoc(doc(db, "users", userId), {
            // Daily (reset for new day)
            stepsToday: deviceStepsToday,
            dateKey: today,

            // Monthly (add yesterday's steps)
            stepsThisLeague: (userData.stepsThisLeague || 0) + yesterdaySteps,

            // All-time (add yesterday's steps)
            totalStepsAllTime:
              (userData.totalStepsAllTime || 0) + yesterdaySteps,

            lastStepUpdate: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });

          console.log(
            `✅ New day! Yesterday: ${yesterdaySteps} steps. Month total: ${(userData.stepsThisLeague || 0) + yesterdaySteps}`,
          );
        } else {
          // ⏰ SAME DAY - Just update today's steps
          await updateDoc(doc(db, "users", userId), {
            stepsToday: deviceStepsToday, // Update today's count
            lastStepUpdate: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });

          console.log(`✅ Updated: ${deviceStepsToday} steps today`);
        }

        // 📊 UPDATE DAILY HISTORY (for weekly calendar!)
        // Get existing history or initialize empty array
        const stepHistory = userData?.stepHistory || [];

        // Check if today's entry exists
        const todayIndex = stepHistory.findIndex(
          (entry: any) => entry.date === today,
        );

        if (todayIndex >= 0) {
          // Update today's steps
          stepHistory[todayIndex] = {
            date: today,
            steps: deviceStepsToday,
            goalReached: deviceStepsToday >= 10000,
          };
        } else {
          // Add new entry for today
          stepHistory.push({
            date: today,
            steps: deviceStepsToday,
            goalReached: deviceStepsToday >= 10000,
          });
        }

        // Keep only last 30 days (for performance & cost optimization)
        const sortedHistory = stepHistory
          .sort((a: any, b: any) => b.date.localeCompare(a.date))
          .slice(0, 30);

        // Save updated history
        await updateDoc(doc(db, "users", userId), {
          stepHistory: sortedHistory,
        });

        console.log(
          `📊 Updated step history: ${today} → ${deviceStepsToday} steps (Goal: ${deviceStepsToday >= 10000 ? "✅" : "❌"})`,
        );
      } catch (error) {
        console.error("❌ Error saving steps to Firestore:", error);
      }
    };

    // Save immediately on mount (when app opens)
    saveStepsToFirestore();

    // Then save every 30 minutes
    const interval = setInterval(saveStepsToFirestore, 1800000); // 30 minutes

    // Cleanup interval when component unmounts
    return () => clearInterval(interval);
  }, [todaySteps, currentStepCount]);

  return {
    isPedometerAvailable,
    todaySteps: todaySteps + currentStepCount, // Combine past + current
    isLoading: false,
  };
}
