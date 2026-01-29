import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // [추가] 데이터베이스 기능

const firebaseConfig = {
  // 🔴 Firebase 콘솔에서 복사한 본인의 키값들을 그대로 유지하세요!
  apiKey: "AIzaSyCUaZnH5UAoOKg5_LfTkOxpgY4FCop1Zt4",
  authDomain: "mealzip-eea8d.firebaseapp.com",
  projectId: "mealzip-eea8d",
  storageBucket: "mealzip-eea8d.firebasestorage.app",
  messagingSenderId: "85862447499",
  appId: "1:85862447499:web:404970f62b4b11807f578e",
  measurementId: "G-78FZB6GG7Z"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); // [추가] DB 내보내기
export const googleProvider = new GoogleAuthProvider();
