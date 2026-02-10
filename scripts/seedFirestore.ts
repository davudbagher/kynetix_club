// scripts/seedFirestore.ts
/**
 * Script to seed Firestore with test data
 * Run with: npx ts-node scripts/seedFirestore.ts
 */

import { initializeApp } from 'firebase/app';
import { addDoc, collection, doc, getFirestore, setDoc, Timestamp } from 'firebase/firestore';

// Your Firebase config (copy from config/firebase.ts)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedFirestore() {
    console.log('🌱 Starting Firestore seeding...\n');

    try {
        // 1. Add Challenges
        console.log('📊 Adding challenges...');

        const challenge1Ref = await addDoc(collection(db, 'challenges'), {
            title: "February 100km Challenge",
            description: "Walk or run 100km this month! Complete daily steps to reach your goal and win exclusive rewards. Track your progress and compete with friends!",
            icon: "🏃",
            type: "distance",
            goal: 100000,
            goalUnit: "steps",
            startDate: Timestamp.fromDate(new Date('2026-02-01')),
            endDate: Timestamp.fromDate(new Date('2026-02-28')),
            isSponsored: false,
            participantCount: 187,
            rewardPoints: 500,
            rewardBadge: "🏆",
            status: "active",
        });
        console.log('✅ Added: February 100km Challenge');

        const challenge2Ref = await addDoc(collection(db, 'challenges'), {
            title: "7-Day Streak Challenge",
            description: "Hit your daily step goal for 7 consecutive days. Build consistency and earn bonus points! Perfect for establishing a healthy routine.",
            icon: "🔥",
            type: "streak",
            goal: 7,
            goalUnit: "days",
            startDate: Timestamp.fromDate(new Date('2026-02-01')),
            endDate: Timestamp.fromDate(new Date('2026-02-28')),
            isSponsored: false,
            participantCount: 342,
            rewardPoints: 250,
            rewardBadge: "⚡",
            status: "active",
        });
        console.log('✅ Added: 7-Day Streak Challenge');

        const challenge3Ref = await addDoc(collection(db, 'challenges'), {
            title: "Nike Run Club Challenge",
            description: "Partner challenge with Nike! Run 50km this month and unlock exclusive Nike discounts and rewards. Track your runs with Nike Run Club app.",
            icon: "👟",
            type: "distance",
            goal: 50000,
            goalUnit: "steps",
            startDate: Timestamp.fromDate(new Date('2026-02-01')),
            endDate: Timestamp.fromDate(new Date('2026-02-28')),
            isSponsored: true,
            sponsorName: "Nike Run Club",
            sponsorLogo: "🏃‍♂️",
            participantCount: 523,
            rewardPoints: 1000,
            rewardBadge: "👟",
            status: "active",
        });
        console.log('✅ Added: Nike Run Club Challenge (Sponsored)\n');

        // 2. Add Users
        console.log('👥 Adding users...');

        await setDoc(doc(db, 'users', 'user_davud'), {
            fullName: "Davud Baghir",
            phone: "+994501234567",
            bio: "Fitness enthusiast from Baku 🇦� | Running addict | CrossFit lover",
            totalSteps: 125000,
            currentStreak: 12,
            longestStreak: 21,
            challengesCompleted: 3,
            challengesActive: 2,
            friendCount: 24,
            unlockedBadges: ["distance_10k", "distance_50k", "streak_7", "challenges_1"],
            isEarlyAdopter: true,
            joinedDate: Timestamp.fromDate(new Date('2026-01-15')),
            lastActive: Timestamp.now(),
        });
        console.log('✅ Added: Davud Baghir');

        await setDoc(doc(db, 'users', 'user_sara'), {
            fullName: "Sara Aliyeva",
            phone: "+994551234567",
            bio: "CrossFit athlete | Marathon runner 🏃‍♀️",
            totalSteps: 180000,
            currentStreak: 23,
            longestStreak: 45,
            challengesCompleted: 7,
            challengesActive: 3,
            friendCount: 52,
            unlockedBadges: ["distance_10k", "distance_50k", "distance_100k", "streak_7", "streak_30", "challenges_5", "social_10", "social_50"],
            isEarlyAdopter: false,
            joinedDate: Timestamp.fromDate(new Date('2026-01-20')),
            lastActive: Timestamp.now(),
        });
        console.log('✅ Added: Sara Aliyeva');

        await setDoc(doc(db, 'users', 'user_ali'), {
            fullName: "Ali Mammadov",
            phone: "+994701234567",
            totalSteps: 95000,
            currentStreak: 7,
            longestStreak: 14,
            challengesCompleted: 2,
            challengesActive: 1,
            friendCount: 18,
            unlockedBadges: ["distance_10k", "streak_7", "challenges_1"],
            isEarlyAdopter: false,
            joinedDate: Timestamp.fromDate(new Date('2026-01-25')),
            lastActive: Timestamp.now(),
        });
        console.log('✅ Added: Ali Mammadov\n');

        // 3. Add Activities
        console.log('📱 Adding activities...');

        await addDoc(collection(db, 'activities'), {
            userId: 'user_sara',
            userName: 'Sara Aliyeva',
            activityType: 'workout_completed',
            title: 'Completed 12,000 steps at morning workout 🏃‍♀️',
            points: 120,
            celebrationCount: 15,
            locationName: 'Baku Boulevard',
            createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)), // 2 hours ago
        });

        await addDoc(collection(db, 'activities'), {
            userId: 'user_ali',
            userName: 'Ali Mammadov',
            activityType: 'goal_reached',
            title: 'Daily goal reached! 🎯',
            points: 100,
            celebrationCount: 8,
            createdAt: Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 60 * 1000)), // 5 hours ago
        });

        await addDoc(collection(db, 'activities'), {
            userId: 'user_davud',
            userName: 'Davud Baghir',
            activityType: 'challenge_joined',
            title: 'Joined February 100km Challenge 🏃',
            points: 50,
            celebrationCount: 12,
            challengeId: challenge1Ref.id,
            createdAt: Timestamp.fromDate(new Date(Date.now() - 8 * 60 * 60 * 1000)), // 8 hours ago
        });

        await addDoc(collection(db, 'activities'), {
            userId: 'user_sara',
            userName: 'Sara Aliyeva',
            activityType: 'streak_milestone',
            title: 'Reached 23-day streak! 🔥',
            points: 230,
            celebrationCount: 24,
            createdAt: Timestamp.fromDate(new Date(Date.now() - 12 * 60 * 60 * 1000)), // 12 hours ago
        });

        console.log('✅ Added 4 activities\n');

        // 4. Add Friendships
        console.log('👫 Adding friendships...');

        await addDoc(collection(db, 'friendships'), {
            userId1: 'user_ali',
            userId2: 'user_davud',
            status: 'active',
            createdAt: Timestamp.now(),
        });
        console.log('✅ Added: Ali ↔️ Davud');

        await addDoc(collection(db, 'friendships'), {
            userId1: 'user_davud',
            userId2: 'user_sara',
            status: 'active',
            createdAt: Timestamp.now(),
        });
        console.log('✅ Added: Davud ↔️ Sara\n');

        console.log('🎉 Firestore seeding complete!\n');
        console.log('Summary:');
        console.log('  - 3 Challenges (1 sponsored)');
        console.log('  - 3 Users');
        console.log('  - 4 Activities');
        console.log('  - 2 Friendships\n');
        console.log('ℹ️  Note: Update userId in AsyncStorage to "user_davud" to see your data');

    } catch (error) {
        console.error('❌ Error seeding Firestore:', error);
    }
}

// Run the seeding
seedFirestore()
    .then(() => {
        console.log('✅ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
    });
