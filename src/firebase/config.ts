// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCEFgZhGR6YL-OCjZi0x361cq3Hep7n6VE",
  authDomain: "issue-tracker-5540b.firebaseapp.com",
  projectId: "issue-tracker-5540b",
  storageBucket: "issue-tracker-5540b.firebasestorage.app",
  messagingSenderId: "647778363928",
  appId: "1:647778363928:web:e3a26623f943c87a27316d",
  measurementId: "G-NCC33FZDW2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore 🔥 THIS WAS MISSING
export const db = getFirestore(app);

// (Optional) Analytics — safe to keep
export const analytics = getAnalytics(app);
