/* =====================================================
   UniGrade V2 — firebase.js
   Firebase Configuration & Initialization
   
   Connected to Firebase Project: UniGradeV2 (uni-grade-v2)
   Services:
   - Firebase Authentication
   - Cloud Firestore Database
   - Firebase Storage
   - Firebase Analytics (optional web analytics)
   ===================================================== */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCCLlIEjpxH8AVhvPVlsv1CrthQRzw_XBU",
  authDomain: "uni-grade-v2.firebaseapp.com",
  projectId: "uni-grade-v2",
  storageBucket: "uni-grade-v2.firebasestorage.app",
  messagingSenderId: "539038735167",
  appId: "1:539038735167:web:d788d2dafd15c6fc89118a",
  measurementId: "G-CWJC7EFQWE"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Safe Analytics initialization
export let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Analytics optional in non-browser/restricted environments
  });
}

export default app;
