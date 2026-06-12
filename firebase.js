import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBpGljmkHts2UGrEk_pUyS1oITDw3QL604",
    authDomain: "uni-grade-1.firebaseapp.com",
    projectId: "uni-grade-1",
    storageBucket: "uni-grade-1.firebasestorage.app",
    messagingSenderId: "173725464505",
    appId: "1:173725464505:web:b287d19518aa26dbc6e868"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);