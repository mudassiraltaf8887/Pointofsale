// Import Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // 👈 image upload ke liye

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDtGbPfb4pDY1BC8-2rfxZfTUsrGH0u5IM",
  authDomain: "possoftware-1c394.firebaseapp.com",
  projectId: "possoftware-1c394",
  storageBucket: "possoftware-1c394.firebasestorage.app",
  messagingSenderId: "370397473467",
  appId: "1:370397473467:web:0828d5ad6b43e7fd08179e",
};

// ✅ Step 1: Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Step 2: Initialize all Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ✅ Step 3: Export them for use in your app
export { app, auth, db, storage };
