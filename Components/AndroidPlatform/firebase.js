// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD2jrar6DQCT3xDzng_ufAkKFI0f9jb430",
  authDomain: "lms-capstone2.firebaseapp.com",
  projectId: "lms-capstone2",
  storageBucket: "lms-capstone2.appspot.com",
  messagingSenderId: "701622407702",
  appId: "1:701622407702:web:be3629e7ff3c4cb95c5b37",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, getDocs };
