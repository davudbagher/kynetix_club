// config/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBW-EgrFqXCpRRT_tjHhCj14hwZwFBag1I",
  authDomain: "kynetix-club.firebaseapp.com",
  projectId: "kynetix-club",
  storageBucket: "kynetix-club.firebasestorage.app",
  messagingSenderId: "244866440234",
  appId: "1:244866440234:web:32be34228a112d33a37753",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app); // Authentication (phone login)
export const db = getFirestore(app); // Database (store users, steps, rewards)

export default app;
