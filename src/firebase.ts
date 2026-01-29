import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // [추가] 데이터베이스 기능

const firebaseConfig = {
  // 🔴 Firebase 콘솔에서 복사한 본인의 키값들을 그대로 유지하세요!
  apiKey: "AIzaSy...", 
  authDomain: "mealzip-....firebaseapp.com",
  projectId: "mealzip-...",
  storageBucket: "mealzip-....appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); // [추가] DB 내보내기
export const googleProvider = new GoogleAuthProvider();
