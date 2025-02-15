import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyChPO_2LsyLZbGipSKVzStcWUvkNczEqoQ",
  authDomain: "next-764ae.firebaseapp.com",
  databaseURL: "https://next-764ae-default-rtdb.firebaseio.com",
  projectId: "next-764ae",
  storageBucket: "next-764ae.firebasestorage.app",
  messagingSenderId: "926471026222",
  appId: "1:926471026222:web:39c4b8a0277a9a92a051bf"
};

// Log the config to verify environment variables are loaded
console.log("Firebase Config:", {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? "EXISTS" : "MISSING" // Don't log actual API key
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);