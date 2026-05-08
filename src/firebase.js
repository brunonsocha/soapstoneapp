import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDrDBXsNBc2RV1rRhnB8GmY1_TmifXsQzQ",
  authDomain: "orangesoapstone.firebaseapp.com",
  projectId: "orangesoapstone",
  storageBucket: "orangesoapstone.firebasestorage.app",
  messagingSenderId: "630637970302",
  appId: "1:630637970302:web:035dfde9516c4f19a8292f",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);
