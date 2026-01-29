import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// 🔴 중요: Firebase 콘솔 -> 프로젝트 설정(톱니바퀴) -> 아래로 스크롤 -> '내 앱'에서 'SDK 설정 및 구성' 복사해서 교체하세요!
const firebaseConfig = {
  apiKey: "AIzaSy...", 
  authDomain: "mealzip-....firebaseapp.com",
  projectId: "mealzip-...",
  storageBucket: "mealzip-....appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
