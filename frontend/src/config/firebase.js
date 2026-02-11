import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDyQCNRWHtbL30dChDCtNBZyIG1g4K6Ncc",
  authDomain: "demiguard-3b4e8.firebaseapp.com",
  projectId: "demiguard-3b4e8",
  storageBucket: "demiguard-3b4e8.firebasestorage.app",
  messagingSenderId: "920163899536",
  appId: "1:920163899536:web:ea4be7109c938ad8ce2015",
  measurementId: "G-DCGQPZVMH7",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
