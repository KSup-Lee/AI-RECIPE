import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { ChevronRight, Calendar, ShoppingCart, ChefHat, AlertCircle } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const [fridgeCount, setFridgeCount] = useState(0);
  const [userName, setUserName] = useState('사용자'); // 나중에 로그인 정보 연동

  useEffect(() => {
    // 냉장고 재료 개수 가져오기
    getDocs(collection(db, 'fridge')).then(snap => setFridgeCount(snap.size));
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFDF9] px-5 pt-8 pb-24">
      {/* 1. 상단 인사말 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-800">
            반가워요, <span className="text-[#FF6B6B]">{userName}</span>님! 👋
          </h1>
          <p className="text-sm text-gray-400 mt-1">오늘도 맛있는 하루 보내세요.</p>
        </div>
      </div>

      {/* 2. 메인 대시보드 카드 */}
      <div className="bg-[#FF6B6B] rounded-3xl p-6 text-white shadow-xl shadow-orange-200 mb-6 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-orange-100 text-sm font-bold mb-1">내 냉장고 상황</p>
          <h2 className="text-3xl font-black mb-4">{fridgeCount}개의 재료 <span className="text-lg font-normal">가 있어요</span></h2>
          <button 
            onClick={() => navigate('/fridge')}
            className="bg-white text-[#FF6B6B] px-5 py-2 rounded-full text-sm font-bold hover:bg-orange-50 transition-colors"
          >
            냉장고 열어보기
          </button>
        </div>
        {/* 장식용 아이콘 */}
        <ChefHat className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-20" />
      </div>

      {/* 3. 퀵 메뉴 (여기에 식단표 버튼이 있습니다!) */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button 
          onClick={() => navigate('/mealplan')}
          className="bg-white p-5 rounded-2xl shadow-sm border border-transparent hover:border-[#FFE0B2] text-left transition-all"
        >
          <div className="bg-orange-100 w-10 h-10 rounded-full flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5 text-[#FF6B6B]" />
          </div>
          <h3 className="font-bold text-gray-800">이번 주 식단표</h3>
          <p className="text-xs text-gray-400 mt-1">체계적인 식습관 🗓️</p>
        </button>

        <button 
          onClick={() => navigate('/shopping')}
          className="bg-white p-5 rounded-2xl shadow-sm border border-transparent hover:border-[#FFE0B2] text-left transition-all"
        >
          <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center mb-3">
            <ShoppingCart className="w-5 h-5 text-blue-500" />
          </div>
          <h3 className="font-bold text-gray-800">장보기 메모</h3>
          <p className="text-xs text-gray-400 mt-1">놓치지 마세요 🛒</p>
        </button>
      </div>

      {/* 4. 바로가기 배너 */}
      <div onClick={() => navigate('/recipes')} className="bg-gray-800 rounded-2xl p-5 flex items-center justify-between cursor-pointer">
        <div className="flex items-center gap-3">
            <AlertCircle className="text-yellow-400" />
            <div>
                <h3 className="text-white font-bold">냉장고 파먹기 도전?</h3>
                <p className="text-gray-400 text-xs">유통기한 임박 재료 구출하기</p>
            </div>
        </div>
        <ChevronRight className="text-gray-500" />
      </div>
    </div>
  );
};

export default Home;
