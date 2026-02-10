# Firestore Setup Guide

## Quick Start: Add Test Data to Firestore

### Method 1: Using the Seeding Script (Recommended)

1. **Install ts-node** (if not already installed):
   ```bash
   npm install -D ts-node
   ```

2. **Update Firebase config** in `scripts/seedFirestore.ts`:
   - Copy your config from `config/firebase.ts`
   - Replace the placeholder values

3. **Run the script**:
   ```bash
   npx ts-node scripts/seedFirestore.ts
   ```

4. **Set your userId** in the app:
   - Open React Native Debugger or use:
   ```typescript
   import AsyncStorage from '@react-native-async-storage/async-storage';
   AsyncStorage.setItem('userId', 'user_davud');
   ```

5. **Restart the app** and pull to refresh!

---

### Method 2: Manual Entry via Firebase Console

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project** → **Firestore Database**
3. **Click "Start collection"**

#### Add Challenges Collection

```
Collection: challenges
Document ID: Auto-ID

Fields:
  title: "February 100km Challenge"
  description: "Walk or run 100km this month! Complete daily steps to reach your goal."
  icon: "🏃"
  type: "distance"
  goal: 100000
  goalUnit: "steps"
  startDate: February 1, 2026 (timestamp)
  endDate: February 28, 2026 (timestamp)
  isSponsored: false
  participantCount: 187
  rewardPoints: 500
  rewardBadge: "🏆"
  status: "active"
```

#### Add Users Collection

```
Collection: users
Document ID: user_davud

Fields:
  fullName: "Davud Baghir"
  phone: "+994501234567"
  bio: "Fitness enthusiast from Baku 🇦�"
  totalSteps: 125000
  currentStreak: 12
  longestStreak: 21
  challengesCompleted: 3
  challengesActive: 2
  friendCount: 24
  unlockedBadges: ["distance_10k", "streak_7"]
  isEarlyAdoptor: true
  joinedDate: January 15, 2026 (timestamp)
  lastActive: now (timestamp)
```

#### Add Activities Collection

```
Collection: activities
Document ID: Auto-ID

Fields:
  userId: "user_davud"
  userName: "Davud Baghir"
  activityType: "goal_reached"
  title: "Daily goal reached! 🎯"
  points: 100
  celebrationCount: 8
  createdAt: now (timestamp)
```

---

### Method 3: Using Firebase Admin SDK (Backend)

If you want to seed from a backend:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seed() {
  // Add challenge
  await db.collection('challenges').add({
    title: "February 100km Challenge",
    // ... rest of fields
  });
}

seed();
```

---

## Verify Data in App

1. **Check console logs**:
   - Look for: "✅ Fetched X challenges"
   - Look for: "✅ Fetched X activities"

2. **Pull to refresh** on Activity Tab

3. **If still showing empty**:
   - Check userId in AsyncStorage matches Firestore user doc ID
   - Check Firebase security rules allow reads
   - Check network tab for Firestore errors

---

## Firebase Security Rules

Add these rules to allow testing:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access for testing
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

⚠️ **Warning**: These rules are for testing only! Update before production.

---

## Troubleshooting

### Challenges not showing?

1. Check console: `⚠️ No Firebase challenges found, using mock data for testing`
2. Verify challenges collection exists in Firestore
3. Check that `status` field = "active"
4. Pull to refresh to clear cache

### Activities empty?

1. Make sure activities have valid `createdAt` timestamps
2. Verify userId format matches between app and Firestore

### Can't join challenges?

1. Set userId in AsyncStorage first
2. Check that user document exists in Firestore
3. Check Firebase security rules allow writes
