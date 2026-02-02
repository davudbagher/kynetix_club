import { Pedometer } from "expo-sensors";
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

  return {
    isPedometerAvailable,
    todaySteps: todaySteps + currentStepCount, // Combine past + current
    isLoading: false,
  };
}
