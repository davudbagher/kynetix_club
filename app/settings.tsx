import { auth, db } from "@/config/firebase";
import Colors from "@/constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface UserData {
  fullName: string;
  avatar: string;
  phoneNumber: string;
}

export default function SettingsScreen() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userId = await AsyncStorage.getItem("kynetix_user_id");
        if (!userId) return;

        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading settings:", error);
        setIsLoading(false);
      }
    };
    loadUserData();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("kynetix_user_id");
            await AsyncStorage.removeItem("kynetix_phone_number");
            await signOut(auth);
            router.replace("/auth");
          } catch (error) {
            Alert.alert("Error", "Failed to logout");
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.neonLime} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
          <View style={styles.backButton} />
        </View>

        {/* User Info Card */}
        {userData && (
          <View style={styles.card}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatar}>{userData.avatar}</Text>
            </View>
            <Text style={styles.name}>{userData.fullName}</Text>
            <Text style={styles.phone}>{userData.phoneNumber}</Text>
          </View>
        )}

        {/* Settings Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity</Text>
          <View style={styles.settingCard}>
            <View>
              <Text style={styles.settingLabel}>Daily Step Goal</Text>
              <Text style={styles.settingValue}>10,000 steps</Text>
            </View>
            <Text style={styles.comingSoon}>Fixed for MVP</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <TouchableOpacity style={styles.settingCard} disabled>
            <View>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Text style={styles.settingSubtext}>Reminders & updates</Text>
            </View>
            <Text style={styles.comingSoon}>Coming soon</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingCard} disabled>
            <View>
              <Text style={styles.settingLabel}>Language</Text>
              <Text style={styles.settingSubtext}>English</Text>
            </View>
            <Text style={styles.comingSoon}>Coming soon</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

          <TouchableOpacity style={styles.settingCard} disabled>
            <Text style={styles.settingLabel}>Help Center</Text>
            <Text style={styles.comingSoon}>Coming soon</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingCard} disabled>
            <Text style={styles.settingLabel}>Contact Us</Text>
            <Text style={styles.comingSoon}>Coming soon</Text>
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.footer}>
          <Text style={styles.version}>Kynetix Club</Text>
          <Text style={styles.versionNumber}>Version 1.0.0 (MVP)</Text>
          <Text style={styles.copyright}>© 2026 Built in Baku 🇦🇿</Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkGrey,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  backText: {
    fontSize: 28,
    color: Colors.white,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.white,
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: Colors.black,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 32,
    borderWidth: 1,
    borderColor: Colors.cardGrey,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.cardGrey,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.neonLime,
  },
  avatar: {
    fontSize: 40,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.white,
    marginBottom: 4,
  },
  phone: {
    fontSize: 14,
    color: Colors.lightGrey,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  settingCard: {
    backgroundColor: Colors.black,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.cardGrey,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
    marginBottom: 2,
  },
  settingValue: {
    fontSize: 14,
    color: Colors.neonLime,
    fontWeight: "600",
  },
  settingSubtext: {
    fontSize: 13,
    color: Colors.lightGrey,
  },
  comingSoon: {
    fontSize: 11,
    color: Colors.lightGrey,
    fontStyle: "italic",
  },
  logoutButton: {
    backgroundColor: "#ff3b30",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.white,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  version: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
    marginBottom: 4,
  },
  versionNumber: {
    fontSize: 13,
    color: Colors.lightGrey,
    marginBottom: 8,
  },
  copyright: {
    fontSize: 11,
    color: Colors.lightGrey,
  },
});
