/* =====================================================
   UniGrade V2 — firebase.js
   Firebase Configuration & Initialization
   
   Reuses V1 project: uni-grade-1
   ===================================================== */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDp78Uw_23fh3hjdhJCSLusailxplDu9uw",
  authDomain: "uni-grade-1.firebaseapp.com",
  projectId: "uni-grade-1",
  storageBucket: "uni-grade-1.firebasestorage.app",
  messagingSenderId: "173725464505",
  appId: "1:173725464505:web:b287d19518aa26dbc6e868"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
