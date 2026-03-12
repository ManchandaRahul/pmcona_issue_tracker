// auth.ts
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from "../firebase";  // ← your Firebase init file (import { initializeApp } from "firebase/app"; etc.)

const auth = getAuth(app);

export type Role = "admin" | "user";

// Map emails to roles (you can later store this in Firestore instead)
const USER_EMAILS: Record<string, string> = {
  "admin": "admin@pmcona.com",
  "user": "user@pmcona.com",
  // Add more as needed
};
const USER_ROLES: Record<string, Role> = {
  "user": "user",
  "admin": "admin",
};

export async function login(username: string, password: string) {  // Rename param to username for clarity
  const trimmedUsername = username.trim().toLowerCase();

  const email = USER_EMAILS[trimmedUsername];
  if (!email) {
    throw new Error("Invalid username");
  }
try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password.trim());
    const firebaseUser = userCredential.user;

    const role = USER_ROLES[trimmedUsername] || "user";

    return {
      uid: firebaseUser.uid,
      username: trimmedUsername,  // Keep your original username
      role,
    };
  } catch (error: any) {
    console.error("Firebase login error:", error);
    throw new Error(error.message || "Invalid credentials");
  }
}

// Optional helper
export function getCurrentUser() {
  return auth.currentUser;
}