// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDANF7YOgHTRWPS-EIXWCWnB0HVYMHclaU",
  authDomain: "level-up-chess.firebaseapp.com",
  projectId: "level-up-chess",
  storageBucket: "level-up-chess.appspot.com",
  messagingSenderId: "10963404824",
  appId: "1:10963404824:web:cc6572e48f0f0111fa9b6d",
  measurementId: "G-1LVQ2TGN23"
};

// אתחול Firebase
const app = initializeApp(firebaseConfig);

// יצירת החיבור ל-Firestore
const db = getFirestore(app);

// ייצוא ה-Firestore
export { db };
