import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBTiF01MeEtudFv7PCOmViCXvFN9qH5CDQ",
  authDomain: "bytebank-postech.firebaseapp.com",
  projectId: "bytebank-postech",
  storageBucket: "bytebank-postech.firebasestorage.app",
  messagingSenderId: "286714351159",
  appId: "1:286714351159:web:e05bb119ff5d98811df9b2"
};

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)