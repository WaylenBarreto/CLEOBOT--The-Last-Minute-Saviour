import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy
} from "firebase/firestore";
// Initialize Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ""
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Set up Google OAuth Provider with required Workspace Scopes
const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/userinfo.email");
provider.addScope("https://www.googleapis.com/auth/userinfo.profile");
provider.addScope("https://www.googleapis.com/auth/calendar.readonly");
provider.addScope("https://www.googleapis.com/auth/gmail.readonly");

// Force account selection every time (prevents auto-reuse of wrong account)
provider.setCustomParameters({ prompt: "select_account" });

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Detect mobile browsers — popups are blocked on iOS Safari and some Android browsers
const isMobileBrowser = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// Helper to prevent Firestore calls from hanging indefinitely when database is not configured
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs))
  ]);
};

// Save or Update User Profile Document in Firestore
export const saveUserProfile = async (uid: string, email: string, displayName?: string) => {
  try {
    const docRef = doc(db, "users", uid);
    await withTimeout(setDoc(docRef, {
      uid,
      email,
      displayName: displayName || email.split("@")[0],
      createdAt: new Date().toISOString()
    }, { merge: true }), 3000, null);
    console.log("User Profile saved to Firestore successfully:", uid);
  } catch (error) {
    console.error("Error saving user profile to Firestore:", error);
  }
};

// Auth listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      // If we have cachedAccessToken, we pass it. If not, it can be null (meaning email/pass user or token expired)
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google — uses Popup on desktop, Redirect on mobile (popups are blocked on mobile browsers)
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (isMobileBrowser()) {
    // On mobile, redirect the entire page. The result is handled by checkRedirectResult on page load.
    await signInWithRedirect(auth, provider);
    return null; // Page will reload; result is captured in checkRedirectResult
  }

  // Desktop: use popup
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to get Google Access Token from Auth Result");
    }
    cachedAccessToken = credential.accessToken;
    await saveUserProfile(result.user.uid, result.user.email || "", result.user.displayName || undefined);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Call this once on app mount to pick up the token after a mobile redirect sign-in
export const checkRedirectResult = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) return null;
    cachedAccessToken = credential.accessToken;
    await saveUserProfile(result.user.uid, result.user.email || "", result.user.displayName || undefined);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error("Redirect result error:", error);
    return null;
  }
};


// Email & Password Signup
export const signUpWithEmail = async (email: string, pass: string, name: string): Promise<User> => {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(res.user, { displayName: name });
    await saveUserProfile(res.user.uid, email, name);
    return res.user;
  } catch (error) {
    console.error("Email Signup Error:", error);
    throw error;
  }
};

// Email & Password Login
export const loginWithEmail = async (email: string, pass: string): Promise<User> => {
  try {
    const res = await signInWithEmailAndPassword(auth, email, pass);
    return res.user;
  } catch (error) {
    console.error("Email Login Error:", error);
    throw error;
  }
};

// Sign out
export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

// --- Firestore Database Storage & Sync Helpers ---

// Save Crisis Game Plan to Firestore
export const savePlanToFirestore = async (userId: string, plan: any) => {
  try {
    const planId = plan.taskName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    const docRef = doc(db, "users", userId, "plans", planId);
    const payload = {
      id: planId,
      userId,
      taskName: plan.taskName,
      priority: plan.priority,
      estimatedTotalMinutes: plan.estimatedTotalMinutes,
      panicModeTrigger: plan.panicModeTrigger,
      actionableSteps: plan.actionableSteps,
      escalationStrategy: plan.escalationStrategy,
      createdAt: new Date().toISOString()
    };
    await withTimeout(setDoc(docRef, payload), 3000, null);
    console.log("Successfully saved plan to Firestore:", planId);
  } catch (error) {
    console.error("Error saving plan to Firestore:", error);
  }
};

// Get all Crisis Game Plans from Firestore for the user
export const getPlansFromFirestore = async (userId: string): Promise<any[]> => {
  try {
    const collRef = collection(db, "users", userId, "plans");
    const q = query(collRef, orderBy("createdAt", "desc"));
    const querySnapshot = await withTimeout(getDocs(q), 3000, null);
    if (!querySnapshot) {
      console.warn("Firestore getPlans query timed out. Using local fallback.");
      return [];
    }
    const plans: any[] = [];
    querySnapshot.forEach((doc) => {
      plans.push(doc.data());
    });
    return plans;
  } catch (error) {
    console.error("Error fetching plans from Firestore:", error);
    return [];
  }
};

// Delete Crisis Game Plan from Firestore
export const deletePlanFromFirestore = async (userId: string, planId: string) => {
  try {
    const docRef = doc(db, "users", userId, "plans", planId);
    await withTimeout(deleteDoc(docRef), 3000, null);
    console.log("Successfully deleted plan from Firestore:", planId);
  } catch (error) {
    console.error("Error deleting plan from Firestore:", error);
  }
};

// Save Guardian Scan Report to Firestore
export const saveScanToFirestore = async (userId: string, scan: any, inputFeed: string) => {
  try {
    const scanId = "scan_" + Date.now();
    const docRef = doc(db, "users", userId, "guardian_scans", scanId);
    const payload = {
      id: scanId,
      userId,
      streamInput: inputFeed,
      clientTime: scan.clientTime || new Date().toISOString(),
      modeDetected: scan.modeDetected,
      panicModeTrigger: scan.panicModeTrigger,
      escalationTwiMLScript: scan.escalationTwiMLScript,
      discoveredDeadlines: scan.discoveredDeadlines,
      proposedFocusBlocks: scan.proposedFocusBlocks,
      createdAt: new Date().toISOString()
    };
    await withTimeout(setDoc(docRef, payload), 3000, null);
    console.log("Successfully saved scan to Firestore:", scanId);
  } catch (error) {
    console.error("Error saving scan to Firestore:", error);
  }
};

// Get all Guardian Scans from Firestore
export const getScansFromFirestore = async (userId: string): Promise<any[]> => {
  try {
    const collRef = collection(db, "users", userId, "guardian_scans");
    const q = query(collRef, orderBy("createdAt", "desc"));
    const querySnapshot = await withTimeout(getDocs(q), 3000, null);
    if (!querySnapshot) {
      console.warn("Firestore getScans query timed out. Using local fallback.");
      return [];
    }
    const scans: any[] = [];
    querySnapshot.forEach((doc) => {
      scans.push(doc.data());
    });
    return scans;
  } catch (error) {
    console.error("Error fetching scans from Firestore:", error);
    return [];
  }
};
